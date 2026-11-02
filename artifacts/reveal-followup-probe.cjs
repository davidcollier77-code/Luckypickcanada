/**
 * Browser evidence for the Lucky Reveal follow-ups (specs/078).
 *
 * Covers desktop and mobile, the 6 Pick and 7 Pick reveals, the settled pile, the
 * homepage-matched glass panel, reduced motion, and one-tap close before and after
 * scrolling.
 *
 * Usage: eval "$(scripts/setup-chromium-libs.sh --env)"; node artifacts/reveal-followup-probe.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'reveal-followup');
const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:3000';
const results = {};

function record(name, value) {
  results[name] = value;
  console.log(`${name}: ${JSON.stringify(value)}`);
}

async function openReveal(page, label, { picks = '6', delivery = 'personal' } = {}) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Choose a Lucky Pick/i }).first().click();
  if (picks === '7') {
    await page.getByRole('radio', { name: /7 Pick/i }).first().check();
  }
  if (delivery === 'gift') {
    await page.getByRole('radio', { name: /Gift Reveal/i }).first().check();
  }
  const preview = page.getByRole('button', { name: /Preview Reveal/i }).first();
  await preview.waitFor({ state: 'visible', timeout: 20000 });
  await preview.click();

  const dialog = page.locator('[role="dialog"][aria-labelledby="lucky-reveal-title"]');
  await dialog.waitFor({ state: 'visible', timeout: 20000 });
  return dialog;
}

async function hitTest(page, label) {
  const close = page.locator('button[aria-label="Close lucky reveal"]');
  const box = await close.boundingBox();
  const probes = await page.evaluate((b) => {
    const points = {
      topEdge: { x: b.x + b.width / 2, y: b.y + 5 },
      centre: { x: b.x + b.width / 2, y: b.y + b.height / 2 },
      lower: { x: b.x + b.width / 2, y: b.y + b.height - 5 },
    };
    const out = {};
    for (const [key, p] of Object.entries(points)) {
      const el = document.elementFromPoint(p.x, p.y);
      out[key] = {
        tag: el?.tagName,
        text: (el?.textContent || '').trim().slice(0, 20),
        isCloseTarget: Boolean(el?.closest('button[aria-label="Close lucky reveal"]')),
      };
    }
    return out;
  }, box);
  record(`${label}.closeBox`, { width: box.width, height: box.height });
  record(`${label}.hitTest`, probes);
}

async function layoutReport(page, label) {
  const info = await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"][aria-labelledby="lucky-reveal-title"]');
    const sectionStyle = getComputedStyle(panel);
    const scroller = panel.querySelector('.lucky-reveal-scroll') || panel;
    const layer = document.querySelector('.lucky-celebration');
    const celebrationZ = layer ? Number(getComputedStyle(layer).zIndex) : null;
    const panelZ = Number(sectionStyle.zIndex);
    const paintedAbove = celebrationZ !== null && celebrationZ > panelZ;

    const leaves = Array.from(document.querySelectorAll('.lucky-settled-leaf')).map((leaf) => {
      const r = leaf.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
    });
    const targets = Array.from(panel.querySelectorAll('.lucky-reveal-number, p, h2, h3, button, a')).map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, text: (el.textContent || '').trim().slice(0, 22), top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });

    // Only a leaf that paints above the panel can cover content; a leaf behind the
    // glass cannot, so geometric overlap alone is not reported as a defect.
    const overlaps = [];
    if (paintedAbove) {
      for (const leaf of leaves) {
        for (const target of targets) {
          if (leaf.bottom > target.top && leaf.top < target.bottom) {
            overlaps.push({ leaf: `${leaf.left}-${leaf.right}@${leaf.top}`, target: `${target.tag}:${target.text}` });
          }
        }
      }
    }

    return {
      panel: {
        background: sectionStyle.backgroundImage,
        backdropFilter: sectionStyle.backdropFilter || sectionStyle.webkitBackdropFilter,
        overflow: sectionStyle.overflow,
        scrollBody: getComputedStyle(scroller).overflowY,
        scrollHeight: scroller.scrollHeight,
        clientHeight: scroller.clientHeight,
      },
      panelZ,
      celebrationZ,
      paintedAbovePanel: paintedAbove,
      leafCount: leaves.length,
      leafLayers: Array.from(new Set(Array.from(document.querySelectorAll('.lucky-settled-leaf')).map((l) => getComputedStyle(l).zIndex))),
      canvasCount: document.querySelectorAll('body > canvas').length,
      overlaps,
    };
  });
  record(`${label}.layout`, info);
  return info;
}

async function shareReport(page, dialog, label, logoRequests) {
  await dialog.getByRole('button', { name: /Share My Reveal/i }).click();
  const preview = page.locator('img[alt*="reveal image"]');
  await preview.waitFor({ state: 'visible', timeout: 30000 });
  const img = await preview.evaluate((el) => ({ width: el.naturalWidth, height: el.naturalHeight, src: el.src.slice(0, 30) }));
  record(`${label}.sharePreview`, img);
  record(`${label}.logoRequests`, logoRequests);
  await page.screenshot({ path: path.join(OUT, `${label}-share-sheet.png`) });
  await page.getByRole('button', { name: /Close sharing options/i }).click();
  await page.waitForTimeout(300);
}

async function clickCentre(page, dialog, label, phase) {
  const close = dialog.locator('button[aria-label="Close lucky reveal"]');
  const box = await close.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(700);
  const closed = (await dialog.count()) === 0;
  record(`${label}.click-${phase}-closed`, closed);
  return closed;
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--force-color-profile=srgb', '--font-render-hinting=none'],
  });

  const viewports = {
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  };

  for (const [label, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      hasTouch: label === 'mobile',
      isMobile: label === 'mobile',
    });
    const page = await context.newPage();
    const logoRequests = [];
    page.on('request', (request) => {
      if (/lucky-reveal-logo|BackgroundEraser/.test(request.url())) {
        logoRequests.push(request.url().split('/').pop());
      }
    });
    page.on('pageerror', (error) => console.log(`[pageerror] ${error.message.slice(0, 200)}`));

    let dialog = await openReveal(page, label);
    await page.waitForTimeout(6500); // celebration starts after the final number
    await hitTest(page, label);
    await layoutReport(page, label);
    await page.screenshot({ path: path.join(OUT, `${label}-reveal.png`) });
    await shareReport(page, dialog, label, logoRequests);

    const closedBeforeScroll = await clickCentre(page, dialog, label, 'beforeScroll');
    record(`${label}.closedBeforeScroll`, closedBeforeScroll);

    // After scrolling the body, the X must still be reachable and close in one click.
    dialog = await openReveal(page, label);
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const panel = document.querySelector('[role="dialog"][aria-labelledby="lucky-reveal-title"]');
      const scroller = panel.querySelector('.lucky-reveal-scroll') || panel;
      scroller.scrollTop = scroller.scrollHeight;
    });
    await page.waitForTimeout(400);
    record(
      `${label}.closeAfterScroll`,
      await page.evaluate(() => {
        const btn = document.querySelector('button[aria-label="Close lucky reveal"]');
        const r = btn.getBoundingClientRect();
        const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          inViewport: r.top >= 0 && r.bottom <= window.innerHeight,
          hit: Boolean(el?.closest('button[aria-label="Close lucky reveal"]')),
          top: Math.round(r.top),
        };
      }),
    );
    record(`${label}.closedAfterScroll`, await clickCentre(page, dialog, label, 'afterScroll'));

    // Escape still closes.
    dialog = await openReveal(page, label);
    await page.waitForTimeout(900);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    record(`${label}.escapeClosed`, (await dialog.count()) === 0);

    // Seven-Pick reveal, settled pile screenshot.
    dialog = await openReveal(page, label, { picks: '7' });
    await page.waitForTimeout(9500);
    const sevenInfo = await layoutReport(page, `${label}.seven`);
    record(`${label}.seven.numbers`, await page.locator('.lucky-reveal-number').allInnerTexts());
    await page.screenshot({ path: path.join(OUT, `${label}-seven-settled.png`) });
    record(`${label}.seven.closed`, await clickCentre(page, dialog, label, 'seven'));
    record(`${label}.seven.leafCount`, sevenInfo.leafCount);

    // Gift reveal: the same shared popup reached through the Gift delivery option.
    dialog = await openReveal(page, label, { delivery: 'gift' });
    await page.waitForTimeout(6500);
    await layoutReport(page, `${label}.gift`);
    record(`${label}.gift.heading`, await dialog.locator('#lucky-reveal-title').innerText());
    record(`${label}.gift.closed`, await clickCentre(page, dialog, label, 'gift'));
    await page.screenshot({ path: path.join(OUT, `${label}-gift.png`) });

    await context.close();
  }

  // Reduced motion: static pile, no burst, no canvas, still closable.
  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const reducedPage = await reduced.newPage();
  const reducedDialog = await openReveal(reducedPage, 'reduced');
  await reducedPage.waitForTimeout(6000);
  await layoutReport(reducedPage, 'reduced');
  await reducedPage.screenshot({ path: path.join(OUT, 'reduced-reveal.png') });
  record('reduced.closed', await clickCentre(reducedPage, reducedDialog, 'reduced', 'static'));
  await reduced.close();

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved ${path.join(OUT, 'results.json')}`);
}

run().catch((error) => {
  console.error('PROBE FAILED', error);
  process.exit(1);
});
