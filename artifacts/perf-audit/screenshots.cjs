#!/usr/bin/env node
/**
 * Captures first-screen screenshots and the document's resource hints for
 * visual parity evidence.
 *
 * Usage: node artifacts/perf-audit/screenshots.cjs <url> <outputDir>
 */
const { chromium } = require('playwright-chromium');
const fs = require('node:fs');
const path = require('node:path');

const url = process.argv[2];
const outDir = path.resolve(process.argv[3] || 'artifacts/perf-audit/after');
if (!url) {
  console.error('Usage: node artifacts/perf-audit/screenshots.cjs <url> <outputDir>');
  process.exit(2);
}

const viewports = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1, mobile: false },
  { name: 'mobile', width: 390, height: 844, dpr: 3, mobile: true },
];

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const summary = {};

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(url, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(2500);

    const file = path.join(outDir, `homepage-${vp.name}.png`);
    await page.screenshot({ path: file });

    const hints = await page.evaluate(() => ({
      heroHints: [...document.querySelectorAll('head link[rel="preload"][as="image"]')].map((link) => ({
        href: link.getAttribute('href'),
        imagesrcset: link.getAttribute('imagesrcset'),
        type: link.getAttribute('type'),
        fetchpriority: link.getAttribute('fetchpriority'),
      })),
      heroPicture: (() => {
        const img = document.querySelector('.hero-image-container img');
        if (!img) return null;
        return {
          currentSrc: img.currentSrc,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          clientWidth: img.clientWidth,
          clientHeight: img.clientHeight,
          complete: img.complete,
        };
      })(),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      heroText: document.querySelector('h1') ? document.querySelector('h1').textContent : null,
    }));

    summary[vp.name] = { screenshot: file, ...hints, consoleErrors: errors };
    await context.close();
  }

  fs.writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
