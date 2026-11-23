/**
 * The Lucky Meter's physical composition and chamber behaviour.
 *
 * The whole meter — struck medallion, twelve seasonal chambers, the central
 * decorative leaf, the fixed external maple-leaf pointer and its curved arm,
 * the receiving vessel, the pour and the golden transfer beam — is one
 * three-dimensional scene. This module holds the numbers that scene and its
 * tests share, and the pure chamber maths.
 *
 * Angles use screen coordinates: 0° is 12 o'clock and angles run clockwise.
 * The pointer is fixed at 7:30 (225°). The wheel is the only thing that moves.
 */

/** One chamber per seasonal Lucky Colour. */
export const CHAMBER_COUNT = 12;
export const CHAMBER_DEGREES = 360 / CHAMBER_COUNT;

/** The fixed external golden maple leaf that is both pointer and pouring spout. */
export const POINTER_ANGLE_DEGREES = 225;

/** Every world-space anchor the scene builds from. */
export const METER_LAYOUT = Object.freeze({
  wheel: Object.freeze({
    x: 0,
    y: 0.62,
    z: 0,
    outerRadius: 1.06,
    chamberOuterRadius: 1,
    chamberInnerRadius: 0.58,
    chamberDepth: 0.12,
  }),
  pointer: Object.freeze({
    angleDegrees: POINTER_ANGLE_DEGREES,
    radius: 1.16,
    socketRadius: 0.088,
    leafScale: 0.34,
  }),
  arm: Object.freeze({
    base: Object.freeze([-1.68, -0.5, 0]),
    shoulder: Object.freeze([-1.42, -0.3, 0.03]),
    socket: Object.freeze([-0.88, -0.24, 0.08]),
    spout: Object.freeze([-0.78, -0.62, 0.05]),
    tubeRadius: 0.042,
  }),
  vessel: Object.freeze({
    x: -0.78,
    y: -1.2,
    z: 0.05,
    radius: 0.31,
    height: 0.63,
    liquidRadius: 0.265,
    liquidDepth: 0.48,
  }),
  beam: Object.freeze({
    // The transfer starts in the receiving vessel and ends at the wheel's
    // centre readout, where the lucky number is displayed.
    from: Object.freeze([-0.78, -0.86, 0.2]),
    to: Object.freeze([0, 0.58, 0.42]),
  }),
});

/** Wraps any angle into [0, 360). */
export function normalizeDegrees(angle) {
  const value = Number(angle);
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

/** A point on a circle where 0° is 12 o'clock and angles run clockwise. */
export function polarPosition(angleDegrees, radius, centre = { x: 0, y: 0 }) {
  const radians = (normalizeDegrees(angleDegrees) * Math.PI) / 180;
  return {
    x: centre.x + radius * Math.sin(radians),
    y: centre.y + radius * Math.cos(radians),
  };
}

/** The centre of chamber `index`, in world coordinates. */
export function chamberCentre(index, paletteLength = CHAMBER_COUNT) {
  const step = 360 / (Number.isFinite(paletteLength) && paletteLength > 0 ? paletteLength : CHAMBER_COUNT);
  const angle = normalizeDegrees(index * step);
  const radius =
    (METER_LAYOUT.wheel.chamberInnerRadius + METER_LAYOUT.wheel.chamberOuterRadius) / 2;
  return {
    ...polarPosition(angle, radius, { x: METER_LAYOUT.wheel.x, y: METER_LAYOUT.wheel.y }),
    angle,
  };
}

/** The fixed pointer's socket position in world coordinates. */
export function pointerSocketPosition() {
  return polarPosition(METER_LAYOUT.pointer.angleDegrees, METER_LAYOUT.pointer.radius, {
    x: METER_LAYOUT.wheel.x,
    y: METER_LAYOUT.wheel.y,
  });
}

/**
 * How full a chamber is.
 *
 * Every chamber is full except the selected one, which drains to empty as the
 * pour runs. The receiving vessel is not involved: it fills and stays full.
 *
 * @param {number} index
 * @param {number} selectedIndex
 * @param {number} drain 0–1 pour progress.
 * @returns {number} 0–1.
 */
export function chamberFillFactor(index, selectedIndex, drain) {
  const progress = Math.max(0, Math.min(1, Number(drain) || 0));
  if (selectedIndex < 0 || index !== selectedIndex) return 1;
  return 1 - progress;
}

/**
 * The selected chamber index for a palette and colour id.
 *
 * @param {ReadonlyArray<{ id: string }>} palette
 * @param {string|null} colourId
 * @returns {number} -1 when nothing is selected.
 */
export function selectedChamberIndex(palette, colourId) {
  if (!Array.isArray(palette) || !colourId) return -1;
  const index = palette.findIndex((colour) => colour?.id === colourId);
  return index >= 0 ? index : -1;
}

/** A conic-gradient string for the no-WebGL CSS wheel. */
export function chamberGradient(palette) {
  const colours = Array.isArray(palette) ? palette : [];
  if (colours.length === 0) {
    return 'conic-gradient(from 0deg, #2a3340 0deg 360deg)';
  }
  const step = 360 / colours.length;
  const stops = colours
    .map((colour, index) => {
      const start = (index * step).toFixed(2);
      const end = ((index + 1) * step).toFixed(2);
      return `${colour.hex} ${start}deg ${end}deg`;
    })
    .join(', ');
  return `conic-gradient(from 0deg, ${stops})`;
}
