// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LUCKY_COLORS } from '../app/lucky-reveal';
import {
  LUCKY_COLOR_SWATCHES,
  LUCKY_SITE_URL,
  buildShareMessage,
  getLuckyColorSwatch,
  getLuckyColorSwatchGradient,
  splitLuckyNumberRows,
} from '../app/lucky-reveal-presentation';

/**
 * Source guard for `specs/075-lucky-reveal-polish`.
 *
 * The reveal presents 6 picks as 3 + 3 and 7 picks as 4 + 3, shows a swatch
 * beside the lucky colour, and shares one static image through the device's own
 * sharing panel instead of a wall of network buttons.
 */

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const popupSource = readSource('app/lucky-reveal-popup.js');
const shareButtonSource = readSource('app/share-lucky-pick-button.js');
const shareImageSource = readSource('app/lucky-reveal-share-image.js');
const revealPageSource = readSource('app/reveal/[revealId]/page.tsx');

const SIX_PICK = [3, 11, 19, 24, 40, 47];
const SEVEN_PICK = [1, 4, 9, 16, 25, 36, 49];

describe('Lucky Reveal number row layout', () => {
  it('splits a 6 Pick into three centred numbers over three', () => {
    expect(splitLuckyNumberRows(SIX_PICK)).toEqual([
      [3, 11, 19],
      [24, 40, 47],
    ]);
  });

  it('splits a 7 Pick into four numbers over three centred underneath', () => {
    expect(splitLuckyNumberRows(SEVEN_PICK)).toEqual([
      [1, 4, 9, 16],
      [25, 36, 49],
    ]);
  });

  it('preserves the stored numbers and their order', () => {
    for (const numbers of [SIX_PICK, SEVEN_PICK]) {
      expect(splitLuckyNumberRows(numbers).flat()).toEqual(numbers);
    }
  });

  it('keeps every number visible for an unrecognised count', () => {
    expect(splitLuckyNumberRows([5, 8, 13, 21, 34])).toEqual([[5, 8, 13, 21, 34]]);
    expect(splitLuckyNumberRows([])).toEqual([]);
    expect(splitLuckyNumberRows(undefined)).toEqual([]);
  });
});

