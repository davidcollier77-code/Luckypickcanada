#!/usr/bin/env node
/*
 * Phase 3 reliability and performance audit probe for the Lucky Reveal.
 *
 * Runs against a local production build (`next start`) and opens the reveal
 * through the site's own free Preview Reveal path, so no payment or email
 * happens. It records evidence for:
 *   - the 6 Pick and 7 Pick experiences on an Android-emulated phone,
 *   - the sound mute/unmute control (including muting before and during the cue),
 *   - a browser that blocks automatic audio playback,
 *   - `prefers-reduced-motion: reduce`,
 *   - animation and sound cleanup after the reveal closes,
 *   - the sound assets the reveal actually requests and their measured bytes,
 *   - horizontal overflow, clipped/crowded controls and console/network errors.
 *
 * Requires the Chromium library setup:
 *   eval "$(bash scripts/setup-chromium-libs.sh --env)"
 * Usage: node artifacts/reveal-phase3-audit-probe.cjs [baseUrl]
 */

const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright-chromium');

const BASE_URL = process.argv[2] || 'http://127.0.0.1:3021';
const REPORT_DIR = join(process.cwd(), 'artifacts', 'reveal-phase3-audit');

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36';

const SHARE_OPTIONS = [
  'Share to Apps',
  'Copy the website link',
  'Copy the image',
  'Download the image',
];

