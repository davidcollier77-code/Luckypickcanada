// @vitest-environment node
import { statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Source guard for `specs/078-lucky-reveal-followup-polish`.
 *
 * The merged reveal had three reported presentation problems and one unfinished
 * image audit: most of the close button was covered by the panel body, the settled
 * leaves formed an even row that could overlap the CTA, and the panel was a dark
 * opaque scrim instead of the homepage's translucent glass. The share image also
 * downloaded a 1920x4152 logo to draw a 116px mark.
 */

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const popupSource = readSource('app/lucky-reveal-popup.js');
const celebrationSource = readSource('app/lucky-reveal-celebration.jsx');
const shareImageSource = readSource('app/lucky-reveal-share-image.js');
const homepageCss = readSource('themes/default/homepage.css');

describe('Close control', () => {
  it('stacks the button above the panel body and gives it a 44px touch target', () => {
    const closeBlock = popupSource.slice(
      popupSource.indexOf('const closeButtonStyle'),
      popupSource.indexOf('function SlowWords'),
    );

    expect(closeBlock).toContain('zIndex: 3');
    expect(closeBlock).toContain('width: 44,');
    expect(closeBlock).toContain('height: 44,');
    expect(closeBlock).toContain("touchAction: 'manipulation'");
    expect(closeBlock).toContain("WebkitTapHighlightColor: 'transparent'");

    // The body wrapper keeps the panel's stack level, so the button must be higher.
    const bodyIndex = popupSource.indexOf('className="lucky-reveal-scroll"');
    const wrapper = popupSource.slice(bodyIndex, bodyIndex + 300);
    expect(wrapper).toContain('zIndex: 2');
  });

  it('scrolls the body inside the panel so the button cannot scroll away', () => {
    expect(popupSource).toContain("display: 'flex',");
    expect(popupSource).toContain("flexDirection: 'column',");
    expect(popupSource).toContain("overflow: 'hidden',");
    expect(popupSource).toContain('padding: 0,');

    const bodyIndex = popupSource.indexOf('className="lucky-reveal-scroll"');
    const wrapper = popupSource.slice(bodyIndex, bodyIndex + 420);
    expect(wrapper).toContain("overflowY: 'auto'");
    expect(wrapper).toContain("flex: '1 1 auto'");
    expect(wrapper).toContain('minHeight: 0');
    expect(wrapper).toContain("padding: 'clamp(1.5rem, 5vw, 2.5rem)'");
  });

  it('keeps the existing close behaviour unchanged', () => {
    expect(popupSource).toContain('aria-label="Close lucky reveal"');
    expect(popupSource).toContain('onClick={closeReveal}');
    expect(popupSource).toContain('autoFocus');
    expect(popupSource).toContain("if (e.key === 'Escape')");
  });
});

describe('Homepage-matched container', () => {
  it('uses the homepage card gradient and blur', () => {
    expect(popupSource).toContain(
      'linear-gradient(145deg, rgba(5, 11, 18, 0.7), rgba(7, 19, 27, 0.52) 52%, rgba(8, 7, 18, 0.62))',
    );
    expect(popupSource).toContain("backdropFilter: 'blur(16px)'");
    expect(popupSource).toContain("WebkitBackdropFilter: 'blur(16px)'");

    // The values are the homepage's own, not invented.
    expect(homepageCss).toContain('rgba(5, 11, 18, 0.7)');
    expect(homepageCss).toContain('rgba(7, 19, 27, 0.52) 52%');
    expect(homepageCss).toContain('rgba(8, 7, 18, 0.62)');
    expect(homepageCss).toContain('backdrop-filter: blur(16px)');
  });

  it('keeps the lucky-colour border, glow and layout', () => {
    expect(popupSource).toContain('borderColor: theme.borderColor');
    expect(popupSource).toContain('boxShadow: theme.boxShadow');
    expect(popupSource).toContain('borderRadius: 28');
  });
});

describe('Settled leaf pile', () => {
  it('stacks overlapping leaves in three layers', () => {
    for (const layer of ['layer: 0', 'layer: 1', 'layer: 2']) {
      expect(celebrationSource).toContain(layer);
    }
    expect(celebrationSource).toContain('zIndex: leaf.layer');
    expect((celebrationSource.match(/\{ left: '/g) || []).length).toBe(18);

    // Varied rotation and size, not one repeated leaf.
    const rotations = [...celebrationSource.matchAll(/rotate: (-?\d+)/g)].map((m) => Number(m[1]));
    expect(new Set(rotations).size).toBeGreaterThan(12);
    const sizes = [...celebrationSource.matchAll(/size: (\d+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeGreaterThanOrEqual(15);
  });

  it('paints the finish behind the panel so it cannot cover content', () => {
    expect(celebrationSource).toMatch(/\.lucky-celebration \{[\s\S]{0,400}z-index: 1;/);
    expect(popupSource).toContain('zIndex: 2');
  });
});

describe('Share logo sizing', () => {
  it('serves the 232px variants instead of the full-size original', () => {
    expect(shareImageSource).toContain('/assets/lucky-reveal-logo-232.avif');
    expect(shareImageSource).toContain('/assets/lucky-reveal-logo-232.webp');
    expect(shareImageSource).toContain('/assets/lucky-reveal-logo-232.png');
    expect(shareImageSource).not.toContain('/BackgroundEraser_20260724_163638777.avif');

    const size = (relativePath) => statSync(join(process.cwd(), relativePath)).size;
    const smallAvif = size('public/assets/lucky-reveal-logo-232.avif');
    const fullAvif = size('public/BackgroundEraser_20260724_163638777.avif');

    // The measured decision: the drawn mark is 116px, so the small AVIF wins.
    expect(smallAvif).toBeLessThan(fullAvif / 4);
    expect(smallAvif).toBeLessThan(32 * 1024);
  });

  it('keeps the generated share image a PNG', () => {
    expect(shareImageSource).toContain("canvas.toBlob(resolve, 'image/png')");
  });
});
