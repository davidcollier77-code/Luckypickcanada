/**
 * Browser evidence for the Lucky Reveal confetti Phase 1 work (specs/080).
 *
 * Measures, for both number-selection modes and both viewports:
 * - the particle canvas lives inside the reveal overlay (never on <body>),
 * - leaves are actually painted inside the reveal's animation area,
 * - the celebration starts after the final number and ends within 3-4 s,
 * - nothing (layer, canvas, settled leaves) remains afterwards,
 * - the opening sparkle and the finishing pop are requested,
 * - numbers appear individually.
 *
 * Usage: eval "$(scripts/setup-chromium-libs.sh --env)"; node artifacts/reveal-confetti-phase1-probe.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'reveal-confetti-phase1');
const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:3001';
const results = {};

function record(name, value) {
  results[name] = value;
  console.log(`${name}: ${JSON.stringify(value)}`);
}

async function openReveal(page, picks) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Choose a Lucky Pick/i }).first().click();
  if (picks === '7') {
    await page.getByRole('radio', { name: /7 Pick/i }).first().check();
  }
  const preview = page.getByRole('button', { name: /Preview Reveal/i }).first();
  await preview.waitFor({ state: 'visible', timeout: 25000 });
  const startedAt = Date.now();
  await preview.click();

  const dialog = page.locator('[role="dialog"][aria-labelledby="lucky-reveal-title"]');
  await dialog.waitFor({ state: 'visible', timeout: 25000 });
  return { dialog, startedAt };
}

const canvasPixels = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector('.lucky-celebration-particle-canvas');
    if (!canvas) return { present: false };
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    if (!width || !height) return { present: true, width, height, painted: 0 };
    const data = ctx.getImageData(0, 0, width, height).data;
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) painted += 1;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      present: true,
      width,
      height,
      painted,
      rect: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };
  });

async function waitForCelebration(page, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const present = await page.evaluate(
      () => Boolean(document.querySelector('.lucky-celebration')),
    );
    if (present) return Date.now() - started;
    await page.waitForTimeout(50);
  }
  return null;
}

async function waitForCelebrationEnd(page, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const present = await page.evaluate(
      () => Boolean(document.querySelector('.lucky-celebration')),
    );
    if (!present) return Date.now() - started;
    await page.waitForTimeout(50);
  }
  return null;
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--force-color-profile=srgb', '--font-render-hinting=none'],
  });

  const viewports = {
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  };

  for (const [viewportLabel, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      hasTouch: viewportLabel === 'mobile',
      isMobile: viewportLabel === 'mobile',
    });
    const page = await context.newPage();
    const soundRequests = [];
    const pageErrors = [];
    page.on('request', (request) => {
      const url = request.url();
      if (/chime-sound|confetti-pop/.test(url)) soundRequests.push(url.split('/').pop());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message.slice(0, 160)));

    for (const picks of ['6', '7']) {
      const label = `${viewportLabel}.${picks}pick`;
      soundRequests.length = 0;
      const { dialog, startedAt } = await openReveal(page, picks);

      // Numbers appear individually: the first number is visible before the last.
      await page.waitForTimeout(2300);
      const numberStates = await page.evaluate(() => {
        const numbers = Array.from(document.querySelectorAll('.lucky-reveal-number'));
        return numbers.map((node) => ({
          value: node.textContent.trim(),
          opacity: Number(getComputedStyle(node).opacity),
          delay: node.style.animationDelay.split(',')[0].trim(),
        }));
      });
      record(`${label}.numbers`, {
        count: numberStates.length,
        values: numberStates.map((state) => state.value),
        firstOpacity: numberStates[0]?.opacity,
        lastOpacity: numberStates[numberStates.length - 1]?.opacity,
        firstDelay: numberStates[0]?.delay,
        lastDelay: numberStates[numberStates.length - 1]?.delay,
      });

      await dialog.waitFor({ state: 'visible' });

      const celebrationAfterOpenMs = await waitForCelebration(page, 12000);
      record(`${label}.celebrationStartMsAfterOpen`, celebrationAfterOpenMs);

      const layout = await page.evaluate(() => {
        const panel = document.querySelector('[role="dialog"][aria-labelledby="lucky-reveal-title"]');
        const layer = document.querySelector('.lucky-celebration');
        const particles = document.querySelector('.lucky-celebration-particles');
        const canvas = document.querySelector('.lucky-celebration-particle-canvas');
        return {
          panelZ: panel ? Number(getComputedStyle(panel).zIndex) : null,
          finishZ: layer ? Number(getComputedStyle(layer).zIndex) : null,
          particlesZ: particles ? Number(getComputedStyle(particles).zIndex) : null,
          overlayArea: (() => {
            const root = panel?.parentElement;
            if (!root) return null;
            const r = root.getBoundingClientRect();
            return { width: Math.round(r.width), height: Math.round(r.height) };
          })(),
          particlesInsideReveal: Boolean(particles && panel?.parentElement?.contains(particles)),
          canvasParentClass: canvas?.parentElement?.className || null,
          bodyCanvasCount: document.querySelectorAll('body > canvas').length,
          settledLeaves: document.querySelectorAll('.lucky-settled-leaf').length,
        };
      });
      record(`${label}.layout`, layout);

      const firstSample = await canvasPixels(page);
      record(`${label}.canvasSampleAtStart`, firstSample);
      await page.waitForTimeout(700);
      const secondSample = await canvasPixels(page);
      record(`${label}.canvasSampleAt700ms`, secondSample);
      await page.screenshot({ path: path.join(OUT, `${label}-burst.png`) });

      const celebrationEndMs = await waitForCelebrationEnd(page, 12000);
      record(`${label}.celebrationEndMsAfterStart`, celebrationEndMs);
      record(`${label}.totalCelebrationMsAfterOpen`,
        celebrationAfterOpenMs !== null && celebrationEndMs !== null
          ? celebrationAfterOpenMs + celebrationEndMs
          : null,
      );

      const after = await page.evaluate(() => ({
        celebrationLayer: document.querySelectorAll('.lucky-celebration').length,
        particleLayer: document.querySelectorAll('.lucky-celebration-particles').length,
        canvases: document.querySelectorAll('canvas').length,
        bodyCanvases: document.querySelectorAll('body > canvas').length,
        settledLeaves: document.querySelectorAll('.lucky-settled-leaf').length,
      }));
      record(`${label}.afterCelebration`, after);
      record(`${label}.soundRequests`, [...new Set(soundRequests)]);
      record(`${label}.openMs`, Date.now() - startedAt);
      record(`${label}.pageErrors`, pageErrors);

      await page.screenshot({ path: path.join(OUT, `${label}-after.png`) });
      await dialog.getByRole('button', { name: /Close lucky reveal/i }).click();
      await page.waitForTimeout(500);
    }

    // Reduced motion: no canvas, no celebration layer, static finish preserved.
    const reduced = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const reducedPage = await reduced.newPage();
    await openReveal(reducedPage, '6');
    await reducedPage.waitForTimeout(6000);
    record(
      `${viewportLabel}.reducedMotion`,
      await reducedPage.evaluate(() => ({
        canvases: document.querySelectorAll('canvas').length,
        particleLayer: document.querySelectorAll('.lucky-celebration-particles').length,
        settledLeaves: document.querySelectorAll('.lucky-settled-leaf').length,
        flashDisplay: (() => {
          const flash = document.querySelector('.lucky-celebration-flash');
          return flash ? getComputedStyle(flash).display : null;
        })(),
      })),
    );
    await reduced.close();
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ error: String(error), results }, null, 2));
  process.exitCode = 1;
});
