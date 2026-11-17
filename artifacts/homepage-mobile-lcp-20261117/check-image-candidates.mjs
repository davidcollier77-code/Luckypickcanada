// Reports which hero-artwork candidate each device profile actually downloads,
// so an image-ladder change can be verified rather than assumed.
//
// Usage: node artifacts/homepage-mobile-lcp-20261117/check-image-candidates.mjs [url]

import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:3100/';

const profiles = [
  { name: 'mobile-390 (DPR 2.75)', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
  { name: 'mobile-412 (DPR 1.75, PSI)', viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true },
  { name: 'mobile-412 (DPR 2.75)', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
  { name: 'desktop-1440 (DPR 1)', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

for (const profile of profiles) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  const info = await page.evaluate(() => {
    const img = document.querySelector('.hero-art-slice--emblem .hero-art-image');
    const entry = performance.getEntriesByName(img.currentSrc)[0];
    return {
      currentSrc: img.currentSrc.replace(location.origin, ''),
      naturalWidth: img.naturalWidth,
      renderedWidth: Math.round(img.getBoundingClientRect().width),
      transferSize: entry ? entry.transferSize : null,
    };
  });
  const needed = profile.viewport.width * profile.deviceScaleFactor;
  console.log(`${profile.name}: needs ${Math.round(needed)} device px -> ${info.currentSrc} (${info.naturalWidth}w, ${Math.round((info.transferSize || 0) / 1024)} KiB, rendered ${info.renderedWidth} CSS px)`);
  await context.close();
}

await browser.close();
