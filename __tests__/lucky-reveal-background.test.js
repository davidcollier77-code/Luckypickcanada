import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source guard for `specs/074-lucky-reveal-milky-way-background`.
 *
 * The Lucky Reveal must present the same Milky Way / starfield artwork the
 * homepage uses, and must no longer render its own aurora background. These
 * assertions pin the artwork reference, the homepage's focal treatment, the
 * removal of the old background layers, and the absence of the meteorite and
 * shooting-star effects the request does not require.
 */

const popupSource = readFileSync(join(process.cwd(), 'app/lucky-reveal-popup.js'), 'utf8');
const homepageCss = readFileSync(join(process.cwd(), 'themes/default/homepage.css'), 'utf8');

describe('Lucky Reveal background', () => {
  it('uses the homepage Milky Way artwork on the reveal overlay', () => {
    const webp = "url('/assets/crystal-ball-bg-desktop.webp') type('image/webp')";
    const avif = "url('/assets/crystal-ball-bg-desktop.avif') type('image/avif')";
    const jpeg = "url('/assets/crystal-ball-bg-desktop.jpeg') type('image/jpeg')";

    expect(popupSource).toContain(webp);
    expect(popupSource).toContain(avif);
    expect(popupSource).toContain(jpeg);

    // Same format preference order as the homepage backdrop.
    expect(popupSource.indexOf(webp)).toBeLessThan(popupSource.indexOf(avif));
    expect(popupSource.indexOf(avif)).toBeLessThan(popupSource.indexOf(jpeg));

    for (const asset of [
      'crystal-ball-bg-desktop.webp',
      'crystal-ball-bg-desktop.avif',
      'crystal-ball-bg-desktop.jpeg',
    ]) {
      expect(existsSync(join(process.cwd(), 'public/assets', asset))).toBe(true);
    }
  });

  it("reuses the homepage backdrop's focal treatment", () => {
    expect(homepageCss).toContain('/assets/crystal-ball-bg-desktop.webp');
    expect(popupSource).toContain("backgroundPosition: 'center, center 45%'");
    expect(popupSource).toContain("backgroundSize: 'auto, cover'");
    expect(popupSource).toContain("backgroundRepeat: 'no-repeat, no-repeat'");
    expect(popupSource).toContain("backgroundColor: '#02050a'");
  });

  it('removes the previous reveal-only background', () => {
    expect(popupSource).not.toContain('lucky-aurora-glow-1');
    expect(popupSource).not.toContain('lucky-aurora-glow-2');
    expect(popupSource).not.toContain('lucky-twinkle');
    expect(popupSource).not.toContain('starPositions');
    expect(popupSource).not.toContain('radialGlow');
    expect(popupSource).not.toContain('rgba(2, 4, 8, 0.90)');
    expect(popupSource).not.toContain('mixBlendMode');
  });

  it('adds no meteorite or shooting-star effects', () => {
    // Effect implementations, not prose: the component comment explains that
    // these effects are intentionally excluded.
    expect(popupSource).not.toMatch(/animate-meteor|animate-shooting/i);
    expect(popupSource).not.toMatch(/shootingStar|ShootingStar|meteorShower|MeteorShower/);
    expect(popupSource).not.toMatch(/from '\.\/components\/(ShootingStars|CosmicBackground)'/);
  });

  it('keeps the reveal content, theming, and controls intact', () => {
    for (const token of [
      'Your lucky reveal is here',
      'Payment complete',
      "id=\"lucky-reveal-title\"",
      'Close lucky reveal',
      'ShareLuckyPickButton',
      'Add me to the Little Luck Map',
      'borderColor: theme.borderColor',
      'boxShadow: theme.boxShadow',
      'lucky-number-reveal',
      'lucky-glow-pulse',
      'lucky-premium-fade-in',
      'lucky-word-rise',
      'lucky-map-button-enhanced',
    ]) {
      expect(popupSource).toContain(token);
    }

    // The colour themes keep their identity even though the background changed.
    expect(popupSource.match(/borderColor: 'rgba\(/g)?.length).toBe(7);
  });
});
