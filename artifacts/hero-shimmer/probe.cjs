/* Chromium probe for specs/089-homepage-nav-gold-shimmer.
 *
 * Serves an already-started production build (BASE_URL, default
 * http://127.0.0.1:3100/). For desktop, mobile and reduced-motion profiles it:
 *   - reads the hero primary navigation entries,
 *   - samples the hero across a full shimmer cycle and measures the pixel
 *     movement inside each decorated region (gold ring, gold wordmark,
 *     Explore Your Luck line/arrow),
 *   - saves the first and peak frames as evidence PNGs,
 *   - records hero image responses (one AVIF variant, nothing else),
 *   - checks overflow and console/page errors,
 *   - clicks Explore Your Luck and confirms the eased scroll still happens.
 * Writes PNGs and report.json into artifacts/hero-shimmer/.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-chromium');
const sharp = require('sharp');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/';
const OUT = path.join(process.cwd(), 'artifacts', 'hero-shimmer');
fs.mkdirSync(OUT, { recursive: true });

const REGIONS = ['--ring', '--wordmark', '--explore'];
const FRAMES = 26;
const FRAME_INTERVAL_MS = 400;

async function meanPixelDiff(bufA, bufB, rect) {
  const extract = {
    left: Math.max(0, Math.round(rect.left)),
    top: Math.max(0, Math.round(rect.top)),
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };

  const a = await sharp(bufA).extract(extract).raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(bufB).extract(extract).raw().toBuffer({ resolveWithObject: true });

  const channels = Math.min(a.info.channels, b.info.channels);
  const pixels = Math.min(a.info.width * a.info.height, b.info.width * b.info.height);
  const lengths = Math.min(a.data.length, b.data.length);
  let total = 0;
  let changedPixels = 0;

  for (let i = 0; i < lengths; i += channels) {
    let pixelDelta = 0;
    for (let c = 0; c < Math.min(3, channels); c += 1) {
      pixelDelta += Math.abs(a.data[i + c] - b.data[i + c]);
    }
    const delta = pixelDelta / Math.min(3, channels);
    total += delta;
    if (delta >= 6) changedPixels += 1;
  }

  return {
    meanAbsDiff: Number((total / Math.max(1, pixels)).toFixed(3)),
    changedPixelRatio: Number((changedPixels / Math.max(1, pixels)).toFixed(4)),
  };
}

async function runProfile(browser, name, viewport, { reducedMotion = false } = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const heroResponses = [];

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (error) => pageErrors.push(String(error && error.message ? error.message : error)));
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('homepage-hero-lucky-pick-canada')) {
      heroResponses.push({ file: url.split('/').pop(), status: response.status() });
    }
  });

  await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => {
    const img = document.querySelector('.hero-image-container img');
    return Boolean(img && img.complete && img.naturalWidth > 0 && document.querySelector('.hero-gold-shimmer-frame'));
  }, { timeout: 60000 });
  await page.waitForTimeout(800);

  const nav = await page.evaluate(() => [...document.querySelectorAll('.homepage-main-nav a')]
    .map((a) => ({ label: a.textContent.trim(), href: a.getAttribute('href') })));

  const geometry = await page.evaluate((regions) => {
    const hero = document.querySelector('.hero-image-container').getBoundingClientRect();
    const image = document.querySelector('.hero-image-container img');
    const imageRect = image.getBoundingClientRect();
    const scale = Math.min(imageRect.width / image.naturalWidth, imageRect.height / image.naturalHeight);
    const frame = document.querySelector('.hero-gold-shimmer-frame').getBoundingClientRect();
    const out = {
      hero: { left: hero.left, top: hero.top, width: hero.width, height: hero.height },
      imageBox: { width: Math.round(imageRect.width), height: Math.round(imageRect.height) },
      paintedBox: { width: Math.round(image.naturalWidth * scale), height: Math.round(image.naturalHeight * scale) },
      frame: { width: Math.round(frame.width), height: Math.round(frame.height) },
      scroll: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
    };
    for (const region of regions) {
      const element = document.querySelector(`.hero-gold-shimmer${region}`);
      const rect = element.getBoundingClientRect();
      out[region] = {
        left: rect.left - hero.left,
        top: rect.top - hero.top,
        width: rect.width,
        height: rect.height,
        display: getComputedStyle(element).display,
        maskImage: getComputedStyle(element).maskImage || getComputedStyle(element).webkitMaskImage,
      };
    }
    out.shimmerDisplay = getComputedStyle(document.querySelector('.hero-gold-shimmer')).display;
    out.animation = getComputedStyle(document.querySelector('.hero-gold-shimmer--wordmark'), '::before').animationName;
    return out;
  }, REGIONS);

  const heroClip = {
    x: Math.max(0, Math.round(geometry.hero.left)),
    y: Math.max(0, Math.round(geometry.hero.top)),
    width: Math.max(1, Math.round(geometry.hero.width)),
    height: Math.max(1, Math.round(geometry.hero.height)),
  };

  const frameCount = reducedMotion ? 6 : FRAMES;
  const frames = [];
  for (let i = 0; i < frameCount; i += 1) {
    frames.push(await page.screenshot({ clip: heroClip }));
    if (i < frameCount - 1) await page.waitForTimeout(FRAME_INTERVAL_MS);
  }

  const wholeHero = [];
  for (let i = 1; i < frames.length; i += 1) {
    wholeHero.push(await meanPixelDiff(frames[i - 1], frames[i], { left: 0, top: 0, width: heroClip.width, height: heroClip.height }));
  }
  const peakIndex = wholeHero.reduce((best, value, index) => (value.meanAbsDiff > wholeHero[best].meanAbsDiff ? index : best), 0);

  const regions = {};
  for (const region of REGIONS) {
    const rect = geometry[region];
    const steps = [];
    for (let i = 1; i < frames.length; i += 1) {
      steps.push(await meanPixelDiff(frames[i - 1], frames[i], rect));
    }
    const firstToPeak = await meanPixelDiff(frames[0], frames[peakIndex + 1] ?? frames[frames.length - 1], rect);
    regions[region] = {
      ...rect,
      maxConsecutiveMeanAbsDiff: Math.max(...steps.map((step) => step.meanAbsDiff)),
      maxChangedPixelRatio: Math.max(...steps.map((step) => step.changedPixelRatio)),
      totalChangeAcrossCycle: steps.reduce((sum, step) => sum + step.meanAbsDiff, 0),
      firstToPeak,
    };
  }

  const shotA = `${name}-a.png`;
  const shotB = `${name}-b.png`;
  fs.writeFileSync(path.join(OUT, shotA), frames[0]);
  fs.writeFileSync(path.join(OUT, shotB), frames[Math.min(peakIndex + 1, frames.length - 1)]);

  const before = await page.evaluate(() => window.scrollY);
  const canvasBefore = await page.evaluate(() => document.querySelectorAll('canvas').length);
  await page.click('.homepage-hero-welcome button[aria-label^="Explore your luck"]');
  await page.waitForTimeout(2000);
  const afterScroll = await page.evaluate(() => window.scrollY);
  const canvasAfter = await page.evaluate(() => document.querySelectorAll('canvas').length);
  const confettiState = await page.evaluate(() => document.querySelector('.homepage-hero-welcome button[aria-label^="Explore your luck"]')?.getAttribute('data-confetti-pop-ready'));

  await context.close();

  return {
    name,
    viewport,
    reducedMotion,
    nav,
    geometry,
    peakFrame: peakIndex + 1,
    wholeHeroMaxMeanAbsDiff: Math.max(...wholeHero.map((step) => step.meanAbsDiff)),
    regions,
    heroResponses,
    canvasBefore,
    canvasAfter,
    confettiState,
    scroll: { before, after: afterScroll },
    consoleErrors,
    pageErrors,
    screenshots: [shotA, shotB],
  };
}

(async () => {
  const browser = await chromium.launch();
  const report = { base: BASE, generatedAt: new Date().toISOString(), frames: FRAMES, frameIntervalMs: FRAME_INTERVAL_MS, profiles: [] };
  try {
    report.profiles.push(await runProfile(browser, 'desktop', { width: 1440, height: 900 }));
    report.profiles.push(await runProfile(browser, 'mobile', { width: 390, height: 844 }));
    report.profiles.push(await runProfile(browser, 'reduced-motion', { width: 1440, height: 900 }, { reducedMotion: true }));
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  for (const profile of report.profiles) {
    console.log(`\n== ${profile.name} ${profile.viewport.width}x${profile.viewport.height} reducedMotion=${profile.reducedMotion}`);
    console.log('nav:', JSON.stringify(profile.nav));
    console.log('frame', JSON.stringify(profile.geometry.frame), 'imageBox', JSON.stringify(profile.geometry.imageBox), 'paintedBox', JSON.stringify(profile.geometry.paintedBox));
    console.log('animation', profile.geometry.animation, 'shimmer display', profile.geometry.shimmerDisplay, 'overflow', JSON.stringify(profile.geometry.scroll));
    console.log('whole hero max consecutive diff', profile.wholeHeroMaxMeanAbsDiff, 'peak frame', profile.peakFrame);
    for (const region of REGIONS) {
      const r = profile.regions[region];
      console.log(region, JSON.stringify({ display: r.display, box: [Math.round(r.width), Math.round(r.height)], maxStep: r.maxConsecutiveMeanAbsDiff, maxChangedRatio: r.maxChangedPixelRatio, totalChange: Number(r.totalChangeAcrossCycle.toFixed(2)), firstToPeak: r.firstToPeak.meanAbsDiff }));
    }
    console.log('hero responses', JSON.stringify(profile.heroResponses));
    console.log('scroll', JSON.stringify(profile.scroll), 'canvas', profile.canvasBefore, '->', profile.canvasAfter, 'confettiReady', profile.confettiState);
    console.log('consoleErrors', JSON.stringify(profile.consoleErrors), 'pageErrors', JSON.stringify(profile.pageErrors));
  }
})().catch((error) => {
  console.error('PROBE FAILED:', error);
  process.exitCode = 1;
});
