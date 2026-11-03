#!/usr/bin/env node
/*
 * Phase 2 Chromium probe for the Lucky Reveal.
 *
 * Runs against a local production server (`next start`) using the site's own
 * free Preview Reveal path, so no payment or email happens. It records the
 * atmosphere from Howler's Web Audio buffer sources, the finishing chime from
 * its HTML5 media element, the painted confetti canvas, the four sharing
 * options, a stubbed native share panel on desktop and mobile, and the
 * no-Web-Share fallback.
 *
 * Requires the Chromium library setup:
 *   eval "$(bash scripts/setup-chromium-libs.sh | sed -n 's/^export //p')"
 * Usage: node artifacts/reveal-phase2-probe.cjs [baseUrl]
 */

const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright-chromium');

const BASE_URL = process.argv[2] || 'http://127.0.0.1:3011';
const REPORT_DIR = join(process.cwd(), 'artifacts', 'reveal-phase2');

const SHARE_OPTIONS = [
  'Share to Apps',
  'Copy the website link',
  'Copy the image',
  'Download the image',
];

const SCENARIOS = [
  { label: 'desktop-6-personal', viewport: { width: 1440, height: 900 }, picks: '6', delivery: 'Personal Reveal', nativeShare: true },
  { label: 'desktop-7-gift', viewport: { width: 1440, height: 900 }, picks: '7', delivery: 'Gift Reveal', nativeShare: true },
  { label: 'mobile-7-personal', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, picks: '7', delivery: 'Personal Reveal', nativeShare: true },
  { label: 'mobile-6-gift-no-web-share', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, picks: '6', delivery: 'Gift Reveal', nativeShare: false },
];

