import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source guard for `specs/088-live-performance-readiness`.
 *
 * A preload hint's `type` only filters formats the browser cannot decode, so
 * hinting the hero artwork in both AVIF and WebP made AVIF-capable browsers
 * download both files for one painted image. Exactly one hint (AVIF) may be
 * emitted, while the `<picture>` element must keep delivering the AVIF source
 * first, the WebP source second, and the WebP `<img>` fallback.
 */

const heroSource = readFileSync(join(process.cwd(), 'app/homepage/Hero.js'), 'utf8');

/** Returns every hero artwork URL passed to React's `preload()`. */
function heroPreloadPaths() {
  return [...heroSource.matchAll(/preload\(\s*["'`]([^"'`]*homepage-hero-lucky-pick-canada[^"'`]*)["'`]/g)].map(
    (match) => match[1]
  );
}

describe('Homepage hero image delivery', () => {
  it('emits exactly one hero preload hint and it is the AVIF artwork', () => {
    const paths = heroPreloadPaths();

    expect(paths).toHaveLength(1);
    expect(paths[0]).toMatch(/\.avif$/);
    expect(heroSource).toContain('type: "image/avif"');
    expect(heroSource).toContain('fetchPriority: "high"');
    expect(heroSource).toContain('imageSrcSet: "/homepage-hero-lucky-pick-canada-669w.avif 669w, /homepage-hero-lucky-pick-canada.avif 1024w"');
  });

  it('never hints the WebP artwork', () => {
    for (const path of heroPreloadPaths()) {
      expect(path).not.toMatch(/\.webp$/);
    }
    expect(heroSource).not.toMatch(/preload\(\s*["'`][^"'`]*homepage-hero[^"'`]*\.webp/);
  });

  it('keeps the AVIF-first picture sources and the WebP fallback unchanged', () => {
    const avifSource = '<source type="image/avif" srcSet="/homepage-hero-lucky-pick-canada-669w.avif 669w, /homepage-hero-lucky-pick-canada.avif 1024w" sizes="(max-width: 768px) 100vw, 1024px" />';
    const webpSource = '<source type="image/webp" srcSet="/homepage-hero-lucky-pick-canada-669w.webp 669w, /homepage-hero-lucky-pick-canada.webp 1024w" sizes="(max-width: 768px) 100vw, 1024px" />';

    expect(heroSource).toContain(avifSource);
    expect(heroSource).toContain(webpSource);
    expect(heroSource.indexOf(avifSource)).toBeLessThan(heroSource.indexOf(webpSource));

    expect(heroSource).toContain('src="/homepage-hero-lucky-pick-canada.webp"');
    expect(heroSource).toContain('alt="Lucky Pick Canada emblem with a maple leaf and clover set against a starry sky."');
    expect(heroSource).toContain('fetchPriority="high"');
  });

  it('keeps the artwork files the markup and hint reference', () => {
    for (const asset of [
      'homepage-hero-lucky-pick-canada.avif',
      'homepage-hero-lucky-pick-canada-669w.avif',
      'homepage-hero-lucky-pick-canada.webp',
      'homepage-hero-lucky-pick-canada-669w.webp',
    ]) {
      expect(existsSync(join(process.cwd(), 'public', asset))).toBe(true);
    }
  });
});
