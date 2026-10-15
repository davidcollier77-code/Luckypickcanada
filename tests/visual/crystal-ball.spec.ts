import { test, expect } from '@playwright/test';

test('Crystal Ball artwork and inner glow keep their geometry across responsive viewports', async ({ page }) => {
  await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const artwork = page.locator('svg[aria-label*="ruby maple leaf"]');
  await expect(artwork).toBeVisible({ timeout: 10_000 });
  await expect(artwork.locator('title')).toHaveText('Lucky Pick Canada Crystal Ball');

  const metrics = await page.evaluate(() => {
    const svg = document.querySelector('svg[aria-label*="ruby maple leaf"]') as SVGSVGElement | null;
    const wrapper = svg?.parentElement;
    const glow = wrapper?.querySelector('[class*="ballInnerGlow"]') as HTMLElement | null;

    if (!svg || !wrapper || !glow) return null;

    const imageBox = svg.getBoundingClientRect();
    const wrapperBox = wrapper.getBoundingClientRect();
    const glowBox = glow.getBoundingClientRect();

    return {
      viewBox: svg.getAttribute('viewBox'),
      hasMapleLeaf: Boolean(svg.querySelector('path[fill="url(#ruby)"]')),
      hasEmeraldClover: Boolean(svg.querySelector('linearGradient#emerald')),
      hasSapphire: Boolean(svg.querySelector('linearGradient#sapphire')),
      hasGoldPedestal: Boolean(svg.querySelector('linearGradient#goldMetal')),
      imageRatio: imageBox.width / imageBox.height,
      wrapperTop: wrapperBox.top,
      wrapperHeight: wrapperBox.height,
      glowTop: glowBox.top,
      glowLeft: glowBox.left,
      glowWidth: glowBox.width,
      glowHeight: glowBox.height,

    };
  });

  expect(metrics).not.toBeNull();
  if (!metrics) throw new Error('Crystal Ball artwork or glow element is missing.');

  expect(metrics.viewBox).toBe('0 0 500 650');
  expect(metrics.imageRatio).toBeCloseTo(500 / 650, 2);
  expect(metrics.hasMapleLeaf).toBe(true);
  expect(metrics.hasEmeraldClover).toBe(true);
  expect(metrics.hasSapphire).toBe(true);
  expect(metrics.hasGoldPedestal).toBe(true);
  expect(Math.abs(metrics.glowWidth - metrics.glowHeight)).toBeLessThanOrEqual(1);

  const glowCenterY = metrics.glowTop + metrics.glowHeight / 2;
  const expectedGlowCenterY = metrics.wrapperTop + metrics.wrapperHeight * 0.36;
  expect(Math.abs(glowCenterY - expectedGlowCenterY)).toBeLessThanOrEqual(1.5);


  await expect(page.getByText('LUCKYPICKCANADA.CA', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Your question for the crystal ball' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Luck Meter' })).toBeVisible();
});
