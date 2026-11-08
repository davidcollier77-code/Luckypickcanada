/**
 * Browser measurement harness for the mobile-usability and accessibility work
 * areas (audit findings D3, D4, D5, D8 from PR #1773).
 *
 *   node artifacts/a11y-mobile-20261108/measure.mjs out.json [baseUrl]
 *   DESKTOP=1 node artifacts/a11y-mobile-20261108/measure.mjs desktop.json [baseUrl]
 *
 * Every reported number is measured from the rendered page; nothing is inferred.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const outFile = process.argv[2] || 'measurements.json';
const baseUrl = process.argv[3] || 'http://127.0.0.1:3000';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = process.env.DESKTOP === '1';
const VIEWPORT = DESKTOP ? { width: 1440, height: 900 } : MOBILE;
const ROUTES = ['/', '/reveal', '/crystal-ball', '/map', '/about', '/lucky-meter'];

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  isMobile: !DESKTOP,
  hasTouch: !DESKTOP,
  colorScheme: 'dark',
  locale: 'en-CA',
});

const page = await context.newPage();
const results = { baseUrl, viewport: VIEWPORT, generatedAt: new Date().toISOString(), routes: {} };

for (const route of ROUTES) {
  const response = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Let hydrated content and fallback fonts settle without waiting for network idle.
  await page.waitForTimeout(2500);

  results.routes[route] = await page.evaluate(() => {
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05;
    };

    const directText = (el) => Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
      .join(' ')
      .trim();

    const textSamples = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el)) continue;
      const text = directText(el);
      if (!text) continue;
      textSamples.push({
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === 'string' ? el.className.slice(0, 90) : '',
        fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
        text: text.slice(0, 60),
        hiddenFromAssistiveTech: el.closest('[aria-hidden="true"]') !== null,
        inFooter: Boolean(el.closest('footer')),
        inHeader: Boolean(el.closest('header')),
      });
    }
    const sizes = textSamples.map((s) => s.fontSize).sort((a, b) => a - b);

    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => ({
      level: Number(h.tagName.slice(1)),
      text: (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
      renderedWidth: Math.round(h.getBoundingClientRect().width * 10) / 10,
    }));
    const navs = Array.from(document.querySelectorAll('nav')).map((n) => ({
      label: n.getAttribute('aria-label'),
      links: n.querySelectorAll('a,button').length,
    }));

    return {
      mainCount: document.querySelectorAll('main').length,
      mainIds: Array.from(document.querySelectorAll('main')).map((m) => m.id || null),
      headings,
      headingOrder: headings.map((h) => h.level).join(','),
      navs,
      skipLink: Array.from(document.querySelectorAll('a'))
        .filter((a) => /skip/i.test(a.textContent || ''))
        .map((a) => a.getAttribute('href')),
      overflow: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      font: {
        min: sizes[0] ?? null,
        median: sizes.length ? sizes[Math.floor(sizes.length / 2)] : null,
        under12: textSamples
          .filter((s) => s.fontSize < 12)
          .map((s) => ({ fontSize: s.fontSize, tag: s.tag, className: s.className, text: s.text, hiddenFromAssistiveTech: s.hiddenFromAssistiveTech, inFooter: s.inFooter })),
      },
    };
  });

  results.routes[route].status = response ? response.status() : null;
}

await page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);

/**
 * Effective clickable extent: walks outward from the control centre until
 * elementFromPoint stops resolving inside the control. Generated (::before/
 * ::after) hit areas count, so this reports what a finger actually hits.
 */
const tapProbe = await page.evaluate(() => {
  // `html { scroll-behavior: smooth }` makes scrollIntoView asynchronous, which
  // would probe an element that is still off-screen. Scroll instantly instead.
  const scrollInstant = (el) => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const rect = el.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2, behavior: 'instant' });
    document.documentElement.style.scrollBehavior = previous;
  };

  const span = (el) => {
    const r = el.getBoundingClientRect();
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const inside = (x, y) => {
      const hit = document.elementFromPoint(x, y);
      return Boolean(hit && (hit === el || el.contains(hit)));
    };
    const walk = (dx, dy) => {
      let n = 0;
      while (n < 80) {
        const x = cx + dx * (n + 1);
        const y = cy + dy * (n + 1);
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) break;
        if (!inside(x, y)) break;
        n += 1;
      }
      return n;
    };
    const up = walk(0, -1);
    const down = walk(0, 1);
    const left = walk(-1, 0);
    const right = walk(1, 0);
    return {
      width: left + right + 1,
      height: up + down + 1,
      box: { left: cx - left, right: cx + right, top: cy - up, bottom: cy + down },
    };
  };

  const measured = (label, selector, limit = 3) => Array.from(document.querySelectorAll(selector))
    .filter((el) => el.getBoundingClientRect().width > 0)
    .slice(0, limit)
    .map((el) => {
      scrollInstant(el);
      const r = el.getBoundingClientRect();
      const hit = span(el);
      return {
        label,
        tag: el.tagName.toLowerCase(),
        className: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        rect: { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 },
        hitArea: { width: hit.width, height: hit.height },
        hitBox: hit.box,
      };
    });

  const targets = [
    ...measured('homepage header link', '.homepage-main-nav a', 4),
    ...measured('footer nav link', 'footer nav[aria-label="Footer navigation"] a', 3),
    ...measured('footer social link', 'footer nav[aria-label="Social links"] a', 3),
    ...measured('footer legal link', 'footer nav[aria-label="Legal links"] a', 2),
  ];

  const overlaps = [];
  for (let i = 0; i < targets.length; i += 1) {
    for (let j = i + 1; j < targets.length; j += 1) {
      const a = targets[i].hitBox;
      const b = targets[j].hitBox;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 0 && h > 0) {
        overlaps.push({ a: `${targets[i].label}: ${targets[i].text.slice(0, 24)}`, b: `${targets[j].label}: ${targets[j].text.slice(0, 24)}`, overlapPx: { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 } });
      }
    }
  }

  return { targets, overlaps };
});
results.tapTargets = tapProbe.targets;
results.tapOverlaps = tapProbe.overlaps;

