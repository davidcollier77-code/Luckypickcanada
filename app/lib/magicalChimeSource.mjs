/**
 * Canonical URL for the short Explore Your Luck chime.
 *
 * The application audio loader and Next.js Content Security Policy derive
 * their configuration from this single source to prevent origin drift.
 */
export const MAGICAL_CHIME_URL =
  'https://assets.mixkit.co/sfx/preview/mixkit-fairy-magic-sparkle-871.wav';

export const MAGICAL_CHIME_CSP_ORIGIN = new URL(MAGICAL_CHIME_URL).origin;
