/**
 * The Lucky Meter's choreography envelopes.
 *
 * The storyboard owns *when* every stage starts and ends. This module owns how
 * strongly the scene's light, rim glow, dust and trail respond inside those
 * windows. It is pure and frame-independent: the component and the scene ask
 * for a set of 0–1 weights at the current elapsed time, so a throttled frame
 * clock can never leave a light stuck on.
 *
 * Nothing here selects a value, changes a duration or reorders a beat.
 */

import { STORYBOARD_TIMING } from './storyboard.js';

export const PERCENTAGE_START_MS =
  STORYBOARD_TIMING.anticipationMs + STORYBOARD_TIMING.leafExitMs;
export const WHEEL_END_MS = PERCENTAGE_START_MS + STORYBOARD_TIMING.wheelMs;
export const PERCENTAGE_END_MS = PERCENTAGE_START_MS + STORYBOARD_TIMING.percentageMs;
export const POUR_END_MS = PERCENTAGE_END_MS + STORYBOARD_TIMING.pourMs;
export const NUMBER_PAUSE_END_MS = POUR_END_MS + STORYBOARD_TIMING.numberPauseMs;
export const TRANSFER_END_MS = NUMBER_PAUSE_END_MS + STORYBOARD_TIMING.transferMs;
export const REVEAL_COMPLETE_MS = TRANSFER_END_MS + STORYBOARD_TIMING.transferSettleMs;

/** Every key the scene reads. Exported so a test can assert the vocabulary. */
export const CHOREOGRAPHY_KEYS = Object.freeze([
  'focus',
  'rim',
  'banner',
  'pourGlow',
  'flight',
  'dust',
  'settle',
]);

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

/** Smooth 0→1 between two times. */
function ramp(elapsedMs, fromMs, toMs) {
  if (toMs <= fromMs) return elapsedMs >= toMs ? 1 : 0;
  return clamp01((elapsedMs - fromMs) / (toMs - fromMs));
}

/** 0 → 1 → 0 across a window. */
function bell(elapsedMs, fromMs, toMs) {
  const progress = ramp(elapsedMs, fromMs, toMs);
  return Math.sin(progress * Math.PI);
}

function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/**
 * The scene's weights for one moment of the sequence.
 *
 * - `focus`    the wheel's spotlight: rises with the spin, holds through the
 *              pour and releases after the number has settled.
 * - `rim`      the selected cup's rim: switches on when the wheel lands.
 * - `banner`   the banner's engraving light: flares on the landing and again on
 *              arrival.
 * - `pourGlow` the spout/stream light: only while colour is moving.
 * - `flight`   the number's trail: only inside its transfer window.
 * - `dust`     ambient gold dust: calm at rest, alive during the reveal.
 * - `settle`   the finished scene's resting light.
 *
 * @param {number} elapsedMs Milliseconds since Start.
 * @returns {{ focus: number, rim: number, banner: number, pourGlow: number, flight: number, dust: number, settle: number }}
 */
export function getChoreography(elapsedMs) {
  const time = Math.max(0, Number(elapsedMs) || 0);

  const spin = smoothstep(ramp(time, PERCENTAGE_START_MS, WHEEL_END_MS));
  const pour = ramp(time, PERCENTAGE_END_MS, POUR_END_MS);
  const transfer = ramp(time, NUMBER_PAUSE_END_MS, TRANSFER_END_MS);
  const finished = time >= REVEAL_COMPLETE_MS;

  // Focus peaks on the landing beat and relaxes once the number has seated.
  const focus = finished ? 0.42 : Math.max(spin, pour > 0 ? 1 : 0) * (1 - 0.25 * transfer);

  // The rim lights on the landing frame and stays lit through the reveal.
  const rim = time < WHEEL_END_MS ? 0 : finished ? 0.3 : 1;

  // Two banner flares: the landing and the arrival.
  const bannerFlare =
    bell(time, WHEEL_END_MS - 120, WHEEL_END_MS + 760) +
    bell(time, TRANSFER_END_MS - 260, REVEAL_COMPLETE_MS + 240);

  return {
    focus: clamp01(focus),
    rim: clamp01(rim),
    banner: clamp01(0.18 + bannerFlare * 0.82),
    pourGlow:
      time >= PERCENTAGE_END_MS && time <= POUR_END_MS
        ? clamp01(Math.sin(ramp(time, PERCENTAGE_END_MS, POUR_END_MS) * Math.PI) * 1.1)
        : 0,
    flight: bell(time, NUMBER_PAUSE_END_MS, TRANSFER_END_MS),
    dust: clamp01(0.32 + focus * 0.32 + bell(time, PERCENTAGE_END_MS, TRANSFER_END_MS) * 0.36),
    settle: finished ? 1 : 0,
  };
}

/**
 * The cue names the sequence emits and the storyboard time each one lands on.
 * Used by the component and asserted by the unit suite so a cue can never fire
 * before its visual event.
 *
 * @returns {Array<{ cue: string, atMs: number }>}
 */
export function getRevealCueSchedule() {
  return [
    { cue: 'wheel-start', atMs: PERCENTAGE_START_MS },
    { cue: 'wheel-stop', atMs: WHEEL_END_MS },
    { cue: 'colour-pour', atMs: PERCENTAGE_END_MS },
    { cue: 'bowl-full', atMs: POUR_END_MS },
    { cue: 'number-depart', atMs: NUMBER_PAUSE_END_MS },
    { cue: 'number-reveal', atMs: REVEAL_COMPLETE_MS },
  ];
}
