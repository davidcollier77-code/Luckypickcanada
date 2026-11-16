/**
 * Cosmic event stage for the Daily Resonance reveal.
 *
 * Three set pieces share one additive WebGL pipeline:
 *   - Meteor Shower: depth-varied meteors with a colour-graded plasma trail, a
 *     widening smoke wake, shed fragments and a close foreground sweep.
 *   - Cosmic Lightning: branching discharges drawn at several distances with a
 *     white-hot core and a cool sheath, each briefly lighting the atmosphere.
 *   - Fireworks: red peonies and white/silver crackle in three dimensions, smoke
 *     that takes colour from the light around it, and a golden finale that is
 *     much larger and the warmest moment of the whole sequence.
 *
 * Depth is projected, not simulated. Every effect is authored at a depth
 * multiplier, and one camera turns that into screen size, brightness and motion,
 * so a near meteor is genuinely larger and faster than a distant one and a
 * distant lightning channel genuinely converges.
 *
 * Two transparent surfaces carry the result so depth ordering with the interface
 * is real: the far surface sits behind the meter and its panels, the near surface
 * above them. The near surface is optional and pointer-transparent, so
 * constrained devices keep a single context.
 *
 * Lighting is shared. Each strike and each detonation publishes a coloured light
 * into `gpu-scene-light`, which the sky-light pass uses to brighten the
 * atmosphere and which the medallion and the maple leaves read to light
 * themselves. That is what stops the effects from looking like separate flat
 * animations over a photograph.
 */

import {
  getRenderQuality,
  getWebGLContext,
  onVisibilityChange,
  prefersReducedMotion,
  watchContextLoss,
} from '../app/lib/graphics-capabilities';
import {
  POINT_FRAGMENT_SHADER,
  POINT_VERTEX_SHADER,
  PointBatch,
  clamp,
  createProgram,
  hexToRgb,
  randomBetween,
  readMaxPointSize,
} from '../app/lib/gpu-particles';
import { createSkyLightProgram } from '../app/lib/gpu-lighting';
import { clearSceneLights, publishSceneLights } from '../app/lib/gpu-scene-light';
import { depthScale } from '../app/lib/gpu-math';
import { getThunderCue, getThunderDelayMs } from '../app/lib/lucky-meter/event-audio';

const HAZE_VERTEX_SHADER = `
attribute vec2 a_uv;
varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_uv.x * 2.0 - 1.0, 1.0 - a_uv.y * 2.0, 0.0, 1.0);
}
`;

