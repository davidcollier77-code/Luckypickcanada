const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(process.cwd(), '.docs');
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

async function main() {
  console.log('Starting documentation refresh...');

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // Use ctx7 CLI to fetch documentation if available, otherwise just create placeholders for testing

  // We require CONTEXT7_API_KEY environment variable. Let's make sure it's set.
  // Although not all context7 calls require the key, we fail non-zero on retrieval failure.
  // Use ctx7 CLI to fetch documentation
  let ctx7Available = false;
  try {
    execSync('npx --no-install ctx7 --version', { stdio: 'ignore' });
    ctx7Available = true;
  } catch (e) {
    console.error('ctx7 CLI not available locally. Failing.');
    process.exit(1); // Fail non-zero
  }


  const inventory = new Set();

  for (const [group, libs] of Object.entries(LIBRARIES)) {
    const groupDir = path.join(DOCS_DIR, group);
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir, { recursive: true });
    }

    for (const lib of libs) {
      inventory.add(lib);
      const safeName = lib.replace(/[\/\.]/g, '_');
      const docPath = path.join(groupDir, `${safeName}.md`);


      if (ctx7Available) {
         try {
             // In a real environment with credentials, this would fetch actual docs
             // We use "npx --yes ctx7 query"
             const output = execFileSync('npx', ['--yes', 'ctx7', 'query', lib, 'full documentation'], {
                 encoding: 'utf8'
             });
             fs.writeFileSync(docPath, output);
         } catch(e) {
             console.error(`Failed to fetch docs for ${lib}:`, e.message);
             process.exit(1); // Fail clearly on retrieval failure
         }
      }

    }
  }

  console.log(`Verified ${inventory.size} unique libraries across ${Object.keys(LIBRARIES).length} groups.`);

  // Create manifest for verification
  try {
    fs.writeFileSync(path.join(DOCS_DIR, 'manifest.json'), JSON.stringify({
      lastUpdated: new Date().toISOString(),
      groups: LIBRARIES,
      inventory: Array.from(inventory)
    }, null, 2));
  } catch (e) {
    console.error('Failed to write manifest.json:', e.message);
    process.exit(1);
  }

  console.log('Documentation refresh complete.');
}

main().catch(console.error);
