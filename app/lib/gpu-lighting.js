/**
 * Lit-surface and atmosphere shaders for the Lucky Meter environment.
 *
 * Two programs live here, both WebGL 1 / GLSL ES 1.00 so they run on the same
 * context the existing point pipeline already uses:
 *
 *   - The lit mesh program shades the medallion and the golden maple leaves with
 *     a metallic two-lobe specular response, a Fresnel term, a procedural sky
 *     reflection, hemisphere ambient and the shared scene lights. Two-sided
 *     shading is used instead of face culling, which removes any winding
 *     assumption from the geometry builders.
 *   - The sky-light program is an additive full-screen pass. It is what makes an
 *     explosion or a strike visibly brighten the night sky: each light spreads a
 *     coloured, noise-modulated falloff across the atmosphere instead of the sky
 *     staying uniformly dark behind the effect.
 *
 * Nothing here allocates per frame: uniforms are uploaded from caller-owned
 * matrices, and light uniforms come from the shared fixed-capacity bus.
 */

import { createProgram } from './gpu-particles';

export const MESH_VERTEX_SHADER = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_albedo;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;
uniform mat3 u_normalMatrix;
// Per-draw pigment. Defaults to white, so a caller that supplies nothing keeps
// the mesh's authored albedo exactly as before.
uniform vec3 u_albedoTint;

varying vec3 v_world;
varying vec3 v_normal;
varying vec3 v_albedo;
varying float v_viewDepth;

void main() {
  vec4 world = u_model * vec4(a_position, 1.0);
  v_world = world.xyz;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_albedo = a_albedo * u_albedoTint;
  vec4 view = u_view * world;
  // View space looks down -Z, so the positive distance is the negated Z.
  v_viewDepth = -view.z;
  gl_Position = u_projection * view;
}
`;

export const MESH_FRAGMENT_SHADER = `
precision highp float;

varying vec3 v_world;
varying vec3 v_normal;
varying vec3 v_albedo;
varying float v_viewDepth;

uniform vec3 u_camera;
uniform vec3 u_keyDir;
uniform vec3 u_keyColor;
uniform vec3 u_skyColor;
uniform vec3 u_groundColor;
uniform vec3 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;
uniform float u_metal;
uniform float u_exposure;
uniform float u_lightCount;
uniform vec4 u_lights[4];
uniform vec3 u_lightColors[4];

// A procedural studio environment: cool zenith, warm horizon, dark ground and a
// broad overhead softbox. Sampling this along the reflection vector is what
// makes the gold look like metal rather than a shaded orange disc.
vec3 environment(vec3 direction) {
  vec3 horizon = vec3(0.44, 0.31, 0.16);
  vec3 zenith = vec3(0.13, 0.2, 0.37);
  vec3 ground = vec3(0.045, 0.04, 0.036);
  vec3 color = mix(horizon, zenith, pow(clamp(direction.y, 0.0, 1.0), 0.62));
  color = mix(color, ground, smoothstep(0.0, -0.32, direction.y));
  float softbox = pow(max(0.0, dot(direction, normalize(vec3(0.12, 1.0, 0.42)))), 28.0);
  color += vec3(0.9, 0.82, 0.66) * softbox * 0.6;
  return color;
}

// Filmic roll-off so a bright highlight desaturates toward white instead of
// clipping to a flat patch.
vec3 toneMap(vec3 value) {
  vec3 numerator = value * (2.51 * value + 0.03);
  vec3 denominator = value * (2.43 * value + 0.59) + 0.14;
  return clamp(numerator / denominator, 0.0, 1.0);
}

