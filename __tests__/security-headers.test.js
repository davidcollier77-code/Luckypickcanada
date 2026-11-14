import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config.mjs';

/**
 * Contract guard for `specs/156-security-headers-hardening`.
 *
 * The rendered browser behaviour is exercised separately by
 * `tests/visual/security-headers.spec.ts`; this test locks the configured
 * header values so a directive cannot be weakened or an unused origin
 * reintroduced without review.
 */

const SECURITY_HEADERS_SOURCE = '/((?!api|_next).*)';

async function pageHeaders() {
  const routes = await nextConfig.headers();
  const route = routes.find((entry) => entry.source === SECURITY_HEADERS_SOURCE);
  expect(route, 'security header route').toBeDefined();
  return route.headers;
}

function headerValue(headers, key) {
  return headers.find((header) => header.key === key)?.value;
}

function directivesOf(csp) {
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

describe('content security policy', () => {
  it('keeps the Next.js inline-script allowance and refuses inline event handlers', async () => {
    const csp = headerValue(await pageHeaders(), 'Content-Security-Policy');
    expect(csp).toBeDefined();
    const directives = directivesOf(csp);

    // Next.js emits inline bootstrap/flight scripts; no nonce flow is proven here.
    expect(directives['script-src']).toContain("'unsafe-inline'");
    expect(directives['script-src']).toContain("'self'");
    // React uses delegated events, never inline handler attributes.
    expect(directives['script-src-attr']).toEqual(["'none'"]);
  });

  it('keeps every required integration origin', async () => {
    const csp = headerValue(await pageHeaders(), 'Content-Security-Policy');
    const directives = directivesOf(csp);

    expect(directives['script-src']).toEqual(
      expect.arrayContaining([
        'https://challenges.cloudflare.com',
        'https://www.googletagmanager.com',
        'https://static.cloudflareinsights.com',
      ])
    );
    expect(directives['connect-src']).toEqual(
      expect.arrayContaining([
        'https://challenges.cloudflare.com',
        'https://www.google-analytics.com',
        'https://region1.google-analytics.com',
      ])
    );
    expect(directives['frame-src']).toContain('https://challenges.cloudflare.com');
    expect(directives['img-src']).toContain('https://www.google-analytics.com');
    // The checkout form posts to /api/checkout, which redirects to Stripe.
    expect(directives['form-action']).toEqual(['\'self\'', 'https://checkout.stripe.com']);
  });

  it('drops origins the site no longer uses', async () => {
    const csp = headerValue(await pageHeaders(), 'Content-Security-Policy');
    const directives = directivesOf(csp);

    // Fonts are self-hosted by the application's font pipeline.
    expect(directives['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directives['style-src']).not.toContain('https://fonts.googleapis.com');
    expect(directives['font-src']).toEqual(["'self'"]);
    expect(directives['font-src']).not.toContain('https://fonts.gstatic.com');
    // No current source or rendered page references Pexels.
    expect(directives['img-src']).not.toContain('https://images.pexels.com');
  });

  it('keeps the existing structural restrictions', async () => {
    const csp = headerValue(await pageHeaders(), 'Content-Security-Policy');
    const directives = directivesOf(csp);

    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
    expect(directives['frame-ancestors']).toEqual(["'self'"]);
    expect(directives['media-src']).toEqual(["'self'", 'data:']);
    expect(directives['img-src']).toEqual(expect.arrayContaining(["'self'", 'data:', 'blob:']));
    expect(csp).not.toContain('*');
  });
});

describe('remaining security headers', () => {
  it('uses the strict cross-origin referrer policy', async () => {
    expect(headerValue(await pageHeaders(), 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('no longer sends the obsolete X-XSS-Protection header', async () => {
    expect(headerValue(await pageHeaders(), 'X-XSS-Protection')).toBeUndefined();
  });

  it('preserves HSTS, MIME, framing, permissions and opener protections', async () => {
    const headers = await pageHeaders();

    expect(headerValue(headers, 'Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains'
    );
    expect(headerValue(headers, 'X-Content-Type-Options')).toBe('nosniff');
    expect(headerValue(headers, 'X-Frame-Options')).toBe('SAMEORIGIN');
    expect(headerValue(headers, 'Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    expect(headerValue(headers, 'Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('does not duplicate a security header', async () => {
    const headers = await pageHeaders();
    const names = headers.map((header) => header.key.toLowerCase());
    for (const name of ['content-security-policy', 'referrer-policy', 'strict-transport-security']) {
      expect(names.filter((candidate) => candidate === name)).toHaveLength(1);
    }
  });
});
