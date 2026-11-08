import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import nextConfig from '../next.config.mjs';
import { faqItems } from '../app/homepage/faq-content';

/**
 * Source guard for `specs/115-first-screen-clarity-naming-csp`.
 *
 * Covers the first-screen explanation and free action (audit D1), the Cloudflare
 * Analytics CSP source (D2) and the owner-approved experience names (D6). The
 * rendered behaviour is exercised separately in the browser.
 */

const read = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

const heroSource = read('app/homepage/Hero.js');
const homePageSource = read('app/homepage/HomePage.js');
const layoutSource = read('app/layout.js');
const mapSource = read('app/lucky-map-of-canada/lucky-map-of-canada.js');

describe('first-screen clarity', () => {
  it('shows the brand, the purpose and a free way in before scrolling', () => {
    expect(heroSource).toMatch(/<h1 className="hero-welcome-title">Lucky Pick Canada<\/h1>/);
    expect(heroSource).toContain('A fun, free place to explore what luck means to you.');
    expect(heroSource).toMatch(/more than fortune and\s+fame/);
    expect(heroSource).toMatch(/<a href="#play-explore" className="hero-welcome-cta gold-3d-btn">/);
    expect(heroSource).toContain('Explore free experiences');
    expect(heroSource).toContain('Luck Generator');
    expect(heroSource).toContain('Crystal Ball');
    expect(heroSource).toContain('Lucky Community Stories');
  });

  it('keeps the existing artwork, free explore control and animations', () => {
    expect(heroSource).toContain('/homepage-hero-lucky-pick-canada.avif');
    expect(heroSource).toContain('<ExploreLuckButton />');
    expect(heroSource).toContain('hero-gold-shimmer');
    expect(heroSource).not.toMatch(/sr-only">Lucky Pick Canada/);
  });

  it('keeps the fun, community and non-gambling identity', () => {
    expect(heroSource).toContain('Free to enjoy · For fun and entertainment only');
    expect(heroSource).not.toMatch(/\b(casino|betting|wager|wagering|jackpot|odds)\b/i);
  });
});

describe('Cloudflare Analytics CSP', () => {
  it('allows the analytics beacon through script-src only', async () => {
    const headers = await nextConfig.headers();
    const pageRoute = headers.find((entry) => entry.source === '/((?!api|_next).*)');
    expect(pageRoute).toBeDefined();

    const csp = pageRoute.headers.find((header) => header.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();

    const directives = Object.fromEntries(
      csp.value
        .split(';')
        .map((directive) => directive.trim())
        .filter(Boolean)
        .map((directive) => {
          const [name, ...sources] = directive.split(/\s+/);
          return [name, sources];
        })
    );

    expect(directives['script-src']).toContain('https://static.cloudflareinsights.com');
    expect(directives['script-src']).toContain("'self'");
    expect(directives['script-src']).toContain('https://challenges.cloudflare.com');
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
    expect(directives['frame-ancestors']).toEqual(["'self'"]);
    expect(directives['form-action']).toEqual(["'self'", 'https://checkout.stripe.com']);
    expect(directives['connect-src']).not.toContain('https://static.cloudflareinsights.com');
    expect(csp.value).not.toContain('*');
  });
});

describe('approved experience names', () => {
  it('uses the approved section names on the homepage', () => {
    expect(homePageSource).toContain('>LUCK GENERATOR</h2>');
    expect(homePageSource).toContain('Lucky Community Stories');
    expect(homePageSource).toContain('Lucky Reveals — Your Little Touch of Luck');
    expect(homePageSource).toContain('Personal Reveal · CAD $1.00');
    expect(homePageSource).toContain('Gift Reveal · CAD $1.99');
    expect(homePageSource).toContain('Tip Jar — Help Keep the Luck Rolling');
    expect(homePageSource).not.toMatch(/LUCKY METER|ORACLE|Choose a Lucky Pick|Lucky Reveal · CAD/);
  });

  it('uses the approved names in navigation and the map page', () => {
    expect(layoutSource).toMatch(/href="\/lucky-meter"[^>]*>Luck Generator</);
    expect(layoutSource).toMatch(/href="\/map"[^>]*>Lucky Community Stories</);
    expect(mapSource).toContain('Lucky Community Stories by province');
    expect(mapSource).toContain('View Lucky Community Stories');
    expect(mapSource).not.toContain('Lucky Map navigation');
    expect(mapSource).not.toContain('Lucky Stories by province');
  });

  it('uses the approved names in the FAQ content', () => {
    const text = faqItems.map((item) => `${item.question} ${item.answer}`).join('\n');

    expect(text).toMatch(/Luck Generator/);
    expect(text).toMatch(/Lucky Community Stories/);
    expect(text).toMatch(/Gift Reveal/);
    expect(text).not.toMatch(/Lucky Meter|Lucky Pick gift|Lucky Stories\b/);
  });

  it('leaves destinations and prices untouched', () => {
    expect(layoutSource).toContain('href="/lucky-meter"');
    expect(layoutSource).toContain('href="/map"');
    expect(homePageSource).toContain('href="/crystal-ball"');
    expect(homePageSource).toContain('href="/map"');
    expect(homePageSource).toContain('CAD $1.00');
    expect(homePageSource).toContain('CAD $1.99');
  });
});

describe('mobile marker spacing', () => {
  it('fans the Maritime markers apart so each keeps its own target', () => {
    const mapCss = read('themes/default/map.css');

    expect(mapSource).toContain('data-province={province.code}');
    expect(mapCss).toMatch(/\.province-marker\[data-province='NB'\]/);
    expect(mapCss).toMatch(/\.province-marker\[data-province='PE'\]/);
    expect(mapCss).toMatch(/\.province-marker\[data-province='NS'\]/);
    expect(mapCss).toMatch(/@media \(max-width: 620px\)/);
  });
});
