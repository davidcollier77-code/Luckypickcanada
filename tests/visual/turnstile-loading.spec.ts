import { test, expect } from '@playwright/test';

const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';

test('preloads the exact Turnstile API script on the homepage and map pages only', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const homepagePreload = page.locator(
    'head link[rel="preload"][as="script"][href^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
  );

  await expect(homepagePreload).toHaveCount(1);
  await expect(homepagePreload).toHaveAttribute('href', TURNSTILE_SCRIPT_URL);

  // The hint is deliberately page-scoped so unrelated routes do not download
  // the Turnstile API when they have no form requiring it.
  await page.goto('/about', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await expect(
    page.locator(
      'head link[rel="preload"][as="script"][href^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    ),
  ).toHaveCount(0);

  await page.goto('/map', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await expect(
    page.locator(
      'head link[rel="preload"][as="script"][href^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    ),
  ).toHaveCount(1);

});