describe('Lucky Reveal colour swatches', () => {
  it('gives every lucky colour its own accurate swatch', () => {
    for (const colour of LUCKY_COLORS) {
      const swatch = getLuckyColorSwatch(colour);

      expect(LUCKY_COLOR_SWATCHES[colour]).toBeDefined();
      expect(swatch.from).toMatch(/^#[0-9a-f]{6}$/i);
      expect(swatch.to).toMatch(/^#[0-9a-f]{6}$/i);
      expect(swatch.from).not.toBe(swatch.to);
    }

    const targets = LUCKY_COLORS.map((colour) => getLuckyColorSwatch(colour).to);
    expect(new Set(targets).size).toBe(LUCKY_COLORS.length);
  });

  it('keeps the gold, green, and silver treatments recognisable', () => {
    expect(getLuckyColorSwatch('Star Gold').to).toBe('#b45309');
    expect(getLuckyColorSwatch('Aurora Green').to).toBe('#047857');
    expect(getLuckyColorSwatch('Moonlight Silver').from).toBe('#ffffff');
  });

  it('falls back to the gold treatment without renaming an unknown colour', () => {
    expect(getLuckyColorSwatch('Fortune Blue')).toEqual(getLuckyColorSwatch('Star Gold'));
    expect(getLuckyColorSwatchGradient('Sky Blue')).toContain('#cffafe');
    expect(getLuckyColorSwatchGradient('Sky Blue')).toContain('#0369a1');
  });
});

describe('Reveal popup presentation', () => {
  it('renders the stored numbers as centred rows', () => {
    expect(popupSource).toContain('splitLuckyNumberRows');
    expect(popupSource).toContain('lucky-reveal-number-row');
    expect(popupSource).toContain('justifyContent: \'center\'');
    expect(popupSource).toMatch(/rowOffsets\[rowIndex\] \+ columnIndex/);
  });

  it('shows the colour swatch beside the colour name', () => {
    expect(popupSource).toContain('getLuckyColorSwatchGradient');
    expect(popupSource).toContain('lucky-reveal-swatch');
    expect(popupSource).toMatch(/aria-hidden="true"[\s\S]{0,220}className="lucky-reveal-swatch"/);
    expect(popupSource).toContain('{reveal.luckyColor}');
  });

  it('adds the shimmer and maple-leaf sparkle finishing touches', () => {
    expect(popupSource).toContain('lucky-reveal-shimmer');
    expect(popupSource).toContain('lucky-reveal-shimmer-sweep');
    expect(popupSource).toContain('lucky-reveal-sparkle');
    expect(popupSource).toContain('lucky-reveal-maple-gold');
  });

  it('respects reduced motion and keeps the finished result visible', () => {
    expect(popupSource).toContain('@media (prefers-reduced-motion: reduce)');
    expect(popupSource).toMatch(/\.lucky-reveal-number,[\s\S]{0,240}animation: none !important;/);
    expect(popupSource).toContain('.lucky-reveal-shimmer { display: none !important; }');
  });

  it('replaces the auroras wording with Milky Way wording', () => {
    expect(popupSource).not.toContain('Auroras and stars');
    expect(popupSource).toContain('Milky Way and a sky full of stars');
  });

  it('preserves the reveal controls and never generates a result', () => {
    for (const token of [
      'Your lucky reveal is here',
      'Payment complete',
      'id="lucky-reveal-title"',
      'Close lucky reveal',
      'ShareLuckyPickButton',
      'borderColor: theme.borderColor',
      'boxShadow: theme.boxShadow',
      'lucky-number-reveal',
      'lucky-glow-pulse',
      'lucky-premium-fade-in',
      'lucky-word-rise',
    ]) {
      expect(popupSource).toContain(token);
    }

    // The map invitation was removed; the reveal and its remaining controls stay.
    expect(popupSource).not.toContain('Add me to the Little Luck Map');
    expect(popupSource).not.toContain('lucky-map-button-enhanced');

    expect(popupSource).not.toContain('generateLuckyNumbers');
    expect(popupSource).not.toContain('createLuckyReveal');
    expect(popupSource).not.toContain('Math.random');
  });
});

describe('Lucky Reveal sharing', () => {
  it('exposes the Share to Apps control and the three preserved actions', () => {
    // Phase 2 adds the fourth, clearly visible option; the three existing
    // actions stay exactly as they were and are never hidden.
    expect(shareButtonSource).toContain('Share to Apps');
    expect(shareButtonSource).toContain('role="group"');
    expect(shareButtonSource).toContain('aria-label="Share your reveal"');
    expect(shareButtonSource.match(/type="button"/g)?.length).toBeGreaterThan(0);
    expect(shareButtonSource).not.toContain('Share Your Luck');
    expect(shareButtonSource).not.toMatch(/Facebook|shareToX|shareToWhatsApp|twitter\.com|facebook\.com/i);
    expect(shareButtonSource).not.toMatch(/mailto:|sms:/);
    expect(shareButtonSource).not.toMatch(/Copy card message|Copy share link/);
  });

  it('shares the static image with text and the website link where supported', () => {
    expect(shareButtonSource).toContain('createLuckyRevealShareImage');
    expect(shareButtonSource).toContain('navigator.share');
    expect(shareButtonSource).toContain('navigator.canShare');
    expect(shareButtonSource).toContain('files: [file]');
    expect(shareButtonSource).toContain('buildShareMessage');
    expect(shareButtonSource).toContain('LUCKY_SITE_URL');
  });

  it('handles a cancelled device share panel gracefully', () => {
    expect(shareButtonSource).toMatch(/error\?\.name === 'AbortError'/);
    expect(shareButtonSource).toContain('Sharing cancelled.');
  });

  it('keeps Copy link, Copy image and Download visible as the fallback', () => {
    expect(shareButtonSource).toContain('Download the image');
    expect(shareButtonSource).toContain('Copy the image');
    expect(shareButtonSource).toContain('Copy the website link');
    expect(shareButtonSource).toContain('ClipboardItem');
    expect(shareButtonSource).toContain('URL.createObjectURL(file)');
    expect(shareButtonSource).toContain('URL.revokeObjectURL(url)');
    // They are always visible, not gated behind the native share panel.
    expect(shareButtonSource).not.toContain('setIsFallbackOpen');
  });

  it('never generates a new result while sharing', () => {
    for (const source of [shareButtonSource, shareImageSource]) {
      expect(source).not.toContain('generateLuckyNumbers');
      expect(source).not.toContain('crypto.getRandomValues');
      expect(source).not.toContain('Math.random(');
      expect(source).not.toMatch(/from '\.\/lucky-reveal'/);
    }
  });
});

describe('Static share image', () => {
  it('uses the reveal numbers, colour swatch, lucky day, and branding', () => {
    expect(shareImageSource).toContain('splitLuckyNumberRows');
    expect(shareImageSource).toContain('getLuckyColorSwatch');
    expect(shareImageSource).toContain('reveal.game.numbers');
    expect(shareImageSource).toContain('reveal.luckyColor');
    expect(shareImageSource).toContain('reveal.luckyDay');
    expect(shareImageSource).toContain('LUCKYPICKCANADA.CA');
    expect(shareImageSource).toContain('LUCKY COLOUR');
    expect(shareImageSource).toContain('LUCKY DAY');
    expect(shareImageSource).toContain('LUCKY_SITE_HOST');
  });

  it('produces a PNG file without adding a dependency', () => {
    expect(shareImageSource).toContain("canvas.toBlob(resolve, 'image/png')");
    expect(shareImageSource).toContain('new File([blob]');
    expect(shareImageSource).not.toMatch(/from 'html2canvas'/);
  });
});

describe('Personal and Gift presentation', () => {
  it('keeps one shared reveal component and the stored gift result', () => {
    expect(revealPageSource).toContain("from '../../lucky-reveal-popup'");
    expect(revealPageSource).toContain('buildLuckyReveal');
    expect(revealPageSource).toContain('metadata.giftNumbers');
    expect(revealPageSource).toContain('metadata.giftLuckyColor');
    expect(revealPageSource).toContain('metadata.giftLuckyDay');
  });

  it('builds share text from the reveal that was already shown', () => {
    const reveal = {
      game: { name: '7 Pick', numbers: SEVEN_PICK },
      luckyColor: 'Lunar Rose',
      luckyDay: 'Friday',
    };

    expect(buildShareMessage(reveal)).toBe(
      `I just revealed my 7 Pick on LuckyPickCanada.ca: ${SEVEN_PICK.join(', ')}. Lucky color: Lunar Rose. Lucky day: Friday. ${LUCKY_SITE_URL}`,
    );
  });
});
