import { test, expect } from '@playwright/test';

const REVEAL_ID = 'cs_test_visual_123';
const RECIPIENT = 'friend@example.test';
const SUCCESS_COPY = 'Gift Dispatched Successfully';
const REVEAL_DIALOG = 'section[role="dialog"][aria-labelledby="lucky-reveal-title"]';

test.describe('Gift reveal delivery confirmation gate', () => {
  test('does not show the dispatch confirmation or the pick without a confirmed delivery flag', async ({ page }) => {
    await page.goto(`/reveal/${REVEAL_ID}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await expect(page.getByText('We could not confirm this gift')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(SUCCESS_COPY)).toHaveCount(0);
    await expect(page.locator(REVEAL_DIALOG)).toHaveCount(0);
  });

  test('ignores a spoofed recipientEmail param when delivery is unconfirmed', async ({ page }) => {
    await page.goto(`/reveal/${REVEAL_ID}?recipientEmail=${encodeURIComponent(RECIPIENT)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await expect(page.getByText('We could not confirm this gift')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(SUCCESS_COPY)).toHaveCount(0);
    await expect(page.getByText(RECIPIENT)).toHaveCount(0);
    await expect(page.locator(REVEAL_DIALOG)).toHaveCount(0);
  });

  test('reveals the pick and confirms dispatch once delivery is confirmed', async ({ page }) => {
    await page.goto(`/reveal/${REVEAL_ID}?giftDelivered=1&recipientEmail=${encodeURIComponent(RECIPIENT)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    await expect(page.getByText(SUCCESS_COPY)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(RECIPIENT)).toBeVisible();
    await expect(page.getByText('We could not confirm this gift')).toHaveCount(0);
    await expect(page.locator(REVEAL_DIALOG)).toBeVisible({ timeout: 15_000 });
  });
});