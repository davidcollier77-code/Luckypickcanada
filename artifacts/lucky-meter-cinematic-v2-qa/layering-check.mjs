import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [label, width, height] of [['390', 390, 844], ['412', 412, 915], ['1440', 1440, 900]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('http://127.0.0.1:3000/lucky-meter', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const result = await page.evaluate(() => {
    const near = document.querySelector('[data-testid="lucky-meter-ornaments-near"]');
    const far = document.querySelector('[data-testid="lucky-meter-ornaments-far"]');
    const heading = document.querySelector('h1');
    const z = (el) => (el ? getComputedStyle(el).zIndex : null);
    // Walk up from the heading to the nearest element that establishes stacking.
    let node = heading; let stack = null;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      if (cs.zIndex !== 'auto' && cs.position !== 'static') { stack = { tag: node.tagName, cls: node.className, z: cs.zIndex }; break; }
      node = node.parentElement;
    }
    return {
      nearMounted: Boolean(near), farMounted: Boolean(far),
      farZ: z(far), nearZ: z(near),
      headingStack: stack,
      headingText: heading?.textContent?.trim().slice(0, 40) ?? null,
    };
  });
  console.log(label, JSON.stringify(result));
  await page.close();
}
await browser.close();
