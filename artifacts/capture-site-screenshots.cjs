/* eslint-disable no-console */
// Capture real Chromium screenshots of the live site for visual inspection.
//
// Prerequisite (once per workspace):
//   scripts/setup-chromium-libs.sh
//   eval "$(scripts/setup-chromium-libs.sh --env)"
//
// Usage:
//   node artifacts/capture-site-screenshots.cjs [url]
//
// Writes PNGs plus report.json into artifacts/browser-proof/. The report records
// what the browser actually observed, so a screenshot cannot be claimed without
// evidence that the page rendered.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-chromium');

const TARGET = process.argv[2] || process.env.TARGET_URL || 'https://luckypickcanada.ca/';
const OUT = path.join(__dirname, 'browser-proof');

const VIEWPORTS = [
  { label: 'desktop-1440x900', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  {
    label: 'mobile-390x844',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  {
    label: 'mobile-412x915',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
];

async function inspect(page, label) {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 300));
  });

  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  // Let hero/entry animations settle before capturing.
  await page.waitForTimeout(4_000);

  const facts = await page.evaluate(() => {
    const images = Array.from(document.images);
    const heading = document.querySelector('h1, h2');
    return {
      title: document.title,
      heading: heading ? heading.textContent.trim().slice(0, 120) : null,
      url: location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      images: {
        total: images.length,
        loaded: images.filter((img) => img.complete && img.naturalWidth > 0).length,
        broken: images
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.currentSrc || img.src)
          .slice(0, 10),
      },
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      visibleTextLength: (document.body.innerText || '').trim().length,
    };
  });

  const viewportShot = path.join(OUT, `luckypickcanada-${label}.png`);
  await page.screenshot({ path: viewportShot, fullPage: false });

  let fullPageShot = null;
  if (label.startsWith('desktop')) {
    fullPageShot = path.join(OUT, `luckypickcanada-${label}-fullpage.png`);
    await page.screenshot({ path: fullPageShot, fullPage: true });
  }

  return {
    label,
    status: response ? response.status() : null,
    ...facts,
    horizontalOverflow: facts.document.scrollWidth - facts.document.clientWidth,
    consoleErrors,
    screenshots: [viewportShot, fullPageShot].filter(Boolean).map((file) => path.relative(OUT, file)),
    bytes: [viewportShot, fullPageShot]
      .filter(Boolean)
      .map((file) => ({ file: path.relative(OUT, file), size: fs.statSync(file).size })),
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const version = browser.version();
  const results = [];

  for (const spec of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: spec.viewport,
      deviceScaleFactor: spec.deviceScaleFactor,
      isMobile: Boolean(spec.isMobile),
      hasTouch: Boolean(spec.hasTouch),
      colorScheme: 'dark',
      locale: 'en-CA',
    });
    const page = await context.newPage();
    const result = await inspect(page, spec.label);
    results.push(result);
    console.log(
      `${result.status} ${spec.label} — title="${result.title}" images=${result.images.loaded}/${result.images.total} overflow=${result.horizontalOverflow}px text=${result.visibleTextLength} chars`,
    );
    await context.close();
  }

  await browser.close();

  const report = {
    target: TARGET,
    capturedAt: new Date().toISOString(),
    browser: { name: 'chromium', version },
    platform: process.platform,
    results,
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\nChromium ${version} — ${results.length} viewport(s) captured into ${OUT}`);
}

main().catch((error) => {
  console.error('CAPTURE FAILED:', error);
  process.exit(1);
});
