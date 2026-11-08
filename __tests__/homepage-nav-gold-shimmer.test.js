import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source guard for `specs/089-homepage-nav-gold-shimmer`.
 *
 * The homepage hero primary navigation must offer one stories link, labelled
 * "Lucky Community Stories", and no legacy "Lucky Map" entry, while the map page and the
 * homepage call to action that reaches it stay in place. The gold wordmark,
 * the Explore Your Luck line/arrow and the emblem's gold ring are painted into
 * one artwork, so the shimmer must be a decorative layer above it: masked,
 * non-interactive, aligned to the painted artwork box, removed for reduced
 * motion, and never a change to image delivery.
 */

const read = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');
const heroSource = read('app/homepage/Hero.js');
const heroCss = read('themes/default/hero.css');
const homePageSource = read('app/homepage/HomePage.js');
const exploreSource = read('app/homepage/ExploreLuckButton.js');

describe('Homepage hero navigation', () => {
  it('offers exactly one stories link, labelled Lucky Community Stories', () => {
    const storiesLinks = heroSource.match(/href="#community-stories"/g) ?? [];

    expect(storiesLinks).toHaveLength(1);
    expect(heroSource).toMatch(/href="#community-stories"[\s\S]{0,220}Lucky Community Stories/);
  });

  it('no longer carries the redundant Lucky Map navigation link', () => {
    expect(heroSource).not.toContain('Lucky Map');
    expect(heroSource).not.toMatch(/href="\/map"/);
  });

  it('keeps the map route and the homepage call to action that reaches it', () => {
    expect(existsSync(join(process.cwd(), 'app/map/page.js'))).toBe(true);
    expect(homePageSource).toMatch(/<Link href="\/map"/);
    expect(homePageSource).toContain('EXPLORE LUCKY COMMUNITY STORIES');
    expect(read('app/layout.js')).toMatch(/href="\/map"[^>]*>Lucky Community Stories</);
  });
});

describe('Hero gold shimmer', () => {
  it('layers three decorative shimmer regions above the artwork', () => {
    expect(heroSource).toContain('className="hero-gold-shimmer-frame" aria-hidden="true"');

    for (const region of ['ring', 'wordmark', 'explore']) {
      expect(heroSource).toContain(`hero-gold-shimmer hero-gold-shimmer--${region}`);
      expect(heroCss).toContain(`.hero-gold-shimmer--${region}`);
    }
  });

  it('places the decoration above the artwork but below the Explore control', () => {
    const pictureEnd = heroSource.indexOf('</picture>');
    const frameIndex = heroSource.indexOf('hero-gold-shimmer-frame');
    const buttonIndex = heroSource.indexOf('<ExploreLuckButton />');

    expect(pictureEnd).toBeGreaterThan(-1);
    expect(pictureEnd).toBeLessThan(frameIndex);
    expect(frameIndex).toBeLessThan(buttonIndex);
  });

  it('animates a light band that visibly travels across each region', () => {
    expect(heroCss).toContain('@keyframes hero-gold-shimmer-sweep');
    expect(heroCss).toMatch(/animation: hero-gold-shimmer-sweep 8s/);
    expect(heroCss).toMatch(/62%, 100% \{ transform: translate3d\(400%, 0, 0\); \}/);
    expect(heroCss).toContain('mix-blend-mode: screen');
    expect(heroCss).toMatch(/\.hero-gold-shimmer--ring::before \{ animation-duration: 10\.5s; \}/);
  });

  it('aligns the decoration with the painted artwork box at every viewport', () => {
    expect(heroCss).toContain('.hero-image-container { container-type: size; }');
    expect(heroCss).toContain('height: min(100cqh, 150cqw);');
    expect(heroCss).toContain('aspect-ratio: 1024 / 1536;');
  });

  it('keeps the decoration out of pointer, tap and keyboard input', () => {
    const shimmerRules = heroCss.slice(heroCss.indexOf('.hero-gold-shimmer-frame'));

    expect(shimmerRules).toContain('pointer-events: none;');
    expect(heroSource).toContain('<span className="hero-gold-shimmer-frame" aria-hidden="true">');
  });

  it('removes the shimmer for reduced motion', () => {
    expect(heroCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.hero-gold-shimmer \{ display: none; \}\s*\}/
    );
  });
});

describe('Explore Your Luck behaviour preserved', () => {
  it('keeps the click, confetti, sound and eased scroll intact', () => {
    expect(heroSource).toContain('<ExploreLuckButton />');
    expect(exploreSource).toContain('aria-label="Explore your luck.');
    expect(exploreSource).toContain('playConfettiPop()');
    expect(exploreSource).toContain('scrollIntoView');
    expect(exploreSource).toContain('requestAnimationFrame(scrollStep)');
    expect(exploreSource).toContain("document.getElementById('play-explore')");
  });
});

describe('Hero image delivery untouched', () => {
  it('keeps AVIF first, WebP second and the WebP img fallback', () => {
    const avifIndex = heroSource.indexOf('type="image/avif"');
    const webpIndex = heroSource.indexOf('type="image/webp"');
    const imgIndex = heroSource.indexOf('src="/homepage-hero-lucky-pick-canada.webp"');

    expect(avifIndex).toBeGreaterThan(-1);
    expect(avifIndex).toBeLessThan(webpIndex);
    expect(webpIndex).toBeLessThan(imgIndex);
  });

  it('adds no shimmer image asset and no extra preload hint', () => {
    const heroPreloads = heroSource.match(/preload\(\s*"\/homepage-hero-lucky-pick-canada/g) ?? [];

    expect(heroPreloads).toHaveLength(1);
    expect(heroCss).not.toMatch(/url\(/);
  });
});
