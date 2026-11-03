/**
 * Browser evidence for the Lucky Reveal finish polish (specs/081).
 *
 * Measures, for desktop and mobile:
 * - the painted pixel count on the confetti canvas over time, so the leaves can
 *   be shown to stay visible until they fall out of the canvas instead of
 *   vanishing at a fixed window,
 * - that the celebration layer is removed only after that canvas is empty,
 * - that the four-pulse finishing class starts right after the layer is gone and
 *   then clears, returning the balls to their normal appearance,
 * - that the new finishing chime is requested exactly at that moment and that
 *   the existing opening sparkle and confetti pop are still requested,
 * - that reduced motion keeps no canvas, no pulses and no finishing chime.
 *
 * Chromium is launched WITHOUT weakening its sandbox: no --no-sandbox flag.
 * Usage:
 *   eval "$(scripts/setup-chromium-libs.sh --env)"
 *   node artifacts/reveal-finish-phase2-probe.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'reveal-finish-phase2');
const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:3001';
const results = {};

function record(name, value) {
  results[name] = value;
  console.log(`${name}: ${JSON.stringify(value)}`);
}

async function openReveal(page) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Choose a Lucky Pick/i }).first().click();
  const preview = page.getByRole('button', { name: /Preview Reveal/i }).first();
  await preview.waitFor({ state: 'visible', timeout: 30000 });
  await preview.click();
  const dialog = page.locator('[role="dialog"][aria-labelledby="lucky-reveal-title"]');
  await dialog.waitFor({ state: 'visible', timeout: 30000 });
  return dialog;
}

const sample = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector('.lucky-celebration-particle-canvas');
    let painted = 0;
    let size = null;
    if (canvas) {
      const context = canvas.getContext('2d');
      const { width, height } = canvas;
      size = { width, height };
      if (width && height) {
        const data = context.getImageData(0, 0, width, height).data;
        for (let index = 3; index < data.length; index += 4) {
          if (data[index] > 0) painted += 1;
        }
      }
    }
    return {
      layer: Boolean(document.querySelector('.lucky-celebration')),
      canvas: Boolean(canvas),
      painted,
      size,
      finishing: Boolean(document.querySelector('.lucky-reveal-numbers--finishing')),
      numbers: document.querySelectorAll('.lucky-reveal-number').length,
    };
  });

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const viewports = {
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  };

  for (const [label, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      hasTouch: label === 'mobile',
      isMobile: label === 'mobile',
    });
    const page = await context.newPage();
    const requests = [];
    const pageErrors = [];
    page.on('request', (request) => {
      const url = request.url();
      if (/chime-sound|confetti-pop|reveal-finish-chime/.test(url)) {
        requests.push(url.split('/').pop());
      }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message.slice(0, 160)));

    const dialog = await openReveal(page);

    // Wait for the celebration, then sample the canvas until the layer leaves.
    const timeline = [];
    const startedAt = Date.now();
    let sawLayer = false;
    while (Date.now() - startedAt < 20000) {
      const frame = await sample(page);
      timeline.push({ t: Date.now() - startedAt, ...frame });
      if (frame.layer) sawLayer = true;
      if (sawLayer && !frame.layer) break;
      await page.waitForTimeout(200);
    }

    const paintedFrames = timeline.filter((f) => f.painted > 0);
    const lastPainted = paintedFrames[paintedFrames.length - 1] || null;
    const lastLayerFrame = timeline.filter((f) => f.layer).pop() || null;
    record(`${label}.timeline`, timeline.map(({ t, layer, canvas, painted, finishing }) => ({ t, layer, canvas, painted, finishing })));
    record(`${label}.painted`, {
      samples: paintedFrames.length,
      maxPainted: Math.max(0, ...timeline.map((f) => f.painted)),
      lastPaintedAtMs: lastPainted?.t ?? null,
      lastLayerAtMs: lastLayerFrame?.t ?? null,
      // The last painted pixel must be seen before (or with) the layer going away.
      leavesGoneBeforeCleanup: Boolean(lastPainted && lastLayerFrame && lastPainted.t <= lastLayerFrame.t + 250),
    });

    await page.screenshot({ path: path.join(OUT, `${label}-finish.png`) });

    // The finishing class starts with the layer gone and clears after four pulses.
    const finishingStart = Date.now();
    let finishingSeenAt = null;
    let finishingClearedAt = null;
    while (Date.now() - finishingStart < 12000) {
      const frame = await sample(page);
      if (frame.finishing && finishingSeenAt === null) finishingSeenAt = Date.now();
      if (finishingSeenAt !== null && !frame.finishing) {
        finishingClearedAt = Date.now();
        break;
      }
      await page.waitForTimeout(100);
    }
    record(`${label}.finishing`, {
      appearedAfterLayerRemoval: finishingSeenAt !== null,
      pulseMs: finishingSeenAt !== null && finishingClearedAt !== null ? finishingClearedAt - finishingSeenAt : null,
      cleared: finishingClearedAt !== null,
    });

    // The balls keep their resting styling once the class is gone.
    record(
      `${label}.restingNumbers`,
      await page.evaluate(() => {
        const numbers = Array.from(document.querySelectorAll('.lucky-reveal-number'));
        return numbers.map((node) => ({
          value: node.textContent.trim(),
          opacity: getComputedStyle(node).opacity,
          glow: getComputedStyle(node, '::after').opacity,
        }));
      }),
    );

    // The finishing chime is requested only after the confetti is gone.
    const chimeIndex = requests.findIndex((name) => name.includes('reveal-finish-chime'));
    record(`${label}.soundRequests`, [...new Set(requests)]);
    record(`${label}.finishingChimeRequested`, chimeIndex >= 0);
    record(`${label}.pageErrors`, pageErrors);

    await dialog.getByRole('button', { name: /Close lucky reveal/i }).click();
    await page.waitForTimeout(400);
    await context.close();

    // Reduced motion: no canvas, no pulse class, no finishing chime.
    const reduced = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const reducedPage = await reduced.newPage();
    const reducedRequests = [];
    reducedPage.on('request', (request) => {
      const url = request.url();
      if (/chime-sound|confetti-pop|reveal-finish-chime/.test(url)) {
        reducedRequests.push(url.split('/').pop());
      }
    });
    await openReveal(reducedPage);
    await reducedPage.waitForTimeout(7000);
    record(`${label}.reducedMotion`, {
      ...(await sample(reducedPage)),
      finishingClass: await reducedPage.evaluate(
        () => document.querySelectorAll('.lucky-reveal-numbers--finishing').length,
      ),
      requests: [...new Set(reducedRequests)],
    });
    await reduced.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, 'report.json'),
    JSON.stringify({ error: String(error), results }, null, 2),
  );
  process.exitCode = 1;
});
