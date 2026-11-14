import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config.mjs';

/**
 * Source guard for `specs/156-hsts-policy-reconciliation`.
 *
 * Cloudflare terminates TLS and overwrites the origin HSTS header, so the live
 * policy is one year with `includeSubDomains` and no `preload`. The repository
 * declaration must match it, appear exactly once, and never reintroduce a
 * two-year value or a preload directive that no browser can receive.
 */

const PAGE_ROUTE = '/((?!api|_next).*)';
const EXPECTED = 'max-age=31536000; includeSubDomains';

const hstsEntries = async () => {
  const routes = await nextConfig.headers();

  return routes.flatMap((route) =>
    route.headers
      .filter((header) => header.key.toLowerCase() === 'strict-transport-security')
      .map((header) => ({ source: route.source, value: header.value }))
  );
};

describe('HSTS policy', () => {
  it('declares exactly one HSTS policy for the page route', async () => {
    const entries = (await hstsEntries()).filter((entry) => entry.source === PAGE_ROUTE);

    expect(entries).toHaveLength(1);
    expect(entries[0].value).toBe(EXPECTED);
  });

  it('keeps a single HSTS definition across the whole header configuration', async () => {
    expect(await hstsEntries()).toHaveLength(1);
  });

  it('never re-declares a two-year max-age or the preload directive', async () => {
    const entries = await hstsEntries();

    for (const entry of entries) {
      expect(entry.value).not.toContain('preload');
      expect(entry.value).not.toContain('63072000');
    }
  });

  it('keeps a max-age of at least one year so the policy meets the approved target', async () => {
    const entries = await hstsEntries();
    const maxAge = Number(/max-age=(\d+)/.exec(entries[0].value)?.[1]);

    expect(maxAge).toBeGreaterThanOrEqual(31536000);
  });
});
