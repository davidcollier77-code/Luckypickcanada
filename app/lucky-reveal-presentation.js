// Presentation-only helpers shared by the Lucky Reveal popup and its static
// share image. Nothing here generates, replaces, or reorders lucky results: the
// same stored numbers, colour, and day always drive both presentations.

export const LUCKY_SITE_URL = 'https://luckypickcanada.ca';
export const LUCKY_SITE_HOST = 'luckypickcanada.ca';

// Three centred numbers on the first row and three centred on the second for a
// 6 Pick. A 7 Pick shows four on the first row and three centred underneath.
const NUMBER_ROW_LAYOUTS = {
  6: [3, 3],
  7: [4, 3],
};

/**
 * Splits the stored lucky numbers into display rows without touching their
 * order. Numbers outside a known layout stay visible in a trailing row.
 *
 * @param {number[]} numbers Stored lucky numbers.
 * @returns {number[][]} Rows of numbers, in their original order.
 */
export function splitLuckyNumberRows(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return [];
  }

  const layout = NUMBER_ROW_LAYOUTS[numbers.length] || [numbers.length];
  const rows = [];
  let offset = 0;

  for (const rowSize of layout) {
    if (offset >= numbers.length) break;
    const row = numbers.slice(offset, offset + rowSize);
    if (row.length > 0) rows.push(row);
    offset += rowSize;
  }

  if (offset < numbers.length) {
    rows.push(numbers.slice(offset));
  }

  return rows;
}

// Each lucky colour keeps a swatch that actually represents it. The gold,
// green, silver, and blue treatments reuse the palette the reveal already uses
// for its border glow and colour card.
export const LUCKY_COLOR_SWATCHES = {
  'Aurora Green': { from: '#a7f3d0', to: '#047857', ring: 'rgba(52, 211, 153, 0.65)' },
  'Star Gold': { from: '#fef3c7', to: '#b45309', ring: 'rgba(251, 191, 36, 0.7)' },
  'Midnight Blue': { from: '#bfdbfe', to: '#1e3a8a', ring: 'rgba(96, 165, 250, 0.65)' },
  'Lucky Red': { from: '#fecaca', to: '#991b1b', ring: 'rgba(248, 113, 113, 0.65)' },
  'Moonlight Silver': { from: '#ffffff', to: '#8fa3b8', ring: 'rgba(226, 232, 240, 0.7)' },
  'Northern Purple': { from: '#e9d5ff', to: '#5b21b6', ring: 'rgba(167, 139, 250, 0.65)' },
  'Sky Blue': { from: '#cffafe', to: '#0369a1', ring: 'rgba(34, 211, 238, 0.65)' },
};

const DEFAULT_LUCKY_COLOR_SWATCH = LUCKY_COLOR_SWATCHES['Star Gold'];

/**
 * Returns the swatch that represents a lucky colour. A stored colour outside the
 * current vocabulary keeps its own name and falls back to the gold treatment
 * rather than pretending to be a different colour.
 *
 * @param {string} luckyColor Lucky colour name.
 * @returns {{from: string, to: string, ring: string}} Swatch colours.
 */
export function getLuckyColorSwatch(luckyColor) {
  return LUCKY_COLOR_SWATCHES[luckyColor] || DEFAULT_LUCKY_COLOR_SWATCH;
}

/**
 * CSS background for the on-screen colour swatch.
 *
 * @param {string} luckyColor Lucky colour name.
 * @returns {string} Radial gradient that reads as a glossy swatch.
 */
export function getLuckyColorSwatchGradient(luckyColor) {
  const { from, to } = getLuckyColorSwatch(luckyColor);
  return `radial-gradient(circle at 32% 26%, ${from} 0%, ${to} 100%)`;
}

/**
 * The link shared with the reveal: the result's own page when the caller supplied
 * one, otherwise the website. Only same-site HTTPS links are accepted, so an
 * unexpected value can never put a third-party URL in a native share payload.
 *
 * @param {{resultUrl?: string}} [reveal] Reveal data.
 * @returns {string} Absolute share link.
 */
export function getShareLink(reveal) {
  const candidate = typeof reveal?.resultUrl === 'string' ? reveal.resultUrl : '';

  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' && [LUCKY_SITE_HOST, `www.${LUCKY_SITE_HOST}`].includes(url.hostname)) {
      return url.toString();
    }
  } catch {
    // No usable result link; the website link below is always valid.
  }

  return LUCKY_SITE_URL;
}

/**
 * Accompanying text for a native share. Kept to the reveal that was already
 * shown so sharing never implies a new result.
 *
 * @param {{game: {name: string, numbers: number[]}, luckyColor: string, luckyDay: string}} reveal Reveal data.
 * @returns {string} Share text including the LuckyPickCanada link.
 */
export function buildShareMessage(reveal) {
  const numbers = reveal.game.numbers.join(', ');

  return `I just revealed my ${reveal.game.name} on LuckyPickCanada.ca: ${numbers}. Lucky color: ${reveal.luckyColor}. Lucky day: ${reveal.luckyDay}. ${LUCKY_SITE_URL}`;
}
