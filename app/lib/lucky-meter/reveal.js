/**
 * Reveal timing and the three motions that settle the daily reading.
 *
 * The percentage dial, the Lucky Number pointer and the segmented colour ring
 * all start at the same instant and settle in a staggered order inside roughly
 * one and a quarter seconds. Only then does the percentage-selected cinematic
 * begin, and only after a one-second pause once the cinematic has finished does
 * a tiny point of light write the Spark across the sky.
 *
 * Each motion lands on a value that was already chosen. The dial stops on the
 * exact angle that represents the percentage, the number pointer stops on the
 * number's own sector and the colour ring stops with the selected colour at its
 * marker, so none of them can select or change a result.
 */
import {
  COLOURS,
  COLOURS_BY_ID,
  EVENTS_BY_ID,
  LUCKY_NUMBER_MAX,
  LUCKY_NUMBER_MIN,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
} from './config';

export const REVEAL_TIMING = Object.freeze({
  /**
   * A short held breath after Start. Nothing moves, so the three motions can
   * arrive as one deliberate gesture instead of a reaction to the click.
   */
  anticipationMs: 500,
  /** When the percentage dial, its flash and the tier text settle. */
  percentageSettleMs: 3200,
  /** When the Lucky Number pointer comes to rest on its number. */
  numberSettleMs: 5400,
  /** When the segmented colour ring comes to rest on its colour. */
  colourSettleMs: 7400,
  /** Every motion has settled by this point. */
  spinMs: 7400,
  /** Two or three flashes of the real number on landing. */
  flashMs: 700,
  flashCount: 3,
  /** Short anticipation after the last settle before the cinematic starts. */
  eventDelayMs: 420,
  /**
   * The sky is still after the cinematic. The Spark gathers for this long
   * before the first character of light appears.
   */
  sparkStartDelayMs: 1000,
  /** Sky-writing cadence: one character at a time, with punctuation pauses. */
  sparkMsPerCharacter: 26,
  sparkPunctuationPauseMs: 150,
});

/** Milliseconds from the Start press until the cinematic event begins. */
export const EVENT_START_MS =
  REVEAL_TIMING.anticipationMs +
  REVEAL_TIMING.colourSettleMs +
  REVEAL_TIMING.eventDelayMs;

/** A full circle is 100%, so one percentage point is 3.6 degrees. */
export const DEGREES_PER_PERCENT = 360 / 100;

/** Bounds for the dial's spin distance, in full turns. */
export const DIAL_TURNS = Object.freeze({ min: 2, max: 3 });

/** One sector per Lucky Number, arranged clockwise from 12 o'clock. */
export const NUMBER_STEPS = LUCKY_NUMBER_MAX - LUCKY_NUMBER_MIN + 1;
export const DEGREES_PER_NUMBER = 360 / NUMBER_STEPS;

/** One segment per approved Lucky Colour. */
export const COLOUR_STEPS = COLOURS.length;
export const DEGREES_PER_COLOUR = 360 / COLOUR_STEPS;

function clampPercentage(value) {
  return Math.max(PERCENTAGE_MIN, Math.min(PERCENTAGE_MAX, Math.round(value)));
}

function clampRandom(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999999, value));
}

