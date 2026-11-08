import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.HERO_PROBE_BASE ?? 'http://127.0.0.1:3000';
const OUT = 'artifacts/hero-reference-20261108/out';

const VIEWPORTS = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'laptop-1024x768', width: 1024, height: 768 },
  { name: 'mobile-412x915', width: 412, height: 915, isMobile: true, hasTouch: true },
  { name: 'mobile-390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const results = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'en-CA',
    isMobile: vp.isMobile ?? false,
    hasTouch: vp.hasTouch ?? false,
  });
  const page = await context.newPage();

  await page.route('**/api/visits', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ visits: 12345 }) })
  );

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2_500);

  const measured = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return {
        x: Math.round(box.x * 10) / 10,
        y: Math.round(box.y + window.scrollY),
        width: Math.round(box.width * 10) / 10,
        height: Math.round(box.height * 10) / 10,
      };
    };
    const hero = document.querySelector('.homepage-hero-welcome');
    const column = document.querySelector('.hero-artwork-column');
    const slices = [...document.querySelectorAll('.hero-art-slice')].map((el) => ({
      classes: el.className,
      box: rect(el),
      ratio: Math.round((el.getBoundingClientRect().width / el.getBoundingClientRect().height) * 1000) / 1000,
      image: el.querySelector('img')?.currentSrc?.split('/').pop() ?? null,
      naturalWidth: el.querySelector('img')?.naturalWidth ?? null,
      imageTop: el.querySelector('img') ? getComputedStyle(el.querySelector('img')).top : null,
    }));
    const panel = document.querySelector('.hero-welcome');
    const nav = document.querySelector('.homepage-main-nav');
    const button = document.querySelector('.homepage-hero-welcome button[aria-label^="Explore your luck"]');
    const exploreSlice = document.querySelector('.hero-image-container');
    const shimmerBands = [...document.querySelectorAll('.hero-gold-shimmer--ring, .hero-gold-shimmer--wordmark, .hero-gold-shimmer--explore')].map((el) => ({
      className: el.className,
      box: rect(el),
      frameBox: rect(el.parentElement),
    }));

    const buttonBox = button?.getBoundingClientRect();
    const stageBox = exploreSlice?.getBoundingClientRect();
    const hitAt = (x, y) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label') ?? document.elementFromPoint(x, y)?.tagName ?? null;

    return {
      title: document.querySelector('h1')?.textContent ?? null,
      navBox: rect(nav),
      heroBox: rect(hero),
      columnBox: rect(column),
      columnPadding: column ? getComputedStyle(column).paddingInline : null,
      slices,
      panelBox: rect(panel),
      panelStyles: panel
        ? {
            border: getComputedStyle(panel).borderTopWidth + ' ' + getComputedStyle(panel).borderTopColor,
            radius: getComputedStyle(panel).borderTopLeftRadius,
            backgroundImage: getComputedStyle(panel).backgroundImage.slice(0, 120),
          }
        : null,
      exploreButtonBox: buttonBox
        ? { x: Math.round(buttonBox.x), y: Math.round(buttonBox.y), width: Math.round(buttonBox.width), height: Math.round(buttonBox.height) }
        : null,
      exploreStageBox: stageBox
        ? { x: Math.round(stageBox.x), y: Math.round(stageBox.y), width: Math.round(stageBox.width), height: Math.round(stageBox.height) }
        : null,
      exploreButtonCentered: buttonBox && stageBox
        ? Math.abs(buttonBox.x + buttonBox.width / 2 - (stageBox.x + stageBox.width / 2)) <= 1
        : null,
      exploreButtonAtBottom: buttonBox && stageBox
        ? buttonBox.y + buttonBox.height >= stageBox.y + stageBox.height - 1
        : null,
      stagePointerEvents: exploreSlice ? getComputedStyle(exploreSlice).pointerEvents : null,
      shimmerBands,
      horizontalOverflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      firstScreenText: {
        heading: document.querySelector('.hero-welcome-lede')?.textContent ?? null,
        cta: document.querySelector('.hero-welcome-cta')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
        note: document.querySelector('.hero-welcome-note')?.textContent ?? null,
      },
      belowHeroPresent: Boolean(document.getElementById('play-explore')),
    };
  });

  // Hit-test the Explore control after scrolling its window into the viewport.
  const stageLocator = page.locator('.hero-image-container');
  await stageLocator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const liveStage = await stageLocator.boundingBox();
  measured.exploreStageLiveBox = liveStage
    ? { x: Math.round(liveStage.x), y: Math.round(liveStage.y), width: Math.round(liveStage.width), height: Math.round(liveStage.height) }
    : null;
  measured.exploreHitTest = liveStage
    ? await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label') ?? null,
        { x: liveStage.x + liveStage.width / 2, y: liveStage.y + liveStage.height * 0.85 }
      )
    : null;
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  const heroScreenshot = join(OUT, `hero-${vp.name}.png`);
  await page.locator('.homepage-hero-welcome').screenshot({ path: heroScreenshot, animations: 'disabled' });
  await page.screenshot({ path: join(OUT, `viewport-${vp.name}.png`), animations: 'disabled' });

  // Full-height hero once the sticky/animated layers settle.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);

  results.push({ viewport: vp, measured, heroScreenshot });
  await context.close();
}

await browser.close();

writeFileSync(join(OUT, 'measurements.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map((r) => ({
  viewport: `${r.viewport.width}x${r.viewport.height}`,
  order: r.measured.slices.map((s) => (s.classes.includes('--emblem') ? 'emblem' : s.classes.includes('--divider') ? 'divider' : 'explore')),
  slices: r.measured.slices.map((s) => `${s.box.width}x${s.box.height} ratio=${s.ratio} img=${s.image}`),
  panel: `${r.measured.panelBox.width}x${r.measured.panelBox.height}`,
  overflow: r.measured.horizontalOverflowPx,
  button: r.measured.exploreButtonBox,
  centered: r.measured.exploreButtonCentered,
  atBottom: r.measured.exploreButtonAtBottom,
  hit: r.measured.exploreHitTest,
  shimmer: r.measured.shimmerBands.length,
})), null, 2));