const HAZE_FRAGMENT_SHADER = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;
uniform vec2 u_resolution;
uniform vec2 u_flash_pos;
uniform float u_flash;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(1.0, u_resolution.y), 1.0);
  vec2 p = v_uv * aspect * 2.6;
  float clouds = fbm(p + vec2(u_time * 0.018, u_time * 0.005));
  clouds = smoothstep(0.32, 0.95, clouds);

  // Denser toward the top of the frame, thinning toward the horizon.
  float heightMask = smoothstep(0.0, 0.42, 1.0 - v_uv.y) * smoothstep(1.05, 0.55, v_uv.y);
  float density = clouds * heightMask;

  float flashDistance = distance(v_uv * u_resolution, u_flash_pos);
  float flash = u_flash * exp(-flashDistance / (u_resolution.y * 0.55));

  vec3 cloudColor = mix(vec3(0.34, 0.41, 0.62), vec3(0.93, 0.96, 1.0), clamp(flash * 1.6, 0.0, 1.0));
  // A light veil only: the Milky Way must stay legible through the storm, so the
  // cloud body contributes a fraction of the strike's own illumination while the
  // strike's flash does the real lighting.
  float alpha = density * u_alpha * 0.22 + flash * 0.5 * u_alpha;
  gl_FragColor = vec4(cloudColor * (0.55 + flash * 2.6), alpha);
}
`;

const QUAD_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

// Meteor trail grade, head to tail. Module constants so the per-sample loop
// never re-parses a hex string: this runs thousands of times per frame.
const TRAIL_HOT = hexToRgb('#ffdca0');
const TRAIL_WARM = hexToRgb('#ff9a4a');
const TRAIL_COOL = hexToRgb('#e0562f');
const TRAIL_EMBER = hexToRgb('#8c2f22');
const METEOR_HEAD = hexToRgb('#ffffff');
const METEOR_HEAD_FINALE = hexToRgb('#fff4d6');

/**
 * One WebGL canvas: programs, attribute buffers and its own backing store.
 */
function createSurface(canvas, { haze = false, skyLight = false } = {}) {
  if (!canvas) return null;
  const gl = getWebGLContext(canvas, {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
  });
  if (!gl) return null;

  let pointProgram = createProgram(gl, POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);
  let hazeProgram = haze ? createProgram(gl, HAZE_VERTEX_SHADER, HAZE_FRAGMENT_SHADER) : null;
  const skyProgram = skyLight ? createSkyLightProgram(gl) : null;
  if (!pointProgram || (haze && !hazeProgram)) {
    if (pointProgram) gl.deleteProgram(pointProgram);
    if (hazeProgram) gl.deleteProgram(hazeProgram);
    if (skyProgram) gl.deleteProgram(skyProgram.program);
    return null;
  }

  const pointLocations = {
    position: gl.getAttribLocation(pointProgram, 'a_position'),
    color: gl.getAttribLocation(pointProgram, 'a_color'),
    size: gl.getAttribLocation(pointProgram, 'a_size'),
    resolution: gl.getUniformLocation(pointProgram, 'u_resolution'),
    alpha: gl.getUniformLocation(pointProgram, 'u_alpha'),
    maxPoint: gl.getUniformLocation(pointProgram, 'u_max_point'),
  };
  const hazeLocations = hazeProgram
    ? {
        uv: gl.getAttribLocation(hazeProgram, 'a_uv'),
        time: gl.getUniformLocation(hazeProgram, 'u_time'),
        alpha: gl.getUniformLocation(hazeProgram, 'u_alpha'),
        resolution: gl.getUniformLocation(hazeProgram, 'u_resolution'),
        flashPosition: gl.getUniformLocation(hazeProgram, 'u_flash_pos'),
        flash: gl.getUniformLocation(hazeProgram, 'u_flash'),
      }
    : null;

  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const sizeBuffer = gl.createBuffer();
  let quadBuffer = null;
  if (hazeProgram || skyProgram) {
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  const maxPointSize = readMaxPointSize(gl);
  let width = 1;
  let height = 1;

  const surface = {
    gl,
    maxPointSize,
    hazeAvailable: Boolean(hazeProgram),
    skyLightAvailable: Boolean(skyProgram),
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    resize(nextWidth, nextHeight, pixelRatio) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    clear() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    drawHaze({ time, alpha, flash, flashPosition }) {
      if (!hazeProgram || !hazeLocations || !quadBuffer) return;
      gl.useProgram(hazeProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(hazeLocations.uv);
      gl.vertexAttribPointer(hazeLocations.uv, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(hazeLocations.time, time);
      gl.uniform1f(hazeLocations.alpha, alpha);
      gl.uniform2f(hazeLocations.resolution, width, height);
      gl.uniform2f(hazeLocations.flashPosition, flashPosition[0], flashPosition[1]);
      gl.uniform1f(hazeLocations.flash, flash);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    /**
     * Additive sky illumination. This is the pass that makes an explosion or a
     * strike visibly brighten the surrounding night sky.
     */
    drawSkyLight({ time, alpha, lights, count }) {
      if (!skyProgram || !quadBuffer) return;
      for (let index = 0; index < count; index += 1) {
        const light = lights[index];
        const offset = index * 4;
        SKY_PACK[offset] = light.x;
        SKY_PACK[offset + 1] = light.y;
        SKY_PACK[offset + 2] = light.radius;
        SKY_PACK[offset + 3] = light.intensity;
        SKY_COLOR_PACK[index * 3] = light.color[0];
        SKY_COLOR_PACK[index * 3 + 1] = light.color[1];
        SKY_COLOR_PACK[index * 3 + 2] = light.color[2];
      }
      gl.useProgram(skyProgram.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(skyProgram.attributes.uv);
      gl.vertexAttribPointer(skyProgram.attributes.uv, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(skyProgram.uniforms.resolution, width, height);
      gl.uniform1f(skyProgram.uniforms.time, time);
      gl.uniform1f(skyProgram.uniforms.global, alpha);
      gl.uniform1f(skyProgram.uniforms.lightCount, count);
      if (count > 0) {
        gl.uniform4fv(skyProgram.uniforms.lights, SKY_PACK);
        gl.uniform3fv(skyProgram.uniforms.lightColors, SKY_COLOR_PACK);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    drawPoints(batch, alpha) {
      if (batch.count === 0) return;
      gl.useProgram(pointProgram);
      gl.uniform2f(pointLocations.resolution, width, height);
      gl.uniform1f(pointLocations.alpha, alpha);
      gl.uniform1f(pointLocations.maxPoint, maxPointSize);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        batch.positions.subarray(0, batch.count * 2),
        gl.DYNAMIC_DRAW,
      );
      gl.enableVertexAttribArray(pointLocations.position);
      gl.vertexAttribPointer(pointLocations.position, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        batch.colors.subarray(0, batch.count * 4),
        gl.DYNAMIC_DRAW,
      );
      gl.enableVertexAttribArray(pointLocations.color);
      gl.vertexAttribPointer(pointLocations.color, 4, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, batch.sizes.subarray(0, batch.count), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(pointLocations.size);
      gl.vertexAttribPointer(pointLocations.size, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, batch.count);
    },
    dispose() {
      try {
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(colorBuffer);
        gl.deleteBuffer(sizeBuffer);
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        if (pointProgram) gl.deleteProgram(pointProgram);
        if (hazeProgram) gl.deleteProgram(hazeProgram);
        if (skyProgram) gl.deleteProgram(skyProgram.program);
        pointProgram = null;
        hazeProgram = null;
      } catch {
        // Releasing a context is an optimisation, never a requirement.
      }
    },
  };

  return surface;
}

// Reused between frames; never resized.
const SKY_PACK = new Float32Array(16);
const SKY_COLOR_PACK = new Float32Array(12);

/**
 * Recursive lightning branching, authored in a local unit space where x is a
 * fraction of the bolt's width and y runs 0 (origin) to 1 (tip).
 */
function buildBranchSegments({
  startX,
  startY,
  endX,
  endY,
  roughness,
  generation,
  maxGeneration,
  branchProbability,
  segments,
  random,
  forkDepth = 0,
  maxSegments = 240,
}) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy);

  if (generation >= maxGeneration || length < 0.004 || segments.length >= maxSegments) {
    segments.push({ startX, startY, endX, endY, generation });
    return;
  }

  const normalX = -dy / (length || 1);
  const normalY = dx / (length || 1);
  const variance = (random() - 0.5) * roughness;
  const midX = (startX + endX) / 2 + normalX * variance;
  const midY = (startY + endY) / 2 + normalY * variance + roughness * 0.09;

  buildBranchSegments({
    startX,
    startY,
    endX: midX,
    endY: midY,
    roughness: roughness * 0.56,
    generation: generation + 1,
    maxGeneration,
    branchProbability,
    segments,
    random,
    forkDepth,
    maxSegments,
  });
  buildBranchSegments({
    startX: midX,
    startY: midY,
    endX,
    endY,
    roughness: roughness * 0.56,
    generation: generation + 1,
    maxGeneration,
    branchProbability,
    segments,
    random,
    forkDepth,
    maxSegments,
  });

  const forks = forkDepth < 1 ? 2 : 1;
  for (let fork = 0; fork < forks; fork += 1) {
    if (random() >= branchProbability * (fork === 0 ? 1 : 0.55)) continue;
    const direction = fork === 0 ? 1 : -1;
    const angle = Math.atan2(dy, dx) + direction * randomBetween(random, 0.32, 1.02);
    const branchLength = length * randomBetween(random, 0.34, 0.78);
    buildBranchSegments({
      startX: midX,
      startY: midY,
      endX: midX + Math.cos(angle) * branchLength,
      endY: midY + Math.sin(angle) * branchLength,
      roughness: roughness * 0.7,
      generation: generation + 1,
      maxGeneration,
      branchProbability: branchProbability * 0.2,
      segments,
      random,
      forkDepth: forkDepth + 1,
      maxSegments,
    });
  }
}

/**
 * A three-dimensional Fibonacci sphere direction. Distributing burst particles
 * on a real sphere is what makes one shell read as a sphere seen from below and
 * another as an ellipse seen across the sky.
 */
function sphereDirection(index, count) {
  const offset = 2 / Math.max(1, count);
  const increment = Math.PI * (3 - Math.sqrt(5));
  const y = index * offset - 1 + offset / 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = index * increment;
  return [Math.cos(phi) * radius, y, Math.sin(phi) * radius];
}

/**
 * Creates and starts the cinematic stage.
 *
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   foregroundCanvas?: HTMLCanvasElement|null,
 *   eventId: 'meteor' | 'lightning' | 'fireworks',
 *   durationMs: number,
 *   onCue?: (cue: string) => void,
 *   onDone?: () => void,
 *   onContextLost?: () => void,
 * }} options
 * @returns {{ destroy: () => void, hasForeground: boolean } | null} Null when WebGL cannot be created.
 */
export function createCosmicEventEngine({
  canvas,
  foregroundCanvas,
  eventId,
  durationMs,
  onCue,
  onDone,
  onContextLost,
}) {
  if (!canvas || typeof window === 'undefined') return null;

  const quality = getRenderQuality();
  const farSurface = createSurface(canvas, { haze: quality.haze, skyLight: true });
  if (!farSurface) return null;

  const nearSurface =
    quality.foreground && foregroundCanvas
      ? createSurface(foregroundCanvas, { haze: false, skyLight: false })
      : null;

  const reducedMotion = prefersReducedMotion();
  const coarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

  let width = Math.max(1, window.innerWidth);
  let height = Math.max(1, window.innerHeight);
  let pixelRatio = Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio);
  let resolutionScale = 1;
  let qualityScale = 1;
  let qualitySteps = 0;
  // Particle sizes are authored against a 1440 x 900 stage. This factor keeps
  // the same apparent grain size on a phone and on a large display.
  let effectScale = 1;
  let centreX = width / 2;
  let centreY = height / 2;

  const basePointBudget =
    quality.tier === 'high' ? 44000 : quality.tier === 'balanced' ? 24000 : 11000;
  const farLimit = Math.round(basePointBudget * (nearSurface ? 0.6 : 1));
  const nearLimit = Math.round(basePointBudget * 0.65);
  const farBatch = new PointBatch(Math.round(farLimit * 0.6), farLimit);
  const nearBatch = nearSurface ? new PointBatch(Math.round(nearLimit * 0.6), nearLimit) : null;

  const maxLiveParticles =
    quality.tier === 'high' ? 7200 : quality.tier === 'balanced' ? 4600 : 2200;

  // Opening bursts are strictly red and white; gold/amber is reserved for the finale.
  const redPalette = [
    hexToRgb('#ff3b45'),
    hexToRgb('#ff5a52'),
    hexToRgb('#ffd2cf'),
    hexToRgb('#ffffff'),
  ];
  const silverPalette = [
    hexToRgb('#ffffff'),
    hexToRgb('#eef6ff'),
    hexToRgb('#cddced'),
    hexToRgb('#fbf7ea'),
  ];
  const finalePalette = [
    hexToRgb('#ffcf7a'),
    hexToRgb('#ffb020'),
    hexToRgb('#fff3c4'),
    hexToRgb('#ffd166'),
    hexToRgb('#fff9e6'),
  ];
  const emberPalette = [hexToRgb('#ffb347'), hexToRgb('#ffd08a'), hexToRgb('#ff8a3d')];
  const boltCore = hexToRgb('#ffffff');
  const boltHalo = hexToRgb('#9cc4ff');
  const boltDepth = hexToRgb('#6f9bff');
  const smokeGrey = hexToRgb('#9aa3b2');

  const meteors = [];
  const lightningStrikes = [];
  const rockets = [];
  const fireworks = [];
  const embers = [];
  const smoke = [];
  /** Expanding rings that make the finale's scale readable at a glance. */
  const shockwaves = [];
  /** Active coloured lights: sky illumination plus shared scene lighting. */
  const activeLights = [];

  let elapsed = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let destroyed = false;
  let completed = false;
  let contextLost = false;
  let nearDead = false;
  let cueHandler = typeof onCue === 'function' ? onCue : null;
  let doneHandler = typeof onDone === 'function' ? onDone : null;
  let lostHandler = typeof onContextLost === 'function' ? onContextLost : null;

  const planRandom = Math.random;
  const plan = [];
  const cueQueue = [];
  let nextSpawnIndex = 0;
  let finaleSpawned = false;
  let flash = 0;
  let flashPosition = [width * 0.5, height * 0.2];
  let hazeStrength = 0;
  let frameAccum = 0;
  let frameCount = 0;
  let droppedPoints = 0;

  function canUseNear() {
    return Boolean(nearSurface) && !nearDead;
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    centreX = width / 2;
    centreY = height / 2;
    const previousWidth = farSurface.width || width;
    const previousHeight = farSurface.height || height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio) * resolutionScale;
    pixelRatio = Math.max(1, pixelRatio);
    effectScale = clamp(Math.sqrt((width * height) / (1440 * 900)), 0.82, 1.55);

    farSurface.resize(width, height, pixelRatio);
    if (nearSurface && !nearDead) nearSurface.resize(width, height, pixelRatio);

    const scaleX = width / previousWidth;
    const scaleY = height / previousHeight;
    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) return;
    if (Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001) return;

    for (const meteor of meteors) {
      meteor.worldX *= scaleX;
      meteor.worldY *= scaleY;
    }
    for (const strike of lightningStrikes) {
      strike.anchorX *= scaleX;
      strike.anchorY *= scaleY;
    }
    for (const light of activeLights) {
      light.x *= scaleX;
      light.y *= scaleY;
    }
    for (const puff of smoke) {
      puff.x *= scaleX;
      puff.y *= scaleY;
    }
    for (const particle of embers) {
      particle.x *= scaleX;
      particle.y *= scaleY;
    }
    for (const firework of fireworks) {
      firework.screenX *= scaleX;
      firework.screenY *= scaleY;
    }
  }

  resize();

  function emitCue(cue) {
    if (cueHandler) cueHandler(cue);
  }

  /**
   * Queues a cue for a later frame, keeping the queue sorted.
   *
   * Delayed sound is how the sequence stays physical: thunder trails its
   * flash, and the finale's launch whistle precedes its detonation.
   */
  function queueCue(at, cue) {
    const time = Math.max(0, Number(at) || 0);
    let index = cueQueue.length;
    while (index > 0 && cueQueue[index - 1].at > time) index -= 1;
    cueQueue.splice(index, 0, { at: time, cue });
  }

  function pushPoint(x, y, size, color, alpha, near = false) {
    if (alpha <= 0.003 || size <= 0) return;
    const surface = near && canUseNear() ? nearSurface : farSurface;
    const batch = near && canUseNear() ? nearBatch : farBatch;
    if (!batch || !surface) return;
    if (!batch.push(x, y, size, color, alpha, pixelRatio, surface.maxPointSize)) {
      droppedPoints += 1;
    }
  }

  function liveParticleCount() {
    let count = 0;
    for (const firework of fireworks) count += firework.particles.length;
    return count;
  }

  /**
   * Publishes one coloured light that illuminates sky, smoke, gold and leaves.
   * Returns the entry so a moving source can keep updating it.
   */
  function addLight({ x, y, radius, intensity, color, life, kind }) {
    if (activeLights.length >= 8) activeLights.shift();
    const entry = { x, y, radius, intensity, peak: intensity, age: 0, life, color, kind };
    activeLights.push(entry);
    return entry;
  }

  // --- Meteors ------------------------------------------------------------

  function spawnMeteor(spec, isFinale = false) {
    // Depth is a multiplier: 0.35 is a distant meteor, 1.7 is close enough to
    // cross the frame. It drives screen size, speed and brightness together.
    const depth = isFinale ? 1.7 : randomBetween(planRandom, 0.35, 1.5);
    const scale = depthScale(depth);
    const near = isFinale || (canUseNear() && depth > 0.92);

    // Back-project the authored screen entry point so the meteor still enters
    // where the choreography wants it while living in projected space.
    const startScreenX = spec.x;
    const startScreenY = spec.y;
    const worldX = (startScreenX - centreX) / scale;
    const worldY = (startScreenY - centreY) / scale;

    const angle = spec.fromRight
      ? -randomBetween(planRandom, 0.42, 0.85)
      : randomBetween(planRandom, 0.42, 0.85);

    // A meteor carries its own light: this is what gives it an atmospheric
    // presence instead of looking like a bright streak on a photograph.
    const light = addLight({
      x: startScreenX,
      y: startScreenY,
      radius: 280 * effectScale * (isFinale ? 1.7 : 1),
      intensity: isFinale ? 1.2 : 0.34 + depth * 0.3,
      color: [1, 0.74, 0.46],
      life: 4,
      kind: 'meteor',
    });

    meteors.push({
      worldX,
      worldY,
      light,
      depth,
      near,
      // World-space velocity and size. One world unit is about 1.4 screen pixels
      // at depth 1, so these are authored as pixels divided by that factor: the
      // same speed then projects far faster when the meteor is near.
      speed: isFinale ? 1500 : randomBetween(planRandom, 620, 900),
      directionX: isFinale ? 1 : Math.sin(angle),
      directionY: isFinale ? 0.55 : Math.cos(angle),
      lengthWorld: isFinale ? 330 : randomBetween(planRandom, 120, 250),
      thicknessWorld: isFinale ? 5.2 : randomBetween(planRandom, 2.2, 4.2),
      headColor: isFinale ? METEOR_HEAD_FINALE : METEOR_HEAD,
      isFinale,
      age: 0,
      // The whoosh belongs to the moment the head actually enters the frame,
      // not to the off-screen spawn, so entry, motion and sound line up.
      entered: false,
      flash: 0,
      seed: planRandom() * 1000,
    });
  }

  /**
   * A meteor burning out: a short warm flare, shed embers and a matching thud.
   * Called when the head leaves the frame, so every started pass has an ending.
   */
  function spawnMeteorImpact(meteor, x, y) {
    emitCue(meteor.isFinale ? 'meteor-finale-impact' : 'meteor-impact');
    addLight({
      x,
      y,
      radius: (meteor.isFinale ? 320 : 150) * effectScale,
      intensity: meteor.isFinale ? 1.15 : 0.5,
      color: [1, 0.72, 0.4],
      life: meteor.isFinale ? 0.65 : 0.4,
      kind: 'meteor-impact',
    });
    if (meteor.isFinale) {
      spawnShockwave(x, y, { radius: Math.max(width, height) * 0.22, life: 0.9 });
    }
    const count = meteor.isFinale ? 30 : 10;
    for (let index = 0; index < count; index += 1) {
      smoke.push({
        kind: 'fragment',
        x: x + randomBetween(planRandom, -8, 8),
        y: y + randomBetween(planRandom, -8, 8),
        vx: randomBetween(planRandom, -95, 95),
        vy: randomBetween(planRandom, -95, 35),
        size: randomBetween(planRandom, 1.6, 3.8) * effectScale,
        age: 0,
        life: randomBetween(planRandom, 0.4, 0.95),
        color: planRandom() > 0.5 ? hexToRgb('#ffcf7a') : hexToRgb('#ff8a3d'),
        drag: 0.93,
        near: meteor.near,
      });
    }
  }

  /**
   * Projects one point of a meteor's trail.
   *
   * The trail recedes: each sample further back along the path is also further
   * from the camera, so it shrinks and converges toward the vanishing point
   * instead of being a uniform line attached to a glowing dot.
   */
  function projectMeteorSample(meteor, progress, out) {
    const sampleDepth = clamp(meteor.depth * (1 + progress * 0.62), 0.3, 2.6);
    const sampleScale = depthScale(sampleDepth);
    out.x = centreX + (meteor.worldX - meteor.directionX * meteor.lengthWorld * progress) * sampleScale;
    out.y = centreY + (meteor.worldY - meteor.directionY * meteor.lengthWorld * progress) * sampleScale;
    out.scale = sampleScale;
    return out;
  }

  const meteorSample = { x: 0, y: 0, scale: 1 };
  // Scratch probes for measuring a trail's projected length.
  const HEAD_PROBE = { x: 0, y: 0, scale: 1 };
  const TAIL_PROBE = { x: 0, y: 0, scale: 1 };

  function updateMeteors(deltaSeconds, globalAlpha) {
    for (let index = meteors.length - 1; index >= 0; index -= 1) {
      const meteor = meteors[index];
      meteor.age += deltaSeconds;
      meteor.worldX += meteor.directionX * meteor.speed * deltaSeconds;
      meteor.worldY += meteor.directionY * meteor.speed * deltaSeconds;

      const headScale = depthScale(meteor.depth);
      const headX = centreX + meteor.worldX * headScale;
      const headY = centreY + meteor.worldY * headScale;

      // Entrance: the first frame the head is actually on screen. The flare and
      // the cue fire together, so the visitor sees and hears the same event.
      if (!meteor.entered) {
        const onScreen =
          headX > -30 && headX < width + 30 && headY > -30 && headY < height + 30;
        if (onScreen) {
          meteor.entered = true;
          meteor.flash = 1;
          emitCue(meteor.isFinale ? 'meteor-finale' : 'meteor-enter');
          addLight({
            x: headX,
            y: headY,
            radius: (meteor.isFinale ? 280 : 120) * effectScale,
            intensity: meteor.isFinale ? 0.95 : 0.35,
            color: [1, 0.86, 0.7],
            life: 0.45,
            kind: 'meteor-entry',
          });
        }
      }

      if (headY > height + 320 || headX < -width * 0.8 || headX > width * 1.8) {
        if (meteor.light) meteor.light.peak = 0;
        if (meteor.entered) spawnMeteorImpact(meteor, headX, headY);
        meteors.splice(index, 1);
        continue;
      }

      if (meteor.light) {
        // Keep the light attached to the head for as long as the meteor lives.
        meteor.light.age = 0;
        meteor.light.x = headX;
        meteor.light.y = headY;
        meteor.light.peak = meteor.isFinale ? 1.2 : 0.3 + meteor.depth * 0.26;
      }

      // Sample density comes from the trail's measured on-screen length, so the
      // plasma always reads as one continuous streak: about one sample every
      // 1.6 px regardless of depth, speed or how the projection is stretched.
      projectMeteorSample(meteor, 0, HEAD_PROBE);
      projectMeteorSample(meteor, 1, TAIL_PROBE);
      const trailPixels = Math.hypot(
        HEAD_PROBE.x - TAIL_PROBE.x,
        HEAD_PROBE.y - TAIL_PROBE.y,
      );
      const samples = Math.round(
        clamp(trailPixels / 1.6, 40, 400) * clamp(qualityScale, 0.5, 1),
      );

      // Guarded denominator: a single-sample trail would otherwise divide by
      // zero and poison every colour and alpha downstream with NaN.
      const sampleSpan = Math.max(1, samples - 1);
      for (let sample = 0; sample < samples; sample += 1) {
        const progress = sample / sampleSpan;
        projectMeteorSample(meteor, progress, meteorSample);
        const { x, y, scale } = meteorSample;

        // Head-to-tail grade: white-hot, gold, orange, deep red, then ember.
        let color;
        if (progress < 0.05) color = meteor.headColor;
        else if (progress < 0.22) color = TRAIL_HOT;
        else if (progress < 0.48) color = TRAIL_WARM;
        else if (progress < 0.75) color = TRAIL_COOL;
        else color = TRAIL_EMBER;

        const thickness = meteor.thicknessWorld * scale * effectScale;
        // The tail widens as it cools and expands into the wake. The floor keeps
        // consecutive samples overlapping into one streak rather than a dotted
        // line, whatever the frame rate does to the sample count.
        const size = Math.max(4.4, thickness * (1.1 + progress * 1.4));
        const alpha = meteor.alpha ?? (meteor.isFinale ? 1 : 0.5 + meteor.depth * 0.32);
        const fade = Math.pow(1 - progress, 1.35);

        pushPoint(x, y, size, color, fade * alpha * globalAlpha, meteor.near);
        // Ionised sheath around the core.
        pushPoint(x, y, size * 2.9, color, fade * alpha * 0.16 * globalAlpha, meteor.near);
      }

      // Hot head: a tight nucleus, a compact flare and a wide atmospheric halo.
      const headAlpha = (meteor.isFinale ? 1 : 0.55 + meteor.depth * 0.4) * globalAlpha;
      const headRadius = Math.max(1.4, meteor.thicknessWorld * headScale * effectScale);

      // A brief ignition flare as the meteor crosses into the frame.
      if (meteor.flash > 0) {
        meteor.flash = Math.max(0, meteor.flash - deltaSeconds * 4.2);
        const flare = meteor.flash * globalAlpha;
        pushPoint(
          headX,
          headY,
          110 * effectScale * (meteor.isFinale ? 1.8 : 1),
          meteor.headColor,
          flare * 0.34,
          meteor.near,
        );
        pushPoint(headX, headY, 36 * effectScale, [1, 1, 1], flare * 0.72, meteor.near);
      }

      pushPoint(headX, headY, headRadius * 26, meteor.headColor, headAlpha * 0.18, meteor.near);
      pushPoint(headX, headY, headRadius * 9, meteor.headColor, headAlpha * 0.42, meteor.near);
      pushPoint(headX, headY, headRadius * 3.2, meteor.headColor, headAlpha, meteor.near);

      // Shed fragments: small bright grains that inherit a little of the head's
      // velocity and then slow down, which reads as material breaking off.
      if (!coarsePointer && meteor.age > 0.08) {
        const shed = meteor.isFinale ? 3 : 1;
        for (let fragment = 0; fragment < shed; fragment += 1) {
          if (planRandom() > 0.55) continue;
          smoke.push({
            kind: 'fragment',
            x: headX + randomBetween(planRandom, -6, 6),
            y: headY + randomBetween(planRandom, -6, 6),
            vx: randomBetween(planRandom, -46, 46) - meteor.directionX * 40,
            vy: randomBetween(planRandom, -18, 62),
            size: randomBetween(planRandom, 1.2, 2.6) * effectScale,
            age: 0,
            life: randomBetween(planRandom, 0.35, 0.85),
            color: planRandom() > 0.5 ? hexToRgb('#ffcf7a') : hexToRgb('#ff8a3d'),
            drag: 0.94,
            near: meteor.near,
          });
        }
      }

      // Smoke wake: neutral puffs that grow, drift and outlive the head.
      if (!coarsePointer && meteor.age > 0.06) {
        smoke.push({
          kind: 'smoke',
          x: headX + randomBetween(planRandom, -4, 4),
          y: headY + randomBetween(planRandom, -4, 4),
          vx: randomBetween(planRandom, -12, 12) - meteor.directionX * 26,
          vy: randomBetween(planRandom, 8, 34),
          size: randomBetween(planRandom, 6, 12) * effectScale * (meteor.near ? 1.35 : 1),
          growth: randomBetween(planRandom, 22, 46) * effectScale,
          age: 0,
          life: randomBetween(planRandom, 1.1, 2.1),
          drag: 0.985,
          near: meteor.near,
        });
      }
    }
  }

  // --- Lightning ----------------------------------------------------------

  function spawnLightning(spec, isFinale = false) {
    // `band` places the strike in the near, middle or far distance. The finale is
    // deliberately in front of everything.
    const depth = isFinale ? 1.9 : spec.depth ?? randomBetween(planRandom, 0.42, 1.45);
    const scale = depthScale(depth);
    const near = isFinale || (canUseNear() && depth > 0.95);

    const anchorX = spec.x;
    const anchorY = -40;
    const segments = [];
    const maxGeneration = coarsePointer ? 5 : isFinale ? 7 : 6;

    // Authored in unit space: x is a fraction of the bolt's width, y runs from
    // the origin to the tip. Projection happens when the channel is rasterised.
    const spread = isFinale ? 0.62 : 0.2 + depth * 0.2;
    const reach = isFinale ? 0.92 : 0.44 + depth * 0.34;

    buildBranchSegments({
      startX: 0,
      startY: 0,
      endX: randomBetween(planRandom, -spread * 0.35, spread * 0.35),
      endY: reach,
      roughness: (isFinale ? 0.16 : 0.12 + depth * 0.04),
      generation: 0,
      maxGeneration,
      branchProbability: isFinale ? 0.34 : 0.17 + depth * 0.1,
      segments,
      random: planRandom,
      maxSegments: isFinale ? 260 : 170,
    });

    if (isFinale) {
      for (let extra = 0; extra < 3; extra += 1) {
        buildBranchSegments({
          startX: 0,
          startY: 0,
          endX: randomBetween(planRandom, -0.4, 0.4),
          endY: reach * randomBetween(planRandom, 0.9, 1.15),
          roughness: 0.1,
          generation: 2,
          maxGeneration: 4,
          branchProbability: 0.22,
          segments,
          random: planRandom,
          maxSegments: 320,
        });
      }
    }

    lightningStrikes.push({
      segments,
      anchorX,
      anchorY,
      depth,
      scale,
      // Channel width in screen pixels at the strike's own depth.
      width: (isFinale ? 9.5 : 3.4 + depth * 3) * effectScale,
      reach: reach * height,
      near,
      age: 0,
      life: isFinale ? 1.7 : randomBetween(planRandom, 0.7, 1.2),
      seed: planRandom() * 100,
      isFinale,
      color: boltHalo,
    });

    addLight({
      x: anchorX,
      y: Math.max(60, anchorY + height * reach * 0.55),
      radius: (isFinale ? 1.5 : 0.85) * Math.max(width, height) * 0.55,
      intensity: isFinale ? 1.35 : 0.45 + depth * 0.35,
      color: [0.68, 0.8, 1.0],
      life: isFinale ? 0.9 : 0.55,
      kind: 'lightning',
    });

    emitCue(isFinale ? 'lightning-finale' : 'lightning');
    // Thunder is a separate, delayed cue: the flash is seen first, and a
    // distant strike arrives later and softer than a close one.
    queueCue(elapsed + getThunderDelayMs(depth, isFinale), getThunderCue(depth, isFinale));
  }

  function updateLightning(deltaSeconds, globalAlpha) {
    let strongestFlash = 0;

    for (let index = lightningStrikes.length - 1; index >= 0; index -= 1) {
      const strike = lightningStrikes[index];
      strike.age += deltaSeconds;
      if (strike.age > strike.life) {
        lightningStrikes.splice(index, 1);
        continue;
      }

      const lifeProgress = strike.age / strike.life;
      const attack = Math.min(1, strike.age / 0.04);
      const decay = Math.pow(1 - lifeProgress, 0.5);
      const phase = strike.age * 74 + strike.seed;
      const flicker =
        lifeProgress < 0.45
          ? Math.sin(phase) > -0.4
            ? 1
            : 0.72
          : Math.sin(phase * 0.7) > 0.2
            ? 0.9
            : 0.56;
      // The channel retracts as it fades: a real strike thins before it goes.
      const retraction = 1 - Math.max(0, lifeProgress - 0.35) * 0.55;
      const intensity = attack * decay * flicker;

      if (intensity > strongestFlash) {
        strongestFlash = intensity;
        flashPosition = [strike.anchorX, Math.max(40, strike.anchorY + strike.reach * 0.4)];
      }

      // Sample densely enough that the channel is continuous rather than beaded.
      const step = Math.max(1.2, 1.8 * effectScale);

      for (const segment of strike.segments) {
        // Project both ends. The tip uses a shallower depth than the origin, so
        // the channel converges at the top and widens toward the viewer.
        const startDepth = strike.depth * (1 + (1 - segment.startY) * 0.34);
        const endDepth = strike.depth * (1 + (1 - segment.endY) * 0.34);
        const startScale = depthScale(startDepth);
        const endScale = depthScale(endDepth);

        // Horizontal fan: a wider view toward the bottom of the bolt.
        const startFan = 0.5 + 0.5 * segment.startY;
        const endFan = 0.5 + 0.5 * segment.endY;

        const sx = strike.anchorX + segment.startX * width * 0.5 * startScale * startFan;
        const sy = strike.anchorY + segment.startY * strike.reach;
        const ex = strike.anchorX + segment.endX * width * 0.5 * endScale * endFan;
        const ey = strike.anchorY + segment.endY * strike.reach;

        const dx = ex - sx;
        const dy = ey - sy;
        const length = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(length / step));
        const taper = segment.generation === 0 ? 1 : Math.max(0.3, 1 - segment.generation * 0.14);
        const localScale = (startScale + endScale) * 0.5;

        for (let sample = 0; sample <= steps; sample += 1) {
          const progress = sample / steps;
          const x = sx + dx * progress;
          const y = sy + dy * progress;
          const coreSize = Math.max(
            step * 2.6,
            strike.width * taper * localScale * effectScale * (0.85 + 0.25 * Math.sin(progress * Math.PI)),
          );
          const alpha = (segment.generation === 0 ? 1 : 0.68) * intensity * retraction * globalAlpha;

          pushPoint(x, y, coreSize, boltCore, alpha * 1.25, strike.near);
          pushPoint(x, y, coreSize * 2.6, boltHalo, alpha * 0.4, strike.near);
          if (sample % 2 === 0) {
            pushPoint(x, y, coreSize * 7.5, boltDepth, alpha * 0.12, strike.near);
          }
        }
      }

      // Origin bloom and ground illumination: wide, low-alpha light that reads
      // as the atmosphere responding rather than a painted disc.
      pushPoint(
        strike.anchorX,
        Math.max(30, strike.anchorY + 18),
        (strike.isFinale ? 300 : 180) * effectScale,
        boltDepth,
        intensity * 0.16 * globalAlpha,
        strike.near,
      );
      pushPoint(
        strike.anchorX,
        Math.min(height, strike.anchorY + strike.reach),
        (strike.isFinale ? 240 : 150) * effectScale,
        boltHalo,
        intensity * 0.13 * globalAlpha,
        strike.near,
      );
    }

    flash += (strongestFlash - flash) * Math.min(1, deltaSeconds * 26);
    flash = clamp(flash, 0, 1.3);
  }

  // --- Fireworks ----------------------------------------------------------

  function createParticle({
    x,
    y,
    vx,
    vy,
    colour,
    size,
    life,
    gravity,
    drag,
    trail,
    kind,
    near,
    depth,
    branchAt = 0,
  }) {
    return {
      x,
      y,
      vx,
      vy,
      age: 0,
      life,
      colour,
      size,
      gravity,
      drag,
      trail,
      history: [],
      twinkle: randomBetween(planRandom, 0, Math.PI * 2),
      twinkleSpeed: randomBetween(planRandom, 5.5, 13),
      kind,
      near,
      depth,
      branchAt,
      branched: false,
    };
  }

  function spawnBurst(screenX, screenY, spec) {
    if (fireworks.length > 7) return;
    const remaining = Math.max(0, maxLiveParticles - liveParticleCount());
    if (remaining <= 0) return;

    const scale = clamp(qualityScale * quality.particleScale, 0.45, 1.3);
    const particles = [];
    const kind = spec.kind;
    const palette =
      kind === 'silver' ? silverPalette : kind === 'gold' || kind === 'willow' || kind === 'goldCore'
        ? finalePalette
        : redPalette;
    const count = Math.min(remaining, Math.round(spec.count * scale * (coarsePointer ? 0.85 : 1)));
    if (count <= 0) return;

    const depth = spec.depth ?? 0.85;
    const projection = depthScale(depth);
    const nearForParticle = (index) =>
      canUseNear() && (spec.foreground === true || (spec.nearRatio ?? 0) * count > index);

    for (let index = 0; index < count; index += 1) {
      // A real sphere, not a ring: the depth component gives each particle its
      // own brightness and size, which is what makes the shell read as volume.
      const [dx, dy, dz] = sphereDirection(index, count);
      const jitter = 0.86 + Math.pow(planRandom(), 0.4) * 0.3;
      const speed = spec.speed * jitter;

      const isWillow = kind === 'willow';
      const isSilver = kind === 'silver';
      const isGold = kind === 'gold' || kind === 'goldCore';

      particles.push(
        createParticle({
          x: screenX,
          y: screenY,
          vx: dx * speed * projection,
          // Screen Y grows downward while the sphere's Y is up.
          vy: -dy * speed * projection,
          colour: palette[index % palette.length],
          size:
            (isGold ? randomBetween(planRandom, 5.5, 9.6)
              : isSilver ? randomBetween(planRandom, 2.6, 4.6)
                : randomBetween(planRandom, 5.2, 9.4)) *
            (0.9 + (spec.sizeMultiplier ?? 1) * 0.18) *
            effectScale,
          life: isWillow
            ? randomBetween(planRandom, 4.6, 5.4)
            : isGold
              ? randomBetween(planRandom, 3.5, 4.6)
              : isSilver
                ? randomBetween(planRandom, 2.2, 3.2)
                : randomBetween(planRandom, 2.5, 3.5),
          gravity: isWillow ? 118 : isGold ? 66 : isSilver ? 48 : 78,
          drag: isWillow ? 0.994 : isGold ? 0.989 : isSilver ? 0.989 : 0.977,
          trail: isWillow ? 14 : isGold ? 10 : isSilver ? 13 : 8,
          kind: isWillow ? 'willow' : kind,
          near: nearForParticle(index),
          depth: depth + dz * 0.32,
          branchAt: isSilver ? randomBetween(planRandom, 0.34, 0.58) : 0,
        }),
      );
    }

    if (particles.length === 0) return;
    fireworks.push({
      particles,
      bornAt: elapsed,
      screenX,
      screenY,
      flash: kind === 'gold' || kind === 'goldCore' ? 1.6 : kind === 'willow' ? 0 : 1,
      // A brief bloom, not a lamp: a huge opaque disc hides the shell it belongs to.
      flashSize:
        Math.max(70, Math.min(240, (spec.speed ?? 160) * 0.42)) *
        (kind.startsWith('gold') ? 1.3 : 1),
      lightColor: palette[0],
    });

    // The detonation lights the sky, the smoke and the gold around it.
    const lightStrength =
      spec.light ?? (kind === 'gold' || kind === 'goldCore' ? 1.35 : kind === 'willow' ? 0.55 : 0.62);
    addLight({
      x: screenX,
      y: screenY,
      radius: Math.max(220, (spec.speed ?? 200) * projection * 2.4),
      intensity: lightStrength,
      color: palette[0],
      life: kind.startsWith('gold') ? 1.7 : 1.05,
      kind: 'firework',
    });
  }

  /** Golden rain that falls across the interface in front of everything. */
  function spawnGoldenFall(screenX, screenY, count) {
    const remaining = Math.max(0, maxLiveParticles - liveParticleCount());
    const total = Math.min(remaining, Math.round(count * quality.particleScale * qualityScale));
    if (total <= 0) return;

    const particles = [];
    for (let index = 0; index < total; index += 1) {
      const angle = Math.PI / 2 + randomBetween(planRandom, -0.82, 0.82);
      const speed = randomBetween(planRandom, width * 0.022, width * 0.07);
      particles.push(
        createParticle({
          x: screenX + randomBetween(planRandom, -18, 18),
          y: screenY + randomBetween(planRandom, -10, 26),
          vx: Math.cos(angle) * speed + randomBetween(planRandom, -24, 24),
          vy: Math.abs(Math.sin(angle) * speed) + randomBetween(planRandom, 12, 48),
          colour: finalePalette[Math.floor(planRandom() * finalePalette.length)],
          size: randomBetween(planRandom, 2.8, 5.6) * effectScale,
          life: randomBetween(planRandom, 4.4, 5.4),
          gravity: 132,
          drag: 0.9975,
          trail: 4,
          kind: 'gold',
          near: canUseNear(),
          depth: 1.5,
        }),
      );
    }

    if (particles.length === 0) return;
    fireworks.push({ particles, bornAt: elapsed, screenX, screenY, flash: 0 });
  }

  function launchFirework(spec, isFinale = false) {
    const originX = spec.originX;
    const speed = isFinale ? height * 0.72 : randomBetween(planRandom, 520, 700);

    rockets.push({
      x: originX,
      y: height + 8,
      targetX: spec.targetX,
      targetY: spec.targetY,
      vy: -speed,
      vx: ((spec.targetX - originX) / Math.max(1, height + 8 - spec.targetY)) * speed,
      spec,
      isFinale,
      near: canUseNear() && spec.targetY > height * 0.46,
      history: [],
    });
    emitCue(isFinale ? 'firework-finale' : 'firework-launch');
  }

  function spawnEmbers(count) {
    for (let index = 0; index < count; index += 1) {
      embers.push({
        x: planRandom() * width,
        y: height * randomBetween(planRandom, 0.8, 1.04),
        vx: randomBetween(planRandom, -14, 14),
        vy: randomBetween(planRandom, -46, -16),
        age: 0,
        life: randomBetween(planRandom, 3.2, 5.6),
        size: randomBetween(planRandom, 1.6, 4.2),
        color: emberPalette[Math.floor(planRandom() * emberPalette.length)],
        phase: randomBetween(planRandom, 0, Math.PI * 2),
        near: canUseNear() && index % 4 === 0,
      });
    }
  }

  // --- Event choreography ------------------------------------------------

  const meteorCount = Math.round(randomBetween(planRandom, 12, 16));
  const lightningCount = Math.round(randomBetween(planRandom, 5, 7));
  const fireworkCount = Math.round(randomBetween(planRandom, 6, 8));

  // The finale's start follows from the event's duration. The fireworks finale
  // also gets a deeper launch whistle queued before it, so its build-up is
  // audible and distinct from the opening pops.
  const finaleAt = Math.max(
    0,
    durationMs - (eventId === 'meteor' ? 1900 : eventId === 'lightning' ? 2300 : 5600),
  );
  if (eventId === 'fireworks') queueCue(Math.max(0, finaleAt - 520), 'firework-finale');

  if (eventId === 'meteor') {
    for (let index = 0; index < meteorCount - 1; index += 1) {
      const fromRight = index % 2 === 1;
      plan.push({
        at:
          (index / Math.max(1, meteorCount - 1)) * durationMs * 0.58 +
          randomBetween(planRandom, 0, 380),
        type: 'meteor',
        fromRight,
        // Enter just outside the frame so every meteor actually crosses the sky.
        x: fromRight
          ? width * randomBetween(planRandom, 1.02, 1.2)
          : -width * randomBetween(planRandom, 0.02, 0.18),
        y: -height * randomBetween(planRandom, 0.02, 0.16),
      });
    }
  } else if (eventId === 'lightning') {
    for (let index = 0; index < lightningCount - 1; index += 1) {
      // Distance bands cycle so every run contains far, middle and near strikes.
      const band = index % 3;
      plan.push({
        at: 220 + (index / Math.max(1, lightningCount - 1)) * durationMs * 0.6,
        type: 'lightning',
        x: width * randomBetween(planRandom, 0.12, 0.88),
        depth: band === 0 ? randomBetween(planRandom, 0.4, 0.55)
          : band === 1 ? randomBetween(planRandom, 0.85, 1.05)
            : randomBetween(planRandom, 1.3, 1.55),
      });
    }
  } else if (eventId === 'fireworks') {
    for (let index = 0; index < fireworkCount - 1; index += 1) {
      const kind = index % 2 === 0 ? 'red' : 'silver';
      plan.push({
        // Leave the last third of the event to the finale.
        at: 180 + (index / Math.max(1, fireworkCount - 1)) * durationMs * 0.36,
        type: 'firework',
        spec: {
          originX: width * randomBetween(planRandom, 0.1, 0.9),
          targetX: width * randomBetween(planRandom, 0.14, 0.86),
          // Kept clear of the very top so the whole shell opens on screen.
          targetY: height * randomBetween(planRandom, 0.17, 0.36),
          kind,
          // Burst depth varies per shell, so some open nearby and some far away.
          depth: randomBetween(planRandom, 0.55, 1.25),
          speed:
            randomBetween(planRandom, kind === 'silver' ? 200 : 155, kind === 'silver' ? 275 : 235) *
            (width < 768 ? 0.86 : 1),
          count:
            kind === 'silver'
              ? randomBetween(planRandom, 320, 420)
              : randomBetween(planRandom, 380, 480),
          sizeMultiplier: randomBetween(planRandom, 0.85, 1.35),
          nearRatio: kind === 'red' ? 0.18 : 0.22,
          light: randomBetween(planRandom, 0.5, 0.72),
        },
      });
    }
  }

  /** Expanding ring used to make the finale's scale readable at a glance. */
  function spawnShockwave(x, y, { radius = 320, life = 1.1 } = {}) {
    shockwaves.push({ x, y, age: 0, life, maxRadius: radius });
  }

  function spawnFinale() {
    if (finaleSpawned) return;
    finaleSpawned = true;

    if (eventId === 'meteor') {
      spawnMeteor({ x: -width * 0.32, y: height * 0.14 }, true);
    } else if (eventId === 'lightning') {
      spawnLightning({ x: width * randomBetween(planRandom, 0.44, 0.56) }, true);
    } else if (eventId === 'fireworks') {
      const centreScreenX = width * 0.5;
      // High enough that the full shell reads above the meter while its golden
      // rain still crosses the whole interface.
      const burstY = height * 0.17;
      const maxDimension = Math.max(width, height);

      // Outer shell and an inner core, both far larger than any opening burst.
      spawnBurst(centreScreenX, burstY, {
        kind: 'gold',
        speed: maxDimension * 0.29,
        count: 1150,
        sizeMultiplier: 2.9,
        nearRatio: 0.55,
        depth: 1.15,
        light: 1.5,
      });
      spawnBurst(centreScreenX, burstY, {
        kind: 'goldCore',
        speed: maxDimension * 0.15,
        count: 420,
        sizeMultiplier: 2.4,
        nearRatio: 0.6,
        depth: 1.15,
        light: 0.7,
      });
      spawnBurst(centreScreenX, burstY + height * 0.015, {
        kind: 'willow',
        speed: maxDimension * 0.2,
        count: 520,
        sizeMultiplier: 2.2,
        depth: 1.1,
        light: 0.5,
      });
      spawnGoldenFall(centreScreenX, burstY, Math.round(quality.sparkBudget * 1.2));
      spawnEmbers(quality.tier === 'constrained' ? 14 : 28);
      spawnShockwave(centreScreenX, burstY, {
        radius: Math.max(width, height) * 0.34,
        life: 1.25,
      });
      // The strongest, warmest environmental illumination of the sequence.
      addLight({
        x: centreScreenX,
        y: burstY,
        radius: Math.max(width, height) * 0.72,
        intensity: 1.7,
        color: [1, 0.78, 0.4],
        life: 2.2,
        kind: 'firework-finale',
      });
      emitCue('finale-boom');
      queueCue(elapsed + 140, 'firework-willow');
    }
  }

  // --- Smoke and embers ---------------------------------------------------

  function updateSmoke(deltaSeconds, globalAlpha) {
    for (let index = smoke.length - 1; index >= 0; index -= 1) {
      const puff = smoke[index];
      puff.age += deltaSeconds;
      if (puff.age >= puff.life) {
        smoke.splice(index, 1);
        continue;
      }

      const dragFactor = Math.pow(puff.drag ?? 0.98, deltaSeconds * 60);
      puff.vx *= dragFactor;
      puff.vy *= dragFactor;
      puff.x += puff.vx * deltaSeconds;
      puff.y += puff.vy * deltaSeconds;

      const progress = puff.age / puff.life;

      if (puff.kind === 'fragment') {
        puff.vy += 120 * deltaSeconds;
        const alpha = Math.pow(1 - progress, 1.6) * globalAlpha;
        pushPoint(puff.x, puff.y, puff.size, puff.color, alpha, puff.near);
        pushPoint(puff.x, puff.y, puff.size * 4.5, puff.color, alpha * 0.24, puff.near);
        continue;
      }

      // Smoke: neutral albedo tinted by whatever light is currently near it, so
      // a burst's colour visibly catches in its own smoke.
      puff.size += (puff.growth ?? 20) * deltaSeconds;
      let tintR = smokeGrey[0];
      let tintG = smokeGrey[1];
      let tintB = smokeGrey[2];
      let nearest = 0;
      for (let lightIndex = 0; lightIndex < activeLights.length; lightIndex += 1) {
        const light = activeLights[lightIndex];
        if (light.intensity <= 0.02) continue;
        const distance = Math.hypot(puff.x - light.x, puff.y - light.y);
        const falloff = Math.max(0, 1 - distance / light.radius);
        if (falloff <= 0) continue;
        const amount = falloff * falloff * Math.min(1, light.intensity);
        if (amount > nearest) nearest = amount;
        tintR += light.color[0] * amount * 0.85;
        tintG += light.color[1] * amount * 0.85;
        tintB += light.color[2] * amount * 0.85;
      }

      const fade = Math.sin(Math.min(1, progress) * Math.PI * 0.9) * (0.28 + nearest * 0.5);
      const tint = [
        Math.min(1, tintR),
        Math.min(1, tintG),
        Math.min(1, tintB),
      ];
      pushPoint(puff.x, puff.y, puff.size, tint, fade * globalAlpha * 0.32, puff.near);
    }
  }

  /** Expanding rings, drawn as dense point rings so they stay additive. */
  function updateShockwaves(deltaSeconds, globalAlpha) {
    for (let index = shockwaves.length - 1; index >= 0; index -= 1) {
      const wave = shockwaves[index];
      wave.age += deltaSeconds;
      if (wave.age >= wave.life) {
        shockwaves.splice(index, 1);
        continue;
      }
      const progress = wave.age / wave.life;
      const radius = wave.maxRadius * effectScale * Math.pow(progress, 0.55);
      const alpha = Math.pow(1 - progress, 1.5) * 0.55 * globalAlpha;
      const points = 56;
      for (let step = 0; step < points; step += 1) {
        const angle = (step / points) * Math.PI * 2;
        pushPoint(
          wave.x + Math.cos(angle) * radius,
          wave.y + Math.sin(angle) * radius,
          3.4 * effectScale,
          finalePalette[0],
          alpha,
          canUseNear(),
        );
      }
    }
  }

  function updateEmbers(deltaSeconds, globalAlpha) {
    for (let index = embers.length - 1; index >= 0; index -= 1) {
      const ember = embers[index];
      ember.age += deltaSeconds;
      if (ember.age >= ember.life || ember.y < -30) {
        embers.splice(index, 1);
        continue;
      }

      ember.vx += Math.sin(ember.age * 2.2 + ember.phase) * 9 * deltaSeconds;
      ember.x += ember.vx * deltaSeconds;
      ember.y += ember.vy * deltaSeconds;

      const lifeProgress = ember.age / ember.life;
      const alpha =
        Math.sin(lifeProgress * Math.PI) * (0.5 + 0.5 * Math.sin(ember.age * 7 + ember.phase));
      pushPoint(ember.x, ember.y, ember.size, ember.color, alpha * globalAlpha, ember.near);
      pushPoint(ember.x, ember.y, ember.size * 5, ember.color, alpha * 0.16 * globalAlpha, ember.near);
    }
  }

  // --- Fireworks update ---------------------------------------------------

  function updateFireworks(deltaSeconds, globalAlpha) {
    // Rockets
    for (let index = rockets.length - 1; index >= 0; index -= 1) {
      const rocket = rockets[index];
      rocket.history.push({ x: rocket.x, y: rocket.y });
      if (rocket.history.length > 8) rocket.history.shift();
      rocket.x += rocket.vx * deltaSeconds;
      rocket.y += rocket.vy * deltaSeconds;

      for (let trailIndex = 0; trailIndex < rocket.history.length; trailIndex += 1) {
        const point = rocket.history[trailIndex];
        const progress = trailIndex / Math.max(1, rocket.history.length - 1);
        pushPoint(
          point.x,
          point.y,
          (1.3 + progress * 1.9) * (rocket.isFinale ? 1.7 : 1),
          rocket.isFinale ? finalePalette[0] : silverPalette[1],
          (0.22 + progress * 0.6) * globalAlpha,
          rocket.near,
        );
      }

      if (rocket.y <= rocket.targetY) {
        if (!rocket.isFinale && rocket.spec) {
          const spec = rocket.spec;
          spawnBurst(rocket.x, rocket.y, spec);
          spawnBurst(rocket.x, rocket.y, {
            ...spec,
            kind: spec.kind === 'silver' ? 'silver' : 'red',
            count: spec.count * 0.42,
            speed: spec.speed * 0.62,
            sizeMultiplier: spec.sizeMultiplier * 0.82,
            nearRatio: 0.1,
            light: 0,
          });
          emitCue(spec.kind === 'silver' ? 'firework-burst-silver' : 'firework-burst');
        }
        rockets.splice(index, 1);
      }
    }

    // Burst particles with cascading trails.
    let liveParticles = liveParticleCount();
    for (let fireworkIndex = fireworks.length - 1; fireworkIndex >= 0; fireworkIndex -= 1) {
      const firework = fireworks[fireworkIndex];
      const particles = firework.particles;
      let alive = 0;

      if (firework.flash > 0) {
        firework.flash = Math.max(0, firework.flash - deltaSeconds * 3.6);
        pushPoint(
          firework.screenX,
          firework.screenY,
          firework.flashSize * (1.15 - firework.flash * 0.2),
          firework.lightColor,
          firework.flash * 0.26 * globalAlpha,
          false,
        );
        pushPoint(
          firework.screenX,
          firework.screenY,
          firework.flashSize * 0.34,
          firework.lightColor,
          Math.min(1, firework.flash * 0.75) * globalAlpha,
          false,
        );
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.age += deltaSeconds;
        if (particle.age >= particle.life) {
          particles.splice(index, 1);
          continue;
        }
        alive += 1;

        particle.history.push({ x: particle.x, y: particle.y });
        if (particle.history.length > particle.trail) particle.history.shift();

        const dragFactor = Math.pow(particle.drag, deltaSeconds * 60);
        particle.vx *= dragFactor;
        particle.vy *= dragFactor;
        particle.vy += particle.gravity * deltaSeconds;
        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;

        const lifeProgress = particle.age / particle.life;

        if (
          particle.kind === 'silver' &&
          !particle.branched &&
          particle.age >= particle.life * particle.branchAt &&
          liveParticles < maxLiveParticles
        ) {
          particle.branched = true;
          const angle = Math.atan2(particle.vy, particle.vx);
          for (let child = 0; child < 2; child += 1) {
            const childAngle = angle + (child === 0 ? 1 : -1) * randomBetween(planRandom, 0.35, 1.1);
            const childSpeed = Math.hypot(particle.vx, particle.vy) * randomBetween(planRandom, 0.25, 0.48);
            firework.particles.push(
              createParticle({
                x: particle.x,
                y: particle.y,
                vx: Math.cos(childAngle) * childSpeed,
                vy: Math.sin(childAngle) * childSpeed,
                colour: silverPalette[child % silverPalette.length],
                size: particle.size * 0.72,
                life: randomBetween(planRandom, 0.55, 1.1),
                gravity: 40,
                drag: 0.99,
                trail: 4,
                kind: 'silver',
                near: particle.near,
                depth: particle.depth,
                // A child is terminal: it must never branch again.
                branchAt: 2,
              }),
            );
            liveParticles += 1;
          }
        }

        const twinkle =
          particle.kind === 'silver'
            ? 0.55 + 0.45 * Math.sin(particle.twinkle + particle.age * 19)
            : particle.kind === 'gold' || particle.kind === 'goldCore'
              ? 0.6 + 0.4 * Math.sin(particle.twinkle + particle.age * 10)
              : 0.82 + 0.18 * Math.sin(particle.twinkle + particle.age * 7);
        const fadeExponent =
          particle.kind === 'gold' || particle.kind === 'goldCore'
            ? 0.82
            : particle.kind === 'willow'
              ? 0.92
              : 1.28;
        const alpha = Math.pow(1 - lifeProgress, fadeExponent) * twinkle;

        // Per-particle depth: the near half of a shell is larger and brighter,
        // which is what turns a ring of dots into a sphere.
        const depthFactor = clamp(particle.depth ?? 1, 0.4, 2);
        const sizeFactor = 0.82 + depthFactor * 0.22;

        // History is sampled once per frame, so at a low frame rate the raw
        // points are far apart. Interpolating between them keeps the streak
        // continuous on a slow device without recording more history.
        const history = particle.history;
        for (let trailIndex = 0; trailIndex < history.length; trailIndex += 1) {
          const point = history[trailIndex];
          const previous = trailIndex > 0 ? history[trailIndex - 1] : null;
          const trailProgress = trailIndex / Math.max(1, history.length - 1);
          const trailSize = particle.size * sizeFactor * (0.52 + trailProgress * 0.48);
          const trailAlpha = alpha * trailProgress * 0.72 * globalAlpha;

          if (previous) {
            const gap = Math.hypot(point.x - previous.x, point.y - previous.y);
            const steps = clamp(Math.round(gap / 5), 1, 3);
            for (let step = 1; step < steps; step += 1) {
              const fraction = step / steps;
              pushPoint(
                previous.x + (point.x - previous.x) * fraction,
                previous.y + (point.y - previous.y) * fraction,
                trailSize,
                particle.colour,
                trailAlpha,
                particle.near,
              );
            }
          }

          pushPoint(point.x, point.y, trailSize, particle.colour, trailAlpha, particle.near);
        }

        pushPoint(
          particle.x,
          particle.y,
          particle.size * sizeFactor,
          particle.colour,
          alpha * globalAlpha,
          particle.near,
        );
        pushPoint(
          particle.x,
          particle.y,
          particle.size * sizeFactor * 5.2,
          particle.colour,
          alpha * 0.2 * globalAlpha,
          particle.near,
        );
      }

      if (alive === 0) fireworks.splice(fireworkIndex, 1);
    }
  }

  // --- Frame --------------------------------------------------------------

  /** Reused each frame for the shared-light selection; never reallocated. */
  const topLights = [];

  function updateLights(deltaSeconds) {
    for (let index = activeLights.length - 1; index >= 0; index -= 1) {
      const light = activeLights[index];
      light.age += deltaSeconds;
      if (light.age >= light.life || light.peak <= 0.001) {
        activeLights.splice(index, 1);
        continue;
      }
      const progress = light.age / light.life;
      // Fast attack, slow tail: a burst is bright immediately and lingers.
      light.intensity = light.peak * Math.pow(1 - progress, 1.7);
    }

    // Publish the strongest lights to the shared bus, which the medallion and
    // the maple leaves read so the whole scene shares one illumination. The
    // selection reuses one array: nothing is allocated per frame.
    topLights.length = 0;
    for (let index = 0; index < activeLights.length; index += 1) {
      const candidate = activeLights[index];
      if (candidate.intensity <= 0.01) continue;
      let slot = 0;
      while (slot < topLights.length && topLights[slot].intensity >= candidate.intensity) slot += 1;
      if (slot >= 4) continue;
      topLights.splice(slot, 0, candidate);
      if (topLights.length > 4) topLights.pop();
    }
    publishSceneLights(topLights);
  }

  function trackPerformance(deltaMs) {
    if (elapsed < 1000 || (qualitySteps >= 2 && (nearDead || !nearSurface))) return;
    frameAccum += deltaMs;
    frameCount += 1;
    if (frameAccum < 1200) return;

    const fps = (frameCount * 1000) / frameAccum;
    frameAccum = 0;
    frameCount = 0;

    if (fps < 42 && qualitySteps < 2) {
      qualitySteps += 1;
      qualityScale = qualitySteps === 1 ? 0.78 : 0.56;
      resolutionScale = qualitySteps === 1 ? 0.86 : 0.7;
      resize();
      return;
    }

    if (fps < 18 && qualitySteps >= 2 && nearSurface && !nearDead) {
      nearDead = true;
      nearSurface.clear();
      nearBatch?.reset();
    }
  }

  function frame(timestamp) {
    if (destroyed || contextLost) return;

    if (!lastFrame) lastFrame = timestamp;
    // Two clocks. The timeline must follow real time so the reveal keeps its
    // documented duration on a slow device, while the simulation step is capped
    // so a long frame cannot teleport particles or tunnel through a curve.
    const wallDeltaMs = Math.min(120, Math.max(0, timestamp - lastFrame));
    lastFrame = timestamp;
    const deltaSeconds = Math.min(0.064, wallDeltaMs / 1000);
    elapsed += wallDeltaMs;

    trackPerformance(wallDeltaMs);

    while (nextSpawnIndex < plan.length && elapsed >= plan[nextSpawnIndex].at) {
      const beat = plan[nextSpawnIndex];
      if (beat.type === 'meteor') spawnMeteor(beat);
      else if (beat.type === 'lightning') spawnLightning(beat);
      else if (beat.type === 'firework') launchFirework(beat.spec);
      nextSpawnIndex += 1;
    }
    while (cueQueue.length > 0 && elapsed >= cueQueue[0].at) {
      emitCue(cueQueue.shift().cue);
    }

    if (!finaleSpawned && elapsed >= finaleAt) {
      spawnFinale();
    }

    const fadeIn = clamp(elapsed / 340, 0, 1);
    const fadeOut = clamp((durationMs - elapsed) / 900, 0, 1);
    const nearFadeOut = clamp((durationMs - elapsed) / 700, 0, 1);
    const globalAlpha = fadeIn * fadeOut;
    const nearAlpha = fadeIn * nearFadeOut;

    flash *= Math.pow(0.02, deltaSeconds);
    flash = clamp(flash, 0, 1.3);

    farSurface.clear();
    if (nearSurface && !nearDead) nearSurface.clear();
    farSurface.gl.enable(farSurface.gl.BLEND);
    farSurface.gl.blendFunc(farSurface.gl.SRC_ALPHA, farSurface.gl.ONE);
    farSurface.gl.disable(farSurface.gl.DEPTH_TEST);
    if (nearSurface && !nearDead) {
      nearSurface.gl.enable(nearSurface.gl.BLEND);
      nearSurface.gl.blendFunc(nearSurface.gl.SRC_ALPHA, nearSurface.gl.ONE);
      nearSurface.gl.disable(nearSurface.gl.DEPTH_TEST);
    }

    farBatch.reset();
    nearBatch?.reset();
    if (meteors.length > 0) updateMeteors(deltaSeconds, globalAlpha);
    if (lightningStrikes.length > 0) updateLightning(deltaSeconds, globalAlpha);
    if (rockets.length > 0 || fireworks.length > 0) {
      updateFireworks(deltaSeconds, globalAlpha);
    }
    if (smoke.length > 0) updateSmoke(deltaSeconds, globalAlpha);
    if (embers.length > 0) updateEmbers(deltaSeconds, globalAlpha);
    if (shockwaves.length > 0) updateShockwaves(deltaSeconds, globalAlpha);

    updateLights(deltaSeconds);

    hazeStrength = eventId === 'lightning' ? 0.26 * globalAlpha + flash * 0.6 : 0;
    if (hazeStrength > 0.001 && farSurface.hazeAvailable) {
      farSurface.drawHaze({
        time: elapsed / 1000,
        alpha: hazeStrength,
        flash,
        flashPosition,
      });
    }

    // Sky illumination: the pass that makes explosions and strikes light the sky.
    if (farSurface.skyLightAvailable && activeLights.length > 0) {
      farSurface.drawSkyLight({
        time: elapsed / 1000,
        alpha: globalAlpha,
        lights: activeLights,
        count: Math.min(4, activeLights.length),
      });
    }

    if (typeof window !== 'undefined' && window.__LUCKY_METER_DEBUG__ === true) {
      window.__luckyCosmic = {
        elapsed: Math.round(elapsed),
        farCount: farBatch.count,
        nearCount: nearBatch ? nearBatch.count : 0,
        fireworks: fireworks.length,
        rockets: rockets.length,
        meteors: meteors.length,
        strikes: lightningStrikes.length,
        smoke: smoke.length,
        lights: activeLights.length,
        finaleSpawned,
        farDropped: farBatch.dropped,
        nearDropped: nearBatch ? nearBatch.dropped : 0,
        droppedPoints,
        qualitySteps,
        nearDead,
        globalAlpha,
        lost: farSurface.gl.isContextLost(),
      };
    }

    farSurface.drawPoints(farBatch, globalAlpha);
    if (nearSurface && !nearDead) nearSurface.drawPoints(nearBatch, nearAlpha);

    if (elapsed >= durationMs) {
      finish();
      return;
    }

    animationFrame = window.requestAnimationFrame(frame);
  }

  function finish() {
    if (completed) return;
    completed = true;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (!contextLost) {
      farSurface.clear();
      if (nearSurface && !nearDead) nearSurface.clear();
    }
    // The stage is over: stop lighting the page.
    clearSceneLights();
    if (doneHandler) doneHandler();
  }

  function handleResize() {
    resize();
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  const stopVisibilityListener = onVisibilityChange((visible) => {
    lastFrame = 0;
    if (!visible) {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      return;
    }
    if (!destroyed && !completed && !contextLost && !animationFrame) {
      animationFrame = window.requestAnimationFrame(frame);
    }
  });

  const stopFarContextWatcher = watchContextLoss(canvas, {
    onLost: () => {
      if (destroyed || completed || contextLost) return;
      contextLost = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      farSurface.dispose();
      clearSceneLights();
      if (lostHandler) lostHandler();
    },
  });

  const stopNearContextWatcher =
    foregroundCanvas && nearSurface
      ? watchContextLoss(foregroundCanvas, {
          onLost: () => {
            nearDead = true;
            try {
              nearSurface.clear();
              nearSurface.dispose();
            } catch {
              // The context is already gone.
            }
          },
        })
      : () => {};

  if (!reducedMotion) {
    animationFrame = window.requestAnimationFrame(frame);
  } else {
    finish();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    stopVisibilityListener();
    stopFarContextWatcher();
    stopNearContextWatcher();

    cueHandler = null;
    doneHandler = null;
    lostHandler = null;
    meteors.length = 0;
    lightningStrikes.length = 0;
    rockets.length = 0;
    fireworks.length = 0;
    embers.length = 0;
    smoke.length = 0;
    shockwaves.length = 0;
    activeLights.length = 0;
    clearSceneLights();

    farSurface.dispose();
    if (nearSurface) nearSurface.dispose();
  }

  return { destroy, hasForeground: Boolean(nearSurface) };
}