/** Wraps any angle into [0, 360). */
export function normalizeAngle(angle) {
  const value = Number(angle);
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

/** The dial position, in degrees clockwise from 12 o'clock, for a percentage. */
export function percentageToAngle(percentage) {
  return clampPercentage(percentage) * DEGREES_PER_PERCENT;
}

/**
 * The percentage represented by a dial position.
 *
 * 100% is a full turn, which wraps to 0°: the top of the dial means the whole
 * range rather than the impossible 0% result. Every other position is its
 * fraction of the circle.
 */
export function angleToPercentage(angle) {
  const normalised = normalizeAngle(angle);
  if (normalised < 1e-9) return PERCENTAGE_MAX;
  return clampPercentage((normalised / 360) * 100);
}

function nudgeAwayFromFinal(value, finalPercentage) {
  const clamped = clampPercentage(value);
  if (clamped !== finalPercentage) return clamped;
  if (clamped < PERCENTAGE_MAX) return clamped + 1;
  if (clamped > PERCENTAGE_MIN) return clamped - 1;
  return clamped;
}

/**
 * Builds this reveal's percentage spin: a random starting angle, two to three
 * full turns, and the exact end angle for the result.
 *
 * `totalSweep` is chosen so the final angle lands on `endAngle` after a whole
 * number of turns plus the remaining arc. Nothing overshoots or settles, so the
 * pointer's physical resting position is the percentage.
 *
 * @param {number} finalPercentage The generated result.
 * @param {() => number} random Injectable random source.
 * @returns {{ startAngle: number, endAngle: number, turns: number, totalSweep: number }}
 */
export function buildDialSpin(finalPercentage, random = Math.random) {
  const endAngle = percentageToAngle(finalPercentage);
  const turns =
    DIAL_TURNS.min +
    Math.floor(clampRandom(random()) * (DIAL_TURNS.max - DIAL_TURNS.min + 1));
  // A small random lead-in keeps the pointer from always starting at 12 o'clock.
  const startAngle = clampRandom(random()) * 360;
  const residual = normalizeAngle(endAngle - startAngle);
  return {
    startAngle,
    endAngle,
    turns,
    totalSweep: turns * 360 + residual,
  };
}

/**
 * Heavy, weighted deceleration: the pointer leaves quickly and creeps into its
 * last few degrees, which is what makes the stop read as a real mechanism.
 *
 * @param {number} progress 0..1
 * @returns {number} 0..1
 */
export function dialEase(progress) {
  const t = Math.max(0, Math.min(1, Number(progress) || 0));
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Samples the dial and the number it points at.
 *
 * @param {number} elapsedMs Milliseconds since the spin started.
 * @param {{ startAngle: number, endAngle: number, totalSweep: number }} spin
 * @param {number} finalPercentage The generated result.
 * @param {number} [durationMs] The percentage settle window.
 * @returns {{ angle: number, percentage: number }}
 */
export function sampleDialSpin(
  elapsedMs,
  spin,
  finalPercentage,
  durationMs = REVEAL_TIMING.percentageSettleMs,
) {
  const final = clampPercentage(finalPercentage);
  const safeSpin =
    spin && Number.isFinite(spin.startAngle) && Number.isFinite(spin.totalSweep)
      ? spin
      : { startAngle: 0, totalSweep: 0 };
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1;
  const elapsed = Math.max(0, Math.min(duration, Number(elapsedMs) || 0));
  const eased = dialEase(elapsed / duration);
  const angle = safeSpin.startAngle + eased * safeSpin.totalSweep;
  return {
    angle,
    // The landing frame is the result itself; every earlier frame is nudged off
    // it so the stop is the reveal.
    percentage:
      elapsed >= duration
        ? final
        : nudgeAwayFromFinal(angleToPercentage(angle), final),
  };
}

/* ── Lucky Number pointer ────────────────────────────────────────────────── */

function clampLuckyNumber(value) {
  if (!Number.isFinite(value)) return LUCKY_NUMBER_MIN;
  return Math.max(LUCKY_NUMBER_MIN, Math.min(LUCKY_NUMBER_MAX, Math.round(value)));
}

/** The pointer angle, in degrees clockwise from 12 o'clock, for a number. */
export function luckyNumberToAngle(number) {
  const value = clampLuckyNumber(number);
  return (value - LUCKY_NUMBER_MIN) * DEGREES_PER_NUMBER + DEGREES_PER_NUMBER / 2;
}

/** The Lucky Number whose sector contains a pointer angle. */
export function angleToLuckyNumber(angle) {
  const normalised = normalizeAngle(angle);
  const index = Math.min(
    NUMBER_STEPS - 1,
    Math.max(0, Math.floor(normalised / DEGREES_PER_NUMBER)),
  );
  return LUCKY_NUMBER_MIN + index;
}

function nudgeNumberAwayFromFinal(value, finalNumber) {
  const clamped = clampLuckyNumber(value);
  if (clamped !== finalNumber) return clamped;
  return clamped < LUCKY_NUMBER_MAX ? clamped + 1 : clamped - 1;
}

/**
 * Builds the number pointer's spin, ending on the exact sector of the number
 * that was already selected.
 *
 * @param {number} finalNumber The independent Lucky Number.
 * @param {() => number} random Injectable random source.
 */
export function buildNumberSpin(finalNumber, random = Math.random) {
  const endAngle = luckyNumberToAngle(finalNumber);
  const turns =
    DIAL_TURNS.min +
    Math.floor(clampRandom(random()) * (DIAL_TURNS.max - DIAL_TURNS.min + 1));
  const startAngle = clampRandom(random()) * 360;
  const residual = normalizeAngle(endAngle - startAngle);
  return {
    startAngle,
    endAngle,
    turns,
    totalSweep: turns * 360 + residual,
  };
}

/**
 * Samples the Lucky Number pointer. The number is read from the pointer's own
 * angle, never from the percentage, and is nudged one step off the result on
 * any intermediate pass so the landing is the reveal.
 *
 * @param {number} elapsedMs
 * @param {{ startAngle: number, totalSweep: number }} spin
 * @param {number} finalNumber
 * @param {number} [durationMs]
 * @returns {{ angle: number, number: number }}
 */
export function sampleNumberSpin(
  elapsedMs,
  spin,
  finalNumber,
  durationMs = REVEAL_TIMING.numberSettleMs,
) {
  const final = clampLuckyNumber(finalNumber);
  const safeSpin =
    spin && Number.isFinite(spin.startAngle) && Number.isFinite(spin.totalSweep)
      ? spin
      : { startAngle: 0, totalSweep: 0 };
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1;
  const elapsed = Math.max(0, Math.min(duration, Number(elapsedMs) || 0));
  const eased = dialEase(elapsed / duration);
  const angle = safeSpin.startAngle + eased * safeSpin.totalSweep;
  return {
    angle,
    number:
      elapsed >= duration
        ? final
        : nudgeNumberAwayFromFinal(angleToLuckyNumber(angle), final),
  };
}

/* ── Lucky Colour ring ───────────────────────────────────────────────────── */

/** The segment index of a colour id, or -1. */
export function getColourIndex(colourId) {
  return COLOURS.findIndex((colour) => colour.id === colourId);
}

/** The colour id at a segment index, wrapping the ring. */
export function getColourIdAt(index) {
  const step = ((Math.round(index) % COLOUR_STEPS) + COLOUR_STEPS) % COLOUR_STEPS;
  return COLOURS[step].id;
}

/**
 * Builds the colour ring's spin. The ring's rotation settles so the selected
 * segment sits under the fixed marker at 12 o'clock.
 *
 * @param {string} colourId The already-selected Lucky Colour.
 * @param {() => number} random Injectable random source.
 */
export function buildColourSpin(colourId, random = Math.random) {
  const index = Math.max(0, getColourIndex(colourId));
  const settleRotation = normalizeAngle(-index * DEGREES_PER_COLOUR);
  const turns = 2 + Math.floor(clampRandom(random()) * 2);
  const startRotation = clampRandom(random()) * 360;
  const residual = normalizeAngle(settleRotation - startRotation);
  return {
    startRotation,
    endRotation: settleRotation,
    turns,
    totalSweep: turns * 360 + residual,
  };
}

/** The colour segment currently under the fixed marker for a ring rotation. */
export function rotationToColourIndex(rotation) {
  return Math.round(normalizeAngle(-rotation) / DEGREES_PER_COLOUR) % COLOUR_STEPS;
}

/**
 * Samples the colour ring. The settled segment is always the colour that was
 * already chosen; while spinning it reads its own rotation and is nudged off
 * the result so the stop is the reveal.
 *
 * @param {number} elapsedMs
 * @param {{ startRotation: number, totalSweep: number }} spin
 * @param {string} finalColourId
 * @param {number} [durationMs]
 * @returns {{ rotation: number, colourIndex: number, colourId: string }}
 */
export function sampleColourSpin(
  elapsedMs,
  spin,
  finalColourId,
  durationMs = REVEAL_TIMING.colourSettleMs,
) {
  const finalIndex = Math.max(0, getColourIndex(finalColourId));
  const safeSpin =
    spin && Number.isFinite(spin.startRotation) && Number.isFinite(spin.totalSweep)
      ? spin
      : { startRotation: 0, totalSweep: 0 };
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1;
  const elapsed = Math.max(0, Math.min(duration, Number(elapsedMs) || 0));
  const eased = dialEase(elapsed / duration);
  const rotation = safeSpin.startRotation + eased * safeSpin.totalSweep;
  let index = rotationToColourIndex(rotation);
  if (elapsed < duration && index === finalIndex) index = (index + 1) % COLOUR_STEPS;
  return { rotation, colourIndex: index, colourId: getColourIdAt(index) };
}

/** Resolves a colour record from the approved palette. */
export function getColourById(colourId) {
  return COLOURS_BY_ID.get(colourId) || null;
}

/**
 * Picks this run's event length inside the event's documented range.
 *
 * @param {string} eventId One of `meteor`, `lightning`, `fireworks`.
 * @param {() => number} random Injectable random source.
 * @returns {number} Duration in milliseconds.
 */
export function getEventDurationMs(eventId, random = Math.random) {
  const event = EVENTS_BY_ID.get(eventId);
  if (!event) return 0;
  const { minDurationMs, maxDurationMs } = event;
  const value = random();
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0;
  return Math.round(minDurationMs + clamped * (maxDurationMs - minDurationMs));
}
