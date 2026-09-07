const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(process.cwd(), '.docs');
const MAX_DOCS_SIZE_BYTES = 495 * 1024 * 1024;

const LIBRARIES = {
  creation: [
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
    "/websites/ai_google_dev_gemini-api"
  ],
  troubleshooting: [
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
    "/websites/ai_google_dev_gemini-api"
  ],
  polishing: [
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
    "/websites/ai_google_dev_gemini-api"
  ],
  testing: [
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
    "/websites/ai_google_dev_gemini-api"
  ],
  security: [
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
    "/websites/ai_google_dev_gemini-api"
  ],
  audio: [
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
    "/websites/developer_apple_webkit"
  ],
  seo: [
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
    "/websites/ai_google_dev_gemini-api"
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
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stats.size;
    }
  }
  return size;
}

function generateManifestContent(inventory) {
  return JSON.stringify({
    lastUpdated: new Date().toISOString(),
    groups: LIBRARIES,
    inventory: Array.from(inventory)
  }, null, 2);
}

async function main() {
  console.log('Starting continuous documentation refresh...');

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  try {
    execSync('npx --no-install ctx7 --version', { stdio: 'ignore' });
  } catch (e) {
    console.error('ctx7 CLI not available locally. Failing.');
    throw new Error('ctx7 CLI not available locally');
  }

  let pendingUpdates = [];
  for (const [group, libs] of Object.entries(LIBRARIES)) {
    const groupDir = path.join(DOCS_DIR, group);
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir, { recursive: true });
    }
    for (const lib of libs) {
      pendingUpdates.push({ group, lib });
    }
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

  // We track if ANY progress was made in the current batch to detect a true deadlock.
  let madeProgressInBatch = true;

  while (pendingUpdates.length > 0 && madeProgressInBatch) {
    stats.batches++;
    console.log(`Starting Batch ${stats.batches}...`);
    madeProgressInBatch = false;

    // We create a new array for items that don't fit in THIS batch
    const nextBatchPending = [];

    while (pendingUpdates.length > 0) {
      const nextUpdate = pendingUpdates.shift();
      const lib = nextUpdate.lib;
      const group = nextUpdate.group;

      const safeName = lib.replace(/[\/\.]/g, '_');
      const groupDir = path.join(DOCS_DIR, group);
      const docPath = path.join(groupDir, `${safeName}.md`);

      let existingSize = 0;
      let contentBefore = null;
      if (fs.existsSync(docPath)) {
          existingSize = fs.statSync(docPath).size;
          contentBefore = fs.readFileSync(docPath, 'utf8');
      }

      console.log(`Fetching docs for ${lib} to memory...`);

      let output;
      let fetchSuccess = true;
      try {
        output = execFileSync('npx', ['--yes', 'ctx7', 'query', lib, 'full documentation'], {
            encoding: 'utf8'
        });
      } catch (e) {
        console.error(`Failed to fetch docs for ${lib}:`, e.message);
        stats.failed++;
        stats.errors.push(`Error on ${lib}: ${e.message}`);
        fetchSuccess = false;
        // If an actual fetch/error condition occurs, we halt the run for safety.
        console.error('Halting run due to fetch error.');
        break;
      }

      const exactSize = Buffer.byteLength(output, 'utf8');
      const netDocSizeIncrease = exactSize - existingSize;

      // Prepare simulated manifest to calculate exact manifest size increase
      const simulatedInventory = new Set(inventory);
      simulatedInventory.add(lib);
      const newManifestContent = generateManifestContent(simulatedInventory);
      const newManifestSize = Buffer.byteLength(newManifestContent, 'utf8');

      let existingManifestSize = 0;
      if (fs.existsSync(manifestPath)) {
          existingManifestSize = fs.statSync(manifestPath).size;
      }
      const netManifestSizeIncrease = newManifestSize - existingManifestSize;

      // 3. Race/capacity safety: Re-verify actual .docs size immediately before committing
      const currentDocsSize = getDirSize(DOCS_DIR);
      const totalNetIncrease = netDocSizeIncrease + netManifestSizeIncrease;

      if (currentDocsSize + totalNetIncrease > MAX_DOCS_SIZE_BYTES) {
        console.log(`Library ${lib} would exceed 495 MB limit (current: ${currentDocsSize}, net doc increase: ${netDocSizeIncrease}, net manifest increase: ${netManifestSizeIncrease}).`);
        console.log('Skipping to see if other pending libraries can shrink the directory.');
        nextBatchPending.push(nextUpdate); // Save for next batch
        continue;
      }

      // It fits!
      fs.writeFileSync(docPath, output);
      fs.writeFileSync(manifestPath, newManifestContent);

      // Update inventory and stats
      inventory.add(lib);
      stats.pending--;

      // 4. Statistics: bytesAdded can be negative
      stats.bytesAdded += totalNetIncrease;

      if (contentBefore === output) {
          stats.unchanged++;
      } else {
          stats.updated++;
      }

      madeProgressInBatch = true;
    }

    if (stats.errors.length > 0) {
        // We halted due to a fetch error, preserve the remaining items to accurately report pending count
        stats.pending += nextBatchPending.length;
        break;
    }

    // Set pendingUpdates to whatever couldn't fit in this batch
    pendingUpdates.push(...nextBatchPending);

    // 1. Deadlock detection: If we finished the pending array and made NO progress, we are deadlocked.
    if (pendingUpdates.length > 0 && !madeProgressInBatch) {
       console.error(`Hard ceiling deadlock: None of the remaining ${pendingUpdates.length} pending libraries could fit.`);
       stats.errors.push(`Hard ceiling deadlock: ${pendingUpdates.length} libraries cannot fit within the 495 MB limit.`);
       break;
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
