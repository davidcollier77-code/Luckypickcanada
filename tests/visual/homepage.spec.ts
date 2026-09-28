import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let seed = 0x6c75636b;

    Math.random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    const frozenNow = Date.UTC(2026, 8, 28, 0, 0, 0);
    Date.now = () => frozenNow;
  });

  await page.route('**/api/visits', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ visits: 12345 }),
    });
  });
});

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
