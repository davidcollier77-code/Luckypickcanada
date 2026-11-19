/**
 * Arrival leaves: the few autumn maple leaves that rest around the Lucky Meter
 * scene when the page appears, then lift on a breeze and leave the sky.
 *
 * This module is pure data and pure motion so the one-shot introduction can be
 * tested without a canvas. `LuckyMeterArrivalLeaves` owns the pixels; this owns
 * the composition, the timing and the path of every leaf.
 *
 * The introduction is deliberately short: one second of rest, then a staggered
 * lift and a wind-carried crossing that ends before a visitor has read the
 * headline and reached Start. Nothing here selects, changes or reads the daily
 * result.
 */
import { pickLeafColour, sampleWindField } from './leaf-wind';

/** When the breeze arrives, and how the crossing is shaped. */
export const ARRIVAL_TIMING = Object.freeze({
  /** Frames 1–2: the resting scene holds long enough to register. */
  restMs: 1750,
  /** The breeze reaches each leaf inside this window. */
  liftSpreadMs: 180,
  /** A short, accelerating lift before the crossing carries the leaf away. */
  flightMs: 1300,
  /** The fraction of the crossing that is fully opaque. */
  holdFraction: 0.62,
});

/**
 * Edge bands the resting leaves occupy. They are kept away from the copy
 * column and from the top-right Home control, and they stay at the sides so a
 * leaf never covers a headline or the medallion.
 */
const REST_BANDS = Object.freeze([
  { x: [0.055, 0.14], y: [0.3, 0.44] },
  { x: [0.86, 0.945], y: [0.27, 0.41] },
  { x: [0.045, 0.125], y: [0.6, 0.76] },
  { x: [0.875, 0.955], y: [0.57, 0.73] },
  { x: [0.04, 0.1], y: [0.45, 0.56] },
]);

