import { describe, expect, it } from 'vitest';
import {
  LUCKY_CARD_TIER_PRESENTATION,
  getLuckyCardTierPresentation,
} from '../app/lucky-card-presentation';
import { LUCKY_CARDS } from '../app/lucky-card-data';

/**
 * Contract guard for `specs/094-lucky-card-reveal-polish` (base tier palette)
 * and `specs/101-lucky-card-reveal-cinematics` (cinematic stage + shared finish).
 *
 * The revealed card presentation is driven entirely by this module, so the tier
 * vocabulary the collection actually ships must have one complete, distinct and
 * escalating treatment per tier, and every shipped card must resolve the same
 * complete finish palette.
 */

const CINEMATIC_KEYS = [
  'spotlightOpacity',
  'shockwaveOpacity',
  'shockwaveScale',
  'glossOpacity',
  'sweepDuration',
  'emberOpacity',
];

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

  it('gives every shipped card the same complete cinematic finish palette', () => {
    expect(LUCKY_CARDS.length).toBeGreaterThan(0);

    for (const card of LUCKY_CARDS) {
      const presentation = getLuckyCardTierPresentation(card.tier);

      for (const key of CINEMATIC_KEYS) {
        expect(typeof presentation[key], `${card.id} ${key}`).toBe('number');
        expect(presentation[key], `${card.id} ${key}`).toBeGreaterThan(0);
      }

      // The finish must stay a finish: strong enough to read, never opaque
      // enough to hide the authored artwork underneath it.
      expect(presentation.glossOpacity, `${card.id} glossOpacity`).toBeLessThanOrEqual(0.4);
      expect(presentation.spotlightOpacity, `${card.id} spotlightOpacity`).toBeLessThanOrEqual(0.6);
      expect(presentation.shockwaveOpacity, `${card.id} shockwaveOpacity`).toBeLessThanOrEqual(1);
      expect(presentation.emberOpacity, `${card.id} emberOpacity`).toBeLessThanOrEqual(1);
    }
  });

  it('escalates the cinematic stage from standard to premium to flagship', () => {
    const standard = getLuckyCardTierPresentation('standard');
    const premium = getLuckyCardTierPresentation('premium');
    const flagship = getLuckyCardTierPresentation('flagship');

    expect(premium.spotlightOpacity).toBeGreaterThan(standard.spotlightOpacity);
    expect(flagship.spotlightOpacity).toBeGreaterThan(premium.spotlightOpacity);

    expect(premium.shockwaveOpacity).toBeGreaterThan(standard.shockwaveOpacity);
    expect(flagship.shockwaveOpacity).toBeGreaterThan(premium.shockwaveOpacity);

    expect(premium.shockwaveScale).toBeGreaterThan(standard.shockwaveScale);
    expect(flagship.shockwaveScale).toBeGreaterThan(premium.shockwaveScale);

    expect(premium.glossOpacity).toBeGreaterThan(standard.glossOpacity);
    expect(flagship.glossOpacity).toBeGreaterThan(premium.glossOpacity);

    expect(premium.sweepDuration).toBeGreaterThan(standard.sweepDuration);
    expect(flagship.sweepDuration).toBeGreaterThan(premium.sweepDuration);

    expect(premium.emberOpacity).toBeGreaterThan(standard.emberOpacity);
    expect(flagship.emberOpacity).toBeGreaterThan(premium.emberOpacity);

    // The shockwave stays a card-scaled event rather than filling the viewport.
    expect(flagship.shockwaveScale).toBeLessThanOrEqual(2);
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
