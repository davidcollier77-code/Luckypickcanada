import { test, expect } from '@playwright/test';

// Verified byte-for-byte against the pinned `@marsidev/react-turnstile@1.6.1`
// loader: `script.src = `${SCRIPT_URL}?onload=${onLoadCallbackName}&render=${render}``
// with `onloadTurnstileCallback` and `explicit` as the defaults.
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';

const TURNSTILE_PRELOAD_SELECTOR =
  'head link[rel="preload"][as="script"][href^="https://challenges.cloudflare.com/turnstile/v0/api.js"]';

test('homepage starts the Turnstile API fetch from the initial document', async ({ page }) => {
  // Resource hints only: this does not execute the API script, create a token,
  // or change Turnstile validation in any way.
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const preload = page.locator(TURNSTILE_PRELOAD_SELECTOR);

  await expect(preload).toHaveCount(1);
  await expect(preload).toHaveAttribute('href', TURNSTILE_SCRIPT_URL);
  // Low priority keeps the third-party script behind the LCP image and the
  // route's own CSS/JS, preserving the mobile PageSpeed work.
  await expect(preload).toHaveAttribute('fetchpriority', 'low');
});

test('other routes do not preload the Turnstile API', async ({ page }) => {
  // The hint is deliberately homepage-scoped so routes without the Suggestion
  // Box never download the third-party script.
  for (const route of ['/about', '/map']) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator(TURNSTILE_PRELOAD_SELECTOR)).toHaveCount(0);
  }
});
