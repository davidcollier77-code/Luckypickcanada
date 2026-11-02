// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAPLE_LEAF_PATH } from '../app/lib/mapleLeafConfetti.mjs';

/**
 * Source guard for `specs/076-lucky-reveal-celebration-image-optimization`.
 *
 * The shared Lucky Reveal celebrates the finished result with the homepage's own
 * golden maple leaf, confetti pop and particle design, then finishes with a small
 * glowing pile of the same leaf. Every applicable raster asset in the reveal and
 * its share-image renderer is delivered AVIF first, WebP second, with the original
 * format only as a compatibility fallback.
 */

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const sharedSource = readSource('app/lib/mapleLeafConfetti.mjs');
const celebrationSource = readSource('app/lucky-reveal-celebration.jsx');
const homepageSource = readSource('app/homepage/ExploreLuckButton.js');
const popupSource = readSource('app/lucky-reveal-popup.js');
const shareImageSource = readSource('app/lucky-reveal-share-image.js');

describe('Shared golden maple-leaf confetti', () => {
  it('keeps one maple-leaf path for the homepage and the reveal', () => {
    expect(sharedSource).toContain('export const MAPLE_LEAF_PATH');
    expect(sharedSource).toContain('export const MAPLE_LEAF_MATRIX');
    expect(sharedSource).toContain('export function loadConfetti');
    expect(sharedSource).toContain('export function createMapleLeafShape');

    expect(homepageSource).toContain("from '../lib/mapleLeafConfetti'");
    expect(celebrationSource).toContain("from './lib/mapleLeafConfetti'");
    expect(celebrationSource).toContain('createMapleLeafShape');

    // The homepage no longer owns a second copy of the artwork.
    expect(homepageSource).not.toContain('const MAPLE_LEAF_PATH');
    expect(homepageSource).not.toContain('shapeFromPath');
    expect(celebrationSource).not.toContain('shapeFromPath');
  });

  it('draws the same leaf outline as public/images/maple-leaf.svg', () => {
    const svgPath = readSource('public/images/maple-leaf.svg').match(/d="([^"]+)"/)[1];

    // The SVG writes one segment as an absolute line (`L546-458`); the particle
    // path writes that identical point relatively (`-204 1052`). The rest is
    // byte-identical, so both render the exact same leaf.
    const normalize = (path) => path.replace('L546-458', '-204 1052');
    expect(normalize(MAPLE_LEAF_PATH)).toBe(normalize(svgPath));
    expect(MAPLE_LEAF_PATH).toContain('m-90 2030');
  });
});