const checks = [];
function record(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ` — ${detail}`}`);
}

async function installProbes(page, nativeSharing) {
  await page.addInitScript((shareEnabled) => {
    // --- Audio probe -------------------------------------------------------
    window.__audioSources = [];
    window.__mediaPlays = [];

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const originalCreateBufferSource = AudioContextClass.prototype.createBufferSource;
      AudioContextClass.prototype.createBufferSource = function patchedCreateBufferSource() {
        const source = originalCreateBufferSource.call(this);
        const originalStart = source.start.bind(source);
        const originalStop = source.stop.bind(source);

        source.start = (...args) => {
          window.__audioSources.push({
            event: 'start',
            duration: source.buffer ? Number(source.buffer.duration.toFixed(3)) : null,
            loop: Boolean(source.loop),
            at: performance.now(),
          });
          return originalStart(...args);
        };
        source.stop = (...args) => {
          window.__audioSources.push({
            event: 'stop',
            duration: source.buffer ? Number(source.buffer.duration.toFixed(3)) : null,
            loop: Boolean(source.loop),
            at: performance.now(),
          });
          return originalStop(...args);
        };

        return source;
      };
    }

    // The finishing chime is an HTML5 <audio> element; record its play calls.
    const originalPlay = window.HTMLMediaElement.prototype.play;
    window.HTMLMediaElement.prototype.play = function patchedPlay(...args) {
      window.__mediaPlays.push({
        src: this.currentSrc || this.src || '',
        at: performance.now(),
      });
      return originalPlay.apply(this, args);
    };

    // --- Confetti recorder -------------------------------------------------
    window.__samples = [];
    window.__recorder = window.setInterval(() => {
      const canvas = document.querySelector('.lucky-celebration-particle-canvas');
      let painted = null;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          try {
            const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
            painted = 0;
            for (let index = 3; index < data.length; index += 4) {
              if (data[index] !== 0) painted += 1;
            }
          } catch {
            painted = null;
          }
        }
      }
      window.__samples.push({
        at: performance.now(),
        present: Boolean(canvas),
        painted,
        finishing: Boolean(document.querySelector('.lucky-reveal-numbers--finishing')),
      });
    }, 100);

    // --- Native share stub -------------------------------------------------
    window.__shares = [];
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => shareEnabled,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareEnabled
        ? async (data) => {
            window.__shares.push({
              title: data.title,
              text: data.text,
              url: data.url,
              files: Array.isArray(data.files)
                ? data.files.map((file) => ({ name: file.name, type: file.type, size: file.size }))
                : null,
              at: performance.now(),
            });
          }
        : undefined,
    });
  }, nativeSharing);
}

async function readSamples(page) {
  return page.evaluate(() => {
    window.clearInterval(window.__recorder);
    return {
      samples: window.__samples || [],
      audioSources: window.__audioSources || [],
      mediaPlays: window.__mediaPlays || [],
      shares: window.__shares || [],
      status: document.querySelector('[role="status"]')?.textContent?.trim() || '',
    };
  });
}

async function openPreviewReveal(page, scenario) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Choose a Lucky Pick/i }).click();
  const modal = page.locator('.checkout-modal');
  await modal.waitFor({ state: 'visible' });

  await modal.locator(`input[name="luckyPickGame"][value="${scenario.picks}"]`).check();
  await modal.getByRole('radio', { name: new RegExp(scenario.delivery) }).check();

  const clickedAt = await page.evaluate(() => performance.now());
  await page.getByRole('button', { name: /Preview Reveal — FREE/i }).click();
  await page.locator('.lucky-reveal-number').first().waitFor({ state: 'visible' });
  return clickedAt;
}

function summariseTimeline(captured, clickedAt) {
  const { samples, audioSources, mediaPlays } = captured;

  let peakPaintedPixels = 0;
  let lastPaintedBeforeGone = null;
  let sawCanvas = false;
  let sawPaint = false;
  let canvasGoneAt = null;
  let firstEmptyAt = null;
  let finishingAt = null;

  for (const sample of samples) {
    if (sample.present) {
      sawCanvas = true;
      if (typeof sample.painted === 'number') {
        peakPaintedPixels = Math.max(peakPaintedPixels, sample.painted);
        if (sample.painted > 0) {
          lastPaintedBeforeGone = sample.painted;
          sawPaint = true;
        }
        // The layer mounts before the first wave paints, so a zero sample only
        // means "cleared" once something has actually been painted.
        if (sample.painted === 0 && sawPaint && firstEmptyAt === null) firstEmptyAt = sample.at;
      }
    } else if (sawCanvas && canvasGoneAt === null) {
      canvasGoneAt = sample.at;
    }
    if (sample.finishing && finishingAt === null) finishingAt = sample.at;
  }

  const glowStarts = audioSources.filter((entry) => entry.event === 'start' && entry.duration === 3);
  const chimePlays = mediaPlays.filter((entry) => entry.src.includes('reveal-finish-chime'));
  const chimeStart = chimePlays.length ? Math.min(...chimePlays.map((entry) => entry.at)) : null;
  const glowStops = audioSources.filter((entry) => entry.event === 'stop' && entry.duration === 3);

  const sampleAtChime = chimeStart === null
    ? null
    : [...samples].reverse().find((sample) => sample.at <= chimeStart && typeof sample.painted === 'number') || null;

  return {
    clickedAt,
    peakPaintedPixels,
    lastPaintedBeforeGone,
    sawCanvas,
    firstEmptyAt,
    canvasGoneAt,
    canvasClearAt: firstEmptyAt ?? canvasGoneAt,
    finishingAt,
    chimeStart,
    paintedAtChime: sampleAtChime ? sampleAtChime.painted : null,
    glowStart: glowStarts[0]?.at ?? null,
    glowLoop: glowStarts[0]?.loop ?? null,
    glowStopCount: glowStops.length,
  };
}

async function runScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    isMobile: Boolean(scenario.isMobile),
    hasTouch: Boolean(scenario.hasTouch),
    deviceScaleFactor: scenario.isMobile ? 2 : 1,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });

  await installProbes(page, scenario.nativeShare);

  const clickedAt = await openPreviewReveal(page, scenario);

  const numbers = await page.evaluate(() =>
    [...document.querySelectorAll('.lucky-reveal-number')].map((node) => Number(node.textContent.trim())),
  );
  record(
    `${scenario.label}: renders ${scenario.picks} numbers`,
    numbers.length === Number(scenario.picks) &&
      numbers.every((number) => number >= 1 && number <= (scenario.picks === '7' ? 50 : 49)),
    JSON.stringify(numbers),
  );

  const group = page.getByRole('group', { name: 'Share your reveal' });
  await group.waitFor({ state: 'visible' });

  const optionRects = [];
  for (const label of SHARE_OPTIONS) {
    const button = group.getByRole('button', { name: label, exact: false });
    const visible = await button.isVisible();
    const box = visible ? await button.boundingBox() : null;
    optionRects.push({ label, visible, height: box ? Math.round(box.height) : 0 });
  }
  record(
    `${scenario.label}: four visible sharing options`,
    optionRects.every((option) => option.visible) && optionRects.length === 4,
    optionRects.map((option) => `${option.label}=${option.visible ? 'visible' : 'hidden'}`).join(', '),
  );
  record(
    `${scenario.label}: every option clears the 44px tap target`,
    optionRects.every((option) => option.height >= 44),
    optionRects.map((option) => `${option.label}:${option.height}px`).join(', '),
  );

  await group.getByRole('button', { name: /Share to Apps/i }).click();
  await page.waitForFunction(
    () => (window.__shares || []).length > 0 || document.querySelector('[role="status"]'),
    null,
    { timeout: 15000 },
  ).catch(() => {});
  await page.waitForTimeout(400);

  const shareState = await page.evaluate(() => ({
    shares: window.__shares || [],
    status: document.querySelector('[role="status"]')?.textContent?.trim() || '',
  }));

  if (scenario.nativeShare) {
    const payload = shareState.shares[0];
    record(
      `${scenario.label}: Share to Apps opens the native panel with image, result and link`,
      Boolean(
        payload &&
          Array.isArray(payload.files) &&
          payload.files.length === 1 &&
          payload.files[0].type === 'image/png' &&
          payload.files[0].size > 10000 &&
          payload.text.includes(numbers.join(', ')) &&
          payload.url === 'https://luckypickcanada.ca',
      ),
      JSON.stringify(payload),
    );
  } else {
    record(
      `${scenario.label}: native sharing unavailable falls back gracefully`,
      shareState.shares.length === 0 &&
        /App sharing is not available in this browser/.test(shareState.status),
      shareState.status,
    );
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll('.share-lucky-option')].map((node) => node.textContent.trim()),
    );
    record(
      `${scenario.label}: the three existing actions remain available`,
      ['Copy the website link', 'Copy the image', 'Download the image'].every((label) =>
        labels.some((text) => text.includes(label)),
      ),
      labels.join(' | '),
    );
  }

  // Wait for the finish, then collect the whole recorded timeline.
  await page.waitForFunction(
    () => Boolean(document.querySelector('.lucky-reveal-numbers--finishing')),
    null,
    { timeout: 30000 },
  ).catch(() => {});
  await page.waitForTimeout(600);

  const captured = await readSamples(page);
  const timeline = summariseTimeline(captured, clickedAt);

  record(
    `${scenario.label}: atmosphere loops with the three-second glow cycle`,
    timeline.glowStart !== null &&
      timeline.glowLoop === true &&
      timeline.glowStart - clickedAt > 2000 &&
      timeline.glowStart - clickedAt < 6000,
    `started ${timeline.glowStart === null ? 'n/a' : Math.round(timeline.glowStart - clickedAt)} ms after opening, loop=${timeline.glowLoop}`,
  );

  record(
    `${scenario.label}: finishing chime starts while leaves are still painted`,
    timeline.chimeStart !== null &&
      typeof timeline.paintedAtChime === 'number' &&
      timeline.paintedAtChime > 0 &&
      timeline.peakPaintedPixels > 0,
    `chime ${timeline.chimeStart === null ? 'n/a' : Math.round(timeline.chimeStart)}, painted then ${timeline.paintedAtChime}, peak ${timeline.peakPaintedPixels}`,
  );

  record(
    `${scenario.label}: chime begins before the confetti has disappeared`,
    timeline.chimeStart !== null &&
      timeline.canvasClearAt !== null &&
      timeline.canvasClearAt - timeline.chimeStart > 0,
    `lead ${timeline.chimeStart === null || timeline.canvasClearAt === null ? 'n/a' : Math.round(timeline.canvasClearAt - timeline.chimeStart)} ms; last painted before clear ${timeline.lastPaintedBeforeGone} of peak ${timeline.peakPaintedPixels}`,
  );

  record(
    `${scenario.label}: four number-ball pulses start only after the confetti is gone`,
    timeline.finishingAt !== null &&
      timeline.canvasClearAt !== null &&
      timeline.finishingAt >= timeline.canvasClearAt,
    `pulses ${timeline.finishingAt === null ? 'n/a' : Math.round(timeline.finishingAt)} vs canvas clear ${timeline.canvasClearAt === null ? 'n/a' : Math.round(timeline.canvasClearAt)}`,
  );

  await page.getByRole('button', { name: 'Close lucky reveal' }).click();
  await page.waitForTimeout(1200);
  const glowStop = await page.evaluate(() =>
    (window.__audioSources || []).filter((entry) => entry.event === 'stop' && entry.duration === 3).length,
  );
  record(
    `${scenario.label}: atmosphere stops when the reveal closes`,
    glowStop >= 1,
    `${glowStop} stop event(s)`,
  );

  record(`${scenario.label}: no page errors`, pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));

  const result = {
    scenario: scenario.label,
    numbers,
    optionRects,
    shareState,
    timeline,
    pageErrors,
  };

  await context.close();
  return result;
}

(async () => {
  mkdirSync(REPORT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });

  const results = [];
  try {
    for (const scenario of SCENARIOS) {
      console.log(`\n== ${scenario.label} ==`);
      results.push(await runScenario(browser, scenario));
    }
  } finally {
    await browser.close();
  }

  const failed = checks.filter((check) => !check.pass);
  const report = { baseUrl: BASE_URL, ranAt: new Date().toISOString(), checks, results };
  writeFileSync(join(REPORT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
