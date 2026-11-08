/**
 * Province-marker interaction + geometry probe for /map.
 *
 * No database is contacted: the /api/lucky-stories response is intercepted and
 * answered with a local fixture that has the same shape the server returns, so
 * the real client component renders all 13 markers.
 *
 * For every marker it records what a pointer actually hits at the marker centre
 * (coordinate click) and, separately, whether the React handler works when the
 * button is clicked directly (DOM click). That separates hit-testing failures
 * from event-handling failures.
 */
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:3000';
const CODES = ['YT', 'NT', 'NU', 'BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'PE', 'NS', 'NL'];
const NAMES = {
  YT: 'Yukon', NT: 'Northwest Territories', NU: 'Nunavut', BC: 'British Columbia',
  AB: 'Alberta', SK: 'Saskatchewan', MB: 'Manitoba', ON: 'Ontario', QC: 'Quebec',
  NB: 'New Brunswick', PE: 'Prince Edward Island', NS: 'Nova Scotia', NL: 'Newfoundland and Labrador',
};

const stories = CODES.map((code, index) => ({
  id: String(index + 1),
  firstName: `Tester${code}`,
  province: code,
  provinceName: NAMES[code],
  preview: `Preview for ${NAMES[code]}.`,
  story: `Full story for ${NAMES[code]}.`,
  createdAt: new Date(Date.now() - index * 3_600_000).toISOString(),
  reactionCount: 0,
}));

const mapData = {
  stories,
  provinceCounts: Object.fromEntries(CODES.map((code) => [code, 1])),
  totalStories: stories.length,
  provincesWithStories: CODES.length,
  isConfigured: true,
};

const read = (page) => page.evaluate(() => ({
  pressed: [...document.querySelectorAll('.province-marker')]
    .filter((m) => m.getAttribute('aria-pressed') === 'true')
    .map((m) => m.dataset.province),
  panel: document.querySelector('.map-story-panel p')?.textContent?.trim() ?? '',
}));

const only = (process.argv[3] || '').split(',').filter(Boolean);

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'intermediate-1024', width: 1024, height: 900 },
  { name: 'intermediate-768', width: 768, height: 900 },
  { name: 'breakpoint-621', width: 621, height: 900 },
  { name: 'breakpoint-620', width: 620, height: 900 },
  { name: 'breakpoint-619', width: 619, height: 900 },
  { name: 'mobile-412', width: 412, height: 915 },
  { name: 'mobile-390', width: 390, height: 844 },
];

const browser = await chromium.launch();
const out = { base, console: [], viewports: {} };

for (const viewport of viewports.filter((entry) => !only.length || only.includes(entry.name))) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  if (viewport.name === 'desktop-1440') {
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') out.console.push(`${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => out.console.push(`pageerror: ${err.message}`));
  }
  await page.route('**/api/lucky-stories*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mapData) });
  });

  await page.goto(`${base}/map`, { waitUntil: 'domcontentloaded' });
  // Instant scrolling only: the page's smooth scroll makes Playwright wait for
  // animation frames between every marker click without affecting geometry.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  await page.waitForFunction(() => document.querySelectorAll('.province-marker').length >= 13, null, { timeout: 45_000 });
  await page.waitForTimeout(500);

  const artwork = page.locator('.official-map-artwork');
  await artwork.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);

  const geometry = await page.evaluate(() => [...document.querySelectorAll('.province-marker')].map((m) => {
    const rect = m.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      code: m.dataset.province,
      size: Math.round(rect.width * 10) / 10,
      centre: [Math.round(cx), Math.round(cy)],
      centreHits: hit ? (hit.closest('.province-marker')?.dataset.province ?? 'non-marker') : 'none',
      centreHitsSelf: hit ? hit.closest('.province-marker') === m : false,
    };
  }));

  const pairs = [];
  for (let i = 0; i < geometry.length; i += 1) {
    for (let j = i + 1; j < geometry.length; j += 1) {
      const a = geometry[i];
      const b = geometry[j];
      const distance = Math.round(Math.hypot(a.centre[0] - b.centre[0], a.centre[1] - b.centre[1]) * 10) / 10;
      if (distance < Math.max(a.size, b.size)) pairs.push({ pair: `${a.code}/${b.code}`, distance, size: a.size });
    }
  }

  await artwork.screenshot({ path: `artifacts/map-marker-fix/${viewport.name}.png` });

  const initial = await read(page);
  const clicks = [];
  for (const code of CODES) {
    const marker = page.locator(`.province-marker[data-province="${code}"]`);
    await marker.scrollIntoViewIfNeeded();
    const box = await marker.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const targeted = await page.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el ? (el.closest('.province-marker')?.dataset.province ?? 'non-marker') : 'none';
    }, [cx, cy]);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(150);
    const afterPointer = await read(page);
    await page.evaluate((c) => {
      document.querySelector(`.province-marker[data-province="${c}"]`).click();
    }, code);
    await page.waitForTimeout(150);
    const afterHandler = await read(page);
    clicks.push({
      clicked: code,
      pointerTargets: targeted,
      pointerPressed: afterPointer.pressed,
      pointerOk: afterPointer.pressed.length === 1 && afterPointer.pressed[0] === code,
      handlerPressed: afterHandler.pressed,
      handlerOk: afterHandler.pressed.length === 1 && afterHandler.pressed[0] === code,
      panel: afterHandler.panel,
    });
  }

  // Keyboard activation of one marker, exercising the native button semantics.
  await page.locator('.province-marker[data-province="BC"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const keyboard = await read(page);

  out.viewports[viewport.name] = {
    count: geometry.length,
    initial,
    geometry,
    pairs,
    clicks,
    keyboardBC: keyboard.pressed,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  };
  await context.close();
}

await browser.close();
out.consoleErrors = out.console.filter((line) => !line.includes('Download the React DevTools'));
console.log(JSON.stringify(out, null, 2));