describe('Lucky Reveal celebration', () => {
  it('launches golden maple leaves from both sides of the screen', () => {
    expect(celebrationSource).toContain('origin: { x: 0, y: 0.82 }');
    expect(celebrationSource).toContain('origin: { x: 1, y: 0.82 }');
    expect(celebrationSource).toContain('angle: 62');
    expect(celebrationSource).toContain('angle: 118');
    expect(celebrationSource).toContain("['#FBBF24', '#F59E0B', '#D97706']");

    // Same particle physics family as the homepage: drift, decay, gravity, ticks.
    for (const token of ['drift:', 'decay:', 'gravity:', 'ticks:', 'scalar:']) {
      expect(celebrationSource).toContain(token);
    }

    // The CSP blocks canvas-confetti's Blob worker, so the shared main-thread
    // canvas technique is reused.
    expect(celebrationSource).toContain('useWorker: false');
    expect(celebrationSource).toContain('confettiLib.create(canvas, { resize: true, useWorker: false })');
  });

  it('plays the existing homepage confetti pop in sync with the burst', () => {
    expect(celebrationSource).toContain('preloadConfettiPop');
    expect(celebrationSource).toContain('playConfettiPop');
    expect(celebrationSource).not.toContain('new Howl');
    expect(celebrationSource).not.toContain('/sounds/');

    // The shared audio is preloaded before the last number settles and played in
    // the launch callback, so the pop starts with the burst.
    const launchIndex = celebrationSource.indexOf('const launch = useCallback');
    expect(launchIndex).toBeGreaterThan(0);
    expect(celebrationSource.slice(0, launchIndex)).toContain('preloadConfettiPop()');
    expect(celebrationSource.slice(launchIndex)).toContain('playConfettiPop()');
  });

  it('adds a brief opening sparkle and a settled golden finish', () => {
    for (const token of [
      'lucky-celebration-flash',
      'lucky-celebration-finish',
      'lucky-celebration-glow',
      'lucky-settled-leaf',
      'lucky-celebration-finish-in',
      'lucky-settled-leaf-in',
    ]) {
      expect(celebrationSource).toContain(token);
    }

    expect(celebrationSource).toContain('aria-hidden="true"');
    expect(celebrationSource).toContain('pointer-events: none');
    // The settled leaves are the same vector outline, not a new raster asset.
    expect(celebrationSource).toContain('viewBox="-2015 -2000 4030 4030"');
    expect(celebrationSource).not.toMatch(/\.(png|webp|avif)\b/);
  });

  it('keeps the celebration inside the two-to-three second window', () => {
    expect(celebrationSource).toMatch(/ticks: 1[0-7]\d\b/);
    expect(celebrationSource).toContain('lucky-celebration-flash 1s');
  });

  it('respects reduced motion and cleans up after itself', () => {
    expect(celebrationSource).toContain('@media (prefers-reduced-motion: reduce)');
    expect(celebrationSource).toMatch(
      /if \(prefersReducedMotion\) \{[\s\S]{0,160}setIsCelebrating\(true\)/,
    );
    expect(celebrationSource).toContain('window.clearTimeout(timer)');
    expect(celebrationSource).toContain('canvasRef.current?.remove()');
    expect(celebrationSource).toContain('confettiRef.current?.reset()');
    expect(celebrationSource).toMatch(/\.lucky-celebration-flash \{ display: none; \}/);
  });

  it('is wired into the one shared reveal after the final number', () => {
    expect(popupSource).toContain("from './lucky-reveal-celebration'");
    expect(popupSource).toContain('<LuckyRevealCelebration startDelayMs={celebrationDelayMs} />');
    expect(popupSource).toContain(
      'const celebrationDelayMs = (startNumbersDelay + (numItems - 1) * 0.35 + 0.95) * 1000;',
    );
    // The panel keeps its own stack level above the static finish.
    expect(popupSource).toContain('zIndex: 2');
  });

  it('never generates or changes a lucky result', () => {
    for (const source of [celebrationSource, sharedSource]) {
      expect(source).not.toContain('generateLuckyNumbers');
      expect(source).not.toContain('crypto.getRandomValues');
      expect(source).not.toMatch(/Math\.random\(/);
      expect(source).not.toMatch(/from '\.\/lucky-reveal'/);
    }
  });
});

describe('Reveal raster images', () => {
  it('keeps the existing Milky Way background AVIF first, WebP second, JPEG last', () => {
    const avif = "url('/assets/crystal-ball-bg-desktop.avif')";
    const webp = "url('/assets/crystal-ball-bg-desktop.webp')";
    const jpeg = "url('/assets/crystal-ball-bg-desktop.jpeg')";

    expect(popupSource).toContain(avif);
    expect(popupSource).toContain(webp);
    expect(popupSource).toContain(jpeg);
    expect(popupSource.indexOf(avif)).toBeLessThan(popupSource.indexOf(webp));
    expect(popupSource.indexOf(webp)).toBeLessThan(popupSource.indexOf(jpeg));

    for (const asset of [
      'crystal-ball-bg-desktop.avif',
      'crystal-ball-bg-desktop.webp',
      'crystal-ball-bg-desktop.jpeg',
    ]) {
      expect(existsSync(join(process.cwd(), 'public/assets', asset))).toBe(true);
    }
  });

  it('loads the share-image logo AVIF first, WebP second, PNG last', () => {
    const avif = '/assets/lucky-reveal-logo-232.avif';
    const webp = '/assets/lucky-reveal-logo-232.webp';
    const png = '/assets/lucky-reveal-logo-232.png';

    expect(shareImageSource).toContain('LOGO_SOURCES');
    expect(shareImageSource).toContain('loadLogo');
    expect(shareImageSource.indexOf(avif)).toBeLessThan(shareImageSource.indexOf(webp));
    expect(shareImageSource.indexOf(webp)).toBeLessThan(shareImageSource.indexOf(png));

    // Every source must actually exist, so a fallback never 404s.
    for (const asset of [
      'assets/lucky-reveal-logo-232.avif',
      'assets/lucky-reveal-logo-232.webp',
      'assets/lucky-reveal-logo-232.png',
    ]) {
      expect(existsSync(join(process.cwd(), 'public', asset))).toBe(true);
    }
  });

  it('keeps the generated shareable image a PNG', () => {
    expect(shareImageSource).toContain("canvas.toBlob(resolve, 'image/png')");
    expect(shareImageSource).toContain("'lucky-reveal.png'");
  });
});
