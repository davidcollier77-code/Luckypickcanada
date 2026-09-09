const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DOCS_DIR = path.join(process.cwd(), '.docs');
const MAX_DOCS_SIZE_BYTES = 495 * 1024 * 1024;

const LIBRARIES = {
  "creation": [
    "/github/docs",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/vercel/next.js",
    "/reactjs/react.dev",
    "/microsoft/typescript",
    "/websites/tailwindcss",
    "/websites/motion_dev",
    "/lucide-icons/lucide",
    "/react-hook-form/documentation",
    "/react-hook-form/resolvers",
    "/emilkowalski/sonner",
    "/bvaughn/react-error-boundary",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api",
    "/dropbox/zxcvbn",
    "/mdn/content",
    "/pixijs/pixijs",
    "/mrdoob/three.js",
    "/adobe/react-spectrum",
    "/storybookjs/storybook",
    "/lovell/sharp"
  ],
  "troubleshooting": [
    "/github/docs",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/vercel/next.js",
    "/reactjs/react.dev",
    "/microsoft/typescript",
    "/opennextjs/opennextjs-cloudflare",
    "/opennextjs/docs",
    "/cloudflare/workers-sdk",
    "/neondatabase/neon",
    "/upstash/docs",
    "/getsentry/sentry-docs",
    "/bvaughn/react-error-boundary",
    "/websites/developer_chrome",
    "/websites/developer_apple_webkit",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api",
    "/mdn/content",
    "/open-telemetry/opentelemetry.io",
    "/GoogleChrome/web.dev"
  ],
  "polishing": [
    "/vercel/next.js",
    "/reactjs/react.dev",
    "/websites/tailwindcss",
    "/llmstxt/gsap_llms_txt",
    "/websites/motion_dev",
    "/lucide-icons/lucide",
    "/emilkowalski/sonner",
    "/goldfire/howler.js",
    "/websites/developer_chrome",
    "/websites/developer_apple_webkit",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api",
    "/dequelabs/axe-core",
    "/mdn/content",
    "/pixijs/pixijs",
    "/mrdoob/three.js",
    "/adobe/react-spectrum",
    "/storybookjs/storybook",
    "/lovell/sharp",
    "/GoogleChrome/web.dev"
  ],
  "testing": [
    "/github/docs",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/vercel/next.js",
    "/reactjs/react.dev",
    "/microsoft/typescript",
    "/testing-library/react-testing-library",
    "/microsoft/playwright",
    "/vitest-dev/vitest",
    "/colinhacks/zod",
    "/getsentry/sentry-docs",
    "/websites/developer_chrome",
    "/websites/developer_apple_webkit",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api",
    "/dequelabs/axe-core",
    "/mdn/content",
    "/adobe/react-spectrum",
    "/OWASP/wstg",
    "/storybookjs/storybook",
    "/open-telemetry/opentelemetry.io",
    "/GoogleChrome/web.dev"
  ],
  "security": [
    "/vercel/next.js",
    "/reactjs/react.dev",
    "/microsoft/typescript",
    "/colinhacks/zod",
    "/cure53/dompurify",
    "/getsentry/sentry-docs",
    "/stripe/stripe-js",
    "/resend/resend-node",
    "/neondatabase/neon",
    "/upstash/docs",
    "/github/docs",
    "/websites/developer_chrome",
    "/websites/developer_apple_webkit",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api",
    "/dropbox/zxcvbn",
    "/OWASP/wstg"
  ],
  "audio": [
    "/goldfire/howler.js",
    "/websites/developer_chrome",
    "/websites/developer_apple_webkit",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api"
  ],
  "deep-dive": [
    "/github/docs",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/vercel/next.js",
    "/reactjs/react.dev",
    "/microsoft/typescript",
    "/opennextjs/opennextjs-cloudflare",
    "/opennextjs/docs",
    "/cloudflare/workers-sdk",
    "/neondatabase/neon",
    "/upstash/docs",
    "/stripe/stripe-js",
    "/resend/resend-node",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api",
    "/getsentry/sentry-docs",
    "/bvaughn/react-error-boundary",
    "/microsoft/playwright",
    "/vitest-dev/vitest",
    "/websites/developer_chrome",
    "/websites/developer_apple_webkit",
    "/android/developers",
    "/dequelabs/axe-core",
    "/mdn/content",
    "/pixijs/pixijs",
    "/mrdoob/three.js",
    "/adobe/react-spectrum",
    "/OWASP/wstg",
    "/google/search-central",
    "/storybookjs/storybook",
    "/open-telemetry/opentelemetry.io",
    "/lovell/sharp",
    "/GoogleChrome/web.dev"
  ],
  "seo": [
    "/vercel/next.js",
    "/reactjs/react.dev",
    "/microsoft/typescript",
    "/websites/tailwindcss",
    "/coreyhaines31/marketingskills",
    "/github/docs",
    "/websites/developer_chrome",
    "/websites/developer_apple_webkit",
    "jules.google/docs",
    "developers.google.com/jules/api",
    "/google-gemini/gemini-cli",
    "/websites/ai_google_dev_gemini-api",
    "/google/search-central",
    "/GoogleChrome/web.dev"
  ]
};

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

function saveManifest(inventory) {
  fs.writeFileSync(path.join(DOCS_DIR, 'manifest.json'), JSON.stringify({
    lastUpdated: new Date().toISOString(),
    groups: LIBRARIES,
    inventory: Array.from(inventory)
  }, null, 2));
}

