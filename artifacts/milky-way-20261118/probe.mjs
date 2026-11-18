/**
 * Production-server probe for specs/187-milky-way-sky-delivery.
 *
 * Loads every route that paints the shared Milky Way backdrop at a mobile and a
 * desktop viewport, records the backdrop response the browser actually chose,
 * and reports its byte size, the computed focal treatment, and layout/console
 * health. Writes JSON so the numbers in the evidence file are reproducible.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3101';
const OUT = new URL('./', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const PROFILES = [
  { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];
const ROUTES = ['/', '/crystal-ball', '/map'];

const browser = await chromium.launch();
const results = [];

for (const profile of PROFILES) {
  for (const route of ROUTES) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor,
      isMobile: profile.isMobile ?? false,
      hasTouch: profile.hasTouch ?? false,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    const skyResponses = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('crystal-ball-bg-')) return;
      let bodyBytes = null;
      try {
        bodyBytes = (await response.body()).length;
      } catch {
        bodyBytes = null;
      }
      skyResponses.push({ url: url.replace(BASE, ''), status: response.status(), bodyBytes });
    });

    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 45_000 });

    const artwork = page.locator('.homepage-sky-backdrop__art').first();
    await artwork.waitFor({ state: 'attached', timeout: 15_000 });
    await page.waitForFunction(
      () => {
        const image = document.querySelector('.homepage-sky-backdrop__art');
        return Boolean(image && image.complete && image.naturalWidth > 0);
      },
      null,
      { timeout: 20_000 },
    );

    const metrics = await artwork.evaluate((image) => {
      const style = getComputedStyle(image);
      const rect = image.getBoundingClientRect();
      return {
        currentSrc: image.currentSrc.replace(location.origin, ''),
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
      };
    });

    const horizontalOverflow =
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

    results.push({
      profile: profile.name,
      route,
      viewport: profile.viewport,
      ...metrics,
      horizontalOverflow,
      errors,
      skyResponses,
    });

    await context.close();
  }
}

await browser.close();
writeFileSync(`${OUT}probe.json`, `${JSON.stringify(results, null, 2)}\n`);
for (const result of results) {
  console.log(
    `${result.profile.padEnd(7)} ${result.route.padEnd(14)} ${String(result.currentSrc).padEnd(42)} ` +
      `${result.naturalWidth}x${result.naturalHeight} ${result.objectPosition} overflow=${result.horizontalOverflow} ` +
      `errors=${result.errors.length}`,
  );
  for (const response of result.skyResponses) {
    console.log(`   ${response.url} status=${response.status} bytes=${response.bodyBytes}`);
  }
}
