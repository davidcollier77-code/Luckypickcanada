/**
 * Shared scene lighting for the Lucky Meter's separately composited renderers.
 *
 * The medallion, the golden maple leaves and the cinematic effects each own a
 * canvas, because they sit on different sides of the interface in the layer
 * order. Separate canvases cannot share a depth buffer, but they must share the
 * light or the scene reads as unrelated images stacked on one another.
 *
 * The event engine is the only producer: it writes the handful of lights it
 * currently has (lightning strikes and firework detonations) into this bus each
 * frame. The medallion and ornament renderers read the same buffer and add its
 * contribution to their own shading. Nothing here allocates after construction,
 * and a renderer that is paused simply stops reading.
 *
 * The buffer is fixed-capacity on purpose: a per-frame variable-length array of
 * lights would allocate in the animation loop, which this codebase avoids.
 */

/** Four lights covers the widest overlap the effects produce in practice. */
export const MAX_SCENE_LIGHTS = 4;

const state = {
  count: 0,
  /** Screen-space position in CSS pixels. */
  x: new Float32Array(MAX_SCENE_LIGHTS),
  y: new Float32Array(MAX_SCENE_LIGHTS),
  /** Radius of influence in CSS pixels. */
  radius: new Float32Array(MAX_SCENE_LIGHTS),
  /** Peak contribution, 0–1.5. */
  intensity: new Float32Array(MAX_SCENE_LIGHTS),
  red: new Float32Array(MAX_SCENE_LIGHTS),
  green: new Float32Array(MAX_SCENE_LIGHTS),
  blue: new Float32Array(MAX_SCENE_LIGHTS),
  /** Monotonic counter, so a reader can cheaply detect that it changed. */
  version: 0,
};

/**
 * Replaces the published light set.
 *
 * @param {Array<{ x: number, y: number, radius: number, intensity: number, color: number[] }>} lights
 */
export function publishSceneLights(lights) {
  const count = Math.min(MAX_SCENE_LIGHTS, Array.isArray(lights) ? lights.length : 0);
  for (let index = 0; index < count; index += 1) {
    const light = lights[index];
    const color = light?.color ?? [1, 1, 1];
    state.x[index] = light?.x ?? 0;
    state.y[index] = light?.y ?? 0;
    state.radius[index] = Math.max(1, light?.radius ?? 1);
    state.intensity[index] = Math.max(0, light?.intensity ?? 0);
    state.red[index] = color[0] ?? 1;
    state.green[index] = color[1] ?? 1;
    state.blue[index] = color[2] ?? 1;
  }
  state.count = count;
  state.version += 1;
}

/** Removes every light, so a finished or unmounted stage stops lighting the page. */
export function clearSceneLights() {
  state.count = 0;
  state.version += 1;
}

/**
 * The published lights. Read-only by convention: callers must not mutate it.
 *
 * @returns {{ count: number, x: Float32Array, y: Float32Array, radius: Float32Array, intensity: Float32Array, red: Float32Array, green: Float32Array, blue: Float32Array, version: number }}
 */
export function getSceneLights() {
  return state;
}

/**
 * Total warm lift at a point, used by renderers that want a single scalar rather
 * than a full shading pass (for example, tinting a leaf's ambient term).
 *
 * @param {number} x
 * @param {number} y
 * @returns {number} 0–1
 */
export function sampleSceneLightLift(x, y) {
  let lift = 0;
  for (let index = 0; index < state.count; index += 1) {
    const dx = x - state.x[index];
    const dy = y - state.y[index];
    const distance = Math.hypot(dx, dy);
    const falloff = Math.max(0, 1 - distance / state.radius[index]);
    lift += falloff * falloff * state.intensity[index];
  }
  return Math.min(1, lift);
}