async function main() {
  console.log('Starting continuous documentation refresh...');

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }



  const uniqueLibraries = new Set();
  const libraryToGroups = new Map();

  for (const [group, libs] of Object.entries(LIBRARIES)) {
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
  const manifestPath = path.join(DOCS_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.inventory && Array.isArray(manifest.inventory)) {
        manifest.inventory.forEach(lib => inventory.add(lib));
      }
    } catch (e) {
      console.warn('Failed to parse existing manifest.json. Starting fresh inventory.', e.message);
    }
  }

  let stats = {
    updated: 0,
    failed: 0,
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

    while (batchContinues && pendingUpdates.length > 0) {
      const nextUpdate = pendingUpdates[0];
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

      console.log(`Fetching docs for ${lib} to temp to determine exact size BEFORE downloading into .docs...`);

      let output;
      try {
        // Fetch into memory first. This acts as our "temp" buffer so we know the EXACT size BEFORE it touches .docs
        output = execFileSync('npx', ['--yes', 'ctx7', 'docs', lib, 'full documentation'], {
            encoding: 'utf8'
        });
      } catch (e) {
        console.error(`Failed to fetch docs for ${lib}:`, e.message);
        stats.failed++;
        stats.errors.push(`Error on ${lib}: ${e.message}`);
        pendingUpdates.shift();
        stats.pending--;
        continue;
      }

      const exactSize = Buffer.byteLength(output, 'utf8');
      const netSizeIncrease = exactSize - existingSize;

      if (currentDocsSize + netSizeIncrease > MAX_DOCS_SIZE_BYTES) {
        console.log(`Library ${lib} (exact size ${exactSize} bytes) would exceed 495 MB limit (current: ${currentDocsSize}, net increase: ${netSizeIncrease}).`);
        console.log('Capacity full. Breaking batch.');
        // We do NOT shift it from pendingUpdates, we do NOT save it to .docs. It remains pending.
        batchContinues = false;
        break;
      }

      // It fits! We can now process it into .docs
      pendingUpdates.shift();
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
               try {
                  fs.unlinkSync(docPath);
               } catch(e) {
                  if (e.code !== 'ENOENT') {
                     throw e;
                  }
               }
               try {
                  const relativeTarget = path.relative(groupDir, path.join(DOCS_DIR, groups[0], `${safeName}.md`));
                  fs.symlinkSync(relativeTarget, docPath);
               } catch(e) {
                  // fallback
                  fs.writeFileSync(docPath, output);
               }
            }
          }
      } else {
          console.log(`UPDATED: ${lib}`);
          stats.updated++;

          // Write primary copy to first group
          const firstGroupPath = path.join(DOCS_DIR, groups[0], `${safeName}.md`);
          fs.writeFileSync(firstGroupPath, output);

          // Write symlinks for subsequent groups
          for (let i = 1; i < groups.length; i++) {
             const groupDir = path.join(DOCS_DIR, groups[i]);
             const docPath = path.join(groupDir, `${safeName}.md`);
             if (fs.existsSync(docPath)) {
                 fs.unlinkSync(docPath);
             }
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
      }

      const wasInInventory = inventory.has(lib);
      inventory.add(lib);

      if (isNewOrUpdated || !wasInInventory) {
          saveManifest(inventory);
      }

      // Update current docs size using strict filesystem measurement to be safe
      currentDocsSize = getDirSize(DOCS_DIR);
    }



    // If we couldn't fit the package, and we are about to start a new batch,
    // we must wait/poll to give an external process time to clear space,
    // otherwise we spin endlessly and halt on the boundary.
    if (pendingUpdates.length > 0) {
      console.log('Batch ended due to capacity constraint. Polling for space...');
      
      // Wait a short period to allow external processes to potentially free space
      const WAIT_PERIOD_MS = 2000;
      console.log(`Waiting ${WAIT_PERIOD_MS}ms for potential external cleanup...`);
      
      // Sleep to yield to external processes
      const sleep = (ms) => {
        const end = Date.now() + ms;
        while (Date.now() < end) {
          // Busy wait (in production, consider using a proper sleep mechanism)
        }
      };
      sleep(WAIT_PERIOD_MS);
      
      let newSize = getDirSize(DOCS_DIR);
      console.log(`Size after wait: ${(newSize / 1024 / 1024).toFixed(2)} MB (was ${(currentDocsSize / 1024 / 1024).toFixed(2)} MB)`);
      
      if (newSize >= currentDocsSize) {
         // No space was freed. Check if ANY pending library can possibly fit.
         const nextLib = pendingUpdates[0].lib;
         console.error(`Hard ceiling deadlock: No space freed after batch boundary.`);
         console.error(`Cannot make progress on ${nextLib} - would require space under ${MAX_DOCS_SIZE_BYTES} bytes ceiling.`);
         console.error(`Current size: ${newSize} bytes, Maximum: ${MAX_DOCS_SIZE_BYTES} bytes`);
         console.error(`No pending library can fit under the hard ceiling without external intervention.`);
         stats.errors.push(`Hard ceiling deadlock: No progress possible after batch ${stats.batches}`);
         break;
      } else {
        console.log('Space was freed. Continuing with next batch...');
        currentDocsSize = newSize;
      }
    }
  }

  stats.finalSize = getDirSize(DOCS_DIR);

  console.log(`\n--- DOCUMENTATION REFRESH REPORT ---`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Successfully updated: ${stats.updated}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Unchanged: ${stats.unchanged}`);
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
