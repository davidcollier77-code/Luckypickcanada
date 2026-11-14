/**
 * Reveal timing and the unpredictable preview number.
 *
 * The real percentage is hidden for the full 4.5-second scramble. The preview
 * climbs high, drops low and jumps high again, with per-frame jitter, and it is
 * guaranteed never to show the final value early.
 */
import { EVENTS_BY_ID, PERCENTAGE_MAX, PERCENTAGE_MIN } from './config';

export const REVEAL_TIMING = Object.freeze({
  /** Unpredictable jump animation before landing. */
  scrambleMs: 4500,
  /** Two or three flashes of the real number on landing. */
  flashMs: 600,
  flashCount: 3,
  /** Percentage and tier are revealed at landing; the rest follows. */
  detailsDelayMs: 800,
  /** After the details, wait before the cinematic event starts. */
  eventDelayMs: 600,
});

/** Anchor values deliberately alternate high and low. */
const SCRAMBLE_ANCHORS = [
  { at: 0, value: 9 },
  { at: 650, value: 91 },
  { at: 1300, value: 12 },
  { at: 2000, value: 97 },
  { at: 2650, value: 27 },
  { at: 3300, value: 87 },
  { at: 3950, value: 43 },
  { at: REVEAL_TIMING.scrambleMs, value: 72 },
];

function clampPercentage(value) {
  return Math.max(PERCENTAGE_MIN, Math.min(PERCENTAGE_MAX, Math.round(value)));
}

function nudgeAwayFromFinal(value, finalPercentage) {
  if (value !== finalPercentage) return value;
  if (value < PERCENTAGE_MAX) return value + 1;
  if (value > PERCENTAGE_MIN) return value - 1;
  return value;
}

/**
 * Builds one scramble path for this reveal. Each anchor is jittered a little so
 * two reveals never follow the same visible path, and no anchor may equal the
 * real percentage.
 *
 * @param {number} finalPercentage The hidden result.
 * @param {() => number} random Injectable random source.
 */
export function buildRevealKeyframes(finalPercentage, random = Math.random) {
  const final = clampPercentage(finalPercentage);
  return SCRAMBLE_ANCHORS.map((anchor, index) => {
    const amplitude = index === 0 ? 3 : 8;
    const jittered = clampPercentage(anchor.value + (random() - 0.5) * 2 * amplitude);
    return { at: anchor.at, value: nudgeAwayFromFinal(jittered, final) };
  });
}

function smoothstep(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

/**
 * Samples the preview number at a point in time. The returned integer is always
 * within 5–100, never 0 and never the final percentage.
 *
 * @param {number} elapsedMs Milliseconds since the reveal started.
 * @param {{at: number, value: number}[]} keyframes Path from `buildRevealKeyframes`.
 * @param {number} finalPercentage The hidden result.
 * @param {() => number} random Injectable jitter source.
 */
export function sampleRevealNumber(
  elapsedMs,
  keyframes,
  finalPercentage,
  random = Math.random,
) {
  const final = clampPercentage(finalPercentage);
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    return nudgeAwayFromFinal(clampPercentage(final === PERCENTAGE_MIN ? final + 1 : final - 1), final);
  }

  const elapsed = Math.max(0, Math.min(REVEAL_TIMING.scrambleMs, Number(elapsedMs) || 0));

  let lower = keyframes[0];
  let upper = keyframes[keyframes.length - 1];
  for (let index = 1; index < keyframes.length; index += 1) {
    if (elapsed <= keyframes[index].at) {
      lower = keyframes[index - 1];
      upper = keyframes[index];
      break;
    }
  }

  const span = Math.max(1, upper.at - lower.at);
  const progress = smoothstep((elapsed - lower.at) / span);
  const base = lower.value + (upper.value - lower.value) * progress;
  // Unpredictable flicker that settles slightly as the landing approaches.
  const jitterScale = 6 * (0.45 + 0.55 * (1 - elapsed / REVEAL_TIMING.scrambleMs));
  const jitter = (random() - 0.5) * 2 * jitterScale;
  const sampled = clampPercentage(base + jitter);

  return nudgeAwayFromFinal(sampled, final);
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
