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

const HERO_IMAGE_SRCSET_AVIF =
  'srcSet="/homepage-hero-lucky-pick-canada-669w.avif 669w, /homepage-hero-lucky-pick-canada-768w.avif 768w, /homepage-hero-lucky-pick-canada.avif 1024w"';

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
    expect(heroSource).toContain(HERO_IMAGE_SRCSET_AVIF.replace('srcSet="', 'imageSrcSet: "').replace(" />", '"'));
  });

  it('hints exactly the candidate ladder the picture element offers', () => {
    // A hint whose candidate list differs from the element's makes Chrome fetch a
    // second file for the same paint, so the two lists must stay identical.
    const pictureSrcSet = heroSource.match(/type="image\/avif" srcSet="([^"]+)"/)[1];
    const hintedSrcSet = heroSource.match(/imageSrcSet: "([^"]+)"/)[1];

    expect(hintedSrcSet).toBe(pictureSrcSet);
  });

  it('offers an ascending candidate ladder with no gap between the phone widths', () => {
    const widths = heroSource
      .match(/type="image\/avif" srcSet="([^"]+)"/)[1]
      .split(',')
      .map((candidate) => Number(candidate.trim().split(' ')[1].replace('w', '')));

    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    // Lighthouse's mobile profile is 412 CSS px at DPR 1.75, i.e. 721 device
    // pixels; without a candidate between 669 and 1024 that device downloaded
    // the 1024 w file. The ladder must keep a step at or just above 721.
    expect(widths.some((width) => width >= 721 && width < 900)).toBe(true);
  });

  it('never hints the WebP artwork', () => {
    for (const path of heroPreloadPaths()) {
      expect(path).not.toMatch(/\.webp$/);
    }
    expect(heroSource).not.toMatch(/preload\(\s*["'`][^"'`]*homepage-hero[^"'`]*\.webp/);
  });

  it('keeps the AVIF-first picture sources and the WebP fallback unchanged', () => {
    const avifSource = `<source type="image/avif" ${HERO_IMAGE_SRCSET_AVIF} sizes="(max-width: 768px) 100vw, 1024px" />`;
    const webpSource = '<source type="image/webp" srcSet="/homepage-hero-lucky-pick-canada-669w.webp 669w, /homepage-hero-lucky-pick-canada-768w.webp 768w, /homepage-hero-lucky-pick-canada.webp 1024w" sizes="(max-width: 768px) 100vw, 1024px" />';

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
      'homepage-hero-lucky-pick-canada-768w.avif',
      'homepage-hero-lucky-pick-canada.webp',
      'homepage-hero-lucky-pick-canada-669w.webp',
      'homepage-hero-lucky-pick-canada-768w.webp',
    ]) {
      expect(existsSync(join(process.cwd(), 'public', asset))).toBe(true);
    }
  });
});
