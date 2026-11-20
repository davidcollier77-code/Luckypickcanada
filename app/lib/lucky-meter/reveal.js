/**
 * Reveal mathematics for the Lucky Meter's colour wheel.
 *
 * The wheel is the twelve-segment palette ring. It spins beneath a fixed
 * maple-leaf pointer at 6 o'clock and stops with the already-selected colour
 * under that pointer. The percentage readout counts up on the same clock and
 * stops on the same frame, so the two can never disagree.
 *
 * Everything here is a pure function of elapsed time and a spin built from the
 * stored result. Nothing samples a random value during the animation, and no
 * angle can select or change a percentage, a number or a colour.
 */
import { COLOURS_BY_ID, getPaletteForDate } from './sparks-and-seasonal-colours';
import { EVENTS_BY_ID, PERCENTAGE_MAX, PERCENTAGE_MIN } from './config';
import { STORYBOARD_TIMING } from './storyboard';

/**
 * The stage lengths are owned by the storyboard. This alias keeps the existing
 * `REVEAL_TIMING` import path meaningful for the reveal, Spark writer and tests.
 */
export const REVEAL_TIMING = STORYBOARD_TIMING;

/** A full circle is 100%, so one percentage point is 3.6 degrees. */
export const DEGREES_PER_PERCENT = 360 / 100;

/** The fixed maple-leaf pointer: 6 o'clock in screen coordinates. */
export const POINTER_ANGLE_DEGREES = 180;

/** One segment per seasonal Lucky Colour. */
export const COLOUR_STEPS = 12;
export const DEGREES_PER_COLOUR = 360 / COLOUR_STEPS;

/** Bounds for the wheel's spin distance, in full turns. */
export const WHEEL_TURNS = Object.freeze({ min: 3, max: 4 });

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

/** The percentage represented by a dial position. */
export function percentageToAngle(percentage) {
  return clampPercentage(percentage) * DEGREES_PER_PERCENT;
}

/**
 * The percentage represented by a dial position.
 *
 * 100% is a full turn, which wraps to 0°: the top of the dial means the whole
 * range rather than the impossible 0% result.
 */
export function angleToPercentage(angle) {
  const normalised = normalizeAngle(angle);
  if (normalised < 1e-9) return PERCENTAGE_MAX;
  return clampPercentage((normalised / 360) * 100);
}

/**
 * Heavy, weighted deceleration: the wheel leaves quickly and creeps into its
 * last few degrees, which is what makes the stop read as a real mechanism.
 */
export function dialEase(progress) {
  const t = Math.max(0, Math.min(1, Number(progress) || 0));
  return 1 - Math.pow(1 - t, 5);
}

/**
 * The displayed percentage during generation.
 *
 * The readout sweeps the real 5–100 range, so it always looks like the meter's
 * own scale rather than an arbitrary 0–100 counter. It accelerates and
 * decelerates with the wheel, tops out one point below 100 while it is still
 * moving, and is nudged one point away from the true value on every
 * intermediate frame: the exact result is reached only on the final frame.
 *
 * @param {number} elapsedMs Milliseconds since the wheel started turning.
 * @param {number} durationMs The generation window.
 * @param {number} finalPercentage The already-selected result.
 * @returns {number} 5–99 while generating, the exact result at the end.
 */
export function sampleGenerationPercentage(elapsedMs, durationMs, finalPercentage) {
  const final = clampPercentage(finalPercentage);
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1;
  const elapsed = Math.max(0, Math.min(duration, Number(elapsedMs) || 0));
  if (elapsed >= duration) return final;

  const eased = dialEase(elapsed / duration);
  const span = PERCENTAGE_MAX - PERCENTAGE_MIN;
  const value = Math.min(
    PERCENTAGE_MAX - 1,
    Math.max(PERCENTAGE_MIN, PERCENTAGE_MIN + Math.floor(eased * span)),
  );
  if (value !== final) return value;
  return value >= PERCENTAGE_MAX - 1 ? value - 1 : value + 1;
}

/* ── Colour wheel ────────────────────────────────────────────────────────── */

/**
 * The segment index of a colour id inside a palette, or -1.
 *
 * @param {string} colourId
 * @param {ReadonlyArray<object>} [palette] The active twelve-colour palette.
 */
