/**
 * Daily selections for the Lucky Meter.
 *
 * The percentage is generated first and is the single source of truth for the
 * reveal: it decides the tier, the tier decides the event and the number set,
 * and the dial is animated to that same percentage. Colour and Little Spark
 * remain independent choices.
 *
 * Repeat protection is preserved without breaking that mapping. Three days in a
 * row must not repeat an event, and because the event follows from the tier,
 * the third draw avoids the whole tier band that would repeat it. Percentages
 * from the last three days are still avoided too.
 *
 * Every selector accepts an injectable random function so the distributions and
 * guards can be tested deterministically.
 */
import {
  COLOURS,
  COLOURS_BY_ID,
  EVENTS_BY_ID,
  HISTORY_LIMITS,
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
 * Draws an integer percentage in [5, 100], never 0, avoiding the last three
 * persisted values and — when supplied — any value whose tier would repeat a
 * blocked event.
 *
 * @param {number[]} [recentPercentages] Last known results, newest first.
 * @param {() => number} [random] Injectable random source.
 * @param {string | null} [blockedEventId] Event the next draw must not produce.
 * @returns {number} Percentage inside the generated range.
 */
export function pickPercentage(
  recentPercentages = [],
  random = Math.random,
  blockedEventId = null,
) {
  const avoid = new Set(
    (Array.isArray(recentPercentages) ? recentPercentages : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value))
      .slice(0, HISTORY_LIMITS.percentages),
  );

  const candidates = [];
  for (let value = PERCENTAGE_MIN; value <= PERCENTAGE_MAX; value += 1) {
    if (avoid.has(value)) continue;
    if (blockedEventId && getEventForPercentage(value)?.id === blockedEventId) continue;
    candidates.push(value);
  }

  if (candidates.length > 0) {
    return candidates[randomIndex(candidates.length, random)];
  }

  // Defensive only: 96 values exist and at most three percentages plus one
  // event band are excluded, so an empty pool cannot occur in practice.
  const span = PERCENTAGE_MAX - PERCENTAGE_MIN + 1;
  const offset = randomIndex(span, random);
  for (let step = 0; step < span; step += 1) {
    const value = PERCENTAGE_MIN + ((offset + step) % span);
    if (!avoid.has(value)) return value;
  }
  return PERCENTAGE_MIN;
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
 * The percentage is drawn first; the tier, event and numbers are all read from
 * it. The only repeat guard that influences the draw is the three-day event
 * guard, which is expressed as "do not draw this event's tier band".
 *
 * @param {{ dateKey: string, history?: object, random?: () => number }} options
 * @returns {object} Complete daily result.
 */
export function createDailyResult({ dateKey, history = {}, random = Math.random } = {}) {
  if (typeof dateKey !== 'string' || dateKey.length === 0) {
    throw new TypeError('createDailyResult requires a local date key');
  }

  const recentEvents = (Array.isArray(history.events) ? history.events : []).filter((id) =>
    EVENTS_BY_ID.has(id),
  );
  // Two identical events in a row would make a third a three-peat.
  const blockedEventId =
    recentEvents.length >= 2 && recentEvents[0] === recentEvents[1] ? recentEvents[0] : null;

  const percentage = pickPercentage(history.percentages, random, blockedEventId);
  const tier = getTierForPercentage(percentage);
  const event = getEventForPercentage(percentage);
  const colour = pickColour(random);
  const spark = pickSpark(history.sparks, random);

  return {
    dateKey,
    percentage,
    tier: {
      id: tier.id,
      label: tier.label,
      message: tier.message,
      numbers: [...tier.numbers],
    },
    event: { id: event.id, name: event.name },
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

/**
 * Validates a persisted result against the current definitions.
 *
 * The percentage is the authority: the tier, event and numbers are recomputed
 * from it, so a result saved under the old independent event weighting (or an
 * old tier band) keeps its percentage, colour, Spark and date while its reveal
 * is normalised to the event that percentage now means. Only genuinely invalid
 * data returns null.
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
  const event = getEventForPercentage(percentage);
  if (!event) return null;

  const colour = COLOURS_BY_ID.get(value.colour?.id);
  if (!colour) return null;
  const spark = SPARKS_BY_ID.get(value.spark?.id);
  if (!spark) return null;

  return {
    dateKey,
    percentage,
    tier: {
      id: tier.id,
      label: tier.label,
      message: tier.message,
      numbers: [...tier.numbers],
    },
    event: { id: event.id, name: event.name },
    colour: {
      id: colour.id,
      name: colour.name,
      hex: colour.hex,
      light: colour.light === true,
    },
    spark: { id: spark.id, message: spark.message },
    // A saved date, colour and Spark are preserved; only the derived reveal is
    // normalised, so storage is never cleared or rolled again.
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : 0,
  };
}
