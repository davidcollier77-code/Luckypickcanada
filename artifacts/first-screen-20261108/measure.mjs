/**
 * Rendered evidence for `specs/115-first-screen-clarity-naming-csp`.
 *
 * Measures the first screen at 1440 x 900 and 390 x 844, the effective hit
 * areas of the footer and homepage-header controls and the map province
 * markers, and records the visible experience names. Run against a local dev
 * server: `node artifacts/first-screen-20261108/measure.mjs`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright-chromium';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT = join(process.cwd(), 'artifacts/first-screen-20261108/results.json');

const FIRST_SCREEN_SELECTORS = [
  'h1.hero-welcome-title',
  '.hero-welcome-lede',
  '.hero-welcome-copy',
  '.hero-welcome-cta',
  '.hero-welcome-note',
];

async function firstScreen(page, label) {
  const viewport = page.viewportSize();
  const doc = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  const blocks = {};
  for (const selector of FIRST_SCREEN_SELECTORS) {
    const locator = page.locator(selector).first();
    const count = await locator.count();
    if (!count) {
      blocks[selector] = { present: false };
      continue;
    }
    const box = await locator.boundingBox();
    const text = (await locator.innerText()).replace(/\s+/g, ' ').trim();
    blocks[selector] = {
      present: true,
      text,
      top: box ? Math.round(box.y) : null,
      bottom: box ? Math.round(box.y + box.height) : null,
      insideFirstViewport: !!box && box.y >= 0 && box.y + box.height <= viewport.height,
    };
  }

  return {
    label,
    viewport,
    ...doc,
    horizontalOverflow: doc.scrollWidth - doc.clientWidth,
    blocks,
    allInsideFirstViewport: Object.values(blocks).every((block) => block.present && block.insideFirstViewport),
  };
}

async function hitExtent(element) {
  await element.scrollIntoViewIfNeeded();
  return element.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const hits = (x, y) => {
      const found = document.elementFromPoint(x, y);
      return !!found && (found === el || el.contains(found));
    };
    if (rect.width < 2 || rect.height < 2 || !hits(cx, cy)) {
      return { invalid: true, border: [rect.width, rect.height].map((n) => +n.toFixed(2)) };
    }
    const probe = (dx, dy) => {
      let extent = 0;
      for (let d = 1; d <= 32; d += 1) {
        if (!hits(cx + dx * d, cy + dy * d)) break;
        extent = d;
      }
      return extent;
    };
    const halfWidth = Math.max(probe(1, 0), probe(-1, 0));
    const halfHeight = Math.max(probe(0, 1), probe(0, -1));
    return {
      invalid: false,
      border: [+rect.width.toFixed(2), +rect.height.toFixed(2)],
      hitArea: [halfWidth * 2, halfHeight * 2],
      label: (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    };
  });
}

async function measureGroup(page, name, selector) {
  const elements = await page.locator(selector).all();
  const samples = [];
  for (const element of elements) {
    samples.push({ selector, ...(await hitExtent(element)) });
  }
  const valid = samples.filter((sample) => !sample.invalid && sample.hitArea);
  return {
    name,
    count: samples.length,
    samples,
    minimumHit: valid.length
      ? valid.reduce((min, sample) => [Math.min(min[0], sample.hitArea[0]), Math.min(min[1], sample.hitArea[1])], [Infinity, Infinity])
      : null,
    failures: valid.filter((sample) => sample.hitArea[0] < 24 || sample.hitArea[1] < 24),
  };
}

const browser = await chromium.launch();
const results = { baseUrl: BASE_URL, capturedAt: new Date().toISOString(), desktop: null, mobile: null, names: {}, tapTargets: null, pageErrors: [] };

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktop.newPage();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  results.desktop = await firstScreen(desktopPage, 'desktop-1440x900');

  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  results.mobile = await firstScreen(mobilePage, 'mobile-390x844');

  results.names.homepage = await mobilePage.evaluate(() => {
    const text = (selector) => [...document.querySelectorAll(selector)].map((el) => el.textContent.replace(/\s+/g, ' ').trim());
    return {
      headings: text('.homepage-section-heading h2, .homepage-community-card h2, .homepage-offer h3, .homepage-offer-title'),
      heroNav: text('.homepage-main-nav a'),
      footerNav: text('footer nav[aria-label="Footer navigation"] a'),
      ctas: text('.homepage-experience .gold-3d-btn, .homepage-experience button'),
      faq: text('.faq-accordion .faq-item > button'),
      firstScreen: text('.hero-welcome h1, .hero-welcome-lede, .hero-welcome-copy, .hero-welcome-cta, .hero-welcome-note'),
    };
  });

  results.tapTargets = {
    footerNavigation: await measureGroup(mobilePage, 'footer navigation', 'footer nav[aria-label="Footer navigation"] a'),
    footerSocial: await measureGroup(mobilePage, 'footer social', 'footer nav[aria-label="Social links"] a'),
    footerLegal: await measureGroup(mobilePage, 'footer legal', 'footer nav[aria-label="Legal links"] a'),
    homepageHeader: await measureGroup(mobilePage, 'homepage header', '.homepage-main-nav a'),
  };

  await mobilePage.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('.province-marker', { timeout: 30_000 });
  results.tapTargets.provinceMarkers = await measureGroup(mobilePage, 'map province markers', '.province-marker');
  results.names.map = await mobilePage.evaluate(() => {
    const text = (selector) => [...document.querySelectorAll(selector)].map((el) => el.textContent.replace(/\s+/g, ' ').trim());
    return {
      headings: text('h1, h2'),
      buttons: text('a.gold-3d-btn, button'),
      ariaLabels: [...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label')).filter((label) => /lucky|stories|map/i.test(label)).slice(0, 20),
    };
  });

  await desktop.close();
  await mobile.close();
} finally {
  await browser.close();
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(results, null, 2)}\n`);

const summarize = (group) => `${group.name}: ${group.count} controls, min hit ${JSON.stringify(group.minimumHit)}, failures ${group.failures.length}`;
console.log('first screen (desktop)', results.desktop.allInsideFirstViewport, results.desktop.horizontalOverflow);
console.log('first screen (mobile)', results.mobile.allInsideFirstViewport, results.mobile.horizontalOverflow);
for (const key of ['footerNavigation', 'footerSocial', 'footerLegal', 'homepageHeader', 'provinceMarkers']) {
  console.log(summarize(results.tapTargets[key]));
}
console.log('written', OUT);