/** Narrow viewports keep tighter margins so a leaf stays out of the meter. */
const MOBILE_REST_BANDS = Object.freeze([
  // The headline fills a phone's width, so the phone composition keeps every
  // leaf in the side gutters beside the meter, well below the copy.
  { x: [0.02, 0.075], y: [0.55, 0.65] },
  { x: [0.925, 0.98], y: [0.55, 0.65] },
  { x: [0.015, 0.07], y: [0.7, 0.8] },
  { x: [0.93, 0.985], y: [0.7, 0.8] },
  { x: [0.935, 0.985], y: [0.83, 0.9] },
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(random, min, max) {
  return min + clamp(random(), 0, 0.999999) * (max - min);
}

/**
 * Builds the resting composition for one introduction.
 *
 * Positions are viewport fractions, so a resize keeps the arrangement. Sizes
 * are CSS pixels and are aware of the viewport: a phone gets smaller leaves.
 *
 * @param {() => number} [random] Injectable random source.
 * @param {number} [count] Number of leaves to place.
 * @param {{ width?: number, height?: number }} [viewport]
 * @returns {Array<object>}
 */
export function createArrivalLeaves(
  random = Math.random,
  count = 5,
  viewport = { width: 1440, height: 900 },
) {
  const width = Number.isFinite(viewport?.width) ? viewport.width : 1440;
  const mobile = width < 640;
  const bands = mobile ? MOBILE_REST_BANDS : REST_BANDS;
  const leaves = [];
  const total = Math.max(1, Math.min(bands.length, Math.round(count) || 1));

  for (let index = 0; index < total; index += 1) {
    const band = bands[index % bands.length];
    leaves.push({
      id: `arrival-leaf-${index}`,
      x: randomBetween(random, band.x[0], band.x[1]),
      y: randomBetween(random, band.y[0], band.y[1]),
      // Small enough to read as a real leaf at rest, never as a banner.
      size: mobile
        ? randomBetween(random, 20, 30)
        : randomBetween(random, 28, 44),
      rotation: randomBetween(random, -0.65, 0.65),
      tilt: randomBetween(random, 0.58, 0.92),
      colour: pickLeafColour(random),
      depth: randomBetween(random, 0.55, 1),
      liftDelay: randomBetween(random, 0, ARRIVAL_TIMING.liftSpreadMs),
      flightMs: ARRIVAL_TIMING.flightMs * randomBetween(random, 0.88, 1.12),
      driftX: randomBetween(random, 0.16, 0.3),
      rise: randomBetween(random, 0.16, 0.3) * (mobile ? 1.2 : 1),
      spin: (random() > 0.5 ? 1 : -1) * randomBetween(random, 1.1, 2.4),
      flutterSpeed: randomBetween(random, 4.4, 8.2),
      flutterPhase: randomBetween(random, 0, Math.PI * 2),
      swayAmp: randomBetween(random, 0.0012, 0.0032),
      swayPhase: randomBetween(random, 0, Math.PI * 2),
    });
  }

  return leaves;
}

/**
 * Milliseconds until every leaf has left the frame.
 *
 * @param {Array<object>} leaves
 * @returns {number}
 */
export function getArrivalDurationMs(leaves) {
  if (!Array.isArray(leaves) || leaves.length === 0) return ARRIVAL_TIMING.restMs;
  let longest = 0;
  for (const leaf of leaves) {
    const delay = Number.isFinite(leaf.liftDelay) ? leaf.liftDelay : 0;
    const flight = Number.isFinite(leaf.flightMs)
      ? leaf.flightMs
      : ARRIVAL_TIMING.flightMs;
    longest = Math.max(longest, delay + flight);
  }
  return Math.round(ARRIVAL_TIMING.restMs + longest);
}

/**
 * Samples one leaf at a moment in the introduction.
 *
 * The return value is everything the renderer needs: a viewport-fraction
 * position, a rotation, the two scale axes that fake a leaf turning in the
 * air, and an alpha that reaches zero exactly when the crossing ends.
 *
 * @param {object} leaf
 * @param {number} elapsedMs Milliseconds since the introduction began.
 * @param {{ gust?: number, cross?: number }} [wind]
 * @returns {{
 *   x: number, y: number, rotation: number, scaleX: number, scaleY: number,
 *   alpha: number, visible: boolean, lifted: boolean, progress: number,
 * }}
 */
export function sampleArrivalLeaf(leaf, elapsedMs, wind = null) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const delay = Number.isFinite(leaf?.liftDelay) ? leaf.liftDelay : 0;
  const flightMs =
    Number.isFinite(leaf?.flightMs) && leaf.flightMs > 0
      ? leaf.flightMs
      : ARRIVAL_TIMING.flightMs;
  const age = elapsed - ARRIVAL_TIMING.restMs - delay;
  const sway = Math.sin(elapsed / 1000 + (leaf?.swayPhase ?? 0));
  const baseX = Number.isFinite(leaf?.x) ? leaf.x : 0.5;
  const baseY = Number.isFinite(leaf?.y) ? leaf.y : 0.5;
  const baseRotation = Number.isFinite(leaf?.rotation) ? leaf.rotation : 0;
  const tilt = Number.isFinite(leaf?.tilt) ? leaf.tilt : 0.75;

  if (age <= 0) {
    return {
      x: baseX + sway * (leaf?.swayAmp ?? 0.002),
      y: baseY,
      rotation: baseRotation + sway * 0.035,
      scaleX: tilt,
      scaleY: 1,
      alpha: 1,
      visible: true,
      lifted: false,
      progress: 0,
    };
  }

  const progress = Math.min(1, age / flightMs);
  // Smooth start and finish: the leaf is picked up, carried, then released.
  const travel = progress * progress * (3 - 2 * progress);
  const lift = Math.sin((progress * Math.PI) / 2);
  const gust = clamp(Number.isFinite(wind?.gust) ? wind.gust : 0, -1, 1);
  const cross = clamp(Number.isFinite(wind?.cross) ? wind.cross : 0, -1, 1);
  const flutter = Math.sin((age / 1000) * (leaf?.flutterSpeed ?? 6) + (leaf?.flutterPhase ?? 0));

  const x =
    baseX +
    (leaf?.driftX ?? 0.2) * travel +
    cross * 0.012 * travel +
    sway * 0.003;
  const y =
    baseY -
    (leaf?.rise ?? 0.2) * lift * (1 + gust * 0.12) +
    Math.sin(progress * Math.PI * 2 + (leaf?.flutterPhase ?? 0)) * 0.008;
  const rotation =
    baseRotation +
    (leaf?.spin ?? 1.5) * travel +
    flutter * 0.28 * (0.35 + progress);
  const scaleX = tilt * (0.42 + 0.58 * Math.abs(Math.cos(flutter * 1.35)));
  const scaleY = 1 - 0.1 * Math.sin(flutter);
  const alpha =
    progress <= ARRIVAL_TIMING.holdFraction
      ? 1
      : Math.max(
          0,
          1 -
            (progress - ARRIVAL_TIMING.holdFraction) /
              (1 - ARRIVAL_TIMING.holdFraction),
        );

  return {
    x,
    y,
    rotation,
    scaleX,
    scaleY,
    alpha,
    visible: progress < 1,
    lifted: true,
    progress,
  };
}

/**
 * The shared wind for a moment in the introduction. The existing field is
 * reused unchanged, so the arrival breeze is the same wind the ornaments use.
 *
 * @param {number} elapsedMs
 * @returns {{ gust: number, lift: number, cross: number }}
 */
export function sampleArrivalWind(elapsedMs) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  return sampleWindField(elapsed / 1000);
}
