/**
 * Reveal timing and the dial spin that lands on the real percentage.
 *
 * The result is generated first. The dial is then animated from a random
 * starting angle through several full turns to exactly the angle that represents
 * that percentage, so its stopping position and the displayed percentage are the
 * same fact. The number shown during the spin is read from the dial's actual
 * angle, and it is nudged away from the final value on any intermediate pass so
 * the result is never leaked before the landing.
 */
import { EVENTS_BY_ID, PERCENTAGE_MAX, PERCENTAGE_MIN } from './config';

export const REVEAL_TIMING = Object.freeze({
  /** Dial spin before landing. */
  scrambleMs: 4500,
  /** Two or three flashes of the real number on landing. */
  flashMs: 600,
  flashCount: 3,
  /** After the percentage and tier, the tier's Lucky Numbers arrive. */
  numbersDelayMs: 800,
  /** After the numbers, the supporting detail panels follow. */
  detailsDelayMs: 600,
  /** After the details, wait before the cinematic event starts. */
  eventDelayMs: 600,
});

/** Milliseconds from the Start press until the cinematic event begins. */
export const EVENT_START_MS =
  REVEAL_TIMING.scrambleMs +
  REVEAL_TIMING.numbersDelayMs +
  REVEAL_TIMING.detailsDelayMs +
  REVEAL_TIMING.eventDelayMs;

/** A full circle is 100%, so one percentage point is 3.6 degrees. */
export const DEGREES_PER_PERCENT = 360 / 100;

/** Bounds for the dial's spin distance, in full turns. */
export const DIAL_TURNS = Object.freeze({ min: 3, max: 5 });

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
 * Builds this reveal's spin: a random starting angle, three to five full turns,
 * and the exact end angle for the result.
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
 * The returned angle is the pointer's absolute rotation, so the caller can apply
 * it directly. The percentage is the angle's position on the dial, except on any
 * intermediate pass through the final value, which is nudged by one point so the
 * result stays hidden until the landing frame.
 *
 * @param {number} elapsedMs Milliseconds since the spin started.
 * @param {{ startAngle: number, endAngle: number, totalSweep: number }} spin
 * @param {number} finalPercentage The generated result.
 * @returns {{ angle: number, percentage: number }}
 */
export function sampleDialSpin(elapsedMs, spin, finalPercentage) {
  const final = clampPercentage(finalPercentage);
  const safeSpin =
    spin && Number.isFinite(spin.startAngle) && Number.isFinite(spin.totalSweep)
      ? spin
      : { startAngle: 0, totalSweep: 0 };
  const elapsed = Math.max(0, Math.min(REVEAL_TIMING.scrambleMs, Number(elapsedMs) || 0));
  const eased = dialEase(elapsed / REVEAL_TIMING.scrambleMs);
  const angle = safeSpin.startAngle + eased * safeSpin.totalSweep;
  return {
    angle,
    percentage: nudgeAwayFromFinal(angleToPercentage(angle), final),
  };
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
