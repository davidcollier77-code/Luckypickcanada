/**
 * Autumn maple-leaf palette and wind field for the Lucky Meter ornaments.
 *
 * Both are pure data and pure functions so they can be tested without WebGL.
 * The palette is a coherent Canadian autumn set — maple red, burnt orange,
 * copper, amber, burgundy, russet and warm gold — and is selected per leaf.
 * It takes no tier or event argument by design: colour variation must stay
 * independent of the daily reading and of the cinematic that follows it.
 *
 * Warm gold is weighted most heavily so the scene still reads as the golden
 * maple-leaf ornament of the established visual identity; the other six
 * colours provide the variation that stops the leaves looking like copies.
 */

export const AUTUMN_LEAF_COLOURS = Object.freeze([
  {
    id: 'warm-gold',
    name: 'Warm Gold',
    albedo: [0.95, 0.72, 0.28],
    metal: 0.95,
    weight: 3,
  },
  {
    id: 'amber',
    name: 'Amber',
    albedo: [0.93, 0.58, 0.18],
    metal: 0.8,
    weight: 2,
  },
  {
    id: 'copper',
    name: 'Copper',
    albedo: [0.78, 0.4, 0.19],
    metal: 0.85,
    weight: 1.4,
  },
  {
    id: 'maple-red',
    name: 'Maple Red',
    albedo: [0.72, 0.12, 0.12],
    metal: 0.45,
    weight: 1.2,
  },
  {
    id: 'burnt-orange',
    name: 'Burnt Orange',
    albedo: [0.8, 0.32, 0.09],
    metal: 0.6,
    weight: 1.2,
  },
  {
    id: 'burgundy',
    name: 'Burgundy',
    albedo: [0.42, 0.09, 0.13],
    metal: 0.35,
    weight: 0.8,
  },
  {
    id: 'russet',
    name: 'Russet',
    albedo: [0.55, 0.28, 0.13],
    metal: 0.4,
    weight: 1,
  },
]);

const TOTAL_WEIGHT = AUTUMN_LEAF_COLOURS.reduce((sum, colour) => sum + colour.weight, 0);

/**
 * Picks one autumn colour for a leaf.
 *
 * @param {() => number} [random] Injectable random source.
 * @returns {{ id: string, name: string, albedo: number[], metal: number, weight: number }}
 */
export function pickLeafColour(random = Math.random) {
  const value = typeof random === 'function' ? random() : 0.5;
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0.5;
  let threshold = clamped * TOTAL_WEIGHT;
  for (const colour of AUTUMN_LEAF_COLOURS) {
    threshold -= colour.weight;
    if (threshold < 0) return colour;
  }
  return AUTUMN_LEAF_COLOURS[AUTUMN_LEAF_COLOURS.length - 1];
}

/**
 * Samples the shared wind field.
 *
 * Two slow, incommensurable periods give a gust that builds, eases and changes
 * direction without ever repeating on a short cycle. Values are normalised to
 * -1..1; callers scale them into their own coordinate space.
 *
 * @param {number} seconds Seconds since the layer started.
 * @returns {{ gust: number, lift: number, cross: number }}
 */
export function sampleWindField(seconds) {
  const time = Number.isFinite(seconds) ? seconds : 0;
  const gust = Math.sin(time * 0.19) * 0.55 + Math.sin(time * 0.071 + 1.3) * 0.45;
  const lift = Math.sin(time * 0.13 + 2.1) * 0.6 + Math.sin(time * 0.31 + 0.4) * 0.4;
  const cross = Math.sin(time * 0.043 + 0.7);
  return {
    gust: Math.max(-1, Math.min(1, gust)),
    lift: Math.max(-1, Math.min(1, lift)),
    cross: Math.max(-1, Math.min(1, cross)),
  };
}

/**
 * Horizontal travel of one leaf in viewport fractions for a given moment.
 *
 * The leaf crosses the frame left to right and wraps, so the scene reads as
 * wind-carried foliage rather than a set of objects spinning in place. Depth
 * changes the speed for parallax.
 *
 * @param {{ travelOffset: number, travelSpeed: number, depth: number }} leaf
 * @param {number} seconds
 * @param {{ gust: number }} wind
 * @param {number} [span] Width of the wrap window in viewport fractions.
 * @returns {{ x: number, progress: number }}
 */
export function sampleLeafTravel(leaf, seconds, wind, span = 1.18) {
  const time = Number.isFinite(seconds) ? seconds : 0;
  const speed = (leaf.travelSpeed ?? 0.012) * (0.55 + (leaf.depth ?? 0.5) * 0.55);
  const gustBoost = 1 + Math.max(-0.6, Math.min(0.8, wind?.gust ?? 0)) * 0.45;
  const raw = (leaf.travelOffset ?? 0) + time * speed * gustBoost;
  const progress = ((raw % span) + span) % span;
  return { x: -0.09 + progress, progress: progress / span };
}
