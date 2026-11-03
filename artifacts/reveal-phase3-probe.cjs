#!/usr/bin/env node
/*
 * Phase 3 Chromium probe for the Lucky Reveal.
 *
 * Runs against a local production server (`next start`) through the site's own
 * free Preview Reveal path, so no payment or email happens. It records:
 *   - the recorded applause (HTML5 media element) and the painted leaf canvas,
 *   - the four sharing options and the native share call,
 *   - the time between the tap and navigator.share (Android user activation),
 *   - cancellation, unsupported sharing and a failing share panel,
 *   - a reveal closed while the applause file is still loading (no late start).
 *
 * Requires the Chromium library setup:
 *   eval "$(bash scripts/setup-chromium-libs.sh | sed -n 's/^export //p')"
 * Usage: node artifacts/reveal-phase3-probe.cjs [baseUrl]
 */

const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright-chromium');

const BASE_URL = process.argv[2] || 'http://127.0.0.1:3011';
const REPORT_DIR = join(process.cwd(), 'artifacts', 'reveal-phase3');

const SHARE_OPTIONS = [
  'Share to Apps',
  'Copy the website link',
  'Copy the image',
  'Download the image',
];

const SCENARIOS = [
  { label: 'desktop-6-personal', viewport: { width: 1440, height: 900 }, picks: '6', delivery: 'Personal Reveal', share: 'success' },
  { label: 'desktop-7-gift', viewport: { width: 1440, height: 900 }, picks: '7', delivery: 'Gift Reveal', share: 'success' },
  { label: 'mobile-7-personal-cancel', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, picks: '7', delivery: 'Personal Reveal', share: 'cancel' },
  { label: 'mobile-6-gift-no-web-share', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, picks: '6', delivery: 'Gift Reveal', share: 'unavailable' },
  { label: 'mobile-7-share-failure', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, picks: '7', delivery: 'Personal Reveal', share: 'failure' },
  { label: 'desktop-6-late-load-close', viewport: { width: 1440, height: 900 }, picks: '6', delivery: 'Personal Reveal', share: 'success', delayApplauseMs: 6000, closeEarlyMs: 2200 },
];

