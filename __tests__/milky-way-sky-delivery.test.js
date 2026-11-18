import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/**
 * Source and asset guard for `specs/187-milky-way-sky-delivery`.
 *
 * The shared Milky Way backdrop used to be fetched by a CSS `image-set()`
 * background, outside any client-side decision. It is now responsive markup, so
 * this guard pins the delivery mechanism, the artwork files the browser really
 * downloads, and the measured first-paint byte reduction. It reads the real
 * assets: a claimed saving that is not in the files cannot pass.
 */

const read = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');
const filePath = (relativePath) => join(process.cwd(), relativePath);
const bytes = (relativePath) => statSync(filePath(relativePath)).size;
const metadataOf = (relativePath) => sharp(filePath(relativePath)).metadata();

const skySource = read('app/components/SkyBackdrop.js');
const homepageCss = read('themes/default/homepage.css');

// Audit baseline for the mobile transfer: 142,777 body bytes plus response
// headers measured as 143,077 in the performance audit. The desktop backdrop the
// homepage actually fetched was the 427,992-byte WebP.
const MOBILE_BASELINE_BYTES = 142_777;
const DESKTOP_BASELINE_BYTES = 427_992;

describe('Milky Way backdrop delivery', () => {
  it('is responsive markup, not a CSS image-set background', () => {
    expect(skySource).toContain('<picture className="homepage-sky-backdrop__picture">');
    expect(skySource).toContain("const MOBILE_ARTWORK_MEDIA = '(max-width: 820px)'");
    expect(skySource.match(/media=\{MOBILE_ARTWORK_MEDIA\}/g)).toHaveLength(3);

    // The stylesheet no longer requests the artwork, so it cannot be fetched by
    // the CSS pipeline before any markup or client policy exists.
    expect(homepageCss).not.toContain("image-set(url('/assets/crystal-ball-bg-");
    expect(homepageCss).not.toContain('/assets/crystal-ball-bg-desktop');
    expect(homepageCss).not.toContain('/assets/crystal-ball-bg-mobile');
  });

  it('keeps the artwork order AVIF, then WebP, then JPEG on both breakpoints', () => {
    for (const variant of ['mobile', 'desktop']) {
      const avif = skySource.indexOf(`/assets/crystal-ball-bg-${variant}.avif`);
      const webp = skySource.indexOf(`/assets/crystal-ball-bg-${variant}.webp`);
      const jpeg = skySource.indexOf(`/assets/crystal-ball-bg-${variant}.jpeg`);
      expect(avif, variant).toBeGreaterThan(-1);
      expect(webp, variant).toBeGreaterThan(avif);
      expect(jpeg, variant).toBeGreaterThan(webp);
    }
    expect(skySource).toContain('src="/assets/crystal-ball-bg-desktop.jpeg"');
  });

  it('preserves the focal treatment, overlays and intrinsic ratio', () => {
    expect(homepageCss).toContain('object-fit: cover');
    expect(homepageCss).toContain('object-position: center 45%');
    expect(homepageCss).toContain('object-position: center 42%');
    // The gradient that used to sit above the photograph is still an overlay.
    expect(homepageCss).toContain('rgba(2, 6, 13, 0.1) 0%');
    expect(homepageCss).toContain('.homepage-sky-backdrop::before');
    expect(homepageCss).toContain('z-index: 1;');

    expect(skySource).toContain('width={1920}');
    expect(skySource).toContain('height={1280}');
  });

  it('never competes with the largest contentful paint', () => {
    expect(skySource).toContain('loading="eager"');
    expect(skySource).toContain('fetchPriority="low"');
    expect(skySource).toContain('decoding="async"');
    expect(skySource).toContain('alt=""');
    expect(skySource).toContain('aria-hidden="true"');
  });

  it('keeps the same artwork at the same dimensions', async () => {
    const mobile = await metadataOf('public/assets/crystal-ball-bg-mobile.avif');
    const desktop = await metadataOf('public/assets/crystal-ball-bg-desktop.avif');

    expect(mobile.width).toBe(1200);
    expect(mobile.height).toBe(800);
    expect(desktop.width).toBe(1920);
    expect(desktop.height).toBe(1280);
  });

  it('reduces the bytes the browser downloads on first paint', () => {
    expect(bytes('public/assets/crystal-ball-bg-mobile.avif')).toBeLessThan(MOBILE_BASELINE_BYTES);
    expect(bytes('public/assets/crystal-ball-bg-desktop.avif')).toBeLessThan(DESKTOP_BASELINE_BYTES);
    // The WebP and JPEG fallbacks stay real, unchanged alternatives.
    for (const fallback of [
      'public/assets/crystal-ball-bg-mobile.webp',
      'public/assets/crystal-ball-bg-mobile.jpeg',
      'public/assets/crystal-ball-bg-desktop.webp',
      'public/assets/crystal-ball-bg-desktop.jpeg',
    ]) {
      expect(existsSync(filePath(fallback)), fallback).toBe(true);
    }
  });

  it('renders the shared layer on every route that paints the sky', () => {
    for (const routeFile of [
      'app/page.js',
      'app/crystal-ball/page.js',
      'app/crystal-ball/preview/page.js',
      'app/lucky-map-of-canada/lucky-map-of-canada.js',
    ]) {
      const source = read(routeFile);
      expect(source, routeFile).toContain('<SkyBackdrop />');
    }
  });
});
