/**
 * Production-server probe for specs/191-reveal-window-protection.
 *
 * Presses the real reveal and measures press-to-reveal-complete and
 * press-to-event-complete from the persisted lifecycle, so the protection
 * change can be shown to leave the cinematic timing untouched. It also records
 * every request that starts between the press and completion.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3105';
const OUT = new URL('./', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Prefer reduced motion so the run is deterministic? No: the task is the real
// cinematic, so keep full motion and give it time.
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto(`${BASE}/lucky-meter`, { waitUntil: 'networkidle', timeout: 60_000 });

const requests = [];
const startedAt = Date.now();
page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  requests.push({ t: Date.now() - startedAt, path: url.pathname, type: request.resourceType() });
});

const button = page.getByRole('button', { name: /Reveal My Resonance/i }).first();
await button.click();
const pressedAt = Date.now();

const readState = () =>
  page.evaluate((key) => {
    try {
      return JSON.parse(window.localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }, STORAGE_KEY);

let revealCompletedAt = null;
let eventCompletedAt = null;
const deadline = pressedAt + 90_000;
while (Date.now() < deadline && eventCompletedAt === null) {
  const state = await readState();
  if (revealCompletedAt === null && state.revealCompleted === true) {
    revealCompletedAt = Date.now();
  }
  if (state.eventCompleted === true) {
    eventCompletedAt = Date.now();
    break;
  }
  await page.waitForTimeout(100);
}
// Let the released queue run, so deferred warm-up is visible after completion.
await page.waitForTimeout(4_000);
const finishedAt = Date.now();

const relative = (request) => request.t - (pressedAt - startedAt);
// Reveal-owned requests: the cue files the reveal itself loads, its visit
// counter and the button click. Anything else after the press would be
// competing background preparation.
const isRevealOwned = (request) =>
  request.path.startsWith('/sounds/') ||
  request.path.startsWith('/freesound_community') ||
  request.path.startsWith('/dragon-studio') ||
  request.path === '/api/visits';
const afterPress = requests.filter((request) => relative(request) >= 0);

const result = {
  pressedAt: new Date(pressedAt).toISOString(),
  pressToRevealCompletedMs: revealCompletedAt === null ? null : revealCompletedAt - pressedAt,
  pressToEventCompletedMs: eventCompletedAt === null ? null : eventCompletedAt - pressedAt,
  measuredForMs: finishedAt - pressedAt,
  state: await readState(),
  requestsDuringReveal: afterPress.map((request) => ({
    msAfterPress: relative(request),
    path: request.path,
    type: request.type,
    revealOwned: isRevealOwned(request),
  })),
  // A request is competing only if it starts clearly inside the window; the
  // release and the last poll can land in the same 100 ms tick.
  competingRequestsAfterPress:
    eventCompletedAt === null
      ? afterPress.filter((request) => !isRevealOwned(request)).map((request) => request.path)
      : afterPress
          .filter(
            (request) =>
              !isRevealOwned(request) &&
              relative(request) < eventCompletedAt - pressedAt - 300,
          )
          .map((request) => request.path),
  requestsAfterCompletion:
    eventCompletedAt === null
      ? []
      : requests
          .filter((request) => relative(request) > eventCompletedAt - pressedAt)
          .map((request) => ({ msAfterPress: relative(request), path: request.path })),
  consoleErrors: errors,
};

await browser.close();
writeFileSync(`${OUT}probe.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      pressToRevealCompletedMs: result.pressToRevealCompletedMs,
      pressToEventCompletedMs: result.pressToEventCompletedMs,
      eventCompleted: result.state.eventCompleted,
      sparkCompleted: result.state.sparkCompleted,
      competingRequestsAfterPress: result.competingRequestsAfterPress,
      requestsAfterCompletion: result.requestsAfterCompletion,
      requests: result.requestsDuringReveal.map(
        (request) => `${request.msAfterPress}ms ${request.path} (${request.type})`,
      ),
      consoleErrors: result.consoleErrors,
    },
    null,
    2,
  ),
);
