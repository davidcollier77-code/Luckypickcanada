import { test, expect } from '@playwright/test';

test('Crystal Ball serves transparent AVIF artwork with WebP and PNG fallbacks at responsive sizes', async ({ page }) => {
  await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const artwork = page.locator('picture img[alt="Canadian crystal ball with a jeweled maple leaf, emerald clover, sapphire pendant, and ornate gold pedestal"]');
  await expect(artwork).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => artwork.evaluate((element) => {
    const image = element as HTMLImageElement;
    return image.complete && /crystal-ball-pedestal(-420w)?\.(avif|webp|png)$/.test(image.currentSrc);
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
      currentSrc: image.currentSrc,
      sources: Array.from(picture.querySelectorAll('source')).map((source) => ({
        type: source.type,
        srcSet: source.srcset,
      })),
      fallbackSrc: image.getAttribute('src'),
      fetchPriority: image.getAttribute('fetchpriority'),
      wrapperTop: wrapperBox.top,
      wrapperHeight: wrapperBox.height,
      glowTop: glowBox.top,
      glowWidth: glowBox.width,
      glowHeight: glowBox.height,
    };
  });

  expect(metrics).not.toBeNull();
  if (!metrics) throw new Error('Crystal Ball artwork or glow element is missing.');
  expect(metrics.isConnected).toBe(true);
  // `sizes` resolves to a viewport-dependent slot width (75vw below 560px,
  // 420px above), so Chromium picks the 420w candidate on small screens and the
  // 716w candidate on wide ones. It then reports naturalWidth density-corrected,
  // so the reported width varies with the viewport instead of staying 420 or
  // 716. Both candidates share the same intrinsic aspect ratio, which is the
  // property the layout actually depends on.
  expect(metrics.currentSrc).toMatch(/crystal-ball-pedestal(-420w)?\.(avif|webp|png)$/);
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
  expect(metrics.fetchPriority).toBe('high');

  expect(Math.abs(metrics.glowWidth - metrics.glowHeight)).toBeLessThanOrEqual(1);
  const glowCenterY = metrics.glowTop + metrics.glowHeight / 2;
  const expectedGlowCenterY = metrics.wrapperTop + metrics.wrapperHeight * 0.32;
  expect(Math.abs(glowCenterY - expectedGlowCenterY)).toBeLessThanOrEqual(1.5);

  await expect(page.getByText('LUCKYPICKCANADA.CA', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate My Fortune/i })).toBeVisible();
  const greeting = page.getByTestId('crystal-ball-greeting');
  await expect(greeting).toBeVisible();
  await expect(greeting.locator('.sr-only')).toHaveText(
    /Well, look who's feeling lucky today\.|Let's see what the universe has up its sleeve, eh\?|I've been waiting for you\.|Pull up a chair, friend/,
  );
  // This page also carries its own "Luck Generator" content CTA, so scope the
  // navigation check to the shared footer navigation instead of matching both.
  await expect(
    page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: 'Luck Generator' }),
  ).toBeVisible();
});

test('the greeting sits above the title and the page carries no separate Canadian quote', async ({ page }) => {
  await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const greeting = page.getByTestId('crystal-ball-greeting');
  const title = page.getByRole('heading', { level: 1, name: 'Crystal Ball' });
  await expect(greeting).toBeVisible({ timeout: 10_000 });
  await expect(title).toBeVisible();

  // Read both boxes in one evaluation so a typing re-render cannot detach a
  // handle between two separate Playwright calls.
  const positions = await page.evaluate(() => {
    const greetingElement = document.querySelector('[data-testid="crystal-ball-greeting"]');
    const titleElement = document.querySelector('h1');
    return {
      greetingTop: greetingElement?.getBoundingClientRect().top ?? null,
      titleTop: titleElement?.getBoundingClientRect().top ?? null,
    };
  });
  if (positions.greetingTop === null || positions.titleTop === null) {
    throw new Error('Greeting or title has no layout box.');
  }
  expect(positions.greetingTop).toBeLessThan(positions.titleTop);

  // The Lucky Generator keeps its quote collection; the Crystal Ball must not
  // repeat one of those quotes as a second, competing reading.
  await expect(
    page.getByText('Like the Northern Lights dancing across the sky, your luck is uniquely yours today.'),
  ).toHaveCount(0);
  await expect(page.getByText(/^“.*”$/)).toHaveCount(0);
});
