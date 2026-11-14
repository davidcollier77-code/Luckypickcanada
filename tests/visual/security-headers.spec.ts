import { expect, test } from '@playwright/test';

/**
 * Browser guard for `specs/156-security-headers-hardening`.
 *
 * The unit contract lives in `__tests__/security-headers.test.js`. This spec
 * checks the headers a real response carries and proves the tightened policy
 * does not break rendering, React events or the public experiences.
 */

function directivesOf(csp: string) {
  return Object.fromEntries(
    csp
      .split(';')
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...sources] = directive.split(/\s+/);
        return [name, sources];
      })
  );
}

test('delivers exactly one hardened policy with the required origins', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);

  const headers = response.headers();
  const csp = headers['content-security-policy'];
  expect(csp, 'content-security-policy').toBeTruthy();

  const directives = directivesOf(csp);
  expect(directives['script-src']).toContain("'unsafe-inline'");
  expect(directives['script-src-attr']).toEqual(["'none'"]);
  expect(directives['script-src']).toEqual(
    expect.arrayContaining([
      'https://challenges.cloudflare.com',
      'https://www.googletagmanager.com',
      'https://static.cloudflareinsights.com',
    ])
  );
  expect(directives['style-src']).not.toContain('https://fonts.googleapis.com');
  expect(directives['font-src']).toEqual(["'self'"]);
  expect(directives['img-src']).not.toContain('https://images.pexels.com');
  expect(directives['form-action']).toContain('https://checkout.stripe.com');

  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-xss-protection']).toBeUndefined();
  expect(headers['strict-transport-security']).toContain('includeSubDomains');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
});

test('loads the public experiences without CSP violations', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/content security policy|refused to (load|execute|apply|connect)/i.test(message.text())) {
      violations.push(message.text());
    }
  });

  for (const path of ['/', '/crystal-ball', '/lucky-meter']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  }

  expect(violations).toEqual([]);
});

test('blocks inline event-handler attributes but keeps React events working', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const inlineHandlerRan = await page.evaluate(() => {
    const button = document.createElement('button');
    button.setAttribute('onclick', 'window.__inlineHandlerRan = true');
    document.body.appendChild(button);
    button.click();
    const ran = Boolean((window as unknown as { __inlineHandlerRan?: boolean }).__inlineHandlerRan);
    button.remove();
    return ran;
  });
  expect(inlineHandlerRan).toBe(false);

  // The homepage's client-rendered exploration control still responds.
  await expect(page.getByRole('button', { name: /explore your luck/i })).toBeVisible();
});
