/**
 * The Lucky Meter's physical composition and chamber behaviour.
 *
 * The whole meter — the arched banner, the twelve seasonal glass cups set in a
 * punched gold plate, the central medallion, the fixed 7:30 spout, the crystal
 * bowl on its foot, the colour bar, the ornate Lucky Number plaque and the
 * number's independent flight — is one three-dimensional scene. This module
 * holds the numbers that scene and its tests share, and the pure maths.
 *
 * Angles use screen coordinates: 0° is 12 o'clock and angles run clockwise.
 * The spout is fixed at 7:30 (225°). The wheel is the only thing that moves.
 */

/** One chamber per seasonal Lucky Colour. */
export const CHAMBER_COUNT = 12;
export const CHAMBER_DEGREES = 360 / CHAMBER_COUNT;

/** The fixed external golden spout that is both pointer and pour. */
export const POINTER_ANGLE_DEGREES = 225;

/** The stage's width-to-height ratio. The instrument is a portrait object. */
export const STAGE_ASPECT = 0.76;

/** The cup window inside each gold spoke, in world units. */
export const CHAMBER_CUP = Object.freeze({
  radius: 0.132,
  height: 0.3,
  innerRadius: 0.092,
  liquidRadius: 0.114,
  liquidDepth: 0.245,
});

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
    radius: 1.04,
    socketRadius: 0.088,
    mouthRadius: 0.082,
    tubeRadius: 0.075,
  }),
  // Retained for the development-only instrument prototype, which still builds
  // the older leaf pointer. Production geometry uses `spout` below.
  arm: Object.freeze({
    base: Object.freeze([-1.28, -0.46, 0.01]),
    shoulder: Object.freeze([-1.15, -0.34, 0.04]),
    socket: Object.freeze([-0.95, -0.35, 0.08]),
    spout: Object.freeze([-0.78, -0.62, 0.05]),
    tubeRadius: 0.042,
  }),
  spout: Object.freeze({
    socket: Object.freeze([-0.735, -0.115, 0.06]),
    elbow: Object.freeze([-0.83, -0.36, 0.09]),
    mouth: Object.freeze([-0.78, -0.6, 0.08]),
    mouthAngleDegrees: 34,
  }),
  vessel: Object.freeze({
    x: -0.78,
    y: -1.16,
    z: 0.05,
    radius: 0.6,
    height: 0.44,
    liquidRadius: 0.52,
    liquidDepth: 0.31,
    liquidFloor: 0.06,
  }),
  plaque: Object.freeze({
    x: 0.72,
    y: -1.0,
    z: 0.06,
    width: 0.94,
    height: 0.7,
    insetWidth: 0.6,
    insetHeight: 0.3,
    headerHeight: 0.16,
  }),
  colourBar: Object.freeze({
    x: -0.78,
    y: -1.54,
    z: 0.12,
    width: 1.16,
    height: 0.25,
  }),
  banner: Object.freeze({
    x: 0,
    y: 1.58,
    z: 0.1,
    width: 1.7,
    height: 0.42,
  }),
});

/** The longest stage that still uses the tall phone composition. */
export const PHONE_MAX_WIDTH = 500;
const STAGE_VERTICAL_EXTENT = 3.8;
const STAGE_LOOK_Y = 0.02;
const FRAMING_FOV = 32;

/**
 * Framing for the production visitor stage.
 *
 * The stage is a portrait crop of the instrument, so it uses one vertical
 * extent for every size: the banner, the wheel, both result destinations and
 * the colour bar always fit, and the wheel keeps its true circle. Only the CSS
 * width changes with the viewport, so the wheel simply grows or shrinks with
 * the screen.
 *
 * `wheelTop` is the projected vertical centre of the wheel as a 0–1 fraction
 * from the top of the stage, so DOM overlays can stay aligned with the canvas.
 *
 * @param {number} width CSS pixels
 * @param {number} height CSS pixels
 * @returns {{ phone: boolean, tabletPortrait: boolean, verticalExtent: number, lookY: number, distance: number, aspect: number, wheelTop: number }}
 */
export function stageFraming(width, height) {
  const safeWidth = Math.max(1, Number(width) || 390);
  const safeHeight = Math.max(1, Number(height) || safeWidth / STAGE_ASPECT);
  const verticalExtent = STAGE_VERTICAL_EXTENT;
  const lookY = STAGE_LOOK_Y;
  const distance = verticalExtent / (2 * Math.tan((FRAMING_FOV * Math.PI) / 360));
  return {
    phone: safeWidth <= PHONE_MAX_WIDTH,
    tabletPortrait: safeWidth / safeHeight < 1.05,
    verticalExtent,
    lookY,
    distance,
    aspect: safeWidth / safeHeight,
    wheelTop: 0.5 - (METER_LAYOUT.wheel.y - lookY) / verticalExtent,
  };
}

/**
 * The visitor stage's framing. Kept as a named export because older callers
 * used it; it is now the same portrait composition.
 *
 * @param {number} width
 * @param {number} height
 */
