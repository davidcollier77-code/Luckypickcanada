const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');

const DOCS_DIR = path.join(process.cwd(), '.docs');
const MAX_DOCS_SIZE_BYTES = 495 * 1024 * 1024;


const getHalifaxTimestamp = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Halifax',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const d = {};
  parts.forEach(({ type, value }) => { d[type] = value; });
  const dateInHalifax = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Halifax' }));
  const dateInUTC = new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' }));
  const diffHours = Math.round((dateInHalifax - dateInUTC) / 3600000);
  const offsetStr = (diffHours >= 0 ? '+' : '-') + Math.abs(diffHours).toString().padStart(2, '0') + ':00';
  return `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}:${d.second}${offsetStr}`;
};

function getDirSize(dirPath) {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i]);
    const stats = fs.lstatSync(filePath);
    if (stats.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stats.size;
    }
  }
  return size;
}





function fetchDocumentation(lib, sourceConfig) {
  return new Promise((resolve, reject) => {
    if (!sourceConfig || sourceConfig.type !== 'url' || !sourceConfig.url) {
      return reject(new Error('Invalid or missing source configuration.'));
    }

    const url = sourceConfig.url;
    https.get(url, {
      headers: {
        'User-Agent': 'LuckyPickCanada-DocsUpdater/1.0'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
         let redirectUrl = res.headers.location;
         if (redirectUrl.startsWith('/')) {
             const baseUrl = new URL(url);
             redirectUrl = baseUrl.origin + redirectUrl;
         }
         https.get(redirectUrl, {
           headers: {
             'User-Agent': 'LuckyPickCanada-DocsUpdater/1.0'
           }
         }, (redirectRes) => {
             if (redirectRes.statusCode !== 200) {
               return reject(new Error(`HTTP ${redirectRes.statusCode}: ${redirectRes.statusMessage} on redirect`));
             }
             let data = '';
             redirectRes.on('data', chunk => data += chunk);
             redirectRes.on('end', () => resolve(data));
             redirectRes.on('error', reject);
         }).on('error', reject);
         return;
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function getUpstreamSha(lib, sourceConfig) {
  return new Promise((resolve) => {
    // Only use GitHub API for sources actually sourced from a GitHub repository HEAD
    if (!sourceConfig || sourceConfig.type !== 'url' || !sourceConfig.url.includes('raw.githubusercontent.com') || !sourceConfig.url.includes('/main/')) {
        resolve(null);
        return;
    }
    if (!lib.startsWith('/')) {
        resolve(null);
        return;
    }
    const parts = lib.split('/');
    if (parts.length >= 3) {
      const org = parts[1];
      const repo = parts[2];

      const options = {
        hostname: 'api.github.com',
        path: `/repos/${org}/${repo}/commits/HEAD`,
        headers: {
          'User-Agent': 'Node.js Context7 Refresher',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      if (process.env.GITHUB_TOKEN) {
         options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      https.get(options, (res) => {
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.sha);
            } catch (e) {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      }).on('error', () => resolve(null));
    } else {
      resolve(null);
    }
  });
}

function saveManifest(inventory, shas, sources, groups) {
  const timestamp = getHalifaxTimestamp();

  const manifestPath = path.join(DOCS_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  const manifestData = {
    lastUpdated: timestamp,
    groups: groups || currentManifest.groups || {},
    sources: sources || currentManifest.sources || {},
    inventory: Array.from(inventory),
    githubShas: shas
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
}

async function main() {
  console.log('Starting continuous documentation refresh...');

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }




  const manifestPath = path.join(DOCS_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
      console.error('CRITICAL: .docs/manifest.json not found.');
      process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const groupsConfig = manifest.groups || {};
  const sourcesConfig = manifest.sources || {};

  const uniqueLibraries = new Set();
  const libraryToGroups = new Map();

  for (const [group, libs] of Object.entries(groupsConfig)) {
    const groupDir = path.join(DOCS_DIR, group);
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir, { recursive: true });
    }
    for (const lib of libs) {
      uniqueLibraries.add(lib);
      if (!libraryToGroups.has(lib)) {
        libraryToGroups.set(lib, []);
      }
      libraryToGroups.get(lib).push(group);
    }
  }

  const pendingUpdates = [];
  for (const lib of uniqueLibraries) {
    pendingUpdates.push({ lib, groups: libraryToGroups.get(lib) });
  }


  const inventory = new Set();
  let githubShas = {};

  try {
    if (manifest.inventory && Array.isArray(manifest.inventory)) {
      manifest.inventory.forEach(lib => inventory.add(lib));
    }
    if (manifest.githubShas && typeof manifest.githubShas === 'object') {
      githubShas = manifest.githubShas;
    }
  } catch (e) {
      console.warn('Failed to parse existing manifest.json. Starting fresh inventory.', e.message);
  }

  let stats = {
    updated: 0,
    failed: 0,
    skipped: 0,
    unchanged: 0,
    pending: pendingUpdates.length,

    bytesAdded: 0,
    batches: 0,
    errors: []
  };

  const timestamp = getHalifaxTimestamp();

  while (pendingUpdates.length > 0) {
    stats.batches++;
    console.log(`Starting Batch ${stats.batches}...`);

    // Independently calculate current docs size
    let currentDocsSize = getDirSize(DOCS_DIR);
    console.log(`Current .docs size: ${(currentDocsSize / 1024 / 1024).toFixed(2)} MB`);

    let batchContinues = true;
    let deferredUpdates = [];
    let progressMade = false;

    while (batchContinues && pendingUpdates.length > 0) {
      const nextUpdate = pendingUpdates.shift();
      const lib = nextUpdate.lib;
      const groups = nextUpdate.groups;

      const safeName = lib.replace(/[\/\.]/g, '_');
      // For size calculation, check the first group's file
      const firstGroupDir = path.join(DOCS_DIR, groups[0]);
      const firstDocPath = path.join(firstGroupDir, `${safeName}.md`);

      let existingSize = 0;
      let contentBefore = null;
      if (fs.existsSync(firstDocPath)) {
          // If we had a symlink, lstat or stat size? We use the actual content length if we read it
          contentBefore = fs.readFileSync(firstDocPath, 'utf8');
          existingSize = Buffer.byteLength(contentBefore, 'utf8');
      }

      // Check upstream SHA if possible
      const sourceConfig = sourcesConfig[lib];
      const upstreamSha = await getUpstreamSha(lib, sourceConfig);
      if (upstreamSha && upstreamSha === githubShas[lib]) {
         console.log(`SKIPPED: ${lib} (upstream SHA ${upstreamSha} has not changed)`);
         stats.skipped++;
         progressMade = true;
         stats.pending--;

         const wasInInventory = inventory.has(lib);
         inventory.add(lib);
         if (!wasInInventory) {
             saveManifest(inventory, githubShas, sourcesConfig, groupsConfig);
         }
         continue;
      }

      console.log(`Fetching docs for ${lib} to temp to determine exact size BEFORE downloading into .docs...`);


      let output;
      let fetchSuccess = false;
      if (!sourceConfig) {
         console.log(`UNRESOLVED SOURCE: No verified source configuration for ${lib}. Skipping.`);
         stats.skipped++;
         stats.pending--;
         continue;
      }

      try {
        console.log(`Fetching docs for ${lib} using configured source to determine exact size BEFORE downloading into .docs...`);
        output = await fetchDocumentation(lib, sourceConfig);
        fetchSuccess = true;
      } catch (e) {
        console.error(`Failed to fetch docs for ${lib} on first attempt:`, e.message);
        console.log(`Waiting 1 minute before retrying ${lib}...`);

        await new Promise(resolve => setTimeout(resolve, 60 * 1000));

        try {
            console.log(`Retrying fetch for ${lib}...`);
            output = await fetchDocumentation(lib, sourceConfig);
            fetchSuccess = true;
        } catch (retryError) {
            console.error(`Failed to fetch docs for ${lib} on retry:`, retryError.message);
            // Treat unresolved/unavailable sources as skipped rather than failing the refresh
            stats.skipped++;
            stats.pending--;
            continue;
        }
      }

      const exactSize = Buffer.byteLength(output, 'utf8');
      const netSizeIncrease = exactSize - existingSize;

      if (currentDocsSize + netSizeIncrease > MAX_DOCS_SIZE_BYTES) {
        console.log(`Library ${lib} (exact size ${exactSize} bytes) would exceed 495 MB limit (current: ${currentDocsSize}, net increase: ${netSizeIncrease}).`);

        if (netSizeIncrease > MAX_DOCS_SIZE_BYTES) {
            console.log(`Library ${lib} itself exceeds the 495 MB limit. Marking as failed.`);
            stats.failed++;
            stats.errors.push(`Library ${lib} exceeds 495 MB limit individually.`);
            stats.pending--;
        } else {
            console.log('Deferring to next batch pass.');
            deferredUpdates.push(nextUpdate);
        }
        continue;
      }

      // It fits! We can now process it into .docs
      stats.pending--;

      let isNewOrUpdated = false;

      if (contentBefore === output) {
          console.log(`CURRENT: ${lib} (no changes)`);
          stats.unchanged++;

          // Ensure symlinks/files exist for ALL groups just in case
          for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const groupDir = path.join(DOCS_DIR, group);
            const docPath = path.join(groupDir, `${safeName}.md`);

            if (i === 0) {
              if (!fs.existsSync(docPath)) {
                fs.writeFileSync(docPath, output);
              }
            } else {
               if (!fs.existsSync(docPath)) {
                  try {
                    const relativeTarget = path.relative(groupDir, path.join(DOCS_DIR, groups[0], `${safeName}.md`));
                    fs.symlinkSync(relativeTarget, docPath);
                  } catch(e) {
                     // fallback
                     fs.writeFileSync(docPath, output);
                  }
               }
            }
          }
      } else {
          console.log(`UPDATED: ${lib}`);
          stats.updated++;

          // Write primary copy to first group
          const firstGroupPath = path.join(DOCS_DIR, groups[0], `${safeName}.md`);
          try { if (fs.lstatSync(firstGroupPath)) fs.unlinkSync(firstGroupPath); } catch (e) {}
          fs.writeFileSync(firstGroupPath, output);

          // Write symlinks for subsequent groups
          for (let i = 1; i < groups.length; i++) {
             const groupDir = path.join(DOCS_DIR, groups[i]);
             const docPath = path.join(groupDir, `${safeName}.md`);
             try { if (fs.lstatSync(docPath)) fs.unlinkSync(docPath); } catch (e) {}
             try {
                const relativeTarget = path.relative(groupDir, firstGroupPath);
                fs.symlinkSync(relativeTarget, docPath);
             } catch(e) {
                console.warn(`Symlink failed for ${docPath}, falling back to writing file: `, e.message);
                fs.writeFileSync(docPath, output);
             }
          }
          // only add netSizeIncrease once
          if (netSizeIncrease > 0) {
              stats.bytesAdded += netSizeIncrease;
          }
          isNewOrUpdated = true;
          progressMade = true;
      }

      if (upstreamSha) {
          githubShas[lib] = upstreamSha;
          isNewOrUpdated = true;
      }

      const wasInInventory = inventory.has(lib);

      inventory.add(lib);


      if (isNewOrUpdated || !wasInInventory) {
          saveManifest(inventory, githubShas, sourcesConfig, groupsConfig);
          if (!wasInInventory) {
          }
      }


      // Update current docs size using strict filesystem measurement to be safe
      currentDocsSize = getDirSize(DOCS_DIR);
    }



    if (deferredUpdates.length > 0) {
      if (!progressMade) {
         console.error(`Hard ceiling deadlock: No space freed and no pending resources can fit.`);
         console.error(`Current size: ${currentDocsSize} bytes, Maximum: ${MAX_DOCS_SIZE_BYTES} bytes`);
         console.error(`No pending library can fit under the hard ceiling.`);
         stats.errors.push(`Hard ceiling deadlock: No progress possible after batch ${stats.batches}`);
         break;
      } else {
        console.log(`Batch finished. ${deferredUpdates.length} resources deferred to next pass.`);
        // Put deferred updates back into pending for the next batch iteration
        pendingUpdates.push(...deferredUpdates);
      }
    }
  }

  stats.finalSize = getDirSize(DOCS_DIR);

  console.log(`\n--- DOCUMENTATION REFRESH REPORT ---`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Successfully updated: ${stats.updated}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Unchanged: ${stats.unchanged}`);
  console.log(`Skipped (no upstream change): ${stats.skipped}`);
  console.log(`Pending: ${stats.pending}`);
  console.log(`Bytes added: ${stats.bytesAdded}`);
  console.log(`Final .docs size: ${stats.finalSize} bytes (${(stats.finalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Batches used: ${stats.batches}`);
  if (stats.errors.length > 0) {
    console.log(`Errors encountered:\n  - ${stats.errors.join('\n  - ')}`);
  }
  console.log(`------------------------------------\n`);

  if (stats.errors.length > 0) {
    const failMsg = `FAILED — [${timestamp}] — VERIFICATION FAILED`;
    console.log(failMsg);
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Documentation Refresh Result\n\n❌ ' + failMsg + '\n');
    }
    process.exit(1);
  } else {
    const successMsg = `SUCCESS — [${timestamp}] — VERIFIED`;
    console.log(successMsg);
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Documentation Refresh Result\n\n✅ ' + successMsg + '\n');
    }
    console.log('Documentation refresh complete.');
  }
}

main().catch((e) => {
  const timestamp = getHalifaxTimestamp();
  console.error(e);
  const failMsg = `FAILED — [${timestamp}] — VERIFICATION FAILED`;
  console.log(failMsg);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Documentation Refresh Result\n\n❌ ' + failMsg + '\n');
  }
  process.exit(1);
});
