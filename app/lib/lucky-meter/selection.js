/**
 * Daily selections for the Lucky Meter.
 *
 * Four independent, uniformly weighted choices are made for each local day:
 * the percentage, the Lucky Number, the Lucky Colour and the Little Spark.
 *
 * The percentage is the single source of truth for the reveal: it decides the
 * tier and the tier decides the event. Every other choice is independent, so a
 * colour, number or Spark never influences the percentage and the dial /
 * colour ring never select anything.
 *
 * Repeat protection is deliberately minimal. Each choice excludes only the
 * value in the most recent saved result; anything older is eligible again the
 * next day. Because the event follows from the percentage, the same event may
 * run on consecutive days (different percentages in the same tier are valid).
 *
 * Every selector accepts an injectable random function so the distributions and
 * guards can be tested deterministically.
 */
import {
  COLOURS,
  COLOURS_BY_ID,
  EVENTS_BY_ID,
  LUCKY_NUMBER_MAX,
  LUCKY_NUMBER_MIN,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
  TIERS,
  TIERS_BY_ID,
} from './config';
import { LITTLE_SPARKS, SPARKS_BY_ID } from './little-sparks';

function clampRandom(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  // Math.random() is < 1 by contract; guard against a test double returning 1.
  return value >= 1 ? 0.999999999 : value;
}

function randomIndex(length, random) {
  return Math.floor(clampRandom(random()) * length);
}

export function getTierForPercentage(percentage) {
  const value = Number(percentage);
  return TIERS.find((tier) => value >= tier.min && value <= tier.max) || null;
}

/**
 * The one event a percentage may show. `null` outside the valid 5–100 range.
 *
 * @param {number} percentage
 * @returns {{ id: string, name: string } | null}
 */
export function getEventForPercentage(percentage) {
  const tier = getTierForPercentage(percentage);
  if (!tier) return null;
  return EVENTS_BY_ID.get(tier.eventId) || null;
}

/** The canonical event id for a tier id, or null for an unknown tier. */
export function getEventIdForTier(tierId) {
  const tier = TIERS_BY_ID.get(tierId);
  return tier ? tier.eventId : null;
}

/**
 * Reads the single most recent entry of a history list.
 *
 * History is always newest-first, and "most recent" means the newest stored
 * result only — skipped days change nothing about which value that is.
 */
function mostRecentEntry(history) {
  if (!Array.isArray(history) || history.length === 0) return null;
  return history[0];
}

/**
 * Draws an integer percentage in [5, 100], never 0, avoiding only the single
 * most recent saved percentage. The draw is uniform across the remaining 95
 * values, so the original range, distribution and weighting are preserved.
 *
 * @param {number[]} [recentPercentages] Last known results, newest first.
 * @param {() => number} [random] Injectable random source.
 * @returns {number} Percentage inside the generated range.
 */
export function pickPercentage(recentPercentages = [], random = Math.random) {
  const newest = mostRecentEntry(recentPercentages);
  const avoid = Number.isInteger(Number(newest)) ? Number(newest) : null;

  const candidates = [];
  for (let value = PERCENTAGE_MIN; value <= PERCENTAGE_MAX; value += 1) {
    if (value === avoid) continue;
    candidates.push(value);
  }

  // 95 values remain when one is excluded, so this cannot fall through in
  // practice; the guard keeps a malformed history from returning undefined.
  return candidates.length > 0
    ? candidates[randomIndex(candidates.length, random)]
    : PERCENTAGE_MIN;
}

/**
 * Draws the single Lucky Number uniformly from 1–50, excluding only the number
 * in the most recent saved result.
 *
 * @param {number[]} [recentNumbers] Last known numbers, newest first.
 * @param {() => number} [random] Injectable random source.
 * @returns {number} Integer inside the Lucky Number range.
 */
export function pickLuckyNumber(recentNumbers = [], random = Math.random) {
  const newest = mostRecentEntry(recentNumbers);
  const candidate = Number(newest);
  const avoid =
    Number.isInteger(candidate) && candidate >= LUCKY_NUMBER_MIN && candidate <= LUCKY_NUMBER_MAX
      ? candidate
      : null;

  const pool = [];
  for (let value = LUCKY_NUMBER_MIN; value <= LUCKY_NUMBER_MAX; value += 1) {
    if (value === avoid) continue;
    pool.push(value);
  }
  return pool.length > 0 ? pool[randomIndex(pool.length, random)] : LUCKY_NUMBER_MIN;
}

/**
 * Equal-probability colour selection from the twelve approved colours,
 * excluding only the colour id in the most recent saved result.
 *
 * @param {string[]} [recentColours] Last known colour ids, newest first.
 * @param {() => number} [random] Injectable random source.
 * @returns {{ id: string, name: string, hex: string, light?: boolean }}
 */
