/**
 * Reveal mathematics for the Lucky Meter's colour wheel.
 *
 * The wheel is the twelve-chamber seasonal ring. It spins beneath the fixed
 * external golden maple-leaf pointer at 7:30 (225° in screen coordinates) and
 * stops with the already-selected colour under that pointer. The wheel and the
 * percentage readout use independent windows: the wheel stops first, and the
 * percentage continues its approved five-beat generation before settling on the
 * stored result. They can never select or change a value.
 *
 * Everything here is a pure function of elapsed time and a spin built from the
 * stored result. Nothing samples a random value during the animation, and no
 * angle can select or change a percentage, a number or a colour.
 */
import { COLOURS_BY_ID, getPaletteForDate } from './sparks-and-seasonal-colours';
import { PERCENTAGE_MAX, PERCENTAGE_MIN } from './config';
import { STORYBOARD_TIMING } from './storyboard';

/**
 * The stage lengths are owned by the storyboard. This alias keeps the existing
 * `REVEAL_TIMING` import path meaningful for the reveal, Spark writer and tests.
 */
export const REVEAL_TIMING = STORYBOARD_TIMING;

/** A full circle is 100%, so one percentage point is 3.6 degrees. */
export const DEGREES_PER_PERCENT = 360 / 100;

/** The fixed external maple-leaf pointer: 7:30 in screen coordinates. */
export const POINTER_ANGLE_DEGREES = 225;

/** One segment per seasonal Lucky Colour. */
export const COLOUR_STEPS = 12;
export const DEGREES_PER_COLOUR = 360 / COLOUR_STEPS;

/** The approved wheel spin: exactly five full turns before the landing. */
export const WHEEL_TURNS = 5;

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
 * The five-beat generation, expressed as fractions of the generation window.
 *
 *   1. 0 → 100    the readout rushes to the top of the scale
 *   2. 100 → 18   it falls back
 *   3. 18 → 88    it rises again
 *   4. erratic    it wobbles around the upper range
 *   5. settle     it comes to rest on the stored result
 */
const GENERATION_BEATS = Object.freeze({
  peak: 0.3,
  trough: 0.46,
  rise: 0.62,
  erraticEnd: 0.86,
});

function clampUnit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function easeOutCubic(value) {
  const t = clampUnit(value);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(value) {
  const t = clampUnit(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * The erratic beat's value at normalised progress through that beat. Both ends
 * are 88, so the readout moves continuously into and out of the wobble.
 *
 * @param {number} progress 0–1 through the erratic beat.
 * @returns {number} A value inside 0–100 after clamping at the call site.
 */
function erraticGenerationValue(progress) {
  const t = clampUnit(progress);
  const wobble = Math.sin(t * Math.PI * 4) * 34 + Math.sin(t * Math.PI * 9) * 14;
  return 88 + wobble * (1 - 0.25 * t);
}

/**
 * The displayed percentage during the approved five-beat generation.
 *
 * The readout starts at 0, rushes to 100, falls, rises, becomes erratic and
 * finally settles on the already-selected 5–100 result. The exact result is
 * never shown before the last frame: whenever an intermediate frame would round
 * onto it, the value is nudged one point away.
 *
 * @param {number} elapsedMs Milliseconds since the wheel started turning.
 * @param {number} durationMs The generation window.
 * @param {number} finalPercentage The already-selected result.
 * @returns {number} 0–100 while generating, the exact result at the end.
 */
export function sampleGenerationPercentage(elapsedMs, durationMs, finalPercentage) {
  const final = clampPercentage(finalPercentage);
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1;
  const elapsed = Math.max(0, Math.min(duration, Number(elapsedMs) || 0));
  if (elapsed >= duration) return final;

  const progress = elapsed / duration;
  let value;
  if (progress < GENERATION_BEATS.peak) {
    value = 100 * easeOutCubic(progress / GENERATION_BEATS.peak);
  } else if (progress < GENERATION_BEATS.trough) {
    value =
      100 -
      82 *
        easeInOutCubic(
          (progress - GENERATION_BEATS.peak) / (GENERATION_BEATS.trough - GENERATION_BEATS.peak),
        );
  } else if (progress < GENERATION_BEATS.rise) {
    value =
      18 +
      70 *
        easeOutCubic(
          (progress - GENERATION_BEATS.trough) / (GENERATION_BEATS.rise - GENERATION_BEATS.trough),
        );
  } else if (progress < GENERATION_BEATS.erraticEnd) {
    value = erraticGenerationValue(
      (progress - GENERATION_BEATS.rise) /
        (GENERATION_BEATS.erraticEnd - GENERATION_BEATS.rise),
    );
  } else {
    const settleFrom = erraticGenerationValue(1);
    value =
      settleFrom +
      (final - settleFrom) *
        easeInOutCubic(
          (progress - GENERATION_BEATS.erraticEnd) / (1 - GENERATION_BEATS.erraticEnd),
        );
  }

  const rounded = Math.round(value);
  const clamped = Math.max(0, Math.min(PERCENTAGE_MAX, rounded));
  if (clamped !== final) return clamped;
  return clamped >= PERCENTAGE_MAX ? PERCENTAGE_MAX - 1 : clamped + 1;
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
 * The wheel rotation that brings a chamber under the fixed 7:30 pointer.
 *
 * A chamber's centre sits at `index × 30°` clockwise from 12 o'clock, so the
 * ring must turn by `225° − index × 30°` for the pointer to read it.
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
 * Builds the wheel spin: a random starting angle, exactly five whole turns and
 * a final rotation that places the selected colour under the pointer.
 *
 * @param {string} colourId The already-selected Lucky Colour.
 * @param {() => number} [random] Injectable random source.
 * @param {ReadonlyArray<object>} [palette]
 */
export function buildColourSpin(colourId, random = Math.random, palette = getPaletteForDate()) {
  const endRotation = colourPointerRotation(colourId, palette);
  const turns = WHEEL_TURNS;
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
 * The colour chamber currently under the fixed 7:30 pointer.
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
 * @param {number} [durationMs] The wheel's own window, not the percentage window.
 * @param {ReadonlyArray<object>} [palette]
 */
export function sampleColourSpin(
  elapsedMs,
  spin,
  finalColourId,
  durationMs = STORYBOARD_TIMING.wheelMs,
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
 * The chamber index the stored colour occupies in the active palette.
 *
 * A preservation-safe mapper: it reads the already-selected colour and never
 * introduces randomness, a second colour draw or a new selection path.
 *
 * @param {string} colourId
 * @param {ReadonlyArray<object>} [palette]
 * @returns {number} 0–11, or -1 when the colour is not in the palette.
 */
export function chamberIndexForColour(colourId, palette = []) {
  return getColourIndex(colourId, palette);
}

