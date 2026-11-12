import { expect, type Locator, type Page } from '@playwright/test';
import { GREETINGS, getQuietGreeting } from '../../app/crystal-ball-client/greetings';

/**
 * Accept the current production greeting pool and the deliberately quiet
 * commemorative-day greetings. Resolve the date in the browser because that
 * is the visitor-local calendar used by the Crystal Ball.
 */
export async function expectRecognizedCrystalBallGreeting(page: Page, greetingText: Locator) {
  const dateKey = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const quietGreeting = getQuietGreeting(dateKey);

  await expect
    .poll(
      async () => {
        const text = ((await greetingText.textContent()) || '').trim();
        return GREETINGS.some((greeting) => text.includes(greeting)) || Boolean(quietGreeting && text === quietGreeting);
      },
      { timeout: 10_000 },
    )
    .toBe(true);

  return quietGreeting;
}