// Map province markers need the map data rendered before measuring.
await page.goto(baseUrl + '/map', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
results.mapMarkers = await page.evaluate(() => {
  const scrollInstant = (el) => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const rect = el.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2, behavior: 'instant' });
    document.documentElement.style.scrollBehavior = previous;
  };

  let marker = document.querySelector('.province-marker');
  let injected = false;
  if (!marker) {
    // The local workspace has no story database, so the map renders its empty
    // state and no marker buttons. Inject one button with the production class
    // name into the map surface so the authored CSS can still be measured. This
    // is recorded as injected and does not change any page file.
    const artwork = document.querySelector('.official-map-artwork') || document.body;
    const probe = document.createElement('button');
    probe.type = 'button';
    probe.className = 'province-marker has-stories';
    probe.setAttribute('aria-label', 'Measurement probe: 1 lucky story');
    probe.textContent = 'ON';
    probe.style.left = '50%';
    probe.style.top = '50%';
    artwork.appendChild(probe);
    marker = probe;
    injected = true;
  }
  const markers = injected ? [marker] : Array.from(document.querySelectorAll('.province-marker'));
  scrollInstant(marker);
  const r = marker.getBoundingClientRect();
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const inside = (x, y) => {
    const hit = document.elementFromPoint(x, y);
    return Boolean(hit && (hit === marker || marker.contains(hit)));
  };
  const walk = (dx, dy) => {
    let n = 0;
    while (n < 80) {
      if (!inside(cx + dx * (n + 1), cy + dy * (n + 1))) break;
      n += 1;
    }
    return n;
  };
  const overlaps = [];
  for (let i = 0; i < markers.length; i += 1) {
    for (let j = i + 1; j < markers.length; j += 1) {
      const a = markers[i].getBoundingClientRect();
      const b = markers[j].getBoundingClientRect();
      const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
      const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < (a.width + b.width) / 2) {
        overlaps.push({
          a: markers[i].getAttribute('aria-label'),
          b: markers[j].getAttribute('aria-label'),
          centreDistance: Math.round(dist * 10) / 10,
          visibleRadiusSum: Math.round((a.width + b.width) / 2 * 10) / 10,
        });
      }
    }
  }
  return {
    count: markers.length,
    injected,
    rect: { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 },
    hitArea: { width: walk(-1, 0) + walk(1, 0) + 1, height: walk(0, -1) + walk(0, 1) + 1 },
    overlaps,
  };
});

// Keyboard focus walk on /map: tab through the page and record visible focus.
await page.evaluate(() => document.activeElement && document.activeElement.blur());
const focusWalk = [];
for (let i = 0; i < 45; i += 1) {
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const style = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      className: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
      href: el.getAttribute('href'),
      inFooter: Boolean(el.closest('footer')),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });
  if (focused) focusWalk.push(focused);
}
results.focusWalkMap = focusWalk;

// Skip-link activation: first Tab must land on a visible skip link, Enter must
// move focus to the page's main content landmark.
await page.goto(baseUrl + '/map', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
await page.evaluate(() => document.activeElement && document.activeElement.blur());
await page.keyboard.press('Tab');
// The skip link slides in with a 160 ms transform transition; wait for it to
// finish before judging whether it is on screen.
await page.waitForTimeout(400);
const skipBefore = await page.evaluate(() => {
  const el = document.activeElement;
  const r = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return {
    tag: el.tagName.toLowerCase(),
    text: (el.textContent || '').trim(),
    href: el.getAttribute('href'),
    onScreen: r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0 && r.height > 0,
    rect: { top: Math.round(r.top), height: Math.round(r.height) },
    outlineStyle: style.outlineStyle,
  };
});
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
const skipAfter = await page.evaluate(() => {
  const el = document.activeElement;
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    isMain: el.tagName.toLowerCase() === 'main',
    scrollY: Math.round(window.scrollY),
  };
});
results.skipLink = { before: skipBefore, afterEnter: skipAfter };

writeFileSync(outFile, JSON.stringify(results, null, 2));
console.log(`wrote ${outFile}`);

await browser.close();