export function getColourIndex(colourId, palette = []) {
  if (!Array.isArray(palette) || palette.length === 0) return -1;
  return palette.findIndex((colour) => colour.id === colourId);
}

/** The colour id at a segment index, wrapping the ring. */
export function getColourIdAt(index, palette = []) {
  if (!Array.isArray(palette) || palette.length === 0) return null;
  const step = ((Math.round(index) % palette.length) + palette.length) % palette.length;
  return palette[step].id;
}

/**
 * The wheel rotation that brings a segment under the fixed 6 o'clock pointer.
 *
 * A segment's centre sits at `index × 30°` clockwise from 12 o'clock, so the
 * ring must turn by `180° − index × 30°` for the pointer to read it.
 *
 * @param {string} colourId
 * @param {ReadonlyArray<object>} [palette]
 * @returns {number} Normalised degrees.
 */
export function colourPointerRotation(colourId, palette = []) {
  const index = Math.max(0, getColourIndex(colourId, palette));
  return normalizeAngle(POINTER_ANGLE_DEGREES - index * DEGREES_PER_COLOUR);
}

/**
 * Builds the wheel spin: a random starting angle, three to four whole turns and
 * a final rotation that places the selected colour under the pointer.
 *
 * @param {string} colourId The already-selected Lucky Colour.
 * @param {() => number} [random] Injectable random source.
 * @param {ReadonlyArray<object>} [palette]
 */
export function buildColourSpin(colourId, random = Math.random, palette = getPaletteForDate()) {
  const endRotation = colourPointerRotation(colourId, palette);
  const turns =
    WHEEL_TURNS.min +
    Math.floor(clampRandom(random()) * (WHEEL_TURNS.max - WHEEL_TURNS.min + 1));
  const startRotation = clampRandom(random()) * 360;
  const residual = normalizeAngle(endRotation - startRotation);
  return {
    startRotation,
    endRotation,
    turns,
    totalSweep: turns * 360 + residual,
  };
}

/**
 * The colour segment currently under the fixed 6 o'clock pointer.
 *
 * @param {number} rotation Wheel rotation in degrees.
 * @param {number} [paletteLength]
 */
export function rotationToColourIndex(rotation, paletteLength = COLOUR_STEPS) {
  const length = Number.isFinite(paletteLength) && paletteLength > 0 ? paletteLength : COLOUR_STEPS;
  const step = 360 / length;
  return Math.round(normalizeAngle(POINTER_ANGLE_DEGREES - rotation) / step) % length;
}

/**
 * Samples the wheel. The settled segment is always the colour that was already
 * chosen; while spinning it reads its own rotation and is nudged off the result
 * so the stop is the reveal.
 *
 * @param {number} elapsedMs
 * @param {{ startRotation: number, totalSweep: number }} spin
 * @param {string} finalColourId
 * @param {number} [durationMs]
 * @param {ReadonlyArray<object>} [palette]
 */
export function sampleColourSpin(
  elapsedMs,
  spin,
  finalColourId,
  durationMs = STORYBOARD_TIMING.generationMs,
  palette = getPaletteForDate(),
) {
  const finalIndex = Math.max(0, getColourIndex(finalColourId, palette));
  const safeSpin =
    spin && Number.isFinite(spin.startRotation) && Number.isFinite(spin.totalSweep)
      ? spin
      : { startRotation: 0, totalSweep: 0 };
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1;
  const elapsed = Math.max(0, Math.min(duration, Number(elapsedMs) || 0));
  const eased = dialEase(elapsed / duration);
  const rotation = safeSpin.startRotation + eased * safeSpin.totalSweep;
  let index = rotationToColourIndex(rotation, palette.length);
  if (elapsed < duration && index === finalIndex) index = (index + 1) % palette.length;
  return { rotation, colourIndex: index, colourId: getColourIdAt(index, palette) };
}

/** Resolves a seasonal colour record by id. */
export function getColourById(colourId) {
  return COLOURS_BY_ID.get(colourId) || null;
}

/**
 * Picks this run's event length inside the event's documented range.
 *
 * @param {string} eventId One of `meteor`, `lightning`, `fireworks`.
 * @param {() => number} [random] Injectable random source.
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
