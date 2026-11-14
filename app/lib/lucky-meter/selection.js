/**
 * Independent daily selections for the Lucky Meter.
 *
 * Percentage, event, colour and Little Spark are drawn independently. The tier
 * is derived from the percentage because the tier definitions are percentage
 * ranges, but the other three selections never depend on the percentage.
 *
 * Every selector accepts an injectable random function so the distributions and
 * repeat guards can be tested deterministically.
 */
import {
  COLOURS,
  COLOURS_BY_ID,
  EVENTS,
  EVENTS_BY_ID,
  HISTORY_LIMITS,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
  TIERS,
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
 * Draws an integer percentage in [5, 100], never 0, avoiding the last three
 * persisted values. A bounded retry keeps the draw unbiased in practice.
 */
export function pickPercentage(recentPercentages = [], random = Math.random) {
  const avoid = new Set(
    (Array.isArray(recentPercentages) ? recentPercentages : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value))
      .slice(0, HISTORY_LIMITS.percentages),
  );

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const value = PERCENTAGE_MIN + randomIndex(PERCENTAGE_MAX - PERCENTAGE_MIN + 1, random);
    if (!avoid.has(value)) return value;
  }

  // Deterministic fallback: the distribution is 96 values wide, so at most three
  // are ever excluded. Start from a random offset and find the first free value.
  const span = PERCENTAGE_MAX - PERCENTAGE_MIN + 1;
  const offset = randomIndex(span, random);
  for (let step = 0; step < span; step += 1) {
    const value = PERCENTAGE_MIN + ((offset + step) % span);
    if (!avoid.has(value)) return value;
  }
  return PERCENTAGE_MIN;
}

function weightedPick(candidates, random) {
  const total = candidates.reduce((sum, item) => sum + item.weight, 0);
  let threshold = clampRandom(random()) * total;
  for (const item of candidates) {
    threshold -= item.weight;
    if (threshold < 0) return item;
  }
  return candidates[candidates.length - 1];
}

/**
 * Weighted event selection: Meteor 42%, Lightning 38%, Fireworks 20%.
 *
 * Three consecutive repeats are prevented by re-selecting from the full weight
 * table with the repeated event excluded — not by rotating through a fixed
 * order. When the last two events differ (or history is short), a normal
 * weighted draw is used.
 */
export function pickEvent(eventHistory = [], random = Math.random) {
  const recent = (Array.isArray(eventHistory) ? eventHistory : []).filter((id) => EVENTS_BY_ID.has(id));
  const blockedId = recent.length >= 2 && recent[0] === recent[1] ? recent[0] : null;
  const pool = blockedId ? EVENTS.filter((event) => event.id !== blockedId) : EVENTS;
  return weightedPick(pool, random);
}

/** Equal-probability colour selection from the twelve approved colours. */
export function pickColour(random = Math.random) {
  return COLOURS[randomIndex(COLOURS.length, random)];
}

/** Selects a Spark while avoiding the recently used ids. */
export function pickSpark(sparkHistory = [], random = Math.random) {
  const recent = new Set(
    (Array.isArray(sparkHistory) ? sparkHistory : []).filter((id) => SPARKS_BY_ID.has(id)),
  );
  const fresh = LITTLE_SPARKS.filter((spark) => !recent.has(spark.id));
  const pool = fresh.length > 0 ? fresh : LITTLE_SPARKS;
  return pool[randomIndex(pool.length, random)];
}

/**
 * Builds the complete, self-contained daily result that is persisted and later
 * re-rendered without any further random choices.
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
  const event = pickEvent(history.events, random);
  const colour = pickColour(random);
  const spark = pickSpark(history.sparks, random);

  return {
    dateKey,
    percentage,
    tier: { id: tier.id, label: tier.label, message: tier.message },
    event: { id: event.id, name: event.name, numbers: [...event.numbers] },
    colour: { id: colour.id, name: colour.name, hex: colour.hex },
    spark: { id: spark.id, message: spark.message },
    createdAt: Date.now(),
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Validates a persisted result against the current definitions. A corrupt or
 * out-of-date record returns null and is treated as "no result today" rather
 * than rendering partial data or crashing the page.
 */
export function validateDailyResult(value, expectedDateKey) {
  if (!isPlainObject(value)) return null;

  const { dateKey, percentage } = value;
  if (typeof dateKey !== 'string' || dateKey.length === 0) return null;
  if (expectedDateKey && dateKey !== expectedDateKey) return null;
  if (!Number.isInteger(percentage) || percentage < PERCENTAGE_MIN || percentage > PERCENTAGE_MAX) {
    return null;
  }

  const tier = getTierForPercentage(percentage);
  if (!tier) return null;

  const event = EVENTS_BY_ID.get(value.event?.id);
  if (!event) return null;
  const colour = COLOURS_BY_ID.get(value.colour?.id);
  if (!colour) return null;
  const spark = SPARKS_BY_ID.get(value.spark?.id);
  if (!spark) return null;

  return {
    dateKey,
    percentage,
    tier: { id: tier.id, label: tier.label, message: tier.message },
    event: { id: event.id, name: event.name, numbers: [...event.numbers] },
    colour: { id: colour.id, name: colour.name, hex: colour.hex },
    spark: { id: spark.id, message: spark.message },
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : 0,
  };
}