export function instrumentFraming(width, height) {
  return stageFraming(width, height);
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

/**
 * Where a chamber actually is on screen once the wheel has turned.
 *
 * The scene rotates the wheel group by `-wheelAngle`, so a chamber built at
 * local screen angle `index × 30°` reads at `index × 30° + wheelAngle`. When
 * the wheel has landed, `wheelAngle = 225 − index × 30°` and every selected
 * chamber reads exactly under the 7:30 spout.
 *
 * @param {number} index
 * @param {number} wheelAngle Degrees, as reported by the scene.
 * @param {number} [paletteLength]
 * @returns {{ x: number, y: number, angle: number }}
 */
export function chamberWorldPosition(index, wheelAngle, paletteLength = CHAMBER_COUNT) {
  const step = 360 / (Number.isFinite(paletteLength) && paletteLength > 0 ? paletteLength : CHAMBER_COUNT);
  const angle = normalizeDegrees(index * step + (Number(wheelAngle) || 0));
  const radius =
    (METER_LAYOUT.wheel.chamberInnerRadius + METER_LAYOUT.wheel.chamberOuterRadius) / 2;
  return {
    ...polarPosition(angle, radius, { x: METER_LAYOUT.wheel.x, y: METER_LAYOUT.wheel.y }),
    angle,
  };
}

/** The fixed spout's socket position in world coordinates. */
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

/**
 * A uniform Catmull–Rom sample of a point list.
 *
 * The scene and the clearance test use this one function, so a measured path
 * and a rendered path can never drift apart.
 *
 * @param {ReadonlyArray<readonly number[]>} points
 * @param {number} t 0–1
 * @returns {{ x: number, y: number, z: number }}
 */
export function sampleNumberPath(points, t) {
  const list = Array.isArray(points) ? points : [];
  if (list.length === 0) return { x: 0, y: 0, z: 0 };
  if (list.length === 1) return { x: list[0][0], y: list[0][1], z: list[0][2] ?? 0 };
  const progress = Math.max(0, Math.min(1, Number(t) || 0));
  const scaled = progress * (list.length - 1);
  const index = Math.min(list.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const p0 = list[Math.max(0, index - 1)];
  const p1 = list[index];
  const p2 = list[index + 1];
  const p3 = list[Math.min(list.length - 1, index + 2)];
  const t2 = local * local;
  const t3 = t2 * local;
  const axis = (a, b, c, d) =>
    0.5 *
    (2 * b + (-a + c) * local + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return {
    x: axis(p0[0], p1[0], p2[0], p3[0]),
    y: axis(p0[1], p1[1], p2[1], p3[1]),
    z: axis(p0[2] ?? 0, p1[2] ?? 0, p2[2] ?? 0, p3[2] ?? 0),
  };
}

/**
 * The Lucky Number's independent flight, in world coordinates.
 *
 * It starts in the selected cup, lifts outward and upward into open sky, arcs
 * across in front of the instrument (z above every gold face, so it is drawn in
 * front and never through geometry) and descends into the plaque's recess. It
 * never approaches the spout, the stream or the bowl.
 *
 * @param {{ index: number, wheelAngle: number, paletteLength?: number }} options
 * @returns {number[][]} Five [x, y, z] control points.
 */
export function numberTransferPath({ index, wheelAngle, paletteLength = CHAMBER_COUNT }) {
  const start = chamberWorldPosition(index, wheelAngle, paletteLength);
  const centre = { x: METER_LAYOUT.wheel.x, y: METER_LAYOUT.wheel.y };
  const dx = start.x - centre.x;
  const dy = start.y - centre.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  return [
    [start.x, start.y, 0.26],
    [start.x + ux * 0.34, start.y + uy * 0.2 + 0.34, 0.36],
    [0.06, 0.34, 0.42],
    [METER_LAYOUT.plaque.x - 0.02, METER_LAYOUT.plaque.y + 0.42, 0.4],
    [METER_LAYOUT.plaque.x, METER_LAYOUT.plaque.y - 0.09, 0.34],
  ];
}

/** Minimum clearances the number's path must keep, in world units. */
export const NUMBER_PATH_CLEARANCE = Object.freeze({
  bowl: METER_LAYOUT.vessel.radius + 0.25,
  spout: 0.45,
});

/**
 * Measures how close the number's path comes to the two things it must never
 * touch, plus the bowl's liquid surface height.
 *
 * @param {ReadonlyArray<readonly number[]>} points
 * @param {number} [samples]
 * @returns {{ bowl: number, spout: number, samples: Array<{ x: number, y: number, z: number }> }}
 */
export function measureNumberPathClearance(points, samples = 96) {
  const count = Math.max(2, Math.min(512, Math.floor(samples) || 96));
  const bowl = { x: METER_LAYOUT.vessel.x, y: METER_LAYOUT.vessel.y };
  const spout = { x: METER_LAYOUT.spout.mouth[0], y: METER_LAYOUT.spout.mouth[1] };
  const sampled = [];
  let bowlDistance = Infinity;
  let spoutDistance = Infinity;
  for (let step = 0; step <= count; step += 1) {
    const point = sampleNumberPath(points, step / count);
    sampled.push(point);
    bowlDistance = Math.min(bowlDistance, Math.hypot(point.x - bowl.x, point.y - bowl.y));
    spoutDistance = Math.min(spoutDistance, Math.hypot(point.x - spout.x, point.y - spout.y));
  }
  return { bowl: bowlDistance, spout: spoutDistance, samples: sampled };
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
