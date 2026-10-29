import { test, expect } from '@playwright/test';

const TURNSTILE_PRELOAD_SELECTOR =
  'head link[rel="preload"][as="script"][href^="https://challenges.cloudflare.com/turnstile/v0/api.js"]';

test('does not preload the Turnstile API on initial page documents', async ({ page }) => {
  // The mobile PageSpeed optimization intentionally removed the eager preload
  // so the third-party script does not compete with critical homepage resources.
  // The Turnstile wrapper remains responsible for loading the script when needed.
  // This test checks resource hints only; it does not modify Turnstile validation.
  for (const route of ['/', '/about', '/map']) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator(TURNSTILE_PRELOAD_SELECTOR)).toHaveCount(0);
  }
});
