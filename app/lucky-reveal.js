// Single source of truth for Lucky Reveal content. The website reveal and the
// Gift Edition email both use this module, so one purchase option can never
// produce a different shape or distribution from the other.

export const LUCKY_COLORS = [
  'Aurora Green',
  'Star Gold',
  'Midnight Blue',
  'Lucky Red',
  'Moonlight Silver',
  'Northern Purple',
  'Sky Blue',
];

export const LUCKY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const GAME_SIZES = {
  6: { count: 6, max: 49, label: '6 Pick' },
  7: { count: 7, max: 50, label: '7 Pick' },
};

/**
 * Normalizes the stored game value, which appears as `6`/`7` in Stripe
 * metadata and as `6 Pick`/`7 Pick` in presentation data.
 *
 * @param {string} game Stored or displayed game value.
 * @returns {'6'|'7'} The normalized game size.
 */
export function normalizeLuckyPickGame(game) {
  return game === '7' || game === '7 Pick' ? '7' : '6';
}

export function generateLuckyNumbers(count, max) {
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const swapIndex = randomBuffer[0] % (index + 1);
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers.slice(0, count).sort((a, b) => a - b);
}

function pickOne(items) {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return items[randomBuffer[0] % items.length];
}

/**
 * Creates a fresh reveal for the paid Lucky Reveal experience.
 *
 * @param {string} luckyPickGame Selected 6 Pick or 7 Pick game.
 * @returns {{game: {name: string, numbers: number[]}, luckyColor: string, luckyDay: string}}
 */
export function createLuckyReveal(luckyPickGame) {
  const game = normalizeLuckyPickGame(luckyPickGame);
  const { count, max, label } = GAME_SIZES[game];

  return {
    game: {
      name: label,
      numbers: generateLuckyNumbers(count, max),
    },
    luckyColor: pickOne(LUCKY_COLORS),
    luckyDay: pickOne(LUCKY_DAYS),
  };
}

/**
 * Checks a number set against the rules of its game before it is presented or
 * emailed.
 *
 * @param {number[]} numbers Numbers to validate.
 * @param {string} luckyPickGame Selected 6 Pick or 7 Pick game.
 * @returns {boolean} True when the numbers are complete, unique, and in range.
 */
export function hasValidLuckyNumbers(numbers, luckyPickGame) {
  const { count, max } = GAME_SIZES[normalizeLuckyPickGame(luckyPickGame)];

  return (
    Array.isArray(numbers) &&
    numbers.length === count &&
    numbers.every((number) => Number.isInteger(number) && number >= 1 && number <= max) &&
    new Set(numbers).size === count
  );
}

/**
 * Maps any stored or verified reveal source into the single shape consumed by
 * `LuckyRevealPopup`. Returns null when the numbers cannot be trusted, so a
 * caller never invents results that differ from what was paid for.
 *
 * @param {{game?: string, numbers?: number[], luckyColor?: string, luckyDay?: string}} source Reveal data.
 * @returns {{game: {name: string, numbers: number[]}, luckyColor: string, luckyDay: string}|null}
 */
export function buildLuckyReveal({ game, numbers, luckyColor, luckyDay }) {
  const normalizedGame = normalizeLuckyPickGame(game);
  const parsedNumbers = Array.isArray(numbers) ? numbers.map((number) => Number(number)) : [];

  if (!hasValidLuckyNumbers(parsedNumbers, normalizedGame)) {
    return null;
  }

  return {
    game: {
      name: GAME_SIZES[normalizedGame].label,
      numbers: parsedNumbers,
    },
    luckyColor:
      typeof luckyColor === 'string' && luckyColor.trim() ? luckyColor : LUCKY_COLORS[0],
    luckyDay: typeof luckyDay === 'string' && luckyDay.trim() ? luckyDay : LUCKY_DAYS[0],
  };
}
