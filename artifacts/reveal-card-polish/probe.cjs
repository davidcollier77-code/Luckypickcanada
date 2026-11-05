/* Browser probe for the /reveal Lucky Card presentation polish (specs/094). */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Loopback probe target for the locally served production build.
// DevSkim: ignore DS162092 — loopback only, never a remote or insecure production URL.
const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:3200';
const OUT = process.env.PROBE_OUT || path.join(__dirname, 'out');
const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';

const TIERS = [
  { tier: 'standard', cardId: 'number-seeker', title: 'The Number Seeker' },
  { tier: 'premium', cardId: 'northern-lights', title: 'The Northern Lights' },
  { tier: 'flagship', cardId: 'flagship-card', title: 'The Flagship Card' },
];

// Matched against whitespace-stripped computed values, where `rgba(` is the
// serialisation even for fully opaque colours.
const ACCENTS = {
  standard: '224,148,64',
  premium: '200,204,208',
  flagship: '218,165,32',
};

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass: Boolean(pass), detail });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const consoleErrors = [];

  // ---------- 1. Entry affordance ----------
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
  });
  const page = await mobile.newPage();
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(String(error)));

  await page.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  const button = page.locator('button', { hasText: 'Reveal Today' }).first();
  await button.waitFor({ state: 'visible', timeout: 20000 });
  const box = await button.boundingBox();
  const metrics = await button.evaluate(el => {
    const style = window.getComputedStyle(el);
    return {
      cursor: style.cursor,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      touchAction: style.touchAction,
      transform: style.transform,
      describedBy: el.getAttribute('aria-describedby'),
      innerText: el.innerText.trim(),
    };
  });
  const hintText = metrics.describedBy
    ? (await page.locator(`#${metrics.describedBy}`).innerText()).trim()
    : null;

  check('mobile entry height >= 56px', box && box.height >= 56, box && Math.round(box.height));
  check('mobile entry fills the column (>= 320px)', box && box.width >= 320, box && Math.round(box.width));
  check('pointer cursor', metrics.cursor === 'pointer', metrics.cursor);
  check('gold gradient kept', metrics.backgroundImage.includes('linear-gradient'), metrics.backgroundImage.slice(0, 60));
  check('raised edge kept', metrics.boxShadow.includes('rgb'), metrics.boxShadow.slice(0, 60));
  check('touch-manipulation kept', metrics.touchAction === 'manipulation', metrics.touchAction);
  const exactNameCount = await page
    .getByRole('button', { name: "Reveal Today's Luck", exact: true })
    .count();
  check('accessible name unchanged', exactNameCount === 1, { exactNameCount, innerText: metrics.innerText });
  check('aria-describedby wired', metrics.describedBy === 'lucky-card-reveal-hint', metrics.describedBy);
  check('hint copy', hintText === 'Tap to reveal today\u2019s Lucky Card', JSON.stringify(hintText));

  await page.screenshot({ path: path.join(OUT, 'entry-mobile-390.png') });

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  const hoverTransform = await button.evaluate(el => window.getComputedStyle(el).transform);
  await page.mouse.down();
  await page.waitForTimeout(150);
  const pressedTransform = await button.evaluate(el => window.getComputedStyle(el).transform);
  await page.mouse.up();
  check('hover lift', hoverTransform !== metrics.transform, `${metrics.transform} -> ${hoverTransform}`);
  check('press down', pressedTransform !== hoverTransform, `${hoverTransform} -> ${pressedTransform}`);

  // Pressing the control must actually start the draw: the canvases mount and the
  // entry button leaves the screen.
  await page.waitForTimeout(500);
  const drawCanvasCount = await page.locator('canvas').count();
  const entryGone = await page.getByRole('button', { name: "Reveal Today's Luck", exact: true }).count();
  check('press starts the draw', drawCanvasCount > 0, drawCanvasCount);
  check('entry control leaves the screen while drawing', entryGone === 0, entryGone);
  await mobile.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
  await desktopPage.evaluate(() => window.localStorage.clear());
  await desktopPage.reload({ waitUntil: 'domcontentloaded' });
  const desktopButton = desktopPage.locator('button', { hasText: 'Reveal Today' }).first();
  await desktopButton.waitFor({ state: 'visible', timeout: 20000 });
  const desktopBox = await desktopButton.boundingBox();
  const desktopHint = (await desktopPage.locator('#lucky-card-reveal-hint').innerText()).trim();
  check('desktop entry height >= 56px', desktopBox && desktopBox.height >= 56, desktopBox && Math.round(desktopBox.height));
  check('desktop entry is content-width', desktopBox && desktopBox.width < 700, desktopBox && Math.round(desktopBox.width));
  check('desktop hint visible', desktopHint.length > 0, JSON.stringify(desktopHint));
  await desktopPage.screenshot({ path: path.join(OUT, 'entry-desktop.png') });
  await desktop.close();

  // ---------- 2. Revealed presentation per tier ----------
  for (const spec of TIERS) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
    });
    const tierPage = await context.newPage();
    tierPage.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(`${spec.tier}: ${message.text()}`);
    });
    tierPage.on('pageerror', error => consoleErrors.push(`${spec.tier}: ${String(error)}`));

    await tierPage.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
    await tierPage.evaluate(
      ({ key, cardId, revealDate }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({ cardId, quote: 'Probe quote for the revealed presentation.', revealDate }),
        );
      },
      { key: STORAGE_KEY, cardId: spec.cardId, revealDate: todayKey() },
    );
    await tierPage.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
    await tierPage.locator('h2').first().waitFor({ state: 'visible', timeout: 20000 });
    // Let the reveal entrance and the tier halo fade settle before measuring.
    await tierPage.waitForTimeout(900);

    // The card's revealed ring also carries data-tier, so the chip block is the last match.
    const chip = tierPage.locator(`[data-tier="${spec.tier}"]`).last();
    const chipText = (await chip.innerText()).replace(/\s+/g, ' ').trim();
    const chipStyle = await chip.locator('span').first().evaluate(el => {
      const style = window.getComputedStyle(el);
      return { color: style.color, backgroundColor: style.backgroundColor, boxShadow: style.boxShadow };
    });
    const headingText = (await tierPage.locator('h2').first().innerText()).trim();
    const caption = (await tierPage.locator('p', { hasText: 'Added to your collection' }).first().innerText()).trim();
    const quote = (await tierPage.locator('p', { hasText: 'Probe quote' }).first().innerText()).trim();
    const haloCount = await tierPage.locator(`[data-card-halo="${spec.tier}"]`).count();
    const haloDetail = haloCount
      ? await tierPage.locator(`[data-card-halo="${spec.tier}"]`).first().evaluate(el => {
          const wrapper = el.closest('[aria-hidden="true"]');
          const style = window.getComputedStyle(el);
          return {
            ariaHiddenWrapper: Boolean(wrapper),
            pointerEvents: wrapper ? window.getComputedStyle(wrapper).pointerEvents : null,
            opacity: style.opacity,
            filter: style.filter,
            background: style.backgroundImage,
          };
        })
      : null;
    const ringCount = await tierPage.locator(`.card-container [data-tier="${spec.tier}"]`).count();
    const ringShadow = ringCount
      ? await tierPage
          .locator(`.card-container [data-tier="${spec.tier}"]`)
          .first()
          .evaluate(el => window.getComputedStyle(el).boxShadow)
      : null;
    const artworkSrc = await tierPage.locator(`img[alt="${spec.title}"]`).first().getAttribute('src');
    const overflow = await tierPage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    check(`${spec.tier}: chip label`, chipText.toUpperCase().includes(`${spec.tier.toUpperCase()} TIER`), chipText);
    check(`${spec.tier}: card name`, headingText === spec.title, headingText);
    check(`${spec.tier}: collection caption`, caption.toLowerCase().includes('added to your collection'), caption);
    check(`${spec.tier}: stored quote`, quote.includes('Probe quote'), quote);
    check(`${spec.tier}: halo rendered`, haloCount > 0, haloCount);
    check(
      `${spec.tier}: halo decorative`,
      Boolean(haloDetail && haloDetail.ariaHiddenWrapper && haloDetail.pointerEvents === 'none'),
      haloDetail && haloDetail.pointerEvents,
    );
    check(`${spec.tier}: halo settled`, Boolean(haloDetail && Number(haloDetail.opacity) > 0.9), haloDetail && haloDetail.opacity);
    const accent = ACCENTS[spec.tier].replace(/\s/g, '');
    check(
      `${spec.tier}: halo accent`,
      Boolean(haloDetail && haloDetail.background.replace(/\s/g, '').includes(accent)),
      haloDetail && haloDetail.background.slice(0, 90),
    );
    check(
      `${spec.tier}: frame accent`,
      Boolean(ringShadow && ringShadow.replace(/\s/g, '').includes(accent)),
      ringShadow && ringShadow.slice(0, 90),
    );
    check(`${spec.tier}: artwork unchanged`, Boolean(artworkSrc && artworkSrc.endsWith('.webp')), artworkSrc);
    check(`${spec.tier}: no horizontal overflow`, overflow <= 0, overflow);

    fs.writeFileSync(
      path.join(OUT, `${spec.tier}-metrics.json`),
      JSON.stringify({ chipText, chipStyle, headingText, caption, quote, haloDetail, ringShadow, artworkSrc, overflow }, null, 2),
    );
    await tierPage.screenshot({ path: path.join(OUT, `revealed-${spec.tier}-mobile.png`) });
    if (spec.tier === 'flagship') {
      await tierPage.screenshot({ path: path.join(OUT, 'revealed-flagship-mobile-full.png'), fullPage: true });
    }

    await context.close();
  }

  // ---------- 3. Reduced motion ----------
  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
  await reducedPage.evaluate(
    ({ key, revealDate }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({ cardId: 'lucky-golden-pick', quote: 'Reduced motion quote.', revealDate }),
      );
    },
    { key: STORAGE_KEY, revealDate: todayKey() },
  );
  await reducedPage.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
  await reducedPage.locator('h2').first().waitFor({ state: 'visible', timeout: 20000 });
  const reducedHalo = await reducedPage
    .locator('[data-card-halo="flagship"]')
    .first()
    .evaluate(el => window.getComputedStyle(el).opacity);
  check('reduced motion: halo visible without a fade', Number(reducedHalo) > 0.9, reducedHalo);
  await reducedPage.screenshot({ path: path.join(OUT, 'revealed-flagship-reduced-motion.png') });
  await reduced.close();

  await browser.close();

  check('no console or page errors', consoleErrors.length === 0, consoleErrors.slice(0, 5));

  const failed = results.filter(result => !result.pass);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ results, failed: failed.length }, null, 2));
  for (const result of results) {
    console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name} -> ${JSON.stringify(result.detail)}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('PROBE ERROR', error);
  process.exit(2);
});
