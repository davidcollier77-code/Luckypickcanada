/**
 * Shared additive WebGL primitives for the Lucky Meter renderers.
 *
 * The cosmic event stage and the circular meter's energy trails both draw soft
 * glowing points with the same shader. Keeping the shader source, program
 * helpers and growable point batch here means both renderers use one audited
 * implementation instead of divergent copies.
 *
 * Nothing here allocates until a renderer calls it, and every buffer is owned by
 * the caller so it can be deleted on teardown.
 */

export const POINT_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec4 a_color;
attribute float a_size;
uniform vec2 u_resolution;
uniform float u_max_point;
varying vec4 v_color;

void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
  gl_PointSize = min(a_size, u_max_point);
  v_color = a_color;
}
`;

export const POINT_FRAGMENT_SHADER = `
precision mediump float;
varying vec4 v_color;
uniform float u_alpha;

void main() {
  vec2 offset = gl_PointCoord - vec2(0.5);
  float dist = length(offset) * 2.0;
  if (dist > 1.0) discard;
  float shape = max(0.0, 1.0 - dist);
  // A generous halo around a hot core. A very tight falloff turns dense
  // bursts into invisible specks, especially on software or mobile renderers;
  // this profile keeps the plasma volumetric while the core stays white-hot.
  float halo = pow(shape, 1.15);
  float core = pow(shape, 3.4);
  vec3 color = v_color.rgb * (core * 2.2 + halo * 1.1);
  float alpha = min(1.0, (core + halo * 0.9) * v_color.a * u_alpha);
  gl_FragColor = vec4(color, alpha);
}
`;

/** Converts a CSS hex colour to normalized RGB. */
export function hexToRgb(hex) {
  const clean = String(hex || '#ffffff').replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((character) => character + character).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(random, min, max) {
  return min + random() * (max - min);
}

export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Cosmic shader failed to compile:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Cosmic program failed to link:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/**
 * Largest point size the current graphics path accepts. Callers still clamp
 * their own sizes; this only prevents an over-range gl_PointSize.
 */
export function readMaxPointSize(gl, fallback = 128) {
  try {
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    return Array.isArray(range) && range.length > 1 ? range[1] : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Growable point batch with a hard ceiling.
 *
 * Arrays are reused between frames. When `limit` would be exceeded, extra
 * points are dropped rather than growing without bound, which protects the
 * device from a particle spike or a runaway trail.
 */
export class PointBatch {
  constructor(capacity = 2048, limit = capacity * 4) {
    this.capacity = capacity;
    this.limit = Math.max(capacity, limit);
    // Optional per-frame draw cap used by the runtime quality governor. It
    // keeps the oldest points of a batch and drops new ones, so a struggling
    // device does less raster work without reallocating its buffers.
    this.maxPoints = this.limit;
    this.count = 0;
    this.dropped = 0;
    this.positions = new Float32Array(capacity * 2);
    this.colors = new Float32Array(capacity * 4);
    this.sizes = new Float32Array(capacity);
  }

  reset() {
    this.count = 0;
    this.dropped = 0;
  }

  ensure(extra) {
    const required = this.count + extra;
    if (required <= this.capacity) return true;
    if (required > this.limit) return false;

    // Grow towards double the current capacity but never past the ceiling, and
    // never past what this call actually needs, so a single large spawn does
    // not allocate far more than it will use.
    const capped = Math.min(this.limit, Math.max(required, this.capacity * 2));
    const positions = new Float32Array(capped * 2);
    const colors = new Float32Array(capped * 4);
    const sizes = new Float32Array(capped);
    positions.set(this.positions);
    colors.set(this.colors);
    sizes.set(this.sizes);
    this.positions = positions;
    this.colors = colors;
    this.sizes = sizes;
    this.capacity = capped;
    return true;
  }

  /**
   * @param {number} x CSS pixel x
   * @param {number} y CSS pixel y
   * @param {number} size CSS pixel point diameter
   * @param {number[]} color Normalized RGB
   * @param {number} alpha 0–1
   * @param {number} scale Device pixel ratio
   * @param {number} maxPoint Largest supported gl_PointSize
   * @returns {boolean} Whether the point was stored.
   */
  push(x, y, size, color, alpha, scale, maxPoint) {
    if (alpha <= 0.003 || size <= 0) return false;
    if (this.count >= this.maxPoints) {
      this.dropped += 1;
      return false;
    }
    if (!this.ensure(1)) {
      this.dropped += 1;
      return false;
    }
    const index = this.count;
    this.positions[index * 2] = x;
    this.positions[index * 2 + 1] = y;
    this.colors[index * 4] = color[0];
    this.colors[index * 4 + 1] = color[1];
    this.colors[index * 4 + 2] = color[2];
    this.colors[index * 4 + 3] = clamp(alpha, 0, 1);
    this.sizes[index] = Math.min(size * scale, maxPoint);
    this.count += 1;
    return true;
  }
}