const SCENARIOS = [
  { label: 'android-6-personal', picks: '6', delivery: 'Personal Reveal', android: true, viewport: { width: 412, height: 915 } },
  { label: 'android-7-personal', picks: '7', delivery: 'Personal Reveal', android: true, viewport: { width: 412, height: 915 } },
  { label: 'android-7-gift', picks: '7', delivery: 'Gift Reveal', android: true, viewport: { width: 390, height: 844 } },
  { label: 'android-6-mute-before-cue', picks: '6', delivery: 'Personal Reveal', android: true, viewport: { width: 412, height: 915 }, mute: 'immediately' },
  { label: 'android-6-mute-during-applause', picks: '6', delivery: 'Personal Reveal', android: true, viewport: { width: 412, height: 915 }, mute: 'after-cue' },
  { label: 'android-6-audio-blocked', picks: '6', delivery: 'Personal Reveal', android: true, viewport: { width: 412, height: 915 }, blockAudio: true },
  { label: 'mobile-6-reduced-motion', picks: '6', delivery: 'Personal Reveal', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
  { label: 'desktop-7-geometry', picks: '7', delivery: 'Personal Reveal', viewport: { width: 1440, height: 900 } },
];

const checks = [];
function record(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ` — ${detail}`}`);
}

async function installProbes(page, scenario) {
  await page.addInitScript((options) => {
    window.__media = [];
    window.__streams = [];
    window.__canvasSamples = [];

    const originalPlay = window.HTMLMediaElement.prototype.play;
    const originalPause = window.HTMLMediaElement.prototype.pause;

    if (options.blockAudio) {
      // Chrome's autoplay policy rejects play() before a gesture; reproduce it
      // exactly so the reveal's error handling is exercised.
      window.HTMLMediaElement.prototype.play = function blockedPlay() {
        const error = new Error('play() failed because the user did not interact with the document first.');
        error.name = 'NotAllowedError';
        window.__media.push({ event: 'blocked', src: this.currentSrc || this.src || '', at: performance.now() });
        return Promise.reject(error);
      };
    } else {
      window.HTMLMediaElement.prototype.play = function patchedPlay(...args) {
        window.__media.push({ event: 'play', src: this.currentSrc || this.src || '', at: performance.now() });
        return originalPlay.apply(this, args);
      };
    }

    window.HTMLMediaElement.prototype.pause = function patchedPause(...args) {
      window.__media.push({ event: 'pause', src: this.currentSrc || this.src || '', at: performance.now() });
      return originalPause.apply(this, args);
    };

    // Howler's HTML5 mode uses media elements; its Web Audio streams are also
    // recorded so a cue cannot be missed just because of the playback mode.
    if (window.AudioContext) {
      const start = window.AudioContext.prototype.createBufferSource;
      window.AudioContext.prototype.createBufferSource = function patchedSource(...args) {
        const node = start.apply(this, args);
        const originalStart = node.start.bind(node);
        node.start = (...startArgs) => {
          window.__streams.push({ at: performance.now() });
          return originalStart(...startArgs);
        };
        return node;
      };
    }

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
      window.__canvasSamples.push({
        at: performance.now(),
        present: Boolean(canvas),
        painted,
      });
    }, 120);
  }, { blockAudio: Boolean(scenario.blockAudio) });
}

async function openPreviewReveal(page, scenario) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Choose a Lucky Pick/i }).click();
  const modal = page.locator('.checkout-modal');
  await modal.waitFor({ state: 'visible' });

  await modal.locator(`input[name="luckyPickGame"][value="${scenario.picks}"]`).check();
  await modal.getByRole('radio', { name: new RegExp(scenario.delivery) }).check();
  await page.getByRole('button', { name: /Preview Reveal — FREE/i }).click();
  await page.locator('.lucky-reveal-number').first().waitFor({ state: 'visible' });
}

async function geometrySnapshot(page) {
  return page.evaluate(() => {
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      };
    };
    const hit = (element) => {
      if (!element) return { hit: false, detail: 'missing' };
      const rect = element.getBoundingClientRect();
      const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        hit: Boolean(target) && (target === element || element.contains(target)),
        detail: target
          ? `${target.tagName.toLowerCase()}${target.getAttribute('class') ? `.${String(target.getAttribute('class')).split(' ')[0]}` : ''}`
          : 'nothing',
      };
    };
    const overlaps = (a, b) => {
      if (!a || !b) return false;
      return a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
    };

    const panel = document.querySelector('[role="dialog"]');
    const sound = document.querySelector('.lucky-sound-btn');
    const close = document.querySelector('.lucky-close-btn-hover');
    const shareButtons = [...document.querySelectorAll('.share-lucky-option, .share-lucky-button-main')];
    const balls = [...document.querySelectorAll('.lucky-reveal-number')];

    const shareRects = shareButtons.map((button) => ({
      label: (button.textContent || '').trim().slice(0, 24),
      box: box(button),
      clipX: button.scrollWidth > button.clientWidth + 1,
    }));

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      panel: box(panel),
      panelScrollOverflowX: panel ? panel.scrollWidth - panel.clientWidth : null,
      sound: { box: box(sound), hit: hit(sound) },
      close: { box: box(close), hit: hit(close) },
      controlsOverlap: overlaps(box(sound), box(close)),
      shareRects,
      shareOverlaps: shareRects.some((entry, index) =>
        shareRects.some((other, otherIndex) => index < otherIndex && overlaps(entry.box, other.box)),
      ),
      ballOverlaps: balls.some((ball, index) =>
        balls.some((other, otherIndex) => index < otherIndex && overlaps(box(ball), box(other))),
      ),
      ballsOutsidePanel: panel
        ? balls.some((ball) => {
            const rect = box(ball);
            const panelRect = box(panel);
            return rect.x < panelRect.x || rect.right > panelRect.right;
          })
        : true,
      soundPressed: sound ? sound.getAttribute('aria-pressed') : null,
      soundLabel: sound ? sound.getAttribute('aria-label') : null,
      soundTitle: sound ? sound.getAttribute('title') : null,
    };
  });
}

// Only the reveal's own cues count as reveal sound. The site's button click is a
// separate, user-initiated UI sound (Web Audio) and is not part of the
// celebration, so it must not be mistaken for an automatic reveal cue.
const REVEAL_CUE_FILES = ['chime-sound', 'confetti-pop', 'reveal-applause'];

function isRevealCue(entry) {
  return (
    entry.event === 'play' && REVEAL_CUE_FILES.some((cue) => String(entry.src).includes(cue))
  );
}

function summarise(media) {
  const plays = media.filter((entry) => entry.event === 'play');
  return {
    plays,
    revealCues: plays.filter(isRevealCue),
    applause: plays.filter((entry) => entry.src.includes('reveal-applause')),
    sparkle: plays.filter((entry) => entry.src.includes('chime-sound')),
    pop: plays.filter((entry) => entry.src.includes('confetti-pop')),
    pauses: media.filter((entry) => entry.event === 'pause'),
    blocked: media.filter((entry) => entry.event === 'blocked'),
  };
}

async function runScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    isMobile: Boolean(scenario.android),
    hasTouch: Boolean(scenario.android),
    deviceScaleFactor: scenario.android ? 2 : 1,
    reducedMotion: scenario.reducedMotion || 'no-preference',
    userAgent: scenario.android ? ANDROID_UA : undefined,
  });
  const page = await context.newPage();
  const pageErrors = [];
  const failedRequests = [];
  const soundResponses = [];

  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${url}`);
    if (url.includes('/sounds/')) {
      const length = response.headers()['content-length'];
      soundResponses.push({
        file: url.split('/sounds/')[1],
        status: response.status(),
        bytes: length ? Number(length) : null,
      });
    }
  });

  await installProbes(page, scenario);
  await openPreviewReveal(page, scenario);

  const expected = Number(scenario.picks);
  await page
    .waitForFunction(
      (count) => document.querySelectorAll('.lucky-reveal-number').length === count,
      expected,
      { timeout: 20000 },
    )
    .catch(() => {});

  const numbers = await page.evaluate(() =>
    [...document.querySelectorAll('.lucky-reveal-number')].map((node) => Number(node.textContent.trim())),
  );
  const limit = scenario.picks === '7' ? 50 : 49;
  record(
    `${scenario.label}: renders ${expected} stored numbers in range`,
    numbers.length === expected && numbers.every((number) => Number.isInteger(number) && number >= 1 && number <= limit),
    JSON.stringify(numbers),
  );
  record(
    `${scenario.label}: numbers are unique`,
    new Set(numbers).size === numbers.length,
    `${new Set(numbers).size} unique`,
  );

  // Let the reveal paint fully, then measure layout before interacting.
  await page.waitForTimeout(600);
  const layout = await geometrySnapshot(page);

  record(
    `${scenario.label}: the page has no horizontal overflow`,
    layout.documentOverflowX <= 0,
    `${layout.documentOverflowX}px overflow at ${layout.viewport.width}x${layout.viewport.height}`,
  );
  record(
    `${scenario.label}: the panel and its body do not overflow horizontally`,
    Boolean(layout.panel) &&
      layout.panel.x >= 0 &&
      layout.panel.right <= layout.viewport.width &&
      layout.panelScrollOverflowX !== null &&
      layout.panelScrollOverflowX <= 0,
    `panel ${layout.panel?.x}..${layout.panel?.right} of ${layout.viewport.width}, scroll overflow ${layout.panelScrollOverflowX}px`,
  );
  record(
    `${scenario.label}: number balls stay inside the panel`,
    !layout.ballsOutsidePanel,
    `${numbers.length} balls`,
  );

  // The mute control is the Phase 3 gap being verified: present, 44px, tappable,
  // and semantically a pressed/unpressed toggle.
  record(
    `${scenario.label}: the sound control is visible with a 44px tap target`,
    Boolean(layout.sound.box) && layout.sound.box.width >= 44 && layout.sound.box.height >= 44,
    layout.sound.box ? `${layout.sound.box.width}x${layout.sound.box.height}px` : 'missing',
  );
  record(
    `${scenario.label}: the sound control receives its own taps`,
    layout.sound.hit.hit,
    layout.sound.hit.detail,
  );
  record(
    `${scenario.label}: the sound control is an unpressed, labelled toggle`,
    layout.soundPressed === 'false' &&
      layout.soundLabel === 'Mute reveal sound' &&
      typeof layout.soundTitle === 'string',
    `aria-pressed=${layout.soundPressed}, aria-label="${layout.soundLabel}", title="${layout.soundTitle}"`,
  );
  record(
    `${scenario.label}: the close button is tappable and clear of the sound control`,
    layout.close.hit.hit && !layout.controlsOverlap,
    `close hit=${layout.close.hit.detail}, overlap=${layout.controlsOverlap}`,
  );

  const visibleOptions = layout.shareRects.filter((entry) => entry.box);
  record(
    `${scenario.label}: all sharing actions are visible and unclipped`,
    visibleOptions.length >= 3 && visibleOptions.every((entry) => !entry.clipX && entry.box.width >= 44),
    visibleOptions.map((entry) => `${entry.label}:${entry.box.width}x${entry.box.height}`).join(', '),
  );
  record(
    `${scenario.label}: sharing actions and number balls never overlap`,
    !layout.shareOverlaps && !layout.ballOverlaps,
    `shareOverlap=${layout.shareOverlaps}, ballOverlap=${layout.ballOverlaps}`,
  );

  let mutedAt = null;
  if (scenario.mute === 'immediately') {
    // Mute once the celebration is running, before its finishing cue.
    await page
      .waitForFunction(() => Boolean(document.querySelector('.lucky-celebration-particle-canvas')), null, {
        timeout: 25000,
      })
      .catch(() => {});
    await page.getByRole('button', { name: 'Mute reveal sound' }).click();
    const muted = await page.evaluate(() => {
      const sound = document.querySelector('.lucky-sound-btn');
      return {
        pressed: sound?.getAttribute('aria-pressed'),
        label: sound?.getAttribute('aria-label'),
        at: performance.now(),
      };
    });
    mutedAt = muted.at;
    record(
      `${scenario.label}: tapping the control reports the muted state`,
      muted.pressed === 'true' && muted.label === 'Unmute reveal sound',
      `aria-pressed=${muted.pressed}, aria-label="${muted.label}"`,
    );
  }

  const waitForFinishing = () =>
    page
      .waitForFunction(() => Boolean(document.querySelector('.lucky-reveal-numbers--finishing')), null, {
        timeout: 30000,
      })
      .catch(() => {});
  const waitForApplause = () =>
    page
      .waitForFunction(
        () =>
          (window.__media || []).some(
            (entry) => entry.event === 'play' && entry.src.includes('reveal-applause'),
          ),
        null,
        { timeout: 30000 },
      )
      .catch(() => {});

  if (scenario.mute === 'after-cue') {
    await waitForApplause();
    const before = await page.evaluate(() => window.__media);
    const beforeCount = summarise(before).applause.length;
    await page.getByRole('button', { name: 'Mute reveal sound' }).click();
    await page.waitForTimeout(700);
    const after = await page.evaluate(() => ({
      media: window.__media,
      playing: [...document.querySelectorAll('audio')].filter((element) => !element.paused).length,
    }));
    record(
      `${scenario.label}: muting during the applause stops it immediately`,
      beforeCount === 1 &&
        summarise(after.media).pauses.some((entry) => entry.src.includes('reveal-applause')) &&
        after.playing === 0,
      `${beforeCount} applause play(s), ${after.playing} media element(s) still playing`,
    );
    await waitForFinishing();
  } else if (scenario.mute === 'immediately') {
    await waitForFinishing();
    await page.waitForTimeout(900);
  } else if (scenario.reducedMotion) {
    // The static finish and the pulses are both suppressed here, so give the
    // timeline the room the celebration would have used before measuring.
    await page.waitForTimeout(4000);
  } else if (scenario.blockAudio) {
    await waitForFinishing();
  } else {
    await waitForApplause();
    await page.waitForTimeout(1200);
  }

  const captured = await page.evaluate(() => ({
    media: window.__media,
    streams: window.__streams,
    canvasSamples: window.__canvasSamples,
  }));
  const timeline = summarise(captured.media);
  const uncaughtErrors = pageErrors.filter((error) => !error.startsWith('console:'));
  const consoleErrors = pageErrors
    .filter((error) => error.startsWith('console:'))
    .map((error) => error.replace(/^console:\s*/, ''));
  // A rejected play() is logged by design; only unexpected console errors count.
  const unexpectedConsoleErrors = consoleErrors.filter(
    (text) => !/playback (failed|was unable)|playback failed|audio .*unavailable/i.test(text),
  );

  if (scenario.reducedMotion) {
    const canvasSeen = captured.canvasSamples.some((sample) => sample.present);
    record(
      `${scenario.label}: reduced motion paints no particle canvas`,
      !canvasSeen,
      `${captured.canvasSamples.length} samples, canvas present=${canvasSeen}`,
    );
    record(
      `${scenario.label}: reduced motion plays no reveal cue`,
      timeline.revealCues.length === 0,
      `${timeline.revealCues.length} reveal cue play(s); all media plays=${timeline.plays.length}, UI click streams=${captured.streams.length}`,
    );
    record(
      `${scenario.label}: reduced motion still shows the static finish`,
      Boolean(await page.$('.lucky-celebration-finish')),
      'settled-leaf layer present',
    );
  } else if (scenario.blockAudio) {
    const blockedCount = timeline.blocked.length;
    const finishingSeen = await page.evaluate(() =>
      Boolean(document.querySelector('.lucky-reveal-numbers--finishing')),
    );
    const paintedLeaves = captured.canvasSamples.some(
      (sample) => typeof sample.painted === 'number' && sample.painted > 0,
    );
    record(
      `${scenario.label}: a blocked play() is logged and never thrown`,
      blockedCount > 0 && uncaughtErrors.length === 0,
      `${blockedCount} rejected play(s), ${uncaughtErrors.length} uncaught error(s), ${consoleErrors.length} expected playback log(s)`,
    );
    record(
      `${scenario.label}: the visual celebration still completes when audio is blocked`,
      finishingSeen && paintedLeaves,
      `leaves painted=${paintedLeaves}, golden pulses seen=${finishingSeen}`,
    );
    record(
      `${scenario.label}: the call to action and close stay usable when audio is blocked`,
      Boolean(await page.getByRole('button', { name: 'Close lucky reveal' }).isVisible()) &&
        Boolean(await page.getByRole('button', { name: /Little Luck Map/i }).isVisible()),
      'close and map button visible',
    );
  } else if (scenario.mute === 'immediately') {
    const playsAfterMute = timeline.revealCues.filter((entry) => entry.at > mutedAt);
    record(
      `${scenario.label}: no reveal cue plays after muting`,
      playsAfterMute.length === 0,
      `${playsAfterMute.length} reveal cue(s) after the mute (${timeline.revealCues.length} before it)`,
    );
    record(
      `${scenario.label}: the muted reveal still finishes visually`,
      await page.evaluate(() => Boolean(document.querySelector('.lucky-reveal-numbers--finishing'))),
      'golden pulses ran while muted',
    );
  } else {
    record(
      `${scenario.label}: applause plays exactly once`,
      timeline.applause.length === 1,
      `${timeline.applause.length} applause play(s)`,
    );
    const leavesAtCue = timeline.applause.length
      ? [...captured.canvasSamples]
          .reverse()
          .find((sample) => sample.at <= timeline.applause[0].at && typeof sample.painted === 'number')
      : null;
    record(
      `${scenario.label}: the applause is on the finishing cue`,
      Boolean(leavesAtCue) && leavesAtCue.painted > 0,
      `painted pixels at the cue: ${leavesAtCue ? leavesAtCue.painted : 'n/a'}`,
    );
  }

  record(
    `${scenario.label}: no uncaught page errors`,
    uncaughtErrors.length === 0,
    uncaughtErrors.slice(0, 2).join(' | ') || 'none',
  );
  record(
    `${scenario.label}: no unexpected console errors`,
    unexpectedConsoleErrors.length === 0,
    unexpectedConsoleErrors.slice(0, 2).join(' | ') || `${consoleErrors.length} expected playback log(s)`,
  );
  record(
    `${scenario.label}: no failed network requests`,
    failedRequests.length === 0,
    failedRequests.slice(0, 3).join(' | ') || 'none',
  );

  // Cleanup: closing must take the animation and the sound with it.
  const mediaBeforeClose = timeline.applause.length;
  await page.getByRole('button', { name: 'Close lucky reveal' }).click();
  await page.waitForTimeout(1000);
  const afterClose = await page.evaluate(() => ({
    dialog: Boolean(document.querySelector('[role="dialog"]')),
    canvas: Boolean(document.querySelector('.lucky-celebration-particle-canvas')),
    celebration: Boolean(document.querySelector('.lucky-celebration')),
    playing: [...document.querySelectorAll('audio')].filter((element) => !element.paused).length,
    media: window.__media,
  }));
  record(
    `${scenario.label}: closing removes the reveal, its canvas and its layer`,
    !afterClose.dialog && !afterClose.canvas && !afterClose.celebration,
    `dialog=${afterClose.dialog}, canvas=${afterClose.canvas}, celebration=${afterClose.celebration}`,
  );
  record(
    `${scenario.label}: nothing keeps playing after close`,
    afterClose.playing === 0,
    `${afterClose.playing} media element(s) playing`,
  );
  record(
    `${scenario.label}: no applause starts after close`,
    summarise(afterClose.media).applause.length === mediaBeforeClose,
    `${summarise(afterClose.media).applause.length} total applause play(s)`,
  );

  await context.close();
  return {
    scenario: scenario.label,
    numbers,
    layout,
    timeline: {
      plays: timeline.plays,
      applause: timeline.applause.length,
      blocked: timeline.blocked.length,
      streams: captured.streams.length,
    },
    soundResponses,
    pageErrors,
    failedRequests,
  };
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

  const assets = new Map();
  for (const result of results) {
    for (const response of result.soundResponses) {
      if (!assets.has(response.file)) assets.set(response.file, response);
    }
  }

  const failures = checks.filter((check) => !check.pass);
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    checks,
    failures,
    soundAssets: [...assets.values()],
    results,
  };
  writeFileSync(join(REPORT_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

  console.log(`\n${checks.length - failures.length}/${checks.length} checks passed`);
  if (failures.length) {
    console.log('Failed checks:');
    for (const failure of failures) console.log(`- ${failure.name} — ${failure.detail}`);
    process.exitCode = 1;
  }
})();
