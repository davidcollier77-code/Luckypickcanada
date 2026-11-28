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
    base: Object.freeze([-1.28, -0.46, 0.01]),
    shoulder: Object.freeze([-1.15, -0.34, 0.04]),
    socket: Object.freeze([-0.95, -0.35, 0.08]),
    spout: Object.freeze([-0.78, -0.62, 0.05]),
    tubeRadius: 0.042,
  }),
  vessel: Object.freeze({
    x: -0.78,
    y: -1.28,
    z: 0.05,
    radius: 0.62,
    height: 0.36,
    liquidRadius: 0.54,
    liquidDepth: 0.27,
    liquidFloor: 0.075,
  }),
  beam: Object.freeze({
    // The transfer starts in the selected 7:30 chamber and ends at the separate
    // number display beside the receiving bowl. The two results are never
    // combined: the colour stays in the bowl and the number owns its own place.
    from: Object.freeze([-0.56, 0.06, 0.3]),
    to: Object.freeze([0.16, -1.2, 0.38]),
  }),
});

/** The widest stage that still uses the tall phone composition. */
export const PHONE_MAX_WIDTH = 500;
const PHONE_VERTICAL_EXTENT = 6.6;
const TABLET_VERTICAL_EXTENT = 4.5;
const DESKTOP_VERTICAL_EXTENT = 4.2;
const PHONE_LOOK_Y = -0.35;
const LARGE_LOOK_Y = -0.2;
const FRAMING_FOV = 32;

/**
 * Responsive camera framing for the instrument.
 *
 * The perspective and every world coordinate stay identical; only the camera
 * distance and look-at height change with the stage size. That keeps the wheel
 * circular, preserves relative spacing and never applies a non-uniform scale.
 * `wheelTop` is the projected vertical centre of the wheel as a 0–1 fraction
 * from the top of the stage, so DOM overlays can stay aligned with the canvas.
 *
 * @param {number} width CSS pixels
 * @param {number} height CSS pixels
 * @returns {{ phone: boolean, tabletPortrait: boolean, verticalExtent: number, lookY: number, distance: number, aspect: number, wheelTop: number }}
 */
export function instrumentFraming(width, height) {
  const safeWidth = Math.max(1, Number(width) || 390);
  const safeHeight = Math.max(1, Number(height) || 844);
  const phone = safeWidth <= PHONE_MAX_WIDTH;
  const tabletPortrait = !phone && safeWidth / safeHeight < 1.05;
  const verticalExtent = phone
    ? PHONE_VERTICAL_EXTENT
    : tabletPortrait
      ? TABLET_VERTICAL_EXTENT
      : DESKTOP_VERTICAL_EXTENT;
  const lookY = phone ? PHONE_LOOK_Y : LARGE_LOOK_Y;
  const distance = verticalExtent / (2 * Math.tan((FRAMING_FOV * Math.PI) / 360));
  return {
    phone,
    tabletPortrait,
    verticalExtent,
    lookY,
    distance,
    aspect: safeWidth / safeHeight,
    wheelTop: 0.5 - (METER_LAYOUT.wheel.y - lookY) / verticalExtent,
  };
}

/**
 * Framing for the production visitor stage.
 *
 * The visitor canvas is a square crop of the same instrument rather than the
 * prototype's full-height viewport, so it uses a tighter vertical extent. The
 * geometry, perspective, circular wheel and relative spacing are unchanged;
 * only the crop is closer. Phones keep slightly more breathing room than
 * tablets and desktops, which deliberately let the instrument fill more of the
 * square.
 *
 * @param {number} width CSS pixels
 * @param {number} height CSS pixels
 * @returns {{ phone: boolean, tabletPortrait: boolean, verticalExtent: number, lookY: number, distance: number, aspect: number, wheelTop: number }}
 */
export function stageFraming(width, height) {
  const safeWidth = Math.max(1, Number(width) || 390);
  const safeHeight = Math.max(1, Number(height) || safeWidth);
  const phone = safeWidth <= PHONE_MAX_WIDTH;
  const verticalExtent = phone ? 3.9 : 3.6;
  const lookY = -0.15;
  const distance = verticalExtent / (2 * Math.tan((FRAMING_FOV * Math.PI) / 360));
  return {
    phone,
    tabletPortrait: !phone && safeWidth / safeHeight < 1.05,
    verticalExtent,
    lookY,
    distance,
    aspect: safeWidth / safeHeight,
    wheelTop: 0.5 - (METER_LAYOUT.wheel.y - lookY) / verticalExtent,
  };
}

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
