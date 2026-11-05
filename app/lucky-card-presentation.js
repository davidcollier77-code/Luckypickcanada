/**
 * Presentation values for the three collectible Lucky Card tiers.
 *
 * The accents reuse the colours already painted by the reveal canvas in
 * `app/lucky-card-reveal.js` (standard bronze, premium pewter, flagship gold),
 * so the revealed card, its halo and its frame agree with the beam choreography
 * instead of introducing a second palette.
 *
 * These values are presentation-only: card artwork, weighting, quotes and the
 * reveal animation timings live elsewhere and are not derived from this file.
 */
export const LUCKY_CARD_TIER_PRESENTATION = {
  standard: {
    id: 'standard',
    label: 'Standard',
    glyph: '★',
    accent: '#e09440',
    accentRgb: '224, 148, 64',
    chipText: '#ffe2bd',
    haloOpacity: 0.26,
    haloBlur: 44,
    rimOpacity: 0.42,
    rimBlur: 26,
    revealDuration: 0.5,
    frameOpacity: 0.4,
    innerGlow: 0.16,
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    glyph: '◆',
    accent: '#c8ccd0',
    accentRgb: '200, 204, 208',
    chipText: '#f4f7fa',
    haloOpacity: 0.3,
    haloBlur: 46,
    rimOpacity: 0.5,
    rimBlur: 32,
    revealDuration: 0.55,
    frameOpacity: 0.5,
    innerGlow: 0.2,
  },
  flagship: {
    id: 'flagship',
    label: 'Flagship',
    glyph: '♛',
    accent: '#daa520',
    accentRgb: '218, 165, 32',
    chipText: '#ffefb8',
    haloOpacity: 0.38,
    haloBlur: 52,
    rimOpacity: 0.62,
    rimBlur: 42,
    revealDuration: 0.6,
    frameOpacity: 0.62,
    innerGlow: 0.26,
  },
};

const FALLBACK_TIER = 'standard';

/**
 * Resolve the presentation for a card tier.
 *
 * Uses an own-property lookup so unexpected values such as `toString` or
 * `constructor` cannot resolve to an inherited prototype member, and falls back
 * to the Standard treatment for any unrecognised tier.
 */
export function getLuckyCardTierPresentation(tier) {
  if (typeof tier === 'string' && Object.hasOwn(LUCKY_CARD_TIER_PRESENTATION, tier)) {
    return LUCKY_CARD_TIER_PRESENTATION[tier];
  }
  return LUCKY_CARD_TIER_PRESENTATION[FALLBACK_TIER];
}
