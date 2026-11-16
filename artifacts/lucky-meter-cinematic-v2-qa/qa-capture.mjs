/**
 * Lucky Meter cinematic v2 — visual QA capture harness.
 *
 * Drives the real /lucky-meter experience in Chromium, seeds a deterministic
 * daily result so each cinematic event can be captured on its own, records
 * screenshots at documented beats and samples frame timing.
 *
 * Usage:
 *   node artifacts/lucky-meter-cinematic-v2-qa/qa-capture.mjs <outDir> [viewportName]
 *
 * Viewports mirror the repository Playwright projects exactly:
 *   desktop 1440x900, mobile-390 390x844, mobile-412 412x915.
 *
 * This is measurement evidence for the task, not a committed visual baseline.
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  'mobile-390': { width: 390, height: 844, isMobile: true, hasTouch: true },
  'mobile-412': { width: 412, height: 915, isMobile: true, hasTouch: true },
};

const EVENTS = {
  meteor: { duration: 9000, name: 'Meteor Shower', numbers: [3, 9, 21] },
  lightning: { duration: 10000, name: 'Cosmic Lightning', numbers: [11, 22, 33] },
  fireworks: { duration: 11500, name: 'Fireworks', numbers: [7, 8, 77] },
};

function localDateKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function buildState(eventId, { percentage = 87, completed = false } = {}) {
  const event = EVENTS[eventId];
  const tier =
    percentage >= 80
      ? {
          id: 'high',
          label: 'High Resonance',
          message: 'Your luck is running high today!',
          numbers: [7, 8, 77],
        }
      : percentage >= 40
        ? {
            id: 'medium',
            label: 'Medium Resonance',
            message: 'Your luck is in the mid-range today.',
            numbers: [11, 22, 33],
          }
        : {
            id: 'low',
            label: 'Low Resonance',
            message: "You're riding a little low today, but you're still okay!",
            numbers: [3, 9, 21],
          };

  return {
    version: 1,
    dateKey: localDateKey(),
    result: {
      dateKey: localDateKey(),
      percentage,
      tier,
      event: { id: eventId, name: event.name },
      colour: { id: 'maple-red', name: 'Maple Red', hex: '#B52B32', light: false },
      spark: {
        id: 'spark-06',
        message: 'Your pace is your own, and it is allowed to change.',
      },
      createdAt: Date.now(),
    },
    history: { percentages: [percentage], events: [eventId], sparks: ['spark-06'] },
    eventCompleted: completed,
    stageDurationMs: event.duration,
  };
}

async function seed(page, eventId, options) {
  const state = buildState(eventId, options);
  await page.addInitScript(
    ([key, payload]) => {
      window.localStorage.setItem(key, JSON.stringify(payload));
    },
    [STORAGE_KEY, state],
  );
}

async function probeGraphics(context) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/lucky-meter`, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return { webgl: false };
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      webgl: true,
      version: gl.getParameter(gl.VERSION),
      vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      maxPoint: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      dpr: window.devicePixelRatio,
      contextAttributes: gl.getContextAttributes(),
    };
  });
  await page.close();
  return result;
}

async function probeFrames(page, windowMs = 4000) {
  return page.evaluate(async (duration) => {
    const intervals = [];
    const started = performance.now();
    await new Promise((resolve) => {
      let previous = started;
      const tick = (now) => {
        intervals.push(now - previous);
        previous = now;
        if (now - started < duration) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const sorted = [...intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length * 0.5)] || 0;
    return {
      frames: intervals.length,
      fps: Number(((intervals.length * 1000) / intervals.reduce((a, b) => a + b, 0)).toFixed(1)),
      medianMs: Number(median.toFixed(2)),
      p95Ms: Number((sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(2)),
      dropped: intervals.filter((value) => value > median * 1.5).length,
      longestStallMs: Number(Math.max(...intervals).toFixed(2)),
    };
  }, windowMs);
}

async function main() {
  const outDir = process.argv[2] || 'artifacts/lucky-meter-cinematic-v2-qa/run';
  const only = process.argv[3];
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const report = { capturedAt: new Date().toISOString(), baseUrl: BASE_URL, viewports: {} };

  const probeContext = await browser.newContext();
  report.graphics = await probeGraphics(probeContext);
  await probeContext.close();
  console.log('graphics:', JSON.stringify(report.graphics));

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    if (only && only !== name) continue;
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      colorScheme: 'dark',
      locale: 'en-CA',
    });
    const entry = { viewport, errors: [], states: {} };
    // Expose the engine's per-frame counters so the capture records real work.
    await context.addInitScript(() => {
      window.__LUCKY_METER_DEBUG__ = true;
    });

    // Welcome: no seeded result.
    const welcome = await context.newPage();
    const welcomeErrors = [];
    welcome.on('console', (message) => {
      if (message.type() === 'error') welcomeErrors.push(message.text());
    });
    welcome.on('pageerror', (error) => welcomeErrors.push(String(error)));
    await welcome.goto(`${BASE_URL}/lucky-meter`, { waitUntil: 'networkidle' });
    await welcome.waitForTimeout(900);
    await welcome.screenshot({ path: path.join(outDir, `${name}-welcome.png`) });
    entry.states.welcome = { errors: welcomeErrors };
    await welcome.close();

    // Each event, resumed from persisted state.
    for (const eventId of Object.keys(EVENTS)) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(String(error)));
      await seed(page, eventId, {});
      await page.goto(`${BASE_URL}/lucky-meter`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);

      const duration = EVENTS[eventId].duration;
      const beats = eventId === 'fireworks' ? [0.22, 0.42, 0.62, 0.86, 0.95] : [0.2, 0.45, 0.72, 0.93];
      const captured = [];
      // The 1200 ms settle above already counts against the event clock.
      let last = 1200;
      for (const beat of beats) {
        const target = Math.round(duration * beat);
        await page.waitForTimeout(Math.max(0, target - last));
        last = target;
        const file = `${name}-${eventId}-${String(Math.round(beat * 100)).padStart(3, '0')}.png`;
        await page.screenshot({ path: path.join(outDir, file) });
        captured.push(file);
      }

      // Frame timing during the last stretch of the event.
      const perf = await probeFrames(page, 2500);
      const debug = await page.evaluate(() => window.__luckyCosmic || null);
      entry.states[eventId] = { captured, perf, debug, errors };
      console.log(name, eventId, JSON.stringify(perf), 'errors:', errors.length);
      await page.close();
    }

    report.viewports[name] = entry;
    await context.close();
  }

  await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log('report written to', path.join(outDir, 'report.json'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
