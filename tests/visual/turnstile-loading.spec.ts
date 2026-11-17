import { test, expect } from '@playwright/test';

// The Suggestion Box sits far below the fold, so the homepage must not spend the
// visitor's first bandwidth on the Turnstile challenge runtime. The pinned
// `@marsidev/react-turnstile@1.6.1` loader appends this exact URL from a mount
// effect, so nothing is requested until `TurnstileField` mounts the widget as the
// field approaches the viewport.
const TURNSTILE_SCRIPT_PREFIX = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

const TURNSTILE_PRELOAD_SELECTOR =
  'head link[rel="preload"][as="script"][href^="https://challenges.cloudflare.com/turnstile/v0/api.js"]';

test('homepage defers the Turnstile API until the Suggestion Box is approached', async ({ page }) => {
  const turnstileScriptRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(TURNSTILE_SCRIPT_PREFIX)) turnstileScriptRequests.push(request.url());
  });

  await page.goto('/', { waitUntil: 'load', timeout: 30_000 });

  // No resource hint and no script fetch while the visitor is at the top of the page.
  await expect(page.locator(TURNSTILE_PRELOAD_SELECTOR)).toHaveCount(0);
  expect(turnstileScriptRequests).toEqual([]);

  const section = page.locator('#suggestion-box');
  await section.scrollIntoViewIfNeeded();

  // Reaching the form must start the widget, which keeps the security check ahead
  // of any submission: the submit control stays disabled until a token exists.
  // A run without a Turnstile site key renders the existing "not configured"
  // notice instead, so that outcome is accepted rather than waited out.
  await expect
    .poll(
      async () => {
        if (turnstileScriptRequests.length > 0) return 'requested';
        if (await section.getByText(/Spam check is not configured/i).count()) return 'unconfigured';
        return 'pending';
      },
      { timeout: 30_000, message: 'the Turnstile widget never mounted after the Suggestion Box was reached' },
    )
    .not.toBe('pending');
});

test('other routes do not preload the Turnstile API', async ({ page }) => {
  // The hint is gone entirely; routes that never render a protected form must not
  // fetch the third-party script at all.
  for (const route of ['/about', '/map']) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator(TURNSTILE_PRELOAD_SELECTOR)).toHaveCount(0);
  }
});
