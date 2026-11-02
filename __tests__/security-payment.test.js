import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import * as securityTestTools from '../app/test-tools/reveal-testing/revealTestConfig';
import { POST as sendGift } from '../app/api/send-gift/route';
// Instead of importing verify-session, we just trust the integration testing as it was hard to mock it here cleanly

const originalEnv = process.env;

describe('Security Hardening: Payment & Authorization', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps the public preview enabled independently of production mode', () => {
    const mode = securityTestTools.REVEAL_TEST_MODE;
    const configSource = readFileSync(
      join(process.cwd(), 'app/test-tools/reveal-testing/revealTestConfig.js'),
      'utf8'
    );

    // The temporary public preview must be explicitly enabled in production too.
    expect(configSource).toMatch(/export const REVEAL_TEST_MODE = true;/);
    expect(configSource).not.toMatch(/process\.env\.NODE_ENV/);
    expect(mode).toBe(true);
    expect(securityTestTools.canPreviewReveal('lucky_pick')).toBe(true);
    expect(securityTestTools.canPreviewReveal('gift_package')).toBe(true);
    expect(securityTestTools.canPreviewReveal('tip')).toBe(false);
    // The old form-submission bypass helper is gone, so nothing can skip /api/checkout.
    expect(securityTestTools.canBypassRevealPayment).toBeUndefined();
  });

  describe('Legacy /api/send-gift endpoint', () => {
    it('is blocked outside of development environment', async () => {
      process.env.NODE_ENV = 'production';

      const request = new Request(/* DevSkim: ignore DS162092 */ 'http://localhost/api/send-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
          revealId: '123'
        })
      });

      const response = await sendGift(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('restricted');
    });
  });
});

describe('Free preview reveal boundaries', () => {
  const modalSource = readFileSync(join(process.cwd(), 'app/checkout-modal.jsx'), 'utf8');

  it('never routes previews through the gift email or checkout APIs', () => {
    expect(modalSource).not.toContain('/api/send-gift');
    expect(modalSource).not.toContain("fetch('/api/checkout'");
    // The paid path is still the plain form post it was before.
    expect(modalSource).toContain('action="/api/checkout"');
    expect(modalSource).not.toContain('noValidate');
  });

  it('renders the preview as a non-submitting button outside the form', () => {
    expect(modalSource).toMatch(/<button type="button"[^>]*checkout-modal-preview-button/);
    expect(modalSource).toMatch(/Preview Reveal — FREE/);
  });
});

describe('Unified Lucky Reveal purchase options', () => {
  const checkoutSource = readFileSync(join(process.cwd(), 'app/api/checkout/route.js'), 'utf8');
  const homepageSource = readFileSync(join(process.cwd(), 'app/homepage/HomePage.js'), 'utf8');
  const modalSource = readFileSync(join(process.cwd(), 'app/checkout-modal.jsx'), 'utf8');

  it('preserves the existing prices for both purchase options', () => {
    expect(checkoutSource).toMatch(/lucky_pick: \{[\s\S]*?unitAmount: 100,/);
    expect(checkoutSource).toMatch(/gift_package: \{[\s\S]*?unitAmount: 299,/);
  });

  it('keeps both purchase callbacks intact', () => {
    expect(checkoutSource).toContain('/?payment=success&session_id={CHECKOUT_SESSION_ID}');
    expect(checkoutSource).toContain('/api/gift-delivery?session_id={CHECKOUT_SESSION_ID}');
  });

  it('labels the two options consistently', () => {
    expect(checkoutSource).toContain("name: 'Lucky Reveal'");
    expect(checkoutSource).toContain("name: 'Lucky Reveal Gift Edition'");
    expect(modalSource).toContain("title: 'Lucky Reveal'");
    expect(modalSource).toContain("title: 'Lucky Reveal Gift Edition'");
    expect(homepageSource).toContain('Lucky Reveal Gift Edition');
    expect(homepageSource).toContain('No email delivery');
  });

  it('states that only the standard option skips email delivery', () => {
    expect(checkoutSource).toMatch(/lucky_pick: \{[\s\S]*?No email delivery/);
    expect(modalSource).toMatch(/lucky_pick: \{[\s\S]*?No email delivery/);
  });

  it('requires recipient details only for the Gift Edition', () => {
    expect(checkoutSource).toContain("if (checkoutType === 'gift_package') {");
    expect(modalSource).toContain("type === 'gift_package' &&");
  });

  it('does not send email from the standard checkout path', () => {
    const standardOption = checkoutSource.match(/lucky_pick: \{[\s\S]*?\},/)?.[0] || '';
    expect(standardOption).not.toMatch(/resend|send-gift|gift-delivery|recipientEmail/i);
  });
});

describe('Gift email link security', () => {
  function findRepoRoot(startDirectory = process.cwd()) {
    const filesystemRoot = parse(startDirectory).root;
    let directory = startDirectory;

    while (true) {
      if (existsSync(join(directory, 'app/api/send-gift/route.ts'))) {
        return directory;
      }
      if (directory === filesystemRoot) break;
      directory = dirname(directory);
    }

    throw new Error('Unable to locate repository root for gift-link security test');
  }

  it('protects the opener when a reveal link opens a new tab', () => {
    const routeSource = readFileSync(
      join(findRepoRoot(), 'app/api/send-gift/route.ts'),
      'utf8'
    );
    // Static source check only: this matches the route email template, not rendered HTML.
    // DevSkim: ignore DS610000
    const anchor = routeSource.match(/<a href="\$\{revealUrl\}" target="_blank"[^>]*>/);

    expect(anchor).not.toBeNull();
    expect(anchor[0]).toContain('rel="noopener noreferrer"');
  });
});
