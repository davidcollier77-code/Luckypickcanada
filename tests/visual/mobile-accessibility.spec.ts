import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/reveal', '/crystal-ball', '/map', '/about', '/lucky-meter'];

test('all audited routes render one main landmark and uniquely named navigation regions', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('main#main-content')).toHaveCount(1);
    const labels = await page.locator('nav').evaluateAll((navs) =>
      navs.map((nav) => nav.getAttribute('aria-label')?.trim() ?? ''),
    );
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  }
});

test('Lucky Meter begins with an H1 in the rendered heading sequence', async ({ page }) => {
  await page.goto('/lucky-meter', { waitUntil: 'domcontentloaded' });
  const firstLevel = await page.locator('h1,h2,h3,h4,h5,h6').first().evaluate((heading) =>
    Number(heading.tagName.slice(1)),
  );
  expect(firstLevel).toBe(1);
});

test('skip link is keyboard-visible and moves focus to the shared main landmark', async ({ page }) => {
  await page.goto('/map', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Tab');
  const skipLink = page.locator('a.skip-link');
  await expect(skipLink).toBeFocused();

  /** Reports whether the focused link has finished sliding into the viewport. */
  const isSettledOnScreen = () => skipLink.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight &&
      style.visibility !== 'hidden' && style.display !== 'none';
  });

  // The link moves with a 160 ms focus transition, so wait for the settled
  // position instead of sampling a mid-animation frame. The assertion itself is
  // unchanged: the link must end up fully inside the viewport and visible.
  await expect.poll(isSettledOnScreen, { timeout: 3_000, intervals: [50, 100] }).toBe(true);
  expect(await isSettledOnScreen()).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();
});

test('footer and homepage navigation targets stay at least 24px and do not overlap', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const footer = await page.locator('footer nav a').evaluateAll((anchors) =>
    anchors.map((anchor) => {
      const rect = anchor.getBoundingClientRect();
      const before = getComputedStyle(anchor, '::before');
      return {
        width: rect.width,
        height: rect.height,
        inset: [before.top, before.right, before.bottom, before.left],
        box: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
      };
    }),
  );
  expect(footer.length).toBeGreaterThan(0);
  for (const target of footer) {
    expect(target.width).toBeGreaterThanOrEqual(24);
    expect(target.height).toBeGreaterThanOrEqual(24);
    expect(target.inset).toEqual(['0px', '0px', '0px', '0px']);
  }
  for (let i = 0; i < footer.length; i += 1) {
    for (let j = i + 1; j < footer.length; j += 1) {
      const a = footer[i].box;
      const b = footer[j].box;
      const overlaps = Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
        Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
      expect(overlaps).toBe(false);
    }
  }
  if ((page.viewportSize()?.width ?? 0) <= 620) {
    const header = await page.locator('.homepage-main-nav a').evaluateAll((anchors) =>
      anchors.map((anchor) => {
        const rect = anchor.getBoundingClientRect();
        const before = getComputedStyle(anchor, '::before');
        return { width: rect.width, height: rect.height, inset: [before.top, before.right, before.bottom, before.left] };
      }),
    );
    expect(header.length).toBeGreaterThan(0);
    for (const target of header) {
      expect(target.width).toBeGreaterThanOrEqual(24);
      expect(target.height).toBeGreaterThanOrEqual(24);
      expect(target.inset).toEqual(['0px', '0px', '0px', '0px']);
    }
  }
});

test('mobile audited routes expose no visible reading text below 12px', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 620, 'Mobile caption floor only.');
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const undersized = await page.evaluate(() => {
      const results = [];
      for (const element of document.querySelectorAll('body *')) {
        if (element.closest('[aria-hidden="true"], .sr-only')) continue;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden' ||
            Number(style.opacity) <= 0.05) continue;
        const directText = Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .filter(Boolean)
          .join(' ');
        const fontSize = Number.parseFloat(style.fontSize);
        if (directText && fontSize < 12) results.push({ fontSize, tag: element.tagName.toLowerCase(), text: directText.slice(0, 60) });
      }
      return results;
    });
    expect(undersized, 'Visible text below 12px on ' + route + ': ' + JSON.stringify(undersized)).toEqual([]);
  }
});

test('keyboard focus walk visits each map control once and every visited control has a visible ring', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('/map', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  const seen = new Set();
  let visited = 0;
  for (let i = 0; i < 100; i += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const candidates = Array.from(document.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ));
      const index = candidates.indexOf(element);
      if (index < 0) return null;
      const style = getComputedStyle(element);
      return {
        index,
        visibleRing: style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    if (!focused || seen.has(focused.index)) break;
    seen.add(focused.index);
    visited += 1;
    expect(focused.visibleRing, 'Focus stop ' + focused.index + ' has no visible ring (' +
      focused.outlineStyle + ' ' + focused.outlineWidth + ')').toBe(true);
  }
  expect(visited).toBeGreaterThan(0);
});
