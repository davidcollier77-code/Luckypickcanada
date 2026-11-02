/* eslint-disable no-console */
// Browser verification for specs/075-lucky-reveal-polish.
//
// Uses the development-only deterministic gift route so the reveal does not
// depend on checkout clicks: /reveal/polish-0 is a 6 Pick and
// /reveal/polish-108 is a 7 Pick (seeded from the reveal id in development).
//
// Run against a local dev server:
//   node artifacts/lucky-reveal-polish-check.cjs
const { chromium } = require('playwright-chromium');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT = path.resolve(__dirname);
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function openReveal(page, revealId) {
  await page.goto(`${BASE}/reveal/${revealId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#lucky-reveal-title', { timeout: 60000 });
  await page.waitForTimeout(4200);
}

async function rowSnapshot(page) {
  return page.$$eval('.lucky-reveal-number-row', (rows) =>
    rows.map((row) => {
      const rect = row.getBoundingClientRect();
      const balls = Array.from(row.children).map((ball) => {
        const ballRect = ball.getBoundingClientRect();
        return { number: ball.textContent.trim(), left: ballRect.left, right: ballRect.right };
      });
      return {
        count: row.children.length,
        centre: rect.left + rect.width / 2,
        left: rect.left,
        right: rect.right,
        balls,
      };
    }),
  );
}

async function layoutChecks(page, expectedRows, label, screenshotName) {
  const rows = await rowSnapshot(page);
  const counts = rows.map((row) => row.count).join('+');
  record(`${label}: rows ${expectedRows.join('+')}`, counts === expectedRows.join('+'), `saw ${counts}`);

  const parent = await page.$eval('.lucky-reveal-number-row', (el) => {
    const rect = el.parentElement.getBoundingClientRect();
    return rect.left + rect.width / 2;
  });
  record(
    `${label}: rows centred`,
    rows.every((row) => Math.abs(row.centre - parent) < 1.5),
    rows.map((row) => row.centre.toFixed(1)).join(', ') + ` vs ${parent.toFixed(1)}`,
  );

  const numbers = rows.flatMap((row) => row.balls.map((ball) => ball.number));
  const expectedCount = expectedRows.reduce((total, size) => total + size, 0);
  record(
    `${label}: ${expectedCount} numbers shown in ascending stored order`,
    numbers.length === expectedCount && numbers.every((value, index) => index === 0 || Number(numbers[index - 1]) < Number(value)),
    numbers.join(', '),
  );

  record(
    `${label}: number balls stay inside their row`,
    rows.every((row) => row.balls.every((ball) => ball.left >= row.left - 1 && ball.right <= row.right + 1)),
  );

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  record(`${label}: no horizontal overflow`, overflow <= 0, `${overflow}px`);

  const swatch = await page.evaluate(() => {
    const el = document.querySelector('.lucky-reveal-swatch');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const name = el.parentElement.querySelector('strong').getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      width: rect.width,
      height: rect.height,
      background: style.backgroundImage,
      visible: rect.width > 12 && rect.height > 12 && style.opacity !== '0',
      beside: rect.right <= name.left + 4 && Math.abs(rect.top + rect.height / 2 - (name.top + name.height / 2)) < 8,
      colourName: el.parentElement.querySelector('strong').textContent.trim(),
    };
  });
  record(`${label}: colour swatch is visible beside the colour name`, Boolean(swatch?.visible && swatch?.beside), swatch ? `${swatch.colourName} ${swatch.width}x${swatch.height}` : 'missing');
  record(`${label}: swatch paints its own colour gradient`, Boolean(swatch?.background?.includes('gradient')), swatch ? swatch.background.slice(0, 80) : '');

  record(
    `${label}: reveal is the single dialog`,
    (await page.locator('section[role="dialog"]').count()) === 1,
  );

  await page.screenshot({ path: path.join(OUT, screenshotName), fullPage: false });
}

async function shareFallbackChecks(page) {
  await page.getByRole('button', { name: 'Share My Reveal' }).click();
  await page.waitForSelector('#share-reveal-title', { timeout: 30000 });

  record('sharing: compact window opens when native sharing is unavailable', true);
  record('sharing: exactly one main share control', (await page.getByRole('button', { name: 'Share My Reveal' }).count()) === 1);

  const optionLabels = await page.$$eval('#share-reveal-title ~ *, .share-lucky-option', (nodes) => nodes.map((node) => node.textContent.trim()));
  record('sharing: download option present', optionLabels.some((label) => label.includes('Download the image')));
  record('sharing: copy link option present', optionLabels.some((label) => label.includes('Copy the website link')));

  const legacy = await page.$$eval('button, a', (nodes) =>
    nodes
      .map((node) => node.textContent.trim())
      .filter((label) => /^(Facebook|X|Email|Text|Friends and family|Copy share link|Copy card message)$/.test(label)),
  );
  record('sharing: no legacy social, email, or text buttons', legacy.length === 0, legacy.join(', '));

  const image = await page.evaluate(async () => {
    const img = document.querySelector('img[alt*="reveal image"]');
    if (!img) return null;
    await img.decode().catch(() => {});
    const response = await fetch(img.src);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      size: bytes.length,
      base64: btoa(binary),
    };
  });

  record('sharing: static reveal image renders', Boolean(image && image.size > 20000), image ? `${image.width}x${image.height}, ${image.size} bytes` : 'missing');
  record('sharing: image uses the 1200x1500 share layout', Boolean(image && image.width === 1200 && image.height === 1500));

  if (image) {
    fs.writeFileSync(path.join(OUT, 'lucky-reveal-share-image.png'), Buffer.from(image.base64, 'base64'));
  }
}

async function nativeShareChecks(browser, revealId) {
  const context = await browser.newContext({ viewport: { width: 414, height: 896 }, hasTouch: true, isMobile: true });
  await context.addInitScript(() => {
    window.__shared = null;
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: async (data) => {
        window.__shared = {
          title: data.title,
          text: data.text,
          files: (data.files || []).map((file) => ({ name: file.name, type: file.type, size: file.size })),
        };
      },
      configurable: true,
    });
  });
  const page = await context.newPage();
  await openReveal(page, revealId);
  await page.getByRole('button', { name: 'Share My Reveal' }).click();
  await page.waitForFunction(() => window.__shared !== null, null, { timeout: 30000 });

  const shared = await page.evaluate(() => window.__shared);
  record('sharing: device share panel receives the static image', shared.files?.[0]?.type === 'image/png' && shared.files[0].size > 20000, JSON.stringify(shared.files));
  record('sharing: shared payload is an image, never a video', shared.files.every((file) => !file.type.startsWith('video/')), shared.files.map((file) => file.type).join(','));
  record('sharing: accompanying text carries the website link', shared.text.includes('luckypickcanada.ca'), shared.text.slice(0, 90));
  record('sharing: no fallback window when the device accepts the share', (await page.locator('#share-reveal-title').count()) === 0);

  await context.close();
}

async function cancelChecks(browser, revealId) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: async () => {
        throw new DOMException('Share canceled', 'AbortError');
      },
      configurable: true,
    });
  });
  const page = await context.newPage();
  await openReveal(page, revealId);
  await page.getByRole('button', { name: 'Share My Reveal' }).click();
  await page.waitForSelector('[role="status"]', { timeout: 30000 });
  const status = (await page.textContent('[role="status"]')).trim();

  record('sharing: cancelling is handled without an error', status === 'Sharing cancelled.', status);
  record('sharing: cancelled share does not open the fallback window', (await page.locator('#share-reveal-title').count()) === 0);

  await context.close();
}

async function reducedMotionChecks(browser, revealId) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${BASE}/reveal/${revealId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#lucky-reveal-title', { timeout: 60000 });
  await page.waitForTimeout(700);

  const state = await page.evaluate(() => {
    const number = document.querySelector('.lucky-reveal-number');
    const shimmer = document.querySelector('.lucky-reveal-shimmer');
    const sparkle = document.querySelector('.lucky-reveal-sparkle');
    return {
      numberOpacity: getComputedStyle(number).opacity,
      numberAnimation: getComputedStyle(number).animationName,
      shimmerDisplay: getComputedStyle(shimmer).display,
      sparkleAnimation: getComputedStyle(sparkle).animationName,
    };
  });

  record('reduced motion: numbers are visible immediately', state.numberOpacity === '1', state.numberOpacity);
  record('reduced motion: number animation is suppressed', state.numberAnimation === 'none', state.numberAnimation);
  record('reduced motion: golden shimmer is suppressed', state.shimmerDisplay === 'none', state.shimmerDisplay);
  record('reduced motion: maple sparkle does not animate', state.sparkleAnimation === 'none', state.sparkleAnimation);

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const [label, revealId, expected, viewport] of [
    ['mobile 6 Pick', 'polish-0', [3, 3], { width: 390, height: 844 }],
    ['desktop 6 Pick', 'polish-0', [3, 3], { width: 1440, height: 900 }],
    ['mobile 7 Pick', 'polish-108', [4, 3], { width: 390, height: 844 }],
    ['desktop 7 Pick', 'polish-108', [4, 3], { width: 1440, height: 900 }],
  ]) {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 500, isMobile: viewport.width < 500 });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    });
    const page = await context.newPage();
    await openReveal(page, revealId);
    await layoutChecks(page, expected, label, `lucky-reveal-${label.replace(/\s+/g, '-').toLowerCase()}.png`);
    if (label.startsWith('desktop')) await shareFallbackChecks(page);
    await context.close();
  }

  await nativeShareChecks(browser, 'polish-108');
  await cancelChecks(browser, 'polish-0');
  await reducedMotionChecks(browser, 'polish-108');

  await browser.close();

  const failures = results.filter((result) => !result.ok);
  fs.writeFileSync(path.join(OUT, 'lucky-reveal-polish-report.json'), JSON.stringify({ results, failures: failures.length }, null, 2));
  console.log(`\n${results.length - failures.length}/${results.length} checks passed, ${failures.length} failed.`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('BROWSER CHECK ERROR:', error);
  process.exit(2);
});
