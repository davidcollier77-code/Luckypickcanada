/**
 * Arrival leaves: the substantial pile of autumn maple leaves that rests in the
 * foreground around the Lucky Meter when the page appears, then lifts on a
 * breeze and leaves the sky.
 *
 * This module is pure data and pure motion so the one-shot introduction can be
 * tested without a canvas. `LuckyMeterArrivalLeaves` owns the pixels; this owns
 * the composition, the timing and the path of every leaf.
 *
 * The pile is composed in four overlapping layers plus two side drifts, so it
 * reads as a real mound of dry leaves rather than a ring of stickers: the back
 * layers are smaller, darker and higher, and each layer in front is larger and
 * catches more light. The breeze then lifts the whole pile away in one gust.
 * Nothing here selects, changes or reads the daily result.
 */
import { pickLeafColour, sampleWindField } from './leaf-wind';

/** When the breeze arrives, and how the crossing is shaped. */
export const ARRIVAL_TIMING = Object.freeze({
  /** Stages 1–2: the resting pile holds long enough to register. */
  restMs: 2400,
  /** The breeze reaches each leaf inside this window. */
  liftSpreadMs: 220,
  /** A short, accelerating lift before the crossing carries the leaf away. */
  flightMs: 2100,
  /** The fraction of the crossing that is fully opaque. */
  holdFraction: 0.62,
});

/**
 * The mound, back to front. Bands are viewport fractions; sizes are CSS pixels
 * before the viewport scale is applied. Every band sits below the copy column,
 * so a leaf never covers a headline or the Start control.
 */
const PILE_LAYERS = Object.freeze([
  { x: [0.3, 0.7], y: [0.685, 0.735], size: [24, 32], depth: [0.5, 0.66], weight: 7 },
  { x: [0.22, 0.78], y: [0.722, 0.792], size: [30, 40], depth: [0.62, 0.8], weight: 9 },
  { x: [0.16, 0.84], y: [0.772, 0.852], size: [36, 48], depth: [0.76, 0.92], weight: 9 },
  { x: [0.11, 0.89], y: [0.828, 0.932], size: [42, 56], depth: [0.88, 1], weight: 7 },
]);

/** Loose leaves either side of the mound, still clear of the copy column. */
const FLANK_BANDS = Object.freeze([
  { x: [0.035, 0.12], y: [0.555, 0.78], size: [24, 40], depth: [0.55, 0.9], weight: 2 },
  { x: [0.88, 0.965], y: [0.555, 0.78], size: [24, 40], depth: [0.55, 0.9], weight: 2 },
]);

/** Narrow viewports keep a tighter, lower mound and smaller leaves. */
const MOBILE_SCALE = 0.68;

/** Every band the composition can draw from, back to front. */
const ALL_BANDS = Object.freeze([...PILE_LAYERS, ...FLANK_BANDS]);

const TOTAL_WEIGHT = ALL_BANDS.reduce((sum, band) => sum + band.weight, 0);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(random, min, max) {
  return min + clamp(random(), 0, 0.999999) * (max - min);
}

/**
 * Maps a leaf index onto a band, spread proportionally across the whole
 * composition so a small count still spans the mound back to front instead of
 * clustering in the first band.
 *
 * @param {number} index
 * @param {number} total
 * @returns {number} Index into ALL_BANDS.
 */
function bandForIndex(index, total) {
  const position = total > 1 ? index / total : 0;
  let threshold = clamp(position, 0, 0.999999) * TOTAL_WEIGHT;
  for (let band = 0; band < ALL_BANDS.length; band += 1) {
    threshold -= ALL_BANDS[band].weight;
    if (threshold < 0) return band;
  }
  return ALL_BANDS.length - 1;
}

/**
 * Builds the resting composition for one introduction.
 *
 * Positions are viewport fractions, so a resize keeps the arrangement. Sizes
 * are CSS pixels and are aware of the viewport: a phone gets a smaller mound.
 *
 * @param {() => number} [random] Injectable random source.
 * @param {number} [count] Number of leaves to place.
 * @param {{ width?: number, height?: number }} [viewport]
 * @returns {Array<object>}
 */
export function createArrivalLeaves(
  random = Math.random,
  count = 34,
  viewport = { width: 1440, height: 900 },
) {
  const width = Number.isFinite(viewport?.width) ? viewport.width : 1440;
  const mobile = width < 640;
  const leaves = [];
  const requested = Math.max(1, Math.round(count) || 1);
  const total = Math.max(1, Math.min(ALL_BANDS.length * 12, requested));

  for (let index = 0; index < total; index += 1) {
    const band = ALL_BANDS[bandForIndex(index, total)];
    const sizeScale = mobile ? MOBILE_SCALE : 1;
    // Clamped to the safe frame, so a flank band never drifts off-screen.
    const xRange = [Math.max(0.03, band.x[0]), Math.min(0.97, band.x[1])];
    // A phone keeps the mound below the Start control.
    const yRange = mobile
      ? [Math.max(0.72, band.y[0]), Math.min(0.975, band.y[1])]
      : band.y;

    leaves.push({
      id: `arrival-leaf-${index}`,
      x: randomBetween(random, xRange[0], xRange[1]),
      y: randomBetween(random, yRange[0], yRange[1]),
      // Small enough to read as a real leaf at rest, never as a banner.
      size: randomBetween(random, band.size[0], band.size[1]) * sizeScale,
      rotation: randomBetween(random, -0.85, 0.85),
      tilt: randomBetween(random, 0.58, 0.94),
      colour: pickLeafColour(random),
      depth: randomBetween(random, band.depth[0], band.depth[1]),
      liftDelay: randomBetween(random, 0, ARRIVAL_TIMING.liftSpreadMs),
      flightMs: ARRIVAL_TIMING.flightMs * randomBetween(random, 0.88, 1.12),
      driftX: randomBetween(random, 0.16, 0.34),
      // Half the pile is carried right and half left, so the gust opens out
      // from the centre instead of sliding everything one way.
      driftSign: index % 2 === 0 ? 1 : -1,
      rise: randomBetween(random, 0.16, 0.32) * (mobile ? 1.15 : 1),
      spin: (random() > 0.5 ? 1 : -1) * randomBetween(random, 1.1, 2.6),
      flutterSpeed: randomBetween(random, 4.4, 8.2),
      flutterPhase: randomBetween(random, 0, Math.PI * 2),
      swayAmp: randomBetween(random, 0.0012, 0.0034),
      swayPhase: randomBetween(random, 0, Math.PI * 2),
    });
  }

  // Back to front, so the near leaves paint over the far ones and the pile has
  // a stable depth order on every frame.
  return leaves.sort((left, right) => left.depth - right.depth);
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
  const driftSign = Number.isFinite(leaf?.driftSign) && leaf.driftSign < 0 ? -1 : 1;
  const flutter = Math.sin((age / 1000) * (leaf?.flutterSpeed ?? 6) + (leaf?.flutterPhase ?? 0));

  const x =
    baseX +
    (leaf?.driftX ?? 0.2) * driftSign * travel +
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
