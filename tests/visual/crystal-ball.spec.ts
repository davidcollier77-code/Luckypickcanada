import { test, expect } from '@playwright/test';

test('Crystal Ball artwork and inner glow keep their geometry across responsive viewports', async ({ page }) => {
  await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const artwork = page.locator('picture img[alt="Canadian magical crystal ball on a pedestal"]');
  await expect(artwork).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => artwork.evaluate((element) => {
    const image = element as HTMLImageElement;
    return image.complete && image.naturalWidth === 716 && image.naturalHeight === 895;
  })).toBe(true);

  const metrics = await page.evaluate(() => {
    const image = document.querySelector('picture img[alt="Canadian magical crystal ball on a pedestal"]') as HTMLImageElement | null;
    const picture = image?.closest('picture');
    const wrapper = picture?.parentElement;
    const glow = wrapper?.querySelector('[class*="ballInnerGlow"]') as HTMLElement | null;

    if (!image || !picture || !wrapper || !glow) return null;

    const imageBox = image.getBoundingClientRect();
    const wrapperBox = wrapper.getBoundingClientRect();
    const glowBox = glow.getBoundingClientRect();

    return {
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      imageRatio: imageBox.width / imageBox.height,
      wrapperTop: wrapperBox.top,
      wrapperHeight: wrapperBox.height,
      glowTop: glowBox.top,
      glowLeft: glowBox.left,
      glowWidth: glowBox.width,
      glowHeight: glowBox.height,
      sources: Array.from(picture.querySelectorAll('source')).map((source) => ({
        type: source.type,
        srcSet: source.srcset,
      })),
      fallbackSrc: image.getAttribute('src'),
    };
  });

  expect(metrics).not.toBeNull();
  if (!metrics) throw new Error('Crystal Ball artwork or glow element is missing.');

  expect(metrics.imageWidth).toBe(716);
  expect(metrics.imageHeight).toBe(895);
  expect(metrics.imageRatio).toBeCloseTo(716 / 895, 2);
  expect(Math.abs(metrics.glowWidth - metrics.glowHeight)).toBeLessThanOrEqual(1);

  const glowCenterY = metrics.glowTop + metrics.glowHeight / 2;
  const expectedGlowCenterY = metrics.wrapperTop + metrics.wrapperHeight * 0.36;
  expect(Math.abs(glowCenterY - expectedGlowCenterY)).toBeLessThanOrEqual(1.5);

  expect(metrics.sources).toEqual([
    { type: 'image/avif', srcSet: '/assets/crystal-ball-pedestal.avif' },
    { type: 'image/webp', srcSet: '/assets/crystal-ball-pedestal.webp' },
  ]);
  expect(metrics.fallbackSrc).toBe('/assets/crystal-ball-pedestal.png');
  await expect(page.getByText('LUCKYPICKCANADA.CA', { exact: true })).toBeVisible();
});
