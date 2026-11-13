import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

const STORAGE_KEY = 'luckyPickCanada:crystalBallDailyFortune:v1';
const FALLBACK_HISTORY_KEY =
  'luckyPickCanada:crystalBallFallbackFortune:v1';

const FOLLOW_UP_UNAVAILABLE_MESSAGE = [
  "🔮 The Crystal Ball has been hit hard with fortunes and questions today. I've used up my magical energy and need a little rest.",
  '',
  'Come back tomorrow for your follow-up question.',
  '',
  'Until then, keep that Canadian spirit shining! 🇨🇦✨',
].join('\n');

test('a fallback daily fortune still arrives and a failed follow-up shows the exact notice', async ({
  page,
}) => {
  const fortune = 'A warm fallback fortune is waiting by the water.';
  const question = 'Should I take the scenic route?';
  let fortuneRequests = 0;
  let followUpRequests = 0;

  await page.route('**/api/oracle', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;

    if (body.mode === 'follow-up') {
      followUpRequests += 1;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: FOLLOW_UP_UNAVAILABLE_MESSAGE,
          unavailable: true,
        }),
      });
      return;
    }

    fortuneRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reading: fortune,
        source: 'fallback',
        fortuneId: 'seasonal-autumn-03',
      }),
    });
  });

  await page.goto('/crystal-ball');

  await page.getByRole('button', { name: /Generate My Fortune/i }).click();
  await expect(page.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(fortune, {
    timeout: 15000,
  });
  await expect(
    page.getByText('Curious about your fortune? Ask the Crystal Ball one follow-up question.'),
  ).toBeVisible({ timeout: 15000 });

  // The fallback history stores exactly two fields: the ID and the local date.
  const fallbackHistory = await page.evaluate((key) => {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  }, FALLBACK_HISTORY_KEY);
  expect(Object.keys(fallbackHistory).sort()).toEqual(['date', 'id']);
  expect(fallbackHistory.id).toBe('seasonal-autumn-03');
  expect(fallbackHistory.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await page.getByRole('button', { name: /Ask a Follow-up Question/i }).click();
  const followUpInput = page.getByRole('textbox', { name: 'Your follow-up question' });
  await followUpInput.fill(question);
  await page.getByRole('button', { name: /Ask the Crystal Ball/i }).click();

  const followUpRegion = page.getByRole('region', {
    name: 'Ask a follow-up question',
  });
  const alert = followUpRegion.getByRole('alert');
  await expect(alert).toBeVisible({ timeout: 10000 });
  expect(await alert.textContent()).toBe(FOLLOW_UP_UNAVAILABLE_MESSAGE);
  await expect(page.getByTestId('crystal-ball-followup-answer')).toHaveCount(0);
  await expect(followUpInput).toBeDisabled();
  await expect(
    page.getByRole('button', { name: /Ask the Crystal Ball/i }),
  ).toBeDisabled();
  expect(followUpRequests).toBe(1);

  const saved = await page.evaluate((key) => {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  }, STORAGE_KEY);
  expect(saved.followUpUsed).toBe(true);
  expect(saved).not.toHaveProperty('followUpQuestion');
  expect(saved).not.toHaveProperty('followUpAnswer');

  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  expect(raw).not.toContain(question);
  expect(raw).not.toContain('magical energy');

  // The daily fortune survives a refresh, while the question and notice do not.
  await page.reload();
  await expect(page.locator('div[class*="fortunePanel"] .sr-only')).toHaveText(fortune);
  const restoredRegion = page.getByRole('region', {
    name: 'Ask a follow-up question',
  });
  await expect(restoredRegion.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByTestId('crystal-ball-followup-answer')).toHaveCount(0);
  await expect(page.getByText(/You’ve used today’s follow-up question/)).toBeVisible();
  expect(fortuneRequests).toBe(1);
  expect(followUpRequests).toBe(1);
});
