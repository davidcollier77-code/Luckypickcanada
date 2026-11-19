/**
 * Production-server probe for specs/189-image-derivative-dedupe.
 *
 * Loads the two routes the audit flagged and records every image response, so a
 * second derivative of the same artwork is visible next to the one the
 * responsive `<picture>` painted.
 *
 * `MASK_LOADED=1` hides the "already loaded" signals the hub reads (`currentSrc`,
 * `naturalWidth`, resource timing). The same build then behaves like the pre-fix
 * hub, which shows that the reuse path — not a missing hub — removes the extra
 * request.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3103';
const MASK_LOADED = process.env.MASK_LOADED === '1';
const OUT = new URL('./', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { path: '/lucky-meter', artwork: '/images/lucky-meter-night-sky' },
  { path: '/crystal-ball', artwork: '/assets/crystal-ball-pedestal' },
];
const VIEWPORTS = [
  { width: 1440, height: 900, dpr: 1 },
  { width: 1024, height: 768, dpr: 1 },
  { width: 1024, height: 768, dpr: 2 },
];

const browser = await chromium.launch();
const report = [];

for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.dpr });
    if (MASK_LOADED) {
      await context.addInitScript(() => {
        const original = performance.getEntriesByType.bind(performance);
        performance.getEntriesByType = (type) => (type === 'resource' ? [] : original(type));
        Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { get: () => 0 });
        Object.defineProperty(HTMLImageElement.prototype, 'currentSrc', { get: () => '' });
      });
    }
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    const imageResponses = [];
    page.on('response', async (response) => {
      const url = new URL(response.url());
      if (!/\.(avif|webp|png|jpe?g)$/i.test(url.pathname)) return;
      let bodyBytes = null;
      try {
        bodyBytes = (await response.body()).length;
      } catch {
        bodyBytes = null;
      }
      imageResponses.push({ path: url.pathname, status: response.status(), bodyBytes });
    });

    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 60_000 });
    // The hub prepares the current route after the page settles.
    await page.waitForTimeout(4_000);

    const painted = await page.evaluate(() =>
      Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth > 0)
        .map((image) => ({
          src: image.getAttribute('src'),
          width: image.naturalWidth,
          rendered: image.clientWidth,
        })),
    );

    const counts = {};
    for (const response of imageResponses) {
      counts[response.path] = (counts[response.path] ?? 0) + 1;
    }
    const requested = imageResponses
      .map((response) => response.path)
      .filter((path) => path.startsWith(route.artwork));
    const identities = requested.map((path) => path.replace(/-\d+w(?=\.[a-z0-9]+$)/i, ''));

    report.push({
      viewport: `${viewport.width}x${viewport.height}@${viewport.dpr}x`,
      route: route.path,
      maskLoadedSignals: MASK_LOADED,
      artworkDerivativeRequests: requested,
      duplicateUnderlyingDerivative: identities.length > new Set(identities).size,
      counts,
      totalImageBytes: imageResponses.reduce((total, response) => total + (response.bodyBytes ?? 0), 0),
      painted,
      errors,
    });

    await context.close();
  }
}

await browser.close();
const file = `${OUT}probe${MASK_LOADED ? '-masked' : ''}.json`;
writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
for (const entry of report) {
  console.log(
    JSON.stringify({
      viewport: entry.viewport,
      route: entry.route,
      artwork: entry.artworkDerivativeRequests,
      duplicate: entry.duplicateUnderlyingDerivative,
      bytes: entry.totalImageBytes,
      errors: entry.errors.length,
    }),
  );
}
