import { test, expect } from '@playwright/test';

const GREETING_STORAGE_KEY = 'luckyPickCanada:crystalBallGreeting:v1';
const APPROVED_GREETINGS = [
  "Well, look who's feeling lucky today.",
  "Let's see what the universe has up its sleeve, eh?",
  "I've been waiting for you. Not that I'm keeping track or anything.",
  'Pull up a chair, friend — the mists kept the good seat warm for you.',
];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

test('the daily greeting is stable for the day and never repeats the previous day', async ({ page }) => {
  await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const greetingText = page.getByTestId('crystal-ball-greeting').locator('.sr-only');

  const readGreeting = async () => {
    await expect
      .poll(async () => ((await greetingText.textContent()) || '').trim().length, { timeout: 10_000 })
      .toBeGreaterThan(10);
    return ((await greetingText.textContent()) || '').trim();
  };

  const first = await readGreeting();
  expect(APPROVED_GREETINGS).toContain(first);

  // A refresh keeps the same greeting for the rest of the local day.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(greetingText).toHaveText(first);

  // A record from yesterday is never selected again today.
  await page.evaluate(
    ({ key, stored }) => window.localStorage.setItem(key, stored),
    {
      key: GREETING_STORAGE_KEY,
      stored: JSON.stringify({
        date: localDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        index: 0,
      }),
    },
  );

  await page.reload({ waitUntil: 'domcontentloaded' });
  const second = await readGreeting();
  expect(APPROVED_GREETINGS).toContain(second);
  expect(second).not.toBe(APPROVED_GREETINGS[0]);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(greetingText).toHaveText(second);
});

test('the greeting types out with the golden maple-leaf cursor', async ({ page }) => {
  await page.goto('/crystal-ball', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const greeting = page.getByTestId('crystal-ball-greeting');
  await expect(greeting.locator('[class*="goldenLeafCursor"]').first()).toBeVisible({
    timeout: 10_000,
  });

  const cursor = greeting.locator('[class*="goldenLeafCursor"] img');
  await expect(cursor).toHaveAttribute('src', '/assets/golden-maple-leaf.svg');
  await expect(greeting.locator('.sr-only')).toHaveText(
    /Well, look who's|Let's see what the universe|I've been waiting for you|Pull up a chair/,
    { timeout: 10_000 },
  );
});