void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(u_camera - v_world);
  // Two-sided shading: the geometry builders never rely on a winding order.
  if (dot(N, V) < 0.0) N = -N;

  float NoV = clamp(dot(N, V), 0.0, 1.0);
  vec3 fresnel = v_albedo + (vec3(1.0) - v_albedo) * pow(1.0 - NoV, 5.0);
  vec3 reflected = environment(reflect(-V, N));

  vec3 light = vec3(0.0);

  // Key light: a tight polished lobe plus a broad satin lobe.
  vec3 keyHalf = normalize(u_keyDir + V);
  float tight = pow(max(dot(N, keyHalf), 0.0), 210.0);
  float broad = pow(max(dot(N, keyHalf), 0.0), 24.0);
  vec3 specularTint = mix(vec3(1.0), fresnel, u_metal);
  light += u_keyColor * (tight * 3.0 + broad * 0.2) * specularTint;
  light += u_keyColor * v_albedo * max(dot(N, u_keyDir), 0.0) * mix(0.4, 0.05, u_metal);

  // Hemisphere ambient: warm from below, cool from above.
  float skyAmount = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
  light += mix(u_groundColor, u_skyColor, skyAmount) * v_albedo * 0.9;

  // Metallic reflection plus a small dielectric sheen for the enamel.
  // Deliberately below the key light: a full-strength Fresnel reflection turns
  // the rim into an even cream band and flattens the form.
  light += reflected * fresnel * u_metal * 0.72;
  light += reflected * 0.055 * (1.0 - u_metal);

  // Shared scene lights published by the effect stage.
  for (int index = 0; index < 4; index++) {
    if (float(index) >= u_lightCount) break;
    vec4 sceneLight = u_lights[index];
    vec3 toLight = sceneLight.xyz - v_world;
    float distance = length(toLight);
    vec3 L = toLight / max(0.0001, distance);
    float attenuation = sceneLight.w / (1.0 + distance * distance * 0.7);
    vec3 halfVector = normalize(L + V);
    float specular = pow(max(dot(N, halfVector), 0.0), 96.0);
    light += u_lightColors[index] * attenuation * (
      v_albedo * max(dot(N, L), 0.0) * 1.5 + fresnel * specular * 2.4
    );
  }

  vec3 color = toneMap(light * u_exposure);
  color = pow(color, vec3(1.0 / 2.2));

  // Distance haze: far leaves sink into the atmosphere instead of staying crisp.
  float fog = smoothstep(u_fogNear, u_fogFar, v_viewDepth);
  color = mix(color, u_fogColor, fog);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const SKY_VERTEX_SHADER = `
attribute vec2 a_uv;
varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_uv.x * 2.0 - 1.0, 1.0 - a_uv.y * 2.0, 0.0, 1.0);
}
`;

export const SKY_FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_global;
uniform float u_lightCount;
// xy = screen position, z = radius, w = intensity
uniform vec4 u_lights[4];
uniform vec3 u_lightColors[4];

// Large-scale structure only. A per-pixel fbm here costs sixteen sine and four
// fract calls per fragment across the whole viewport every frame; two wandering
// sinusoids give the same read as lit, uneven atmosphere for a fraction of the
// fragment cost, which matters most on the software rasterizers and mobile GPUs
// this pass runs on.
float skyStructure(vec2 pixel, float height, float time) {
  float scale = max(1.0, height);
  vec2 point = pixel / scale;
  return 0.62
    + 0.2 * sin(point.x * 3.1 + time * 0.07)
    + 0.12 * sin(point.y * 4.7 - time * 0.05)
    + 0.06 * sin((point.x + point.y) * 7.3 + time * 0.11);
}

