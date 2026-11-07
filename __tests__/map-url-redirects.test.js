import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config.mjs';
import sitemap from '../app/sitemap.js';

const MAP_ALIASES = [
  '/lucky-map-of-canada',
  '/where-luck-has-been-found-in-canada',
];

async function loadRedirects() {
  expect(typeof nextConfig.redirects).toBe('function');
  return nextConfig.redirects();
}

describe('legacy map URL consolidation', () => {
  it('permanently redirects each legacy map URL to the canonical /map URL', async () => {
    const redirects = await loadRedirects();

    for (const source of MAP_ALIASES) {
      const matches = redirects.filter((redirect) => redirect.source === source);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        source,
        destination: '/map',
        permanent: true,
      });
    }
  });

  it('keeps the /stories and www-to-apex redirects unchanged', async () => {
    const redirects = await loadRedirects();

    expect(redirects).toContainEqual({
      source: '/stories',
      destination: '/map',
      permanent: true,
    });

    const hostRedirect = redirects.find((redirect) => Array.isArray(redirect.has));
    expect(hostRedirect).toBeDefined();
    expect(hostRedirect).toEqual({
      source: '/:path*',
      has: [{ type: 'host', value: 'www.luckypickcanada.ca' }],
      destination: 'https://luckypickcanada.ca/:path*',
      permanent: true,
    });
  });

  it('lists /map, not the legacy aliases, in the sitemap', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain('https://luckypickcanada.ca/map');
    for (const alias of MAP_ALIASES) {
      expect(urls).not.toContain(`https://luckypickcanada.ca${alias}`);
    }
  });
});
