/* Browser probe for the cinematic /reveal Lucky Card enhancement (specs/101). */
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

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass: Boolean(pass), detail });
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

async function seedStoredCard(page, cardId, quote) {
  await page.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ key, cardId: id, quoteText, revealDate }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({ cardId: id, quote: quoteText, revealDate }),
      );
    },
    { key: STORAGE_KEY, cardId, quoteText: quote, revealDate: todayKey() },
  );
  await page.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const consoleErrors = [];

  // ---------- 1. Entry state, back-face finish and the charging aura ----------
  const entryContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
  });
  const entryPage = await entryContext.newPage();
  entryPage.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  entryPage.on('pageerror', error => consoleErrors.push(String(error)));

  await entryPage.goto(`${BASE}/reveal`, { waitUntil: 'domcontentloaded' });
  await entryPage.evaluate(() => window.localStorage.clear());
  await entryPage.reload({ waitUntil: 'domcontentloaded' });

  const button = entryPage.locator('button', { hasText: 'Reveal Today' }).first();
  await button.waitFor({ state: 'visible', timeout: 20000 });
  const exactNameCount = await entryPage
    .getByRole('button', { name: "Reveal Today's Luck", exact: true })
    .count();
  check('entry control unchanged', exactNameCount === 1, exactNameCount);

  const backFinish = await entryPage.locator('[data-card-finish-state="idle"]').first().evaluate(el => {
    const wrapper = el.closest('[aria-hidden="true"]') || el;
    const layers = [...el.querySelectorAll('[data-card-finish-layer]')].map(layer => layer.dataset.cardFinishLayer);
    const gloss = el.querySelector('[data-card-finish-layer="gloss"]');
    const bevel = el.querySelector('[data-card-finish-layer="bevel"]');
    return {
      layers,
      ariaHidden: el.getAttribute('aria-hidden'),
      pointerEvents: window.getComputedStyle(wrapper).pointerEvents,
      glossBackground: gloss ? window.getComputedStyle(gloss).backgroundImage : null,
      bevelShadow: bevel ? window.getComputedStyle(bevel).boxShadow : null,
    };
  });
  check('card back carries the shared finish', backFinish.layers.includes('gloss') && backFinish.layers.includes('specular') && backFinish.layers.includes('bevel'), backFinish.layers);
  check('card back hides the tier outcome', !backFinish.layers.includes('tier-bloom') && !backFinish.layers.includes('glint'), backFinish.layers);
  check('card finish is decorative', backFinish.ariaHidden === 'true' && backFinish.pointerEvents === 'none', backFinish.pointerEvents);
  check('card gloss reads as gloss', Boolean(backFinish.glossBackground && backFinish.glossBackground.includes('linear-gradient')), backFinish.glossBackground && backFinish.glossBackground.slice(0, 70));
  check('card bevel present', Boolean(backFinish.bevelShadow && backFinish.bevelShadow.includes('inset')), backFinish.bevelShadow && backFinish.bevelShadow.slice(0, 70));

  const buttonBox = await button.boundingBox();
  await entryPage.mouse.click(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
  await entryPage.waitForTimeout(900);
  const charge = await entryPage.locator('[data-reveal-charge]').first().evaluate(el => {
    const glow = el.firstElementChild;
    return {
      tier: el.dataset.revealCharge,
      pointerEvents: window.getComputedStyle(el).pointerEvents,
      ariaHidden: el.getAttribute('aria-hidden'),
      background: glow ? window.getComputedStyle(glow).backgroundImage : null,
    };
  }).catch(() => null);
  const chargeAccentMatched = Boolean(
    charge &&
      ACCENTS[charge.tier] &&
      charge.background &&
      charge.background.replace(/\s/g, '').includes(ACCENTS[charge.tier]),
  );
  check('charging aura renders during the draw', Boolean(charge), charge && charge.tier);
  check('charging aura is tier-tinted', chargeAccentMatched, charge && charge.background && charge.background.slice(0, 80));
  check('charging aura is decorative', Boolean(charge && charge.ariaHidden === 'true' && charge.pointerEvents === 'none'), charge && charge.pointerEvents);
  const canvasCount = await entryPage.locator('canvas').count();
  check('beam choreography still runs', canvasCount > 0, canvasCount);
  await entryPage.screenshot({ path: path.join(OUT, 'draw-charging-aura.png') });
  await entryContext.close();

  // ---------- 2. Revealed cinematic stage and two-face finish per tier ----------
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

    await seedStoredCard(tierPage, spec.cardId, 'Probe quote for the revealed presentation.');
    await tierPage.locator('h2').first().waitFor({ state: 'visible', timeout: 20000 });
    // Let the entrance settle so the measurements describe the finished state.
    await tierPage.waitForTimeout(1500);

    const accent = ACCENTS[spec.tier].replace(/\s/g, '');
    const chip = tierPage.locator(`[data-tier="${spec.tier}"]`).last();
    const chipText = (await chip.innerText()).replace(/\s+/g, ' ').trim();
    const headingText = (await tierPage.locator('h2').first().innerText()).trim();
    const caption = (await tierPage.locator('p', { hasText: 'Added to your collection' }).first().innerText()).trim();
    const quote = (await tierPage.locator('p', { hasText: 'Probe quote' }).first().innerText()).trim();
    const artworkSrc = await tierPage.locator(`img[alt="${spec.title}"]`).first().getAttribute('src');
    const overflow = await tierPage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    check(`${spec.tier}: chip label`, chipText.toUpperCase().includes(`${spec.tier.toUpperCase()} TIER`), chipText);
    check(`${spec.tier}: card name`, headingText === spec.title, headingText);
    check(`${spec.tier}: collection caption`, caption.toLowerCase().includes('added to your collection'), caption);
    check(`${spec.tier}: stored quote`, quote.includes('Probe quote'), quote);
    check(`${spec.tier}: artwork unchanged`, Boolean(artworkSrc && artworkSrc.endsWith('.webp')), artworkSrc);
    check(`${spec.tier}: no horizontal overflow`, overflow <= 0, overflow);

    // Finish on both faces.
    const finish = await tierPage.evaluate(() => {
      const finishes = [...document.querySelectorAll('.card-container [data-card-finish]')];
      return finishes.map(el => ({
        state: el.dataset.cardFinishState,
        layers: [...el.querySelectorAll('[data-card-finish-layer]')].map(layer => layer.dataset.cardFinishLayer),
        pointerEvents: window.getComputedStyle(el).pointerEvents,
        ariaHidden: el.getAttribute('aria-hidden'),
      }));
    });
    const back = finish.find(face => face.state === 'idle');
    const front = finish.find(face => face.state === 'revealed');
    check(`${spec.tier}: two finished faces`, finish.length === 2, finish.length);
    check(
      `${spec.tier}: identical base finish on both faces`,
      Boolean(
        back &&
          front &&
          ['gloss', 'specular', 'bevel'].every(layer => back.layers.includes(layer) && front.layers.includes(layer)),
      ),
      { back: back && back.layers, front: front && front.layers },
    );
    check(
      `${spec.tier}: revealed front adds one bloom and one glint`,
      Boolean(front && front.layers.filter(layer => layer === 'tier-bloom').length === 1 && front.layers.filter(layer => layer === 'glint').length === 1),
      front && front.layers,
    );
    check(
      `${spec.tier}: finish is decorative`,
      finish.every(face => face.ariaHidden === 'true' && face.pointerEvents === 'none'),
      finish.map(face => face.pointerEvents),
    );

    // Cinematic stage.
    const stage = await tierPage.locator(`[data-reveal-stage="${spec.tier}"]`).first().evaluate(el => {
      const spotlight = el.querySelector('[data-reveal-spotlight]');
      const shaft = el.querySelector('[data-reveal-shaft]');
      return {
        ariaHidden: el.getAttribute('aria-hidden'),
        pointerEvents: window.getComputedStyle(el).pointerEvents,
        spotlightBackground: spotlight ? window.getComputedStyle(spotlight).backgroundImage : null,
        shaftBackground: shaft ? window.getComputedStyle(shaft).backgroundImage : null,
        shockwaves: el.querySelectorAll('[data-reveal-shockwave]').length,
        embers: el.querySelectorAll('[data-reveal-ember]').length,
        floor: el.querySelectorAll('[data-reveal-floor]').length,
        halos: el.querySelectorAll(`[data-card-halo="${spec.tier}"]`).length,
      };
    });
    check(`${spec.tier}: spotlight renders`, Boolean(stage.spotlightBackground && stage.spotlightBackground.replace(/\s/g, '').includes(accent)), stage.spotlightBackground && stage.spotlightBackground.slice(0, 80));
    check(`${spec.tier}: light shaft renders`, Boolean(stage.shaftBackground && stage.shaftBackground.includes('linear-gradient')), stage.shaftBackground && stage.shaftBackground.slice(0, 60));
    check(`${spec.tier}: two shockwave rings`, stage.shockwaves === 2, stage.shockwaves);
    check(`${spec.tier}: ember field renders`, stage.embers >= 6, stage.embers);
    check(`${spec.tier}: floor shadow renders`, stage.floor === 1, stage.floor);
    check(`${spec.tier}: tier halo still rendered`, stage.halos === 1, stage.halos);
    check(`${spec.tier}: stage is decorative`, stage.ariaHidden === 'true' && stage.pointerEvents === 'none', stage.pointerEvents);

    // Staged arrival has completed: every block is readable again.
    const presentationOpacity = await tierPage.evaluate(() => {
      const block = document.querySelector('[data-tier]');
      const quotePanel = [...document.querySelectorAll('p')].find(p => p.textContent.includes('Probe quote'));
      return {
        block: block ? window.getComputedStyle(block).opacity : null,
        quote: quotePanel ? window.getComputedStyle(quotePanel.parentElement).opacity : null,
        scrollY: window.scrollY,
      };
    });
    check(`${spec.tier}: tier block settled visible`, Number(presentationOpacity.block) > 0.95, presentationOpacity.block);
    check(`${spec.tier}: quote panel settled visible`, Number(presentationOpacity.quote) > 0.95, presentationOpacity.quote);

    fs.writeFileSync(
      path.join(OUT, `${spec.tier}-metrics.json`),
      JSON.stringify({ chipText, headingText, caption, quote, artworkSrc, overflow, finish, stage }, null, 2),
    );
    await tierPage.screenshot({ path: path.join(OUT, `revealed-${spec.tier}-mobile.png`) });
    if (spec.tier === 'flagship') {
      await tierPage.screenshot({ path: path.join(OUT, 'revealed-flagship-mobile-full.png'), fullPage: true });
      const desktop = await browser.newContext({ viewport: { width: 1440, height: 960 }, colorScheme: 'dark' });
      const desktopPage = await desktop.newPage();
      await seedStoredCard(desktopPage, spec.cardId, 'Probe quote for the revealed presentation.');
      await desktopPage.locator('h2').first().waitFor({ state: 'visible', timeout: 20000 });
      await desktopPage.waitForTimeout(1500);
      await desktopPage.screenshot({ path: path.join(OUT, 'revealed-flagship-desktop.png') });
      await desktop.close();
    }
    await context.close();
  }

  // ---------- 3. Coast-to-Coast Tale keeps its authored frame ----------
  const coastContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
  });
  const coastPage = await coastContext.newPage();
  coastPage.on('pageerror', error => consoleErrors.push(`coast: ${String(error)}`));
  await seedStoredCard(coastPage, 'coast-to-coast-tale', 'Coast probe quote.');
  await coastPage.locator('h2').first().waitFor({ state: 'visible', timeout: 20000 });
  await coastPage.waitForTimeout(1500);
  const coast = await coastPage.evaluate(() => {
    const frame = document.querySelector('[data-card-frame]');
    const front = document.querySelector('.card-container [data-card-finish-state="revealed"]');
    const ring = document.querySelector('.card-container [data-tier]');
    return {
      frameKind: frame ? frame.dataset.cardFrame : null,
      borderWidth: frame ? window.getComputedStyle(frame).borderTopWidth : null,
      finishLayers: front ? [...front.querySelectorAll('[data-card-finish-layer]')].map(layer => layer.dataset.cardFinishLayer) : [],
      ringShadow: ring ? window.getComputedStyle(ring).boxShadow.replace(/\s/g, '') : null,
    };
  });
  check('coast: authored frame preserved', coast.frameKind === 'authored' && coast.borderWidth === '0px', { frameKind: coast.frameKind, borderWidth: coast.borderWidth });
  check('coast: shared finish applied', ['gloss', 'specular', 'bevel', 'tier-bloom'].every(layer => coast.finishLayers.includes(layer)), coast.finishLayers);
  check('coast: tier ring applied', Boolean(coast.ringShadow && coast.ringShadow.includes(ACCENTS.premium.replace(/\s/g, ''))), coast.ringShadow && coast.ringShadow.slice(0, 80));
  const coastOverflow = await coastPage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check('coast: no horizontal overflow', coastOverflow <= 0, coastOverflow);
  await coastPage.screenshot({ path: path.join(OUT, 'revealed-coast-to-coast-mobile.png') });
  await coastContext.close();

  // ---------- 4. Reduced motion ----------
  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const reducedPage = await reduced.newPage();
  reducedPage.on('pageerror', error => consoleErrors.push(`reduced: ${String(error)}`));
  await seedStoredCard(reducedPage, 'flagship-card', 'Reduced motion quote.');
  await reducedPage.locator('h2').first().waitFor({ state: 'visible', timeout: 20000 });
  await reducedPage.waitForTimeout(400);
  const reducedState = await reducedPage.evaluate(() => {
    const stage = document.querySelector('[data-reveal-stage]');
    const spotlight = stage && stage.querySelector('[data-reveal-spotlight]');
    const halo = document.querySelector('[data-card-halo]');
    const front = document.querySelector('.card-container [data-card-finish-state="revealed"]');
    const block = document.querySelector('[data-tier]');
    return {
      shockwaves: stage ? stage.querySelectorAll('[data-reveal-shockwave]').length : null,
      embers: stage ? stage.querySelectorAll('[data-reveal-ember]').length : null,
      glints: front ? front.querySelectorAll('[data-card-finish-layer="glint"]').length : null,
      spotlight: spotlight ? window.getComputedStyle(spotlight).opacity : null,
      halo: halo ? window.getComputedStyle(halo).opacity : null,
      block: block ? window.getComputedStyle(block).opacity : null,
      shockwaveFade: stage ? window.getComputedStyle(stage.firstElementChild).transitionDuration : null,
    };
  });
  check('reduced motion: no shockwave mounted', reducedState.shockwaves === 0, reducedState.shockwaves);
  check('reduced motion: no embers mounted', reducedState.embers === 0, reducedState.embers);
  check('reduced motion: no glint sweep mounted', reducedState.glints === 0, reducedState.glints);
  check('reduced motion: spotlight static and visible', Number(reducedState.spotlight) > 0.9, reducedState.spotlight);
  check('reduced motion: halo static and visible', Number(reducedState.halo) > 0.9, reducedState.halo);
  check('reduced motion: presentation immediately readable', Number(reducedState.block) > 0.95, reducedState.block);
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