export function pickColour(recentColours = [], random = Math.random) {
  const newest = mostRecentEntry(recentColours);
  const avoid = typeof newest === 'string' && COLOURS_BY_ID.has(newest) ? newest : null;
  const pool = avoid ? COLOURS.filter((colour) => colour.id !== avoid) : COLOURS;
  return pool[randomIndex(pool.length, random)];
}

/**
 * Selects a Spark uniformly from the thirty messages, excluding only the Spark
 * in the most recent saved result. The full list is kept as a defensive
 * fallback so a corrupt history can never leave nothing to show.
 */
export function pickSpark(sparkHistory = [], random = Math.random) {
  const newest = mostRecentEntry(sparkHistory);
  const avoid = typeof newest === 'string' && SPARKS_BY_ID.has(newest) ? newest : null;
  const pool = avoid ? LITTLE_SPARKS.filter((spark) => spark.id !== avoid) : LITTLE_SPARKS;
  return pool[randomIndex(pool.length, random)];
}

/**
 * Builds the complete, self-contained daily result that is persisted and later
 * re-rendered without any further random choices.
 *
 * The percentage is drawn first; the tier and event are read from it. The Lucky
 * Number, colour and Spark are drawn independently from the same random source,
 * each excluding only its own most recent previous value.
 *
 * @param {{ dateKey: string, history?: object, random?: () => number }} options
 * @returns {object} Complete daily result.
 */
export function createDailyResult({ dateKey, history = {}, random = Math.random } = {}) {
  if (typeof dateKey !== 'string' || dateKey.length === 0) {
    throw new TypeError('createDailyResult requires a local date key');
  }

  const percentage = pickPercentage(history.percentages, random);
  const tier = getTierForPercentage(percentage);
  const event = getEventForPercentage(percentage);
  const luckyNumber = pickLuckyNumber(history.numbers, random);
  const colour = pickColour(history.colours, random);
  const spark = pickSpark(history.sparks, random);

  return {
    dateKey,
    percentage,
    tier: {
      id: tier.id,
      label: tier.label,
      message: tier.message,
    },
    event: { id: event.id, name: event.name },
    luckyNumber,
    colour: {
      id: colour.id,
      name: colour.name,
      hex: colour.hex,
      light: colour.light === true,
    },
    spark: { id: spark.id, message: spark.message },
    createdAt: Date.now(),
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** True when a stored result already carries a usable Lucky Number. */
export function hasValidLuckyNumber(value) {
  if (!isPlainObject(value)) return false;
  const number = value.luckyNumber;
  return (
    Number.isInteger(number) && number >= LUCKY_NUMBER_MIN && number <= LUCKY_NUMBER_MAX
  );
}

/**
 * Validates a persisted result against the current definitions.
 *
 * The percentage is the authority for the reveal: the tier and event are
 * recomputed from it, so a result saved under an older tier band keeps its
 * percentage, colour, Spark, Lucky Number and date while its reveal is
 * normalised to the event that percentage now means.
 *
 * Migration never rerolls a saved percentage, colour or Spark. A result saved
 * before the Lucky Number existed is given exactly one independent draw; the
 * caller persists it so a refresh cannot roll a different number. Only
 * genuinely invalid data returns null.
 *
 * @param {object} value Stored result payload.
 * @param {string} [expectedDateKey] Local date key the result must belong to.
 * @param {() => number} [random] Injectable random source for the one migration draw.
 * @returns {object | null}
 */
export function validateDailyResult(value, expectedDateKey, random = Math.random) {
  if (!isPlainObject(value)) return null;

  const { dateKey, percentage } = value;
  if (typeof dateKey !== 'string' || dateKey.length === 0) return null;
  if (expectedDateKey && dateKey !== expectedDateKey) return null;
  if (!Number.isInteger(percentage) || percentage < PERCENTAGE_MIN || percentage > PERCENTAGE_MAX) {
    return null;
  }

  const tier = getTierForPercentage(percentage);
  if (!tier) return null;
  const event = getEventForPercentage(percentage);
  if (!event) return null;

  const colour = COLOURS_BY_ID.get(value.colour?.id);
  if (!colour) return null;
  const spark = SPARKS_BY_ID.get(value.spark?.id);
  if (!spark) return null;

  const luckyNumber = hasValidLuckyNumber(value)
    ? value.luckyNumber
    : pickLuckyNumber([], random);

  return {
    dateKey,
    percentage,
    tier: {
      id: tier.id,
      label: tier.label,
      message: tier.message,
    },
    event: { id: event.id, name: event.name },
    luckyNumber,
    colour: {
      id: colour.id,
      name: colour.name,
      hex: colour.hex,
      light: colour.light === true,
    },
    spark: { id: spark.id, message: spark.message },
    // A saved date, colour, Spark and number are preserved; only the derived
    // reveal is normalised, so storage is never cleared or rolled again.
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : 0,
  };
}
