/**
 * Browser QA for the Lucky Meter daily experience.
 *
 * Run against a production server (default http://127.0.0.1:3002) with:
 *   node artifacts/lucky-meter-qa/qa.mjs
 *
 * It forces each event through Math.random, measures the reveal beats from
 * inside the page, checks storage, refresh persistence, mobile layout, reduced
 * motion and the clipboard share fallback, and writes screenshots here.
 *
 * Screenshots use the CDP capture command because the page continuously renders
 * an Aurora canvas and the event canvas; Playwright's stability-oriented
 * screenshot path can wait indefinitely while those frames are live.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:3002';
const OUT = path.resolve('artifacts/lucky-meter-qa');
mkdirSync(OUT, { recursive: true });

const failures = [];
const records = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

async function capture(page, filename) {
  const session = await page.context().newCDPSession(page);
  try {
    // JPEG keeps the SwiftShader readback around four seconds instead of ~30.
    const { data } = await session.send('Page.captureScreenshot', { format: 'jpeg', quality: 58 });
    writeFileSync(path.join(OUT, filename), Buffer.from(data, 'base64'));
  } finally {
    await session.detach();
  }
}

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-dev-shm-usage',
  ],
});

async function installRevealRecorder(page) {
  await page.evaluate(() => {
    const qa = {
      start: performance.now(),
      detailsAt: null,
      stageAt: null,
      stageGoneAt: null,
      earlyFinal: false,
      samples: [],
    };
    window.__luckyQa = qa;
    window.__luckyQaTimer = setInterval(() => {
      const elapsed = performance.now() - qa.start;
      const text = document.body.textContent || '';
      let finalPercentage = null;
      try {
        const stored = localStorage.getItem('lucky-pick-canada-lucky-meter-v1');
        if (stored) finalPercentage = JSON.parse(stored).result.percentage;
      } catch {
        // Storage may not be written yet.
      }
      if (elapsed < 4400 && finalPercentage !== null && text.includes(`${finalPercentage}%`)) {
        qa.earlyFinal = true;
      }
      if (qa.detailsAt === null && text.includes('Your Lucky Numbers')) qa.detailsAt = elapsed;
      const stage = document.querySelector('[data-testid="cosmic-event-stage"]');
      if (qa.stageAt === null && stage) qa.stageAt = elapsed;
      if (qa.stageAt !== null && qa.stageGoneAt === null && !stage) qa.stageGoneAt = elapsed;
      const bigNumber = document.querySelector('.tabular-nums');
      if (bigNumber?.textContent && elapsed < 4400) qa.samples.push(bigNumber.textContent.trim());
    }, 50);
  });
}

async function runEvent({ name, random, viewport, isMobile = false }) {
  const context = await browser.newContext({
    viewport,
    isMobile,
    hasTouch: isMobile,
    deviceScaleFactor: isMobile ? 2 : 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

  await page.addInitScript((value) => {
    Math.random = () => value;
  }, random);
  await page.goto(`${BASE}/lucky-meter`, { waitUntil: 'load' });
  await page.waitForSelector('h1');

  const webgl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    return gl ? gl.getParameter(gl.VERSION) : null;
  });

  await installRevealRecorder(page);
  await page.click('button:has-text("Reveal My Resonance")');
  await page.waitForSelector('text=Your Lucky Numbers', { timeout: 14000 });
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lucky-pick-canada-lucky-meter-v1')),
  );
  // textContent, not innerText: CSS text-transform uppercases several labels.
  const resultText = await page.evaluate(() => document.body.textContent || '');
  const suffix = isMobile ? 'mobile' : 'desktop';

  expect(stored.result.event.id === name, `${name}: stored event ${stored.result.event.id}`);
  expect(
    stored.result.percentage >= 5 && stored.result.percentage <= 100 && stored.result.percentage !== 0,
    `${name}: percentage out of range (${stored.result.percentage})`,
  );
  expect(resultText.includes('Your Lucky Numbers'), `${name}: numbers label missing`);
  for (const number of stored.result.event.numbers) {
    expect(resultText.includes(String(number)), `${name}: lucky number ${number} missing`);
  }
  expect(resultText.includes(stored.result.colour.name), `${name}: colour name missing`);
  expect(resultText.includes(stored.result.spark.message), `${name}: Spark message missing`);
  expect(resultText.includes('not lottery predictions'), `${name}: disclaimer missing`);
  expect(resultText.includes('Share My Resonance'), `${name}: share button missing`);
  expect(resultText.includes('Next Resonance In'), `${name}: countdown label missing`);

  // In-page polling survives SwiftShader main-thread pressure better than a
  // Playwright visibility wait, which can miss a short-lived overlay.
  await page.waitForFunction(
    () => Boolean(document.querySelector('[data-testid="cosmic-event-stage"]')),
    undefined,
    { timeout: 15000 },
  );
  const stageDuration = await page.evaluate(() =>
    Number(
      document
        .querySelector('[data-testid="cosmic-event-stage"]')
        ?.getAttribute('data-duration'),
    ),
  );
  await page.waitForTimeout(1400);
  await capture(page, `${name}-${suffix}-event.jpg`);
  const finaleCaptureStart = {
    meteor: stageDuration - 1400,
    lightning: stageDuration - 1700,
    fireworks: stageDuration - 3200,
  }[name];
  const afterEventCapture = 1400 + 4300;
  await page.waitForTimeout(Math.max(0, finaleCaptureStart - afterEventCapture));
  await capture(page, `${name}-${suffix}-finale.jpg`);
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="cosmic-event-stage"]'),
    undefined,
    { timeout: 40000 },
  );
  await page.waitForTimeout(900);
  await capture(page, `${name}-${suffix}-result.jpg`);

  const qa = await page.evaluate(() => {
    clearInterval(window.__luckyQaTimer);
    return window.__luckyQa;
  });
  const expectedWindows = {
    meteor: [8500, 9500],
    lightning: [9500, 10500],
    fireworks: [11000, 12000],
  }[name];

  expect(qa.earlyFinal === false, `${name}: real percentage appeared before 4.4s`);
  // Software WebGL can delay timers, so these are generous sanity bounds.
  expect(qa.detailsAt !== null && qa.detailsAt >= 4500 && qa.detailsAt <= 9000, `${name}: details at ${qa.detailsAt}`);
  expect(qa.stageAt !== null && qa.stageAt >= 5000 && qa.stageAt <= 12000, `${name}: event start at ${qa.stageAt}`);
  expect(
    Number.isFinite(stageDuration) &&
      stageDuration >= expectedWindows[0] &&
      stageDuration <= expectedWindows[1],
    `${name}: stage duration ${stageDuration} outside ${expectedWindows.join('-')}`,
  );
  // Wall time can inflate under SwiftShader, so the hard window is the stage's
  // own configured duration; observed wall time is recorded for information.
  expect(
    qa.stageGoneAt !== null && qa.stageGoneAt > qa.stageAt,
    `${name}: event never completed in the page`,
  );
  expect(new Set(qa.samples).size > 8, `${name}: too few distinct preview values`);
  expect(consoleErrors.length === 0, `${name}: console errors ${consoleErrors.join(' | ')}`);

  const background = await page.evaluate(() => {
    const image = document.querySelector('picture img');
    const card = document.querySelector('.rounded-3xl');
    const rect = card?.getBoundingClientRect();
    const tierMessage = Array.from(document.querySelectorAll('p')).find((node) => {
      const text = node.textContent || '';
      return text.includes('riding a little low') || text.includes('mid-range') || text.includes('running high');
    });
    return {
      imageLoaded: Boolean(image && image.complete && image.naturalWidth > 0),
      canvasCount: document.querySelectorAll('canvas').length,
      cardWidth: rect ? Math.round(rect.width) : null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      tierFontSize: tierMessage ? getComputedStyle(tierMessage).fontSize : null,
    };
  });
  expect(background.imageLoaded, `${name}: Milky Way image did not load`);
  expect(background.overflowX === false, `${name}: horizontal overflow`);
  expect(
    background.cardWidth !== null && background.cardWidth <= background.viewportWidth,
    `${name}: result card wider than the viewport`,
  );
  expect(Number.parseFloat(background.tierFontSize) >= 12, `${name}: tier message too small`);

  records.push({
    name,
    viewport,
    webgl,
    storage: {
      dateKey: stored.dateKey,
      percentage: stored.result.percentage,
      tier: stored.result.tier.label,
      event: stored.result.event,
      colour: stored.result.colour,
      spark: stored.result.spark.id,
      history: stored.history,
    },
    timings: {
      detailsAt: Math.round(qa.detailsAt),
      stageAt: Math.round(qa.stageAt),
      duration: Math.round(qa.stageGoneAt - qa.stageAt),
      configuredDuration: stageDuration,
      expected: expectedWindows,
    },
    previewSamples: new Set(qa.samples).size,
    background,
    consoleErrors,
  });

  await context.close();
}

async function runMobile() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const mobileErrors = [];
  page.on('pageerror', (error) => mobileErrors.push(error.message));
  await page.addInitScript(() => {
    Math.random = () => 0.2;
  });
  await page.goto(`${BASE}/lucky-meter`, { waitUntil: 'load' });
  await page.click('button:has-text("Reveal My Resonance")');
  await page.waitForSelector('text=Your Lucky Numbers', { timeout: 14000 });
  await page.waitForFunction(
    () => Boolean(document.querySelector('[data-testid="cosmic-event-stage"]')),
    undefined,
    { timeout: 15000 },
  );
  await page.waitForTimeout(1200);
  await capture(page, 'meteor-mobile-event.jpg');
  const mobileBeforeReload = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lucky-pick-canada-lucky-meter-v1')).result.percentage,
  );
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('text=Your Lucky Numbers', { timeout: 8000 });
  await page.waitForTimeout(900);
  await capture(page, 'meteor-mobile-refresh.jpg');
  const refreshState = await page.evaluate(() => ({
    percentage: document.body.innerText.includes(
      String(JSON.parse(localStorage.getItem('lucky-pick-canada-lucky-meter-v1')).result.percentage),
    ),
    revealButton: Boolean(
      Array.from(document.querySelectorAll('button')).find((button) =>
        (button.textContent || '').includes('Reveal My Resonance'),
      ),
    ),
    countdown: document.querySelector('[aria-label="Time until daily reset"]')?.textContent || '',
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  expect(refreshState.percentage, 'mobile refresh: stored percentage not rendered');
  expect(refreshState.revealButton === false, 'mobile refresh: reveal button should not return today');
  expect(/^\d{2}:\d{2}:\d{2}$/.test(refreshState.countdown), 'mobile refresh: countdown missing');
  expect(refreshState.overflowX === false, 'mobile: horizontal overflow');
  expect(mobileErrors.length === 0, `mobile: page errors ${mobileErrors.join(' | ')}`);
  records.push({ name: 'mobile-refresh', percentage: mobileBeforeReload, refreshState, mobileErrors });
  await context.close();
}

async function runReducedMotion() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto(`${BASE}/lucky-meter`, { waitUntil: 'load' });
  await page.click('button:has-text("Reveal My Resonance")');
  await page.waitForSelector('text=Your Lucky Numbers', { timeout: 2500 });
  const reducedState = await page.evaluate(() => ({
    scrambleVisible: document.body.innerText.includes('Reading today'),
    stage: Boolean(document.querySelector('[data-testid="cosmic-event-stage"]')),
    percentage: JSON.parse(localStorage.getItem('lucky-pick-canada-lucky-meter-v1')).result.percentage,
  }));
  await page.waitForTimeout(1200);
  const stageAfter = await page.evaluate(() =>
    Boolean(document.querySelector('[data-testid="cosmic-event-stage"]')),
  );
  expect(reducedState.scrambleVisible === false, 'reduced motion: scramble was shown');
  expect(reducedState.stage === false && stageAfter === false, 'reduced motion: stage was mounted');
  await page.waitForTimeout(600);
  await capture(page, 'reduced-motion-result.jpg');
  records.push({ name: 'reduced-motion', reducedState, stageAfter });
  await context.close();
}

async function runShare() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    window.localStorage.setItem(
      'lucky-pick-canada-lucky-meter-v1',
      JSON.stringify({
        version: 1,
        dateKey,
        result: {
          dateKey,
          percentage: 78,
          event: { id: 'meteor' },
          colour: { id: 'maple-red' },
          spark: { id: 'spark-01' },
          createdAt: Date.now(),
        },
        history: { percentages: [78], events: ['meteor'], sparks: ['spark-01'] },
      }),
    );
  });
  await page.goto(`${BASE}/lucky-meter`, { waitUntil: 'load' });
  await page.waitForSelector('text=Your Lucky Numbers', { timeout: 8000 });
  const nativeShare = await page.evaluate(() => typeof navigator.share === 'function');
  await page.click('button:has-text("Share My Resonance")');
  await page.waitForTimeout(600);
  let clipboardText = '';
  let shareStatus = '';
  try {
    clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    shareStatus = await page.locator('button', { hasText: /Copied/ }).first().textContent();
  } catch (error) {
    failures.push(`share: clipboard read failed (${error.message})`);
  }
  await capture(page, 'share-result.jpg');
  expect(nativeShare === false, 'share: headless browser unexpectedly exposes navigator.share');
  expect(clipboardText.includes('My Daily Resonance'), 'share: clipboard text missing title');
  expect(clipboardText.includes('Your Lucky Numbers: 3, 9, 21'), 'share: clipboard numbers wrong');
  expect(clipboardText.includes('not lottery predictions'), 'share: disclaimer missing');
  expect((shareStatus || '').includes('Copied'), 'share: button did not confirm the copy');
  records.push({ name: 'share', nativeShare, clipboardText, shareStatus });
  await context.close();
}

const scenarios = [
  ['meteor desktop', () => runEvent({ name: 'meteor', random: 0.2, viewport: { width: 1440, height: 950 } })],
  ['lightning desktop', () => runEvent({ name: 'lightning', random: 0.5, viewport: { width: 1440, height: 950 } })],
  ['fireworks desktop', () => runEvent({ name: 'fireworks', random: 0.9, viewport: { width: 1440, height: 950 } })],
  ['mobile', runMobile],
  ['reduced motion', runReducedMotion],
  ['share', runShare],
];

for (const [label, scenario] of scenarios) {
  try {
    await scenario();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

await browser.close();

console.log(JSON.stringify({ base: BASE, failures, records }, null, 2));
if (failures.length > 0) process.exitCode = 1;
