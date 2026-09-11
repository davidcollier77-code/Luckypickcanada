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

/**
 * Detects the primary line-ending style used in a file.
 * Returns '\r
 */
function detectLineEnding(content) {
  if (!content || content.length === 0) {
    return '\n';
  }
  
  const crlfCount = (content.match(/\r\n/g) || []).length;
  const lfCount = (content.match(/(?<!\r)\n/g) || []).length;
  
  // If CRLF appears more frequently, use CRLF; otherwise use LF
  return crlfCount > lfCount ? '\r\n' : '\n';
}

/**
 * Normalizes volatile Devsite metadata to prevent false documentation differences.
 */
function normalizeDevsiteMetadata(content) {
  if (!content) return content;
  // Normalize nonce attributes
  let normalized = content.replace(/nonce="[^"]+"/g, 'nonce="[NONCE]"');

  // Normalize volatile JSON payload arrays that Devsite injects in inline scripts
  // Specifically the one matching GoogleDevelopersObject
  normalized = normalized.replace(/(<script nonce="\[NONCE\]">\s*\(function\(d,e,v,s,i,t,E\)\{d\[\'GoogleDevelopersObject\'\]=i;[\s\S]*?)(,\s*'\[[\s\S]*?\]')(.*<\/script>)/g, '$1, \'[NORMALIZED_DEVSITE_METADATA]\'$3');

  return normalized;
}

/**
 * Normalizes line endings in content to LF for comparison purposes.
 * It also trims trailing whitespace/newlines for consistency.
 */
function normalizeLineEndings(content) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}$/, '\n')
    .trimEnd() + '\n';
}

/**
 * Converts content to use the specified line-ending style.
 */
function convertLineEndings(content, lineEnding) {
  // First normalize ONLY line endings to LF for standard processing
  const normalized = content.replace(/\r\n/g, '\n');
  if (lineEnding === '\r\n') {
    return normalized.replace(/\n/g, '\r\n');
  }
  return normalized;
}




function fetchDocumentation(lib, sourceConfig) {
  return new Promise((resolve, reject) => {
    if (!sourceConfig || sourceConfig.type !== 'url' || !sourceConfig.url) {
      return reject(new Error('Invalid or missing source configuration.'));
    }

    const fetchWithRedirects = (currentUrl, redirectCount) => {
      if (redirectCount <= 0) {
        return reject(new Error('Too many redirects'));
      }

      https.get(currentUrl, {
        headers: {
          'User-Agent': 'LuckyPickCanada-DocsUpdater/1.0'
        },
        timeout: 15000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
           // Drain the response so socket can be closed/reused
           res.resume();
           let redirectUrl = res.headers.location;
           try {
               redirectUrl = new URL(redirectUrl, currentUrl).href;
           } catch (e) {
               return reject(new Error('Invalid redirect URL'));
           }
           return fetchWithRedirects(redirectUrl, redirectCount - 1);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        let data = '';
        let totalSize = 0;
        res.on('data', chunk => {
          totalSize += chunk.length;
          if (totalSize > 10 * 1024 * 1024) {
             res.destroy(new Error('Response size exceeds 10MB limit'));
             return;
          }
          data += chunk;
        });
        res.on('end', () => {
           // Basic sanitization: remove known sensitive token patterns that might leak in docs (e.g. Star History sealed_token)
           const sanitizedData = data.replace(/sealed_token=[^&"'\s]+/g, 'sealed_token=REDACTED');
           resolve(sanitizedData);
        });
      }).on('error', reject).on('timeout', function() { this.destroy(new Error('Request Timeout')); });
    };

    fetchWithRedirects(sourceConfig.url, 5);
  });
}

function getUpstreamSha(lib, sourceConfig) {
  return new Promise((resolve) => {
    if (!lib.startsWith('/')) {
        resolve(null);
        return;
    }
    if (!sourceConfig || sourceConfig.type !== 'url' || !sourceConfig.url) {
        resolve(null);
        return;
    }

    let branch = 'HEAD';
    if (sourceConfig.branch || sourceConfig.ref) {
        branch = sourceConfig.branch || sourceConfig.ref;
    } else {
        try {
            const urlObj = new URL(sourceConfig.url);
            if (urlObj.hostname === 'raw.githubusercontent.com') {
                // Path is usually /owner/repo/branch/path...
                // But branch names can contain slashes (e.g. feature/add-docs)
                // We should match known standard branches, or return null if it's too ambiguous
                const pathname = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
                const pathParts = pathname.split('/');

                if (pathParts.length >= 3) {
                    const owner = pathParts[0];
                    const repo = pathParts[1];
                    const remainingPath = pathParts.slice(2).join('/');

                    const knownBranches = ['main/', 'master/', 'canary/', 'develop/', 'production/'];
                    let foundBranch = null;
                    for (const kb of knownBranches) {
                        if (remainingPath.startsWith(kb)) {
                            foundBranch = kb.substring(0, kb.length - 1); // remove trailing slash
                            break;
                        }
                    }

                    if (foundBranch) {
                        branch = foundBranch;
                    } else {
                        // Branch could have slashes, too ambiguous to guess safely without explicit metadata.
                        resolve(null);
                        return;
                    }
                } else {
                    resolve(null);
                    return;
                }
            } else {
                resolve(null); // Not a github raw url, fall back to comparing bytes
                return;
            }
        } catch (e) {
            resolve(null);
            return;
        }
    }

    const parts = lib.split('/');
    if (parts.length >= 3) {
      const org = parts[1];
      const repo = parts[2];

      // Use encodeURIComponent for branch in case it contains slashes, but the known ones don't. Still good practice.
      const safeBranch = encodeURIComponent(branch);
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${org}/${repo}/commits/${safeBranch}`,
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

function saveManifest(inventory, shas, sources, groups, updateTimestamp = true) {
  const timestamp = getHalifaxTimestamp();

  const manifestPath = path.join(DOCS_DIR, 'manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  const manifestData = {
    lastUpdated: updateTimestamp ? timestamp : (currentManifest.lastUpdated || timestamp),
    groups: groups || currentManifest.groups || {},
    sources: sources || currentManifest.sources || {},
    inventory: Array.from(inventory),
    githubShas: shas
  };
  const tempManifestPath = manifestPath + '.tmp.' + Date.now();
  try {
    fs.writeFileSync(tempManifestPath, JSON.stringify(manifestData, null, 2) + '\n');
    fs.renameSync(tempManifestPath, manifestPath);
  } catch(e) {
    if (fs.existsSync(tempManifestPath)) fs.unlinkSync(tempManifestPath);
    throw e;
  }
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
      let existingLineEnding = '\n';
      if (fs.existsSync(firstDocPath)) {
          // If we had a symlink, lstat or stat size? We use the actual content length if we read it
          contentBefore = fs.readFileSync(firstDocPath, 'utf8');
          existingSize = Buffer.byteLength(contentBefore, 'utf8');
          existingLineEnding = detectLineEnding(contentBefore);
      }
      
      // For genuinely new files, use LF (repository convention)
      if (!contentBefore) {
          existingLineEnding = '\n';
      }

      const sourceConfig = sourcesConfig[lib];

      if (!sourceConfig) {
         console.log(`UNRESOLVED SOURCE: No verified source configuration for ${lib}. Skipping.`);
         stats.skipped++;
         stats.pending--;
         continue;
      }

      // Check upstream SHA if possible
      let allDocsExist = true;
      for (const group of groups) {
          const docPath = path.join(DOCS_DIR, group, `${safeName}.md`);
          if (!fs.existsSync(docPath)) {
              allDocsExist = false;
              break;
          }
      }

      const upstreamSha = await getUpstreamSha(lib, sourceConfig);
      if (upstreamSha && upstreamSha === githubShas[lib] && allDocsExist) {
         console.log(`SKIPPED: ${lib} (upstream SHA ${upstreamSha} has not changed)`);
         stats.skipped++;
         progressMade = true;
         stats.pending--;

         const wasInInventory = inventory.has(lib);
         inventory.add(lib);
         if (!wasInInventory) {
             saveManifest(inventory, githubShas, sourcesConfig, groupsConfig, true);
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
        console.log(`Waiting 60 seconds before retrying ${lib}...`);

        await new Promise(resolve => setTimeout(resolve, 60 * 1000));

        try {
            console.log(`Retrying fetch for ${lib}...`);
            output = await fetchDocumentation(lib, sourceConfig);
            fetchSuccess = true;
        } catch (retryError) {
            console.error(`Failed to fetch docs for ${lib} on retry:`, retryError.message);
            // Record as failed, not skipped
            stats.failed++;
            stats.errors.push(`Failed to fetch ${lib} after 2 attempts: ${retryError.message}`);
            stats.pending--;
            continue;
        }
      }

      const exactSize = Buffer.byteLength(output, 'utf8');
      
      // Convert output to match existing file's line-ending style
      const outputWithCorrectLineEndings = convertLineEndings(output, existingLineEnding);
      const finalSize = Buffer.byteLength(outputWithCorrectLineEndings, 'utf8');
      const netSizeIncrease = finalSize - existingSize;
      
      // Use the converted output for all subsequent operations

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
      let isContentUpdated = false;
      
      // Compare normalized versions to ignore line-ending differences
      const normalizedBefore = contentBefore ? normalizeDevsiteMetadata(normalizeLineEndings(contentBefore)) : null;
      const normalizedOutput = normalizeDevsiteMetadata(normalizeLineEndings(output));
      if (normalizedBefore === normalizedOutput) {
          console.log(`CURRENT: ${lib} (no changes)`);
          stats.unchanged++;

          // Ensure symlinks/files exist for ALL groups just in case
          for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const groupDir = path.join(DOCS_DIR, group);
            const docPath = path.join(groupDir, `${safeName}.md`);

            if (i === 0) {
              if (!fs.existsSync(docPath)) {
                const tempPath = docPath + '.tmp.' + Date.now();
                try {
                  fs.writeFileSync(tempPath, outputWithCorrectLineEndings);
                  fs.renameSync(tempPath, docPath);
                } catch(e) {
                  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                  throw e;
                }
              }
            } else {
               if (!fs.existsSync(docPath)) {
                  try {
                    const relativeTarget = path.relative(groupDir, path.join(DOCS_DIR, groups[0], `${safeName}.md`));
                    fs.symlinkSync(relativeTarget, docPath);
                  } catch(e) {
                     // fallback
                     const tempPath = docPath + '.tmp.' + Date.now();
                     try {
                        fs.writeFileSync(tempPath, outputWithCorrectLineEndings);
                        fs.renameSync(tempPath, docPath);
                     } catch(err) {
                        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                        throw err;
                     }
                  }
               }
            }
          }
      } else {
          console.log(`UPDATED: ${lib}`);
          stats.updated++;

          // Write primary copy to first group
          const firstGroupPath = path.join(DOCS_DIR, groups[0], `${safeName}.md`);
          const tempPath1 = firstGroupPath + '.tmp.' + Date.now();
          try {
             fs.writeFileSync(tempPath1, outputWithCorrectLineEndings);
             fs.renameSync(tempPath1, firstGroupPath);
          } catch(e) {
             if (fs.existsSync(tempPath1)) fs.unlinkSync(tempPath1);
             throw e;
          }

          // Write symlinks for subsequent groups
          for (let i = 1; i < groups.length; i++) {
             const groupDir = path.join(DOCS_DIR, groups[i]);
             const docPath = path.join(groupDir, `${safeName}.md`);
             const tempSymlinkPath = docPath + '.tmp.' + Date.now();
             try {
                const relativeTarget = path.relative(groupDir, firstGroupPath);
                fs.symlinkSync(relativeTarget, tempSymlinkPath);
                fs.renameSync(tempSymlinkPath, docPath);
             } catch(e) {
                if (fs.existsSync(tempSymlinkPath)) fs.unlinkSync(tempSymlinkPath);
                console.warn(`Symlink failed for ${docPath}, falling back to writing file: `, e.message);
                const tempDocPath = docPath + '.tmp.' + Date.now();
                try {
                  fs.writeFileSync(tempDocPath, outputWithCorrectLineEndings);
                  fs.renameSync(tempDocPath, docPath);
                } catch(err) {
                  if (fs.existsSync(tempDocPath)) fs.unlinkSync(tempDocPath);
                  throw err;
                }
             }
          }
          // only add netSizeIncrease once
          if (netSizeIncrease > 0) {
              stats.bytesAdded += netSizeIncrease;
          }
          isNewOrUpdated = true;
          isContentUpdated = true;
          progressMade = true;
      }

      if (upstreamSha) {
          githubShas[lib] = upstreamSha;
          isNewOrUpdated = true;
      }

      const wasInInventory = inventory.has(lib);

      inventory.add(lib);


      if (isNewOrUpdated || !wasInInventory) {
          const updateTimestamp = isContentUpdated || !wasInInventory;
          saveManifest(inventory, githubShas, sourcesConfig, groupsConfig, updateTimestamp);
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
