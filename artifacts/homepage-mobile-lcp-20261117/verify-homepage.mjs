// Browser verification for the homepage hero candidate change.
//
// For each required viewport it records console errors, failed requests,
// horizontal overflow, hero/navigation presence, and whether the night-sky
// canvas is actually animating. It also renders the hero emblem twice - once with
// the 768 w candidate and once by routing that URL to the previous 1024 w file -
// and reports the pixel difference, so the byte saving can be judged against what
// the visitor actually sees.
//
// Usage: node artifacts/homepage-mobile-lcp-20261117/verify-homepage.mjs [url]

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:3100/';
const outDir = 'artifacts/homepage-mobile-lcp-20261117';
mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'mobile-390x844', width: 390, height: 844, dpr: 2.75, mobile: true },
  { name: 'mobile-412x915', width: 412, height: 915, dpr: 2.75, mobile: true },
  { name: 'desktop-1440x900', width: 1440, height: 900, dpr: 1, mobile: false },
];

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const summary = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.dpr,
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 200));
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`.slice(0, 200)));
  page.on('requestfailed', (request) => failedRequests.push(`${request.url().slice(0, 120)} ${request.failure()?.errorText}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url().slice(0, 120)}`);
  });

  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);

  const state = await page.evaluate(async () => {
    const hero = document.querySelector('.hero-art-slice--emblem .hero-art-image');
    const nav = document.querySelector('nav[aria-label="Primary navigation"]');
    const canvas = document.querySelector('canvas.homepage-star-canvas');
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await frame();
    const first = canvas ? canvas.toDataURL().length : 0;
    await new Promise((resolve) => setTimeout(resolve, 350));
    await frame();
    const second = canvas ? canvas.toDataURL().length : 0;
    return {
      currentSrc: hero?.currentSrc.replace(location.origin, '') ?? null,
      naturalWidth: hero?.naturalWidth ?? null,
      heroBox: hero ? hero.getBoundingClientRect().toJSON() : null,
      navLinks: nav ? nav.querySelectorAll('a').length : 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      canvasPresent: Boolean(canvas),
      canvasAnimating: first > 0 && second > 0 && first !== second,
      h1: document.querySelector('h1')?.textContent?.trim() ?? null,
      countdownPresent: /next|rolls over|resets|countdown/i.test(document.body.innerText),
      revealCtas: document.querySelectorAll('button, a').length,
    };
  });

  await page.screenshot({ path: `${outDir}/after-${viewport.name}.png`, fullPage: false });
  summary.push({ viewport: viewport.name, ...state, consoleErrors, failedRequests });
  await context.close();
}

// A/B fidelity comparison at the PSI mobile profile: same page, same browser,
// same render size; only the hero candidate file differs.
const context = await browser.newContext({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true,
});

async function captureEmblem(rerouteToPreviousCandidate) {
  const page = await context.newPage();
  if (rerouteToPreviousCandidate) {
    await page.route('**/homepage-hero-lucky-pick-canada-768w.avif', async (route) => {
      const response = await route.fetch({ url: route.request().url().replace('-768w.avif', '.avif') });
      await route.fulfill({ response });
    });
  }
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('.hero-art-slice--emblem .hero-art-image');
  await page.waitForFunction(
    () => document.querySelector('.hero-art-slice--emblem .hero-art-image')?.complete === true
  );
  await page.waitForTimeout(600);
  const buffer = await page.locator('.hero-art-slice--emblem').screenshot();
  await page.close();
  return buffer;
}

const withNew = await captureEmblem(false);
const withPrevious = await captureEmblem(true);
const a = await sharp(withNew).removeAlpha().raw().toBuffer();
const b = await sharp(withPrevious).removeAlpha().raw().toBuffer();
let absDiff = 0;
let worst = 0;
for (let i = 0; i < Math.min(a.length, b.length); i++) {
  const d = Math.abs(a[i] - b[i]);
  absDiff += d;
  if (d > worst) worst = d;
}
const meanAbsDiff = absDiff / Math.min(a.length, b.length);

console.log(JSON.stringify({ summary, fidelity: { meanAbsDiff, worstChannelDiff: worst, sampleBytes: Math.min(a.length, b.length) } }, null, 2));

await context.close();
await browser.close();
