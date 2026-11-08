import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
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

  it('has no public preview switch or payment-bypass helper', () => {
    expect(
      existsSync(join(process.cwd(), 'app/test-tools/reveal-testing/revealTestConfig.js'))
    ).toBe(false);

    const modalSource = readFileSync(join(process.cwd(), 'app/checkout-modal.jsx'), 'utf8');
    const homepageSource = readFileSync(join(process.cwd(), 'app/homepage/HomePage.js'), 'utf8');

    // The temporary public preview and every helper that could launch a reveal
    // without a paid checkout session are gone from the purchase surfaces.
    expect(modalSource).not.toContain('canPreviewReveal');
    expect(modalSource).not.toContain('onPreviewReveal');
    expect(modalSource).not.toContain('Preview Reveal');
    expect(homepageSource).not.toContain('onPreviewReveal');
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

describe('Reveal paywall boundaries', () => {
  const modalSource = readFileSync(join(process.cwd(), 'app/checkout-modal.jsx'), 'utf8');

  it('keeps the paid form as the only way to start a reveal', () => {
    expect(modalSource).toContain('action="/api/checkout"');
    expect(modalSource).not.toContain('/api/send-gift');
    expect(modalSource).not.toContain("fetch('/api/checkout'");
    expect(modalSource).not.toContain('noValidate');
  });

  it('renders no free preview control or preview styling hook', () => {
    expect(modalSource).not.toMatch(/checkout-modal-preview/);
    expect(modalSource).not.toMatch(/Preview Reveal/);
    expect(modalSource).not.toMatch(/type="button"[^>]*Preview/);
  });

  it('removes the gift email test page and its public route', () => {
    expect(existsSync(join(process.cwd(), 'app/test-tools/gift-email/page.js'))).toBe(false);
    expect(
      existsSync(join(process.cwd(), 'app/test-tools/gift-email/giftEmailTestConfig.js'))
    ).toBe(false);
    expect(existsSync(join(process.cwd(), 'app/api/test-tools/gift-email/route.js'))).toBe(false);
  });
});

describe('Unified Lucky Reveal purchase options', () => {
  const checkoutSource = readFileSync(join(process.cwd(), 'app/api/checkout/route.js'), 'utf8');
  const homepageSource = readFileSync(join(process.cwd(), 'app/homepage/HomePage.js'), 'utf8');
  const modalSource = readFileSync(join(process.cwd(), 'app/checkout-modal.jsx'), 'utf8');

  it('uses the official one-time prices for both purchase options', () => {
    expect(checkoutSource).toMatch(/lucky_pick: \{[\s\S]*?unitAmount: 100,/);
    expect(checkoutSource).toMatch(/gift_package: \{[\s\S]*?unitAmount: 199,/);
  });

  it('keeps both purchase callbacks intact', () => {
    expect(checkoutSource).toContain('/?payment=success&session_id={CHECKOUT_SESSION_ID}');
    expect(checkoutSource).toContain('/api/gift-delivery?session_id={CHECKOUT_SESSION_ID}');
  });

  it('labels the two options consistently', () => {
    // Stripe Checkout uses the official product names; the website keeps the Lucky Reveal presentation.
    expect(checkoutSource).toContain("name: 'Lucky Pick'");
    expect(checkoutSource).toContain("name: 'Lucky Pick Gift'");
    expect(modalSource).toContain("title: 'Lucky Reveal'");
    expect(modalSource).toContain("title: 'Lucky Reveal Gift Edition'");
    expect(modalSource).toContain("label: 'Personal Reveal — CAD $1.00'");
    expect(modalSource).toContain("label: 'Gift Reveal — CAD $1.99'");
    expect(homepageSource).toContain('Choose Your Reveal');
    expect(homepageSource).toContain('no email delivery');
  });

  it('states that only the standard option skips email delivery', () => {
    expect(checkoutSource).toMatch(/lucky_pick: \{[\s\S]*?No email delivery/);
    expect(modalSource).toMatch(/lucky_pick: \{[\s\S]*?No email delivery/);
  });

  it('requires recipient details only for the Gift Edition', () => {
    expect(checkoutSource).toContain("if (checkoutType === 'gift_package') {");
    expect(modalSource).toContain("checkoutType === 'gift_package' &&");
  });

  it('does not send email from the standard checkout path', () => {
    const standardOption = checkoutSource.match(/lucky_pick: \{[\s\S]*?\},/)?.[0] || '';
    expect(standardOption).not.toMatch(/resend|send-gift|gift-delivery|recipientEmail/i);
  });
});

describe('Verify-session route module', () => {
  it('keeps exactly one route module for the endpoint', () => {
    expect(existsSync(join(process.cwd(), 'app/api/verify-session/route.ts'))).toBe(true);
    // A second empty route.js beside route.ts is an unresolved duplicate that can shadow the real
    // handler; it was a 0-byte tracked placeholder and must not come back.
    expect(existsSync(join(process.cwd(), 'app/api/verify-session/route.js'))).toBe(false);
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


describe('Unified Lucky Reveal homepage card', () => {
  const homepageSource = readFileSync(join(process.cwd(), 'app/homepage/HomePage.js'), 'utf8');
  const modalSource = readFileSync(join(process.cwd(), 'app/checkout-modal.jsx'), 'utf8');
  const revealSection = homepageSource.slice(
    homepageSource.indexOf('id="personalized"'),
    homepageSource.indexOf('<LuckyRevealsCounter'),
  );

  it('replaces the two purchase cards with one Lucky Reveals card', () => {
    expect(revealSection.match(/<article/g)).toHaveLength(1);
    expect(revealSection.match(/homepage-offer-featured/g)).toHaveLength(1);
    expect(revealSection.match(/Choose Your Reveal/g)).toHaveLength(1);
    expect(homepageSource).not.toContain('Gift the Gift Edition');
    expect(homepageSource).not.toContain('Choose Lucky Reveal<');
  });

  it('moves both delivery choices into the one selection popup', () => {
    expect(homepageSource).toContain("setCheckoutType('lucky_reveal')");
    expect(modalSource).toContain("type === 'lucky_reveal'");
    expect(modalSource).toContain("value: 'lucky_pick'");
    expect(modalSource).toContain("value: 'gift_package'");
    expect(modalSource).toContain('name="deliveryType"');
    // The paid form still posts the existing checkout types the API handles.
    expect(modalSource).toContain('<input type="hidden" name="checkoutType" value={checkoutType} />');
  });

  it('renders the paid-reveal counter directly below the reveal section and collects nothing', () => {
    const revealIndex = homepageSource.indexOf('id="personalized"');
    const counterIndex = homepageSource.indexOf('<LuckyRevealsCounter');
    const tipIndex = homepageSource.indexOf('id="tip-jar-section"');

    expect(revealIndex).toBeGreaterThan(-1);
    expect(counterIndex).toBeGreaterThan(revealIndex);
    expect(counterIndex).toBeLessThan(tipIndex);
    // No map UI, geolocation, IP lookup, province detection or location storage was added.
    expect(homepageSource).not.toMatch(/geolocation|geoip|ipapi|ip-api|province/i);
    expect(homepageSource).not.toContain('homepage-map-slot');
  });
});
