import { test, expect } from '@playwright/test';
import { GREETINGS } from '../../app/crystal-ball-client/greetings';
import { expectRecognizedCrystalBallGreeting } from './crystal-ball-greeting-assertions';

const GREETING_STORAGE_KEY = 'luckyPickCanada:crystalBallGreeting:v1';

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
  const quietGreeting = await expectRecognizedCrystalBallGreeting(page, greetingText);
  if (quietGreeting) {
    expect(first).toBe(quietGreeting);
  } else {
    expect(GREETINGS.some((greeting) => first.includes(greeting))).toBe(true);
    expect(first).toMatch(/^(Good morning\.|Good afternoon\.|Good evening\.|Still up, eh\?) /);
  }

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
  const secondQuietGreeting = await expectRecognizedCrystalBallGreeting(page, greetingText);
  if (secondQuietGreeting) {
    expect(second).toBe(secondQuietGreeting);
  } else {
    expect(GREETINGS.some((greeting) => second.includes(greeting))).toBe(true);
  }

  const storedIndex = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw).index;
    } catch {
      return null;
    }
  }, GREETING_STORAGE_KEY);
  expect(storedIndex).not.toBe(0);

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
  await expectRecognizedCrystalBallGreeting(page, greeting.locator('.sr-only'));
});
