/**
 * Minimal 3D maths for the Lucky Meter's lit renderers.
 *
 * The repository renders every GPU effect through WebGL 1 with no third-party
 * graphics dependency, so the handful of matrix and projection operations the
 * medallion, the maple leaves and the projected effect camera need live here.
 *
 * Everything is a pure function operating on caller-supplied arrays. Results
 * are written into `out` when one is supplied so animation loops can reuse their
 * buffers instead of allocating a matrix per frame.
 */

/** A 4x4 identity matrix. */
export function identityMat4(out = new Float32Array(16)) {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/**
 * Column-major 4x4 multiply: `out = a * b`.
 *
 * Column-major matches what `gl.uniformMatrix4fv` expects with
 * `transpose = false`, so the result can be uploaded directly. `out` must not
 * alias `a` or `b`; the per-column writes would overwrite inputs still needed
 * by later columns.
 */
export function multiplyMat4(a, b, out = new Float32Array(16)) {
  for (let column = 0; column < 4; column += 1) {
    const b0 = b[column * 4];
    const b1 = b[column * 4 + 1];
    const b2 = b[column * 4 + 2];
    const b3 = b[column * 4 + 3];
    out[column * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[column * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[column * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[column * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
}

/** Standard right-handed perspective projection. */
export function perspectiveMat4(fovYRadians, aspect, near, far, out = new Float32Array(16)) {
  const f = 1 / Math.tan(fovYRadians / 2);
  const rangeInverse = 1 / (near - far);
  out.fill(0);
  out[0] = f / Math.max(0.0001, aspect);
  out[5] = f;
  out[10] = (near + far) * rangeInverse;
  out[11] = -1;
  out[14] = 2 * near * far * rangeInverse;
  return out;
}

/**
 * Orthographic projection.
 *
 * The ornament layer uses this so a leaf's authored screen position is exactly
 * where it is drawn: apparent distance is expressed by explicit size and haze
 * rather than by a vanishing point, which keeps a dozen drifting objects from
 * all leaning toward the centre of the frame.
 */
export function orthographicMat4(left, right, bottom, top, near, far, out = new Float32Array(16)) {
  out.fill(0);
  out[0] = 2 / (right - left);
  out[5] = 2 / (top - bottom);
  out[10] = -2 / (far - near);
  out[12] = -(right + left) / (right - left);
  out[13] = -(top + bottom) / (top - bottom);
  out[14] = -(far + near) / (far - near);
  out[15] = 1;
  return out;
}

export function translationMat4(x, y, z, out = new Float32Array(16)) {
  identityMat4(out);
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

export function scaleMat4(x, y, z, out = new Float32Array(16)) {
  identityMat4(out);
  out[0] = x;
  out[5] = y;
  out[10] = z;
  return out;
}

export function rotationXMat4(radians, out = new Float32Array(16)) {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  identityMat4(out);
  out[5] = cosine;
  out[6] = sine;
  out[9] = -sine;
  out[10] = cosine;
  return out;
}

export function rotationYMat4(radians, out = new Float32Array(16)) {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  identityMat4(out);
  out[0] = cosine;
  out[2] = -sine;
  out[8] = sine;
  out[10] = cosine;
  return out;
}

export function rotationZMat4(radians, out = new Float32Array(16)) {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  identityMat4(out);
  out[0] = cosine;
  out[1] = sine;
  out[4] = -sine;
  out[5] = cosine;
  return out;
}

// Scratch buffers for `composeTrs`. `multiplyMat4` requires its output to be a
// distinct buffer from both inputs, so composition ping-pongs between three.
// These are module-level because the function is synchronous and
// single-threaded; nothing here is re-entrant.
const TRS_A = new Float32Array(16);
const TRS_B = new Float32Array(16);
const TRS_C = new Float32Array(16);

/**
 * Composes translation * rotationY * rotationX * rotationZ * scale into `out`.
 * The fixed order keeps callers from inventing their own and is what both the
 * medallion tilt and the leaf spin expect.
 */
export function composeTrs({
  x = 0,
  y = 0,
  z = 0,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  scale = 1,
}, out = new Float32Array(16)) {
  rotationYMat4(rotationY, TRS_A);
  multiplyMat4(TRS_A, rotationXMat4(rotationX, TRS_B), TRS_C);
  multiplyMat4(TRS_C, rotationZMat4(rotationZ, TRS_B), TRS_A);
  multiplyMat4(TRS_A, scaleMat4(scale, scale, scale, TRS_B), TRS_C);

  // Copy the rotation/scale block and write the translation column directly:
  // multiplying by a translation matrix here would alias `out` with its input.
  out.set(TRS_C);
  out[12] = x;
  out[13] = y;
  out[14] = z;
  out[15] = 1;
  return out;
}

/**
 * Inverse-transpose of a 4x4's upper 3x3, packed as nine column-major floats.
 * Used for non-uniform transforms so normals stay perpendicular to surfaces.
 */
export function normalMatrixFromMat4(matrix, out = new Float32Array(9)) {
  const a00 = matrix[0];
  const a01 = matrix[1];
  const a02 = matrix[2];
  const a10 = matrix[4];
  const a11 = matrix[5];
  const a12 = matrix[6];
  const a20 = matrix[8];
  const a21 = matrix[9];
  const a22 = matrix[10];

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  const determinant = a00 * b01 + a01 * b11 + a02 * b21;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-9) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }

  const inverseDeterminant = 1 / determinant;
  // Cofactor matrix, then transposed, which is the inverse-transpose directly.
  out[0] = b01 * inverseDeterminant;
  out[1] = b11 * inverseDeterminant;
  out[2] = b21 * inverseDeterminant;
  out[3] = (-a22 * a01 + a02 * a21) * inverseDeterminant;
  out[4] = (a22 * a00 - a02 * a20) * inverseDeterminant;
  out[5] = (-a21 * a00 + a01 * a20) * inverseDeterminant;
  out[6] = (a12 * a01 - a02 * a11) * inverseDeterminant;
  out[7] = (-a12 * a00 + a02 * a10) * inverseDeterminant;
  out[8] = (a11 * a00 - a01 * a10) * inverseDeterminant;

  // The inverse-transpose carries a 1/scale factor. Normalise the columns so a
  // caller can treat the result as pure orientation and both mesh renderers get
  // identical lighting regardless of how large the object is.
  for (let column = 0; column < 3; column += 1) {
    const offset = column * 3;
    const length = Math.hypot(out[offset], out[offset + 1], out[offset + 2]);
    if (length > 1e-6) {
      out[offset] /= length;
      out[offset + 1] /= length;
      out[offset + 2] /= length;
    }
  }
  return out;
}

/**
 * The shared effect camera.
 *
 * Effect coordinates are authored as a depth multiplier rather than a raw
 * distance so that a single factor controls apparent size, brightness and speed
 * together: `scale = FOCAL / depthDistance`.
 */
export const EFFECT_CAMERA = Object.freeze({
  focal: 1000,
  baseDepth: 700,
  minDepth: 0.3,
  maxDepth: 1.7,
});

/** True depth distance for a normalised depth multiplier. */
export function depthDistance(depth) {
  const clamped = Math.max(EFFECT_CAMERA.minDepth, Math.min(EFFECT_CAMERA.maxDepth, depth));
  return EFFECT_CAMERA.baseDepth / clamped;
}

/** Screen-space scale for a normalised depth multiplier. */
export function depthScale(depth) {
  return EFFECT_CAMERA.focal / depthDistance(depth);
}

/**
 * Projects a point authored relative to the screen centre at a given depth.
 *
 * `x` and `y` are world offsets from the camera axis; the caller converts a
 * desired screen position with `unprojectToWorld` first. Returns the screen
 * position plus the scale a size should be multiplied by.
 */
export function projectToScreen(x, y, depth, viewport, out = { x: 0, y: 0, scale: 1 }) {
  const scale = depthScale(depth);
  out.x = viewport.centreX + x * scale;
  out.y = viewport.centreY + y * scale;
  out.scale = scale;
  return out;
}

/**
 * Inverse of `projectToScreen`: turns a desired screen position at a depth into
 * the world offset that projects onto it. This is how an effect keeps an
 * authored composition while still living in projected space.
 */
export function unprojectToWorld(screenX, screenY, depth, viewport, out = { x: 0, y: 0 }) {
  const scale = depthScale(depth);
  out.x = (screenX - viewport.centreX) / (scale || 1);
  out.y = (screenY - viewport.centreY) / (scale || 1);
  return out;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function mix(from, to, amount) {
  return from + (to - from) * amount;
}

/** Smooth Hermite interpolation, used for light falloff and fades. */
export function smoothstep(edge0, edge1, value) {
  const denominator = edge1 - edge0;
  if (denominator === 0) return value < edge0 ? 0 : 1;
  const t = clamp((value - edge0) / denominator, 0, 1);
  return t * t * (3 - 2 * t);
}
