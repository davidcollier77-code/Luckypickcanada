import { describe, expect, it } from 'vitest';
import {
  LUCKY_CARD_TIER_PRESENTATION,
  getLuckyCardTierPresentation,
} from '../app/lucky-card-presentation';
import { LUCKY_CARDS } from '../app/lucky-card-data';

/**
 * Contract guard for `specs/094-lucky-card-reveal-polish`.
 *
 * The revealed card presentation is driven entirely by this module, so the tier
 * vocabulary the collection actually ships must have one complete, distinct and
 * escalating treatment per tier.
 */

function hexToRgbTriple(hex) {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `${red}, ${green}, ${blue}`;
}

describe('Lucky Card tier presentation', () => {
  it('covers every tier the card series ships, with distinct accents', () => {
    const shippedTiers = [...new Set(LUCKY_CARDS.map(card => card.tier))].sort();

    expect(shippedTiers).toEqual(['flagship', 'premium', 'standard']);

    for (const tier of shippedTiers) {
      const presentation = getLuckyCardTierPresentation(tier);

      expect(presentation.id).toBe(tier);
      expect(presentation.label).toMatch(/^[A-Z][a-z]+$/);
      expect(presentation.glyph.length).toBeGreaterThan(0);
      expect(presentation.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(presentation.accentRgb).toBe(hexToRgbTriple(presentation.accent));
      expect(presentation.chipText).toMatch(/^#[0-9a-f]{6}$/i);
      expect(presentation.haloOpacity).toBeGreaterThan(0);
      expect(presentation.rimOpacity).toBeGreaterThan(0);
    }

    const accents = shippedTiers.map(tier => getLuckyCardTierPresentation(tier).accent);
    expect(new Set(accents).size).toBe(3);
  });

  it('escalates the reveal treatment from standard to premium to flagship', () => {
    const standard = getLuckyCardTierPresentation('standard');
    const premium = getLuckyCardTierPresentation('premium');
    const flagship = getLuckyCardTierPresentation('flagship');

    expect(premium.haloOpacity).toBeGreaterThan(standard.haloOpacity);
    expect(flagship.haloOpacity).toBeGreaterThan(premium.haloOpacity);

    expect(premium.haloBlur).toBeGreaterThan(standard.haloBlur);
    expect(flagship.haloBlur).toBeGreaterThan(premium.haloBlur);

    expect(premium.rimOpacity).toBeGreaterThan(standard.rimOpacity);
    expect(flagship.rimOpacity).toBeGreaterThan(premium.rimOpacity);

    expect(premium.rimBlur).toBeGreaterThan(standard.rimBlur);
    expect(flagship.rimBlur).toBeGreaterThan(premium.rimBlur);

    expect(premium.frameOpacity).toBeGreaterThan(standard.frameOpacity);
    expect(flagship.frameOpacity).toBeGreaterThan(premium.frameOpacity);

    expect(premium.innerGlow).toBeGreaterThan(standard.innerGlow);
    expect(flagship.innerGlow).toBeGreaterThan(premium.innerGlow);

    expect(flagship.revealDuration).toBeGreaterThanOrEqual(premium.revealDuration);
    expect(premium.revealDuration).toBeGreaterThanOrEqual(standard.revealDuration);
  });

  it('falls back to the standard presentation for unknown or missing tiers', () => {
    const standard = LUCKY_CARD_TIER_PRESENTATION.standard;

    expect(getLuckyCardTierPresentation(undefined)).toBe(standard);
    expect(getLuckyCardTierPresentation(null)).toBe(standard);
    expect(getLuckyCardTierPresentation('')).toBe(standard);
    expect(getLuckyCardTierPresentation('mythic')).toBe(standard);
    // Own-property lookup only: inherited members must not resolve.
    expect(getLuckyCardTierPresentation('toString')).toBe(standard);
    expect(getLuckyCardTierPresentation('constructor')).toBe(standard);
  });
});
