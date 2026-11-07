import { test, expect } from '@playwright/test';

test('Crystal Ball serves transparent AVIF artwork with WebP and PNG fallbacks at responsive sizes', async ({ page }) => {
  await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const artwork = page.locator('picture img[alt="Canadian crystal ball with a jeweled maple leaf, emerald clover, sapphire pendant, and ornate gold pedestal"]');
  await expect(artwork).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => artwork.evaluate((element) => {
    const image = element as HTMLImageElement;
    return image.complete && (image.naturalWidth === 420 || image.naturalWidth === 716);
  })).toBe(true);

  const metrics = await page.evaluate(() => {
    const image = document.querySelector('picture img[alt="Canadian crystal ball with a jeweled maple leaf, emerald clover, sapphire pendant, and ornate gold pedestal"]') as HTMLImageElement | null;
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
      declaredWidth: image.getAttribute('width'),
      declaredHeight: image.getAttribute('height'),
      imageRatio: imageBox.width / imageBox.height,
      isConnected: image.isConnected,
      sources: Array.from(picture.querySelectorAll('source')).map((source) => ({
        type: source.type,
        srcSet: source.srcset,
      })),
      fallbackSrc: image.getAttribute('src'),
      wrapperTop: wrapperBox.top,
    const src = image.currentSrc;
    return image.complete && /crystal-ball-pedestal(-420w)?\.(avif|webp|png)$/.test(src);
  })).toBe(true);

  const metrics = await page.evaluate(() => {
  expect(metrics).not.toBeNull();
  if (!metrics) throw new Error('Crystal Ball artwork or glow element is missing.');
  expect(metrics.isConnected).toBe(true);
  // Chromium density-corrects naturalWidth for srcset images (it reports the
  // `sizes` slot width), so don't hard-code the candidate widths. Both
  // candidates share the same aspect ratio (~1.222), which is preserved by
  // the density correction at any viewport size.
  expect(metrics.imageWidth).toBeGreaterThan(0);
  expect(metrics.imageHeight / metrics.imageWidth).toBeCloseTo(875 / 716, 1);
  expect(metrics.declaredWidth).toBe('716');
  expect(metrics.declaredHeight).toBe('875');
  expect(metrics.imageRatio).toBeCloseTo(716 / 875, 2);
  expect(metrics.sources).toEqual([
    {
      type: 'image/avif',
      srcSet:
        '/assets/crystal-ball-pedestal-420w.avif 420w, /assets/crystal-ball-pedestal.avif 716w',
    },
    {
      type: 'image/webp',
      srcSet:
        '/assets/crystal-ball-pedestal-420w.webp 420w, /assets/crystal-ball-pedestal.webp 716w',
    },
  ]);
  expect(metrics.fallbackSrc).toBe('/assets/crystal-ball-pedestal.png');
  expect(Math.abs(metrics.glowWidth - metrics.glowHeight)).toBeLessThanOrEqual(1);

  const glowCenterY = metrics.glowTop + metrics.glowHeight / 2;
  const expectedGlowCenterY = metrics.wrapperTop + metrics.wrapperHeight * 0.32;
  expect(Math.abs(glowCenterY - expectedGlowCenterY)).toBeLessThanOrEqual(1.5);

  await expect(page.getByText('LUCKYPICKCANADA.CA', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Your question for the crystal ball' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Luck Meter' })).toBeVisible();
});
