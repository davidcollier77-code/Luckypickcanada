/**
 * Production-server probe for specs/190-link-prefetch-policy.
 *
 * Hovers a navigation link under Save-Data (where the adaptive plan forbids
 * speculative prefetching) and on a capable connection (where intent prefetch
 * stays enabled), counting App Router RSC requests in each case. It then clicks
 * the link under Save-Data to confirm navigation itself still works.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3104';
const OUT = new URL('./', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];

async function run({ label, saveData }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (saveData) {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: {
          saveData: true,
          downlink: 30,
          rtt: 30,
          effectiveType: '4g',
          addEventListener() {},
          removeEventListener() {},
        },
      });
    });
  }
  const page = await context.newPage();
  const rscRequests = [];
  const errors = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.searchParams.has('_rsc')) rscRequests.push(`${url.pathname}${url.search}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(1_000);
  const afterLoad = rscRequests.length;
  const beforeHoverPaths = [...rscRequests];

  // `/about` is not one of the hub's likely-next experiences, so a hover
  // prefetch here is the Link's own behaviour rather than hub warming.
  const link = page.getByRole('link', { name: 'About', exact: true }).first();
  await link.hover();
  await page.waitForTimeout(1_500);
  const afterHover = rscRequests.length;
  const afterHoverPaths = [...rscRequests];

  let navigation = null;
  if (saveData) {
    await link.click();
    await page.waitForURL('**/about', { timeout: 20_000 });
    await page.waitForTimeout(1_000);
    navigation = {
      url: new URL(page.url()).pathname,
      heading: (await page.locator('h1').first().textContent())?.trim() ?? null,
    };
  }

  results.push({
    label,
    saveData,
    rscAfterLoad: afterLoad,
    rscAfterHover: afterHover,
    beforeHoverPaths,
    afterHoverPaths,
    hoverPrefetched: afterHover > afterLoad,
    navigation,
    errors,
  });
  await context.close();
}

await run({ label: 'save-data', saveData: true });
await run({ label: 'capable', saveData: false });

await browser.close();
writeFileSync(`${OUT}probe.json`, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