const checks = [];
function record(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ` — ${detail}`}`);
}

async function installProbes(page, shareMode) {
  await page.addInitScript((mode) => {
    window.__media = [];
    window.__shares = [];
    window.__shareCallTimes = [];
    window.__lastTapAt = null;
    window.__canvasSamples = [];
    window.__numberSample = { count: 0, completeAt: null, expected: 0 };

    const originalPlay = window.HTMLMediaElement.prototype.play;
    const originalPause = window.HTMLMediaElement.prototype.pause;
    window.HTMLMediaElement.prototype.play = function patchedPlay(...args) {
      window.__media.push({ event: 'play', src: this.currentSrc || this.src || '', at: performance.now() });
      return originalPlay.apply(this, args);
    };
    window.HTMLMediaElement.prototype.pause = function patchedPause(...args) {
      window.__media.push({ event: 'pause', src: this.currentSrc || this.src || '', at: performance.now() });
      return originalPause.apply(this, args);
    };

    window.setInterval(() => {
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
      const numbers = document.querySelectorAll('.lucky-reveal-number').length;
      if (numbers > window.__numberSample.count) window.__numberSample.count = numbers;
      if (
        window.__numberSample.expected > 0 &&
        numbers === window.__numberSample.expected &&
        window.__numberSample.completeAt === null
      ) {
        window.__numberSample.completeAt = performance.now();
      }
      window.__canvasSamples.push({ at: performance.now(), present: Boolean(canvas), painted });
    }, 100);

    const share = async (data) => {
      window.__shares.push({
        title: data.title,
        text: data.text,
        url: data.url,
        files: Array.isArray(data.files)
          ? data.files.map((file) => ({ name: file.name, type: file.type, size: file.size }))
          : null,
        at: performance.now(),
        tapAt: window.__lastTapAt,
        activationDelta: window.__lastTapAt === null ? null : performance.now() - window.__lastTapAt,
      });
      if (mode === 'cancel') {
        const error = new Error('Share cancelled');
        error.name = 'AbortError';
        throw error;
      }
      if (mode === 'failure') {
        throw new Error('Share panel unavailable');
      }
    };

    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => mode !== 'unavailable',
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: mode === 'unavailable' ? undefined : share,
    });

    // Capture the real tap time in the same task as the click handler.
    document.addEventListener(
      'click',
      (event) => {
        if (event.target?.closest?.('.share-lucky-button-main')) {
          window.__lastTapAt = performance.now();
        }
      },
      true,
    );
  }, shareMode);
}

async function openPreviewReveal(page, scenario) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Choose a Lucky Pick/i }).click();
  const modal = page.locator('.checkout-modal');
  await modal.waitFor({ state: 'visible' });

  await modal.locator(`input[name="luckyPickGame"][value="${scenario.picks}"]`).check();
  await modal.getByRole('radio', { name: new RegExp(scenario.delivery) }).check();

  await page.evaluate((expected) => {
    window.__numberSample.expected = expected;
  }, Number(scenario.picks));

  const openedAt = await page.evaluate(() => performance.now());
  await page.getByRole('button', { name: /Preview Reveal — FREE/i }).click();
  await page.locator('.lucky-reveal-number').first().waitFor({ state: 'visible' });
  return openedAt;
}

function summarise(captured) {
  const plays = captured.media.filter((entry) => entry.event === 'play');
  const applause = plays.filter((entry) => entry.src.includes('reveal-applause'));
  const applauseStart = applause.length ? Math.min(...applause.map((entry) => entry.at)) : null;
  const canvasAtApplause = applauseStart === null
    ? null
    : [...captured.canvasSamples]
        .reverse()
        .find((sample) => sample.at <= applauseStart && typeof sample.painted === 'number') || null;

  return {
    applauseCount: applause.length,
    applauseStart,
    paintedAtApplause: canvasAtApplause ? canvasAtApplause.painted : null,
    plays,
    pauses: captured.media.filter((entry) => entry.event === 'pause'),
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

  if (scenario.delayApplauseMs) {
    await page.route('**/sounds/reveal-applause.wav', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, scenario.delayApplauseMs));
      await route.continue();
    });
  }

  await installProbes(page, scenario.share);
  await openPreviewReveal(page, scenario);

  const numbers = await page.evaluate(() =>
    [...document.querySelectorAll('.lucky-reveal-number')].map((node) => Number(node.textContent.trim())),
  );
  record(
    `${scenario.label}: renders ${scenario.picks} stored numbers`,
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
    `${scenario.label}: four labelled sharing actions`,
    optionRects.filter((option) => option.visible).length >= (scenario.share === 'unavailable' ? 3 : 4),
    optionRects.map((option) => `${option.label}=${option.visible ? 'visible' : 'hidden'}`).join(', '),
  );
  record(
    `${scenario.label}: every visible option clears the 44px tap target`,
    optionRects.every((option) => !option.visible || option.height >= 44),
    optionRects.map((option) => `${option.label}:${option.height}px`).join(', '),
  );

  // A person reads the panel before tapping; the share image is prewarmed 1.2 s
  // after the reveal appears, so wait past that before the tap. An instant tap
  // still opens the sheet with text + link (guarded by the unit tests).
  await page.waitForTimeout(1600);
  await group.getByRole('button', { name: /Share to Apps/i }).click();
  await page.waitForTimeout(600);

  const shareState = await page.evaluate(() => ({
    shares: window.__shares,
    status: document.querySelector('[role="status"]')?.textContent?.trim() || '',
  }));

  if (scenario.share === 'success') {
    const payload = shareState.shares[0];
    record(
      `${scenario.label}: one native share carries the numbers and link`,
      shareState.shares.length === 1 &&
        Boolean(payload) &&
        payload.text.includes(numbers.join(', ')) &&
        payload.url === 'https://luckypickcanada.ca',
      JSON.stringify(payload && { files: payload.files, url: payload.url }),
    );
    record(
      `${scenario.label}: navigator.share runs inside the tap's activation`,
      Boolean(payload) && payload.activationDelta !== null && payload.activationDelta < 100,
      payload ? `share called ${Math.round(payload.activationDelta)} ms after the tap` : 'no share call',
    );
    // The close-during-load scenario closes the reveal early; image readiness is
    // covered by the other runs, so here the text+link fallback is acceptable.
    if (!scenario.closeEarlyMs) {
      record(
        `${scenario.label}: the prewarmed image is shared with no work in the tap`,
        Boolean(payload) &&
          Array.isArray(payload.files) &&
          payload.files.length === 1 &&
          payload.files[0].type === 'image/png' &&
          payload.files[0].size > 10000,
        payload && payload.files ? `${payload.files[0].size} bytes, delta ${Math.round(payload.activationDelta)} ms` : 'n/a',
      );
    }
  }

  if (scenario.share === 'cancel') {
    record(
      `${scenario.label}: cancellation is reported and never retried`,
      shareState.shares.length === 1 && shareState.status === 'Sharing cancelled.',
      `calls=${shareState.shares.length}, status="${shareState.status}"`,
    );
  }

  if (scenario.share === 'failure') {
    record(
      `${scenario.label}: a failed share panel is reported once with the fallback`,
      shareState.shares.length === 1 &&
        /could not open the share panel/.test(shareState.status),
      `calls=${shareState.shares.length}, status="${shareState.status}"`,
    );
  }

  if (scenario.share === 'unavailable') {
    record(
      `${scenario.label}: missing Web Share explains the fallback`,
      shareState.shares.length === 0 &&
        /App sharing is not available in this browser/.test(shareState.status),
      shareState.status,
    );
  }

  if (scenario.closeEarlyMs) {
    await page.waitForTimeout(scenario.closeEarlyMs);
    await page.getByRole('button', { name: 'Close lucky reveal' }).click();
    await page.waitForTimeout(scenario.delayApplauseMs + 1500);
    const afterClose = await page.evaluate(() => ({
      media: window.__media,
      status: document.querySelector('[role="status"]')?.textContent?.trim() || '',
    }));
    record(
      `${scenario.label}: a decode completing after close never plays`,
      afterClose.media.filter((entry) => entry.event === 'play' && entry.src.includes('reveal-applause')).length === 0,
      `${afterClose.media.filter((entry) => entry.event === 'play').length} media play(s) after a delayed load`,
    );
    record(`${scenario.label}: no page errors`, pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
    await context.close();
    return { scenario: scenario.label, numbers, optionRects, shareState, pageErrors };
  }

  // Wait until the applause has been requested and the golden pulses have started.
  await page.waitForFunction(
    () =>
      (window.__media || []).some((entry) => entry.event === 'play' && entry.src.includes('reveal-applause')) &&
      Boolean(document.querySelector('.lucky-reveal-numbers--finishing')),
    null,
    { timeout: 30000 },
  ).catch(() => {});
  await page.waitForTimeout(800);

  const captured = await page.evaluate(() => ({
    media: window.__media,
    canvasSamples: window.__canvasSamples,
    numbers: window.__numberSample,
    status: document.querySelector('[role="status"]')?.textContent?.trim() || '',
  }));
  const timeline = summarise(captured);

  record(
    `${scenario.label}: applause plays exactly once`,
    timeline.applauseCount === 1,
    `${timeline.applauseCount} applause play(s)`,
  );
  record(
    `${scenario.label}: applause waits for every number`,
    timeline.applauseStart !== null &&
      captured.numbers.completeAt !== null &&
      timeline.applauseStart > captured.numbers.completeAt,
    `all ${captured.numbers.expected} numbers at ${captured.numbers.completeAt === null ? 'n/a' : Math.round(captured.numbers.completeAt)}, applause at ${timeline.applauseStart === null ? 'n/a' : Math.round(timeline.applauseStart)}`,
  );
  record(
    `${scenario.label}: applause begins while leaves are still painted`,
    typeof timeline.paintedAtApplause === 'number' && timeline.paintedAtApplause > 0,
    `painted at applause: ${timeline.paintedAtApplause}`,
  );

  await page.getByRole('button', { name: 'Close lucky reveal' }).click();
  await page.waitForTimeout(900);
  const afterClose = await page.evaluate(() => window.__media);
  record(
    `${scenario.label}: closing the reveal stops the applause`,
    afterClose.some((entry) => entry.event === 'pause' && entry.src.includes('reveal-applause')),
    `${afterClose.filter((entry) => entry.event === 'pause' && entry.src.includes('reveal-applause')).length} pause event(s)`,
  );
  const playsAfterClose = afterClose.filter(
    (entry) => entry.event === 'play' && entry.src.includes('reveal-applause'),
  ).length;
  record(
    `${scenario.label}: nothing starts after the reveal closed`,
    playsAfterClose === timeline.applauseCount,
    `${playsAfterClose} total applause play(s)`,
  );

  record(`${scenario.label}: no page errors`, pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));

  const result = {
    scenario: scenario.label,
    numbers,
    optionRects,
    shareState,
    timeline,
    numbersTiming: captured.numbers,
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
