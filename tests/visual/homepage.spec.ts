import { test, expect } from '@playwright/test';

test.describe("Homepage Visual", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let seed = 0x6c75636b;

      Math.random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
      };

      const frozenNow = Date.UTC(2026, 8, 28, 0, 0, 0);
      let timeOffset = 0;

      // Allow tests to predictably advance time for visual verification
      (window as any).__advanceTime = (ms: number) => {
        timeOffset += ms;
      };

      Date.now = () => frozenNow + timeOffset;
    });

    await page.route('**/api/visits', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ visits: 12345 }),
      });
    });
  });

  // Deterministic inputs keep the rendered homepage stable so visual diffs represent real regressions.
  test('homepage viewport matches the approved visual baseline', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('canvas.homepage-star-canvas')).toBeVisible({ timeout: 10_000 });

    await page.waitForLoadState('load', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_000);

    await expect(page).toHaveScreenshot('homepage-viewport.png', {
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.003,
    });
  });
  test('ambient stars twinkle over time', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await expect(page.locator('canvas.homepage-star-canvas')).toBeVisible({ timeout: 10_000 });

    // Ensure initial render is stable
    await page.waitForTimeout(1_000);

    const canvas = page.locator('canvas.homepage-star-canvas');

    // Take screenshot at t=0
    const snapshot1 = await canvas.screenshot();

    // Advance time by 500ms (1/2 second should noticeably change the sin wave for twinkling stars)
    await page.evaluate(() => {
      (window as any).__advanceTime(500);
    });

    await page.waitForTimeout(500); // give the animation loop a chance to run

    const snapshot2 = await canvas.screenshot();

    // The two screenshots should be different, proving stars are twinkling.
    // If they are exactly the same, twinkling is broken or not perceptible.
    expect(snapshot1).not.toEqual(snapshot2);
  });
});
