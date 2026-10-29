import { test, expect } from '@playwright/test';

const TURNSTILE_PRELOAD_SELECTOR =
  'head link[rel="preload"][as="script"][href^="https://challenges.cloudflare.com/turnstile/v0/api.js"]';

test('does not eagerly preload the Turnstile API on initial page documents', async ({ page }) => {
  // The existing PageSpeed plan removes the third-party preload from the
  // critical path. This checks only resource hints, not Turnstile validation.
  for (const route of ['/', '/about', '/map']) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator(TURNSTILE_PRELOAD_SELECTOR)).toHaveCount(0);
  }
});