void main() {
  vec2 pixel = v_uv * u_resolution;
  vec3 accumulated = vec3(0.0);

  for (int index = 0; index < 4; index++) {
    if (float(index) >= u_lightCount) break;
    vec4 light = u_lights[index];
    // Slightly flattened vertically: atmospheric scattering spreads light
    // wider across the sky than down toward the horizon.
    vec2 offset = (pixel - light.xy) * vec2(1.0, 0.78);
    float normalisedDistance = length(offset) / max(1.0, light.z);
    float core = exp(-normalisedDistance * 3.4);
    float halo = exp(-normalisedDistance * 1.05) * 0.34;
    accumulated += u_lightColors[index] * (core + halo) * light.w;
  }

  // Low-frequency structure so the glow reads as lit atmosphere, not a gradient.
  accumulated *= 0.55 + 0.9 * skyStructure(pixel, u_resolution.y, u_time);

  // Keep the zenith brighter than the lowest band, matching how sky light reads
  // against the existing artwork.
  accumulated *= mix(0.72, 1.0, smoothstep(1.0, 0.15, v_uv.y));

  float alpha = clamp(length(accumulated), 0.0, 1.0) * u_global;
  gl_FragColor = vec4(accumulated * u_global, alpha * 0.6);
}
`;

/**
 * Creates the lit-mesh program and caches its attribute and uniform locations.
 *
 * @param {WebGLRenderingContext} gl
 * @returns {object|null} Null when the program cannot be created.
 */
export function createMeshProgram(gl) {
  const program = createProgram(gl, MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER);
  if (!program) return null;

  return {
    program,
    attributes: {
      position: gl.getAttribLocation(program, 'a_position'),
      normal: gl.getAttribLocation(program, 'a_normal'),
      albedo: gl.getAttribLocation(program, 'a_albedo'),
    },
    uniforms: {
      projection: gl.getUniformLocation(program, 'u_projection'),
      view: gl.getUniformLocation(program, 'u_view'),
      model: gl.getUniformLocation(program, 'u_model'),
      normalMatrix: gl.getUniformLocation(program, 'u_normalMatrix'),
      albedoTint: gl.getUniformLocation(program, 'u_albedoTint'),
      camera: gl.getUniformLocation(program, 'u_camera'),
      keyDir: gl.getUniformLocation(program, 'u_keyDir'),
      keyColor: gl.getUniformLocation(program, 'u_keyColor'),
      skyColor: gl.getUniformLocation(program, 'u_skyColor'),
      groundColor: gl.getUniformLocation(program, 'u_groundColor'),
      fogColor: gl.getUniformLocation(program, 'u_fogColor'),
      fogNear: gl.getUniformLocation(program, 'u_fogNear'),
      fogFar: gl.getUniformLocation(program, 'u_fogFar'),
      metal: gl.getUniformLocation(program, 'u_metal'),
      exposure: gl.getUniformLocation(program, 'u_exposure'),
      lightCount: gl.getUniformLocation(program, 'u_lightCount'),
      lights: gl.getUniformLocation(program, 'u_lights[0]'),
      lightColors: gl.getUniformLocation(program, 'u_lightColors[0]'),
    },
  };
}

/**
 * Uploads the geometry-independent uniforms for one frame.
 *
 * @param {WebGLRenderingContext} gl
 * @param {object} meshProgram Result of `createMeshProgram`.
 * @param {object} frame Camera, environment and light settings.
 */
export function beginMeshFrame(gl, meshProgram, frame) {
  const { uniforms } = meshProgram;
  gl.useProgram(meshProgram.program);
  gl.uniformMatrix4fv(uniforms.projection, false, frame.projection);
  gl.uniformMatrix4fv(uniforms.view, false, frame.view);
  gl.uniform3fv(uniforms.camera, frame.camera);
  gl.uniform3fv(uniforms.keyDir, frame.keyDir);
  gl.uniform3fv(uniforms.keyColor, frame.keyColor);
  gl.uniform3fv(uniforms.skyColor, frame.skyColor);
  gl.uniform3fv(uniforms.groundColor, frame.groundColor);
  gl.uniform3fv(uniforms.fogColor, frame.fogColor);
  gl.uniform1f(uniforms.fogNear, frame.fogNear ?? 4);
  gl.uniform1f(uniforms.fogFar, frame.fogFar ?? 12);

  const lights = frame.lights;
  const count = Math.min(4, lights?.count ?? 0);
  if (count > 0) {
    const packed = LIGHT_PACK;
    const colors = LIGHT_COLOR_PACK;
    // Clear all four slots first: these buffers are module-level, so a frame
    // with fewer lights than the last one would otherwise re-upload stale data.
    packed.fill(0);
    colors.fill(0);
    for (let index = 0; index < count; index += 1) {
      const offset = index * 4;
      packed[offset] = lights.positions[index * 3];
      packed[offset + 1] = lights.positions[index * 3 + 1];
      packed[offset + 2] = lights.positions[index * 3 + 2];
      packed[offset + 3] = lights.intensities[index];
      colors[index * 3] = lights.colors[index * 3];
      colors[index * 3 + 1] = lights.colors[index * 3 + 1];
      colors[index * 3 + 2] = lights.colors[index * 3 + 2];
    }
    gl.uniform4fv(uniforms.lights, packed);
    gl.uniform3fv(uniforms.lightColors, colors);
  }
  gl.uniform1f(uniforms.lightCount, count);
}

// Reused between frames; never resized, so no per-frame allocation.
const LIGHT_PACK = new Float32Array(16);
const LIGHT_COLOR_PACK = new Float32Array(12);
const WHITE_TINT = new Float32Array([1, 1, 1]);

/**
 * Uploads one mesh geometry into GPU buffers.
 *
 * @param {WebGLRenderingContext} gl
 * @param {{ positions: Float32Array, normals: Float32Array, albedos: Float32Array, indices: Uint16Array }} geometry
 */
export function createMeshBuffers(gl, geometry) {
  const positionBuffer = gl.createBuffer();
  const normalBuffer = gl.createBuffer();
  const albedoBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  if (!positionBuffer || !normalBuffer || !albedoBuffer || !indexBuffer) {
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(normalBuffer);
    gl.deleteBuffer(albedoBuffer);
    gl.deleteBuffer(indexBuffer);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, albedoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.albedos, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return {
    positionBuffer,
    normalBuffer,
    albedoBuffer,
    indexBuffer,
    indexCount: geometry.indices.length,
    dispose() {
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(normalBuffer);
      gl.deleteBuffer(albedoBuffer);
      gl.deleteBuffer(indexBuffer);
    },
  };
}

/**
 * Draws one mesh with the frame context already set by `beginMeshFrame`.
 *
 * @param {WebGLRenderingContext} gl
 * @param {object} meshProgram Result of `createMeshProgram`.
 * @param {object} buffers Result of `createMeshBuffers`.
 * @param {{
 *   model: Float32Array,
 *   normalMatrix: Float32Array,
 *   metal: number,
 *   exposure: number,
 *   albedoTint?: number[],
 * }} draw
 */
export function drawMesh(gl, meshProgram, buffers, draw) {
  const { uniforms, attributes } = meshProgram;
  gl.uniformMatrix4fv(uniforms.model, false, draw.model);
  gl.uniformMatrix3fv(uniforms.normalMatrix, false, draw.normalMatrix);
  gl.uniform1f(uniforms.metal, draw.metal);
  gl.uniform1f(uniforms.exposure, draw.exposure ?? 1);
  gl.uniform3fv(uniforms.albedoTint, draw.albedoTint ?? WHITE_TINT);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
  gl.enableVertexAttribArray(attributes.position);
  gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
  gl.enableVertexAttribArray(attributes.normal);
  gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.albedoBuffer);
  gl.enableVertexAttribArray(attributes.albedo);
  gl.vertexAttribPointer(attributes.albedo, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
  gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0);
}

/**
 * Creates the additive sky-light program.
 *
 * @param {WebGLRenderingContext} gl
 * @returns {object|null}
 */
export function createSkyLightProgram(gl) {
  const program = createProgram(gl, SKY_VERTEX_SHADER, SKY_FRAGMENT_SHADER);
  if (!program) return null;
  return {
    program,
    attributes: { uv: gl.getAttribLocation(program, 'a_uv') },
    uniforms: {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      global: gl.getUniformLocation(program, 'u_global'),
      lightCount: gl.getUniformLocation(program, 'u_lightCount'),
      lights: gl.getUniformLocation(program, 'u_lights[0]'),
      lightColors: gl.getUniformLocation(program, 'u_lightColors[0]'),
    },
  };
}
