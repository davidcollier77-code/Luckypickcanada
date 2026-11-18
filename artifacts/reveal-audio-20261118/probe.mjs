/**
 * Production-server probe for specs/188-reveal-audio-delivery.
 *
 * Opens the Daily Card Reveal with a cold cache and records every sound
 * response, so a duplicate request per cue would be visible. It then activates
 * the reveal once and reports whether the audio path produced console errors.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3102';
const OUT = new URL('./', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

const soundResponses = [];
page.on('response', async (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/sounds/')) return;
  let bodyBytes = null;
  try {
    bodyBytes = (await response.body()).length;
  } catch {
    bodyBytes = null;
  }
  soundResponses.push({ path: url.pathname, status: response.status(), bodyBytes });
});

await page.goto(`${BASE}/reveal`, { waitUntil: 'networkidle', timeout: 60_000 });
// Let the deferred Howler preload and fetch settle.
await page.waitForTimeout(2_500);

const beforeActivation = [...soundResponses];
const revealButton = page.getByRole('button', { name: /Reveal Today/i }).first();
let activation = 'not-found';
if (await revealButton.count()) {
  await revealButton.click();
  activation = 'clicked';
  await page.waitForTimeout(5_000);
}

const duplicates = {};
for (const response of soundResponses) {
  duplicates[response.path] = (duplicates[response.path] ?? 0) + 1;
}

const summary = {
  activation,
  requestCount: soundResponses.length,
  duplicateRequests: Object.values(duplicates).reduce((total, count) => total + Math.max(0, count - 1), 0),
  perPath: duplicates,
  requestsBeforeActivation: beforeActivation.length,
  requestsAfterActivation: soundResponses.length - beforeActivation.length,
  totalBodyBytes: soundResponses.reduce((total, response) => total + (response.bodyBytes ?? 0), 0),
  standardCueRequestCount: soundResponses.filter((response) =>
    response.path.includes('standard_'),
  ).length,
  standardCueDuplicates: Object.entries(duplicates)
    .filter(([path]) => path.includes('standard_'))
    .reduce((total, [, count]) => total + Math.max(0, count - 1), 0),
  errors,
  responses: soundResponses,
};

await browser.close();
writeFileSync(`${OUT}probe.json`, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, responses: undefined }, null, 2));
