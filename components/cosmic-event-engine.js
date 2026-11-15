/**
 * Cosmic event stage for the Daily Resonance reveal.
 *
 * Three GPU-rendered set pieces share one additive WebGL point pipeline:
 *   - Meteor Shower: depth-varied meteors with plasma trails; near meteors and
 *     the close finale cross in front of the meter.
 *   - Cosmic Lightning: branching strikes at several depths, with atmospheric
 *     haze, cloud bloom and a huge close finale.
 *   - Fireworks: dense red peonies, fine white/silver crackle and a golden
 *     chrysanthemum + willow finale whose sparks fall across the interface.
 *
 * Two transparent surfaces are used so depth is real rather than simulated:
 * the far surface sits behind the meter and interface, the near surface above
 * them. The near surface is optional (and pointer-transparent), so constrained
 * devices keep one context. Every particle is additive light, so the existing
 * Milky Way artwork underneath is never replaced, covered or dimmed.
 *
 * Design notes:
 *   - Positions are CSS pixels, converted to clip space in the vertex shader.
 *   - Particle point sizes are multiplied by the device pixel ratio because
 *     gl_PointSize is expressed in physical pixels.
 *   - Nothing here runs when WebGL is unavailable; the caller shows a static
 *     fallback and keeps its own completion timer.
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
  // A light veil only: the Milky Way must stay legible through the storm, so
  // the cloud body contributes a fraction of the strike's own illumination,
  // while the strike's flash does the real lighting.
  float alpha = density * u_alpha * 0.22 + flash * 0.5 * u_alpha;
  gl_FragColor = vec4(cloudColor * (0.55 + flash * 2.6), alpha);
}
`;

const DEFAULT_WEBGL_ATTRIBUTES = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false,
};

/**
 * One WebGL canvas: programs, attribute buffers and its own backing store.
 * The engine owns two of these only when the resolved quality profile supports
 * the near layer.
 */
function createSurface(canvas, { haze = false } = {}) {
  if (!canvas) return null;
  const gl = getWebGLContext(canvas, DEFAULT_WEBGL_ATTRIBUTES);
  if (!gl) return null;

  let pointProgram = createProgram(gl, POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);
  let hazeProgram = haze ? createProgram(gl, HAZE_VERTEX_SHADER, HAZE_FRAGMENT_SHADER) : null;
  if (!pointProgram || (haze && !hazeProgram)) {
    if (pointProgram) gl.deleteProgram(pointProgram);
    if (hazeProgram) gl.deleteProgram(hazeProgram);
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
  let hazeBuffer = null;
  if (hazeProgram) {
    hazeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hazeBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  const maxPointSize = readMaxPointSize(gl);
  let width = 1;
  let height = 1;

  const surface = {
    gl,
    maxPointSize,
    hazeAvailable: Boolean(hazeProgram),
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
      if (!hazeProgram || !hazeLocations || !hazeBuffer) return;
      gl.useProgram(hazeProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, hazeBuffer);
      gl.enableVertexAttribArray(hazeLocations.uv);
      gl.vertexAttribPointer(hazeLocations.uv, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(hazeLocations.time, time);
      gl.uniform1f(hazeLocations.alpha, alpha);
      gl.uniform2f(hazeLocations.resolution, width, height);
      gl.uniform2f(hazeLocations.flashPosition, flashPosition[0], flashPosition[1]);
      gl.uniform1f(hazeLocations.flash, flash);
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
        if (hazeBuffer) gl.deleteBuffer(hazeBuffer);
        if (pointProgram) gl.deleteProgram(pointProgram);
        if (hazeProgram) gl.deleteProgram(hazeProgram);
        pointProgram = null;
        hazeProgram = null;
        // Do not force-lose the context: the same canvas can be reused by a
        // Strict Mode remount, and a deliberately lost context cannot render.
      } catch {
        // Releasing a context is an optimisation, never a requirement.
      }
    },
  };

  return surface;
}

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

  // Hard geometry budget. Without it a forked finale grows into a full-screen
  // fractal web that hides the interface instead of reading as one strike.
  if (generation >= maxGeneration || length < 8 || segments.length >= maxSegments) {
    segments.push({ startX, startY, endX, endY, generation });
    return;
  }

  const normalX = -dy / (length || 1);
  const normalY = dx / (length || 1);
  const variance = (random() - 0.5) * roughness;
  const midX = (startX + endX) / 2 + normalX * variance;
  const midY = (startY + endY) / 2 + normalY * variance + roughness * 0.12;

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
    const angle =
      Math.atan2(dy, dx) + direction * randomBetween(random, 0.32, 1.02);
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

function rasterizeSegments(segments, { step, coreSize, depth, near }) {
  const points = [];
  for (const segment of segments) {
    const branchDepth = depth * (1 - segment.generation * 0.06);
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    const length = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(length / step));
    const taper = segment.generation === 0 ? 1 : Math.max(0.32, 1 - segment.generation * 0.12);
    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      // A real channel narrows and brightens again at its tip.
      const width = taper * (0.78 + Math.sin(progress * Math.PI) * 0.22);
      points.push({
        x: segment.startX + dx * progress,
        y: segment.startY + dy * progress,
        // The lower bound keeps consecutive samples overlapping. A thin branch
        // drawn with tiny sprites would otherwise read as a string of beads.
        size: Math.max(
          step * 1.7,
          coreSize * width * (0.85 + branchDepth * 0.3) * (near ? 1.35 : 1),
        ),
        alpha: (segment.generation === 0 ? 1 : 0.72) * (0.66 + branchDepth * 0.34),
        core: true,
      });
    }
  }
  return points;
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
  const farSurface = createSurface(canvas, { haze: quality.haze });
  if (!farSurface) return null;

  const nearSurface =
    quality.foreground && foregroundCanvas
      ? createSurface(foregroundCanvas, { haze: false })
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
  // the same apparent grain size on a phone and on a large display instead of
  // turning every spark into a 2-pixel dot on big screens.
  let effectScale = 1;

  // Budgets are per frame across both surfaces. They are high enough for the
  // finale's trails and foreground sparks on capable hardware, and step down
  // with the resolved quality profile rather than being fixed globally.
  const basePointBudget =
    quality.tier === 'high' ? 56000 : quality.tier === 'balanced' ? 30000 : 13000;
  const farLimit = Math.round(basePointBudget * (nearSurface ? 0.6 : 1));
  const nearLimit = Math.round(basePointBudget * 0.65);
  const farBatch = new PointBatch(Math.round(farLimit * 0.6), farLimit);
  const nearBatch = nearSurface ? new PointBatch(Math.round(nearLimit * 0.6), nearLimit) : null;

  const maxLiveParticles =
    quality.tier === 'high' ? 6800 : quality.tier === 'balanced' ? 4400 : 2200;

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

  const meteors = [];
  const lightningStrikes = [];
  const rockets = [];
  const fireworks = [];
  const embers = [];

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

  function canUseNear() {
    return Boolean(nearSurface) && !nearDead;
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const previousWidth = farSurface.width || width;
    const previousHeight = farSurface.height || height;
    pixelRatio =
      Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio) * resolutionScale;
    pixelRatio = Math.max(1, pixelRatio);
    effectScale = clamp(Math.sqrt((width * height) / (1440 * 900)), 0.82, 1.55);

    farSurface.resize(width, height, pixelRatio);
    if (nearSurface && !nearDead) nearSurface.resize(width, height, pixelRatio);

    const scaleX = width / previousWidth;
    const scaleY = height / previousHeight;
    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) return;
    if (Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001) return;

    for (const meteor of meteors) {
      meteor.x *= scaleX;
      meteor.y *= scaleY;
    }
    for (const strike of lightningStrikes) {
      for (const point of strike.points) {
        point.x *= scaleX;
        point.y *= scaleY;
      }
      strike.rootX *= scaleX;
      strike.rootY *= scaleY;
      strike.groundX *= scaleX;
      strike.groundY *= scaleY;
    }
    for (const firework of fireworks) {
      for (const particle of firework.particles) {
        particle.x *= scaleX;
        particle.y *= scaleY;
        particle.history = particle.history.map((entry) => ({
          x: entry.x * scaleX,
          y: entry.y * scaleY,
        }));
      }
    }
    for (const rocket of rockets) {
      rocket.x *= scaleX;
      rocket.y *= scaleY;
      rocket.targetX *= scaleX;
      rocket.targetY *= scaleY;
      rocket.history = rocket.history.map((entry) => ({
        x: entry.x * scaleX,
        y: entry.y * scaleY,
      }));
    }
    for (const ember of embers) {
      ember.x *= scaleX;
      ember.y *= scaleY;
    }
  }

  resize();

  function emitCue(cue) {
    if (cueHandler) cueHandler(cue);
  }

  /**
   * Stores one point on the surface that matches its depth. If the near layer
   * is unavailable, the point falls back to the far surface rather than being
   * lost, which keeps the composition complete on constrained devices.
   */
  function pushPoint(x, y, size, color, alpha, near = false) {
    if (alpha <= 0.003 || size <= 0) return;
    const batch = near && canUseNear() ? nearBatch : farBatch;
    if (!batch) return;
    batch.push(x, y, size, color, alpha, pixelRatio, farSurface.maxPointSize);
  }

  function liveParticleCount() {
    let count = 0;
    for (const firework of fireworks) count += firework.particles.length;
    return count;
  }

  function spawnMeteor(spec, isFinale = false) {
    const depth = isFinale ? 1.25 : randomBetween(planRandom, 0.16, 0.95);
    const angle = spec.fromRight
      ? -randomBetween(planRandom, 0.34, 0.68)
      : randomBetween(planRandom, 0.34, 0.68);
    const speed = 170 + depth * 430;
    const near = isFinale ? true : canUseNear() && depth > 0.62;

    meteors.push({
      x: spec.x,
      y: spec.y,
      // The finale crosses the foreground horizontally instead of falling
      // straight down, which reads as a dominant close sweep.
      vx: isFinale ? width * 1.05 : Math.sin(angle) * speed,
      vy: isFinale ? height * 0.45 : Math.cos(angle) * speed,
      depth,
      near,
      length: isFinale
        ? Math.max(width, height) * 1.3
        : (300 + depth * 520) * effectScale,
      thickness: (isFinale ? 9 : 2.8 + depth * 4.4) * (near ? 1.25 : 1) * effectScale,
      color: isFinale
        ? hexToRgb('#fff1c4')
        : depth > 0.6
          ? hexToRgb('#ffffff')
          : hexToRgb('#a8dcff'),
      trailColor: depth > 0.6 ? hexToRgb('#ffd9a0') : hexToRgb('#5fa8ff'),
      alpha: isFinale ? 1 : 0.45 + depth * 0.5,
      // Dense samples keep the trail a continuous streak instead of dots.
      samples: Math.round(
        (isFinale ? 460 : 240 + depth * 180) *
          clamp(qualityScale * quality.particleScale, 0.55, 1.25),
      ),
      isFinale,
    });
    emitCue(isFinale ? 'meteor-finale' : 'meteor');
  }

  function spawnLightning(spec, isFinale = false) {
    const depth = isFinale ? 1.35 : randomBetween(planRandom, 0.35, 1);
    const scale = (isFinale ? 1.85 : 0.75 + depth * 0.75) * (width < 768 ? 0.84 : 1);
    const segments = [];
    const maxGeneration = coarsePointer ? 5 : isFinale ? 7 : 6;
    const startX = spec.x;
    const startY = -30;
    const targetX = startX + randomBetween(planRandom, -0.3, 0.3) * width * scale;
    const targetY = startY + height * (isFinale ? 1.08 : 0.56 + depth * 0.26) * scale;
    const near = isFinale || (canUseNear() && (spec.near === true || depth > 0.9));

    buildBranchSegments({
      startX,
      startY,
      endX: targetX,
      endY: targetY,
      roughness: (width < 768 ? 150 : 240) * scale,
      generation: 0,
      maxGeneration,
      branchProbability: isFinale ? 0.34 : 0.16 + depth * 0.12,
      segments,
      random: planRandom,
      maxSegments: isFinale ? 260 : 170,
    });

    // The finale's outer branches spread toward the viewer, reading as an
    // enormous close strike that reaches past the frame. Three main forks only:
    // enough to feel colossal, few enough that the channel still reads.
    if (isFinale) {
      for (let index = 0; index < 3; index += 1) {
        buildBranchSegments({
          startX,
          startY,
          endX: startX + randomBetween(planRandom, -0.38, 0.38) * width,
          endY: height * randomBetween(planRandom, 0.9, 1.18),
          roughness: 118,
          generation: 2,
          maxGeneration: 4,
          branchProbability: 0.22,
          segments,
          random: planRandom,
          maxSegments: 320,
        });
      }
    }

    // Bound the samples per strike before rasterising. A deeply forked finale
    // can otherwise produce far more points than the surface budget allows,
    // and a saturated batch would start dropping parts of the channel and draw
    // a dashed bolt. Spacing is widened instead, so the full bolt always draws.
    const totalSegmentLength = segments.reduce(
      (total, segment) =>
        total + Math.hypot(segment.endX - segment.startX, segment.endY - segment.startY),
      0,
    );
    const maxSamples =
      coarsePointer || quality.tier === 'constrained' ? 1800 : isFinale ? 5200 : 3000;
    const adaptiveStep = Math.max(1.9, totalSegmentLength / Math.max(1, maxSamples));

    const points = rasterizeSegments(segments, {
      // Spacing never exceeds a third of the core width, so the three additive
      // passes still overlap into one continuous channel.
      step: adaptiveStep,
      // CSS pixels; PointBatch applies the device pixel ratio once. The core is
      // deliberately narrow: a thick point sprite turns a strike into a white
      // tube. Width comes from the additive bloom passes instead.
      coreSize: Math.max(adaptiveStep * 2.4, (isFinale ? 8 : 3.6 + depth * 2.6) * effectScale),
      depth,
      near,
    });

    lightningStrikes.push({
      points,
      age: 0,
      life: isFinale ? 1.65 : randomBetween(planRandom, 0.62, 1.15),
      peakFlash: isFinale ? 1 : 0.5 + depth * 0.55,
      rootX: startX,
      rootY: startY,
      groundX: targetX,
      groundY: Math.min(height, targetY),
      near,
      isFinale,
      seed: planRandom() * 100,
    });
    emitCue(isFinale ? 'lightning-finale' : 'lightning');
  }

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
      branchAt,
      branched: false,
    };
  }

  function spawnBurst(x, y, spec) {
    if (fireworks.length > 6) return;
    const remaining = Math.max(0, maxLiveParticles - liveParticleCount());
    if (remaining <= 0) return;

    const scale = clamp(qualityScale * quality.particleScale, 0.45, 1.3);
    const particles = [];
    const kind = spec.kind;
    const palette =
      kind === 'silver' ? silverPalette : kind === 'gold' ? finalePalette : redPalette;
    const count = Math.min(remaining, Math.round(spec.count * scale * (coarsePointer ? 0.85 : 1)));
    if (count <= 0) return;

    const nearForParticle = (index) =>
      canUseNear() && (spec.foreground === true || (spec.nearRatio ?? 0) * count > index);

    if (kind === 'silver') {
      // Fine, intricate crackle: smaller grains, longer trails, faster twinkle
      // and two branching child sparks from most of the shell.
      const layers = [1, 0.88, 0.72, 0.54];
      const perLayer = Math.max(1, Math.round(count / layers.length));
      for (const layer of layers) {
        for (let index = 0; index < perLayer; index += 1) {
          const angle = planRandom() * Math.PI * 2;
          const speedScale = layer * (0.84 + Math.pow(planRandom(), 0.4) * 0.26);
          particles.push(
            createParticle({
              x,
              y,
              vx: Math.cos(angle) * spec.speed * speedScale,
              vy: Math.sin(angle) * spec.speed * speedScale,
              colour: palette[index % palette.length],
              size:
                randomBetween(planRandom, 2.3, 4.4) *
                (0.9 + (spec.sizeMultiplier ?? 1) * 0.2) *
                effectScale,
              life: randomBetween(planRandom, 2.2, 3.2),
              gravity: 48,
              drag: 0.989,
              trail: 16,
              kind,
              near: nearForParticle(index),
              branchAt: randomBetween(planRandom, 0.34, 0.58),
            }),
          );
        }
      }
    } else if (kind === 'willow') {
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2 + randomBetween(planRandom, -0.035, 0.035);
        const speed = spec.speed * randomBetween(planRandom, 0.58, 1);
        particles.push(
          createParticle({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            colour: palette[index % palette.length],
            size: randomBetween(planRandom, 3.2, 6.0) * effectScale,
            life: randomBetween(planRandom, 4.5, 5.3),
            gravity: 118,
            drag: 0.994,
            trail: 22,
            kind,
            near: canUseNear() && index % 3 !== 0,
          }),
        );
      }
    } else if (kind === 'gold') {
      // A full spherical chrysanthemum: four shells, soft warm cores and dense
      // long trails. This is the grand finale's body.
      const layers = [1, 0.9, 0.78, 0.62];
      const perLayer = Math.max(1, Math.round(count / layers.length));
      for (const layer of layers) {
        for (let index = 0; index < perLayer; index += 1) {
          const angle = planRandom() * Math.PI * 2;
          const speedScale = layer * (0.82 + Math.pow(planRandom(), 0.35) * 0.3);
          particles.push(
            createParticle({
              x,
              y,
              vx: Math.cos(angle) * spec.speed * speedScale,
              vy: Math.sin(angle) * spec.speed * speedScale,
              colour: palette[index % palette.length],
              size: randomBetween(planRandom, 5.4, 9.6) * effectScale,
              life: randomBetween(planRandom, 3.4, 4.4),
              gravity: 62,
              drag: 0.988,
              trail: 14,
              kind,
              near: canUseNear() && (index % 2 === 0 || index % 7 === 0),
            }),
          );
        }
      }
    } else {
      // Red identity: dense rounded peony shells with heavier grains, short
      // soft trails and a strong warm core. Deliberately unlike the silver.
      const layers = [1, 0.86, 0.68];
      const perLayer = Math.max(1, Math.round(count / layers.length));
      for (const layer of layers) {
        for (let index = 0; index < perLayer; index += 1) {
          const angle = planRandom() * Math.PI * 2;
          const speedScale = layer * (0.86 + Math.pow(planRandom(), 0.3) * 0.24);
          particles.push(
            createParticle({
              x,
              y,
              vx: Math.cos(angle) * spec.speed * speedScale,
              vy: Math.sin(angle) * spec.speed * speedScale,
              colour: palette[index % palette.length],
              size:
                randomBetween(planRandom, 5.0, 9.0) *
                (0.86 + (spec.sizeMultiplier ?? 1) * 0.2) *
                effectScale,
              life: randomBetween(planRandom, 2.5, 3.5),
              gravity: 76,
              drag: 0.976,
              trail: 9,
              kind,
              near: nearForParticle(index),
            }),
          );
        }
      }
    }

    if (particles.length === 0) return;
    fireworks.push({
      particles,
      bornAt: elapsed,
      x,
      y,
      light: spec.sizeMultiplier ?? 1,
      lightColor: palette[0],
      flash: kind === 'gold' ? 1.5 : 1,
      flashSize: Math.max(160, (spec.speed ?? 150) * (kind === 'gold' ? 1.9 : 1.35)),
    });
  }

  /**
   * Golden sparks dedicated to the foreground layer. They launch downward from
   * the finale centre and are long-lived enough to cross the meter, Little
   * Spark, the colour, the numbers, Share and the countdown before fading.
   */
  function spawnGoldenFall(x, y, count) {
    const remaining = Math.max(0, maxLiveParticles - liveParticleCount());
    const total = Math.min(remaining, Math.round(count * quality.particleScale * qualityScale));
    if (total <= 0) return;

    const particles = [];
    for (let index = 0; index < total; index += 1) {
      // Predominantly downward, with just enough lateral spread to rain across
      // the whole composition. Gravity then carries them over the interface.
      const angle = Math.PI / 2 + randomBetween(planRandom, -0.82, 0.82);
      const speed = randomBetween(planRandom, width * 0.022, width * 0.07);
      particles.push(
        createParticle({
          x: x + randomBetween(planRandom, -18, 18),
          y: y + randomBetween(planRandom, -10, 26),
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
        }),
      );
    }

    if (particles.length === 0) return;
    fireworks.push({
      particles,
      bornAt: elapsed,
      light: 1.4,
      lightColor: finalePalette[0],
    });
  }

  function launchFirework(spec, isFinale = false) {
    const originX = spec.originX;
    const targetY = spec.targetY;
    const speed = isFinale ? height * 0.72 : randomBetween(planRandom, 520, 700);

    rockets.push({
      x: originX,
      y: height + 8,
      targetX: spec.targetX,
      targetY,
      vy: -speed,
      vx: ((spec.targetX - originX) / Math.max(1, height + 8 - targetY)) * speed,
      spec,
      isFinale,
      near: canUseNear() && targetY > height * 0.46,
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

  // --- Event choreography -------------------------------------------------

  const meteorCount = Math.round(randomBetween(planRandom, 12, 16));
  const lightningCount = Math.round(randomBetween(planRandom, 5, 7));
  const fireworkCount = Math.round(randomBetween(planRandom, 6, 8));

  if (eventId === 'meteor') {
    for (let index = 0; index < meteorCount - 1; index += 1) {
      const fromRight = index % 2 === 1;
      plan.push({
        at:
          (index / Math.max(1, meteorCount - 1)) * durationMs * 0.58 +
          randomBetween(planRandom, 0, 380),
        type: 'meteor',
        fromRight,
        // Enter just outside the frame so every meteor actually crosses the
        // sky instead of falling unseen far beyond the edge.
        x: fromRight
          ? width * randomBetween(planRandom, 1.02, 1.2)
          : -width * randomBetween(planRandom, 0.02, 0.18),
        y: -height * randomBetween(planRandom, 0.02, 0.16),
      });
    }
  } else if (eventId === 'lightning') {
    hazeStrength = 0.5;
    for (let index = 0; index < lightningCount - 1; index += 1) {
      plan.push({
        at: 220 + (index / Math.max(1, lightningCount - 1)) * durationMs * 0.6,
        type: 'lightning',
        x: width * randomBetween(planRandom, 0.07, 0.93),
        // Guarantee both background and foreground strikes in every run.
        near: index % 2 === 1,
      });
    }
  } else if (eventId === 'fireworks') {
    for (let index = 0; index < fireworkCount - 1; index += 1) {
      const kind = index % 2 === 0 ? 'red' : 'silver';
      plan.push({
        // Leave the last third of the event to the finale, so the opening
        // red/white bursts have largely dissipated before the golden show.
        at: 180 + (index / Math.max(1, fireworkCount - 1)) * durationMs * 0.36,
        type: 'firework',
        spec: {
          originX: width * randomBetween(planRandom, 0.1, 0.9),
          targetX: width * randomBetween(planRandom, 0.14, 0.86),
          // Burst in the open sky above the meter rather than behind its disc.
          targetY: height * randomBetween(planRandom, 0.1, 0.29),
          kind,
          // Expansion speed of the burst itself (the rocket ascent is chosen in
          // launchFirework). These remain tight enough to read as dense shells.
          speed:
            randomBetween(planRandom, kind === 'silver' ? 200 : 155, kind === 'silver' ? 275 : 235) *
            (width < 768 ? 0.86 : 1),
          count:
            kind === 'silver'
              ? randomBetween(planRandom, 320, 420)
              : randomBetween(planRandom, 380, 480),
          sizeMultiplier: randomBetween(planRandom, 0.85, 1.35),
          nearRatio: kind === 'red' ? 0.18 : 0.22,
        },
      });
    }
  }

  function spawnFinale() {
    if (finaleSpawned) return;
    finaleSpawned = true;

    if (eventId === 'meteor') {
      spawnMeteor({ x: -width * 0.32, y: height * 0.14 }, true);
    } else if (eventId === 'lightning') {
      spawnLightning({ x: width * randomBetween(planRandom, 0.42, 0.58) }, true);
    } else if (eventId === 'fireworks') {
      const centerX = width * 0.5;
      // High enough that the full chrysanthemum reads around and above the
      // ring, while its golden rain still crosses the whole interface.
      const burstY = height * 0.18;
      const maxDimension = Math.max(width, height);

      // Large spherical chrysanthemum.
      spawnBurst(centerX, burstY, {
        kind: 'gold',
        speed: maxDimension * 0.27,
        count: 1400,
        sizeMultiplier: 2.8,
        foreground: false,
        nearRatio: 0.55,
      });
      // Inner bright core.
      spawnBurst(centerX, burstY, {
        kind: 'gold',
        speed: maxDimension * 0.15,
        count: 560,
        sizeMultiplier: 2.4,
        nearRatio: 0.6,
      });
      // Long graceful willow streamers.
      spawnBurst(centerX, burstY + height * 0.015, {
        kind: 'willow',
        speed: maxDimension * 0.19,
        count: 700,
        sizeMultiplier: 2.2,
      });
      // Dedicated foreground sparks that travel down across the interface.
      spawnGoldenFall(centerX, burstY, Math.round(quality.sparkBudget * 2));
      spawnEmbers(quality.tier === 'constrained' ? 14 : 28);
      emitCue('finale-boom');
      cueQueue.push({ at: elapsed + 140, cue: 'firework-willow' });
    }
  }

  // --- Rendering ----------------------------------------------------------

  function updateMeteors(deltaSeconds, globalAlpha) {
    for (let index = meteors.length - 1; index >= 0; index -= 1) {
      const meteor = meteors[index];
      meteor.x += meteor.vx * deltaSeconds;
      meteor.y += meteor.vy * deltaSeconds;

      if (meteor.y > height + 280 || meteor.x < -width * 0.7 || meteor.x > width * 1.7) {
        meteors.splice(index, 1);
        continue;
      }

      const speed = Math.hypot(meteor.vx, meteor.vy) || 1;
      const directionX = meteor.vx / speed;
      const directionY = meteor.vy / speed;
      const near = meteor.near;

      // Sample at roughly one third of the core diameter so successive sprites
      // overlap into a continuous streak of plasma instead of a line of beads.
      const step = Math.max(1.5, 2.0 * effectScale);
      const samples = Math.max(20, Math.min(meteor.samples, Math.ceil(meteor.length / step)));

      for (let sample = 0; sample < samples; sample += 1) {
        const progress = sample / (samples - 1);
        const trailX = meteor.x - directionX * meteor.length * progress;
        const trailY = meteor.y - directionY * meteor.length * progress;
        const trailAlpha = meteor.alpha * Math.pow(1 - progress, 1.5);
        const size = meteor.thickness * (1 - progress * 0.74) * (sample < 2 ? 2.1 : 1);
        pushPoint(
          trailX,
          trailY,
          Math.max(1.1, size),
          sample < 3 ? meteor.color : meteor.trailColor,
          trailAlpha * 1.15 * globalAlpha,
          near,
        );
        // Sheath of ionised light around the core: the plasma feel of a real
        // meteor rather than a hard line.
        pushPoint(
          trailX,
          trailY,
          Math.max(2.6, size * 3.4),
          meteor.trailColor,
          trailAlpha * 0.24 * globalAlpha,
          near,
        );
        if (sample % 3 === 0) {
          pushPoint(
            trailX,
            trailY,
            Math.max(5, size * 10),
            meteor.trailColor,
            trailAlpha * 0.06 * globalAlpha,
            near,
          );
        }
      }

      // Hot head, atmospheric halo and a small shock ring.
      pushPoint(
        meteor.x,
        meteor.y,
        meteor.thickness * 22,
        meteor.trailColor,
        meteor.alpha * 0.26 * globalAlpha,
        near,
      );
      pushPoint(
        meteor.x,
        meteor.y,
        meteor.thickness * 7,
        meteor.trailColor,
        meteor.alpha * 0.5 * globalAlpha,
        near,
      );
      pushPoint(
        meteor.x,
        meteor.y,
        meteor.thickness * 2.6,
        meteor.color,
        meteor.alpha * globalAlpha,
        near,
      );
    }
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
      // Sharp attack, irregular multi-flicker, quick decay, then a short
      // afterglow that keeps the scene lit like a real strike.
      const attack = Math.min(1, strike.age / 0.045);
      const decay = Math.pow(1 - lifeProgress, 0.42);
      const phase = strike.age * 74 + strike.seed;
      const flicker =
        lifeProgress < 0.5
          ? Math.sin(phase) > -0.4
            ? 1
            : 0.76
          : Math.sin(phase * 0.7) > 0.2
            ? 0.92
            : 0.62;
      const afterglow = lifeProgress > 0.72 ? 0.45 : 1;
      const intensity = attack * decay * flicker * afterglow;

      if (intensity * strike.peakFlash > strongestFlash) {
        strongestFlash = intensity * strike.peakFlash;
        flashPosition = [strike.rootX, Math.max(30, strike.rootY)];
      }

      // Cloud bloom at the origin and ground/sky illumination at the tip. Both
      // are wide, low-alpha light so they illuminate the atmosphere rather
      // than painting a disc over the artwork.
      pushPoint(
        strike.rootX,
        Math.max(24, strike.rootY + 20),
        (strike.isFinale ? 260 : 170) * effectScale,
        boltDepth,
        intensity * 0.16 * globalAlpha,
        strike.near,
      );
      pushPoint(
        strike.groundX,
        strike.groundY,
        (strike.isFinale ? 210 : 130) * effectScale,
        boltHalo,
        intensity * 0.14 * globalAlpha,
        strike.near,
      );

      for (const point of strike.points) {
        const pointSize = point.size * (1 + (1 - lifeProgress) * 0.14);
        pushPoint(
          point.x,
          point.y,
          pointSize,
          boltCore,
          point.alpha * intensity * 1.35 * globalAlpha,
          strike.near,
        );
        // Two additive bloom passes: a tight electric sheath and a wide
        // atmospheric halo. Together they read as light in the sky.
        pushPoint(
          point.x,
          point.y,
          pointSize * 2.6,
          boltHalo,
          point.alpha * intensity * 0.46 * globalAlpha,
          strike.near,
        );
        pushPoint(
          point.x,
          point.y,
          pointSize * 7.5,
          strike.isFinale ? boltHalo : boltDepth,
          point.alpha * intensity * 0.14 * globalAlpha,
          strike.near,
        );
      }
    }

    flash += (strongestFlash - flash) * Math.min(1, deltaSeconds * 26);
  }

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

      // The ignition flash is what makes a shell read as an explosion instead
      // of a cloud of dots: a short, broad bloom of the shell's own colour.
      if (firework.flash > 0) {
        firework.flash = Math.max(0, firework.flash - deltaSeconds * 2.2);
        pushPoint(
          firework.x,
          firework.y,
          firework.flashSize * (1.2 - firework.flash * 0.25),
          firework.lightColor,
          firework.flash * 0.5 * globalAlpha,
          false,
        );
        pushPoint(
          firework.x,
          firework.y,
          firework.flashSize * 0.42,
          firework.lightColor,
          Math.min(1, firework.flash * 1.4) * globalAlpha,
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

        // Silver crackle branches into short-lived child sparks mid-flight.
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
                // Children are terminal sparkles. A child must never branch
                // again, or the crackle chain reacts without end and consumes
                // the whole particle and point budget.
                branchAt: 2,
              }),
            );
            liveParticles += 1;
          }
        }

        const twinkle =
          particle.kind === 'silver'
            ? 0.55 + 0.45 * Math.sin(particle.twinkle + particle.age * 19)
            : particle.kind === 'gold'
              ? 0.6 + 0.4 * Math.sin(particle.twinkle + particle.age * 10)
              : 0.82 + 0.18 * Math.sin(particle.twinkle + particle.age * 7);
        // The golden show must stay legible for its whole fall; the red peony
        // fades faster so the finale always reads as the bigger moment.
        const fadeExponent =
          particle.kind === 'gold' ? 0.82 : particle.kind === 'willow' ? 0.92 : 1.28;
        const alpha = Math.pow(1 - lifeProgress, fadeExponent) * twinkle;

        for (let trailIndex = 0; trailIndex < particle.history.length; trailIndex += 1) {
          const point = particle.history[trailIndex];
          const trailProgress = trailIndex / Math.max(1, particle.history.length - 1);
          pushPoint(
            point.x,
            point.y,
            particle.size * (0.52 + trailProgress * 0.48),
            particle.colour,
            alpha * trailProgress * 0.72 * globalAlpha,
            particle.near,
          );
        }

        pushPoint(
          particle.x,
          particle.y,
          particle.size,
          particle.colour,
          alpha * globalAlpha,
          particle.near,
        );
        pushPoint(
          particle.x,
          particle.y,
          particle.size * 5.2,
          particle.colour,
          alpha * 0.2 * globalAlpha,
          particle.near,
        );
      }

      if (alive === 0) fireworks.splice(fireworkIndex, 1);
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
        Math.sin(lifeProgress * Math.PI) *
        (0.5 + 0.5 * Math.sin(ember.age * 7 + ember.phase));
      pushPoint(ember.x, ember.y, ember.size, ember.color, alpha * globalAlpha, ember.near);
      pushPoint(ember.x, ember.y, ember.size * 5, ember.color, alpha * 0.16 * globalAlpha, ember.near);
    }
  }

  function trackPerformance(deltaMs) {
    // Ignore the first moments after mount: loading and shader compilation are
    // not representative of the device's sustained frame rate.
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
      // Reduce future spawn counts and resolution, never the current draw:
      // dropping the newest points would erase the finale while older trails
      // survive. The point budgets still cap total allocation.
      resize();
      return;
    }

    // Two reductions were not enough. On a genuinely slow renderer, stop
    // compositing the optional foreground surface as well. Its points move to
    // the far surface, so the show continues without a second full-viewport
    // framebuffer and text stays readable.
    if (fps < 18 && qualitySteps >= 2 && nearSurface && !nearDead) {
      nearDead = true;
      nearSurface.clear();
      nearBatch?.reset();
    }
  }

  function frame(timestamp) {
    if (destroyed || contextLost) return;

    if (!lastFrame) lastFrame = timestamp;
    const deltaMs = Math.min(64, timestamp - lastFrame);
    lastFrame = timestamp;
    const deltaSeconds = deltaMs / 1000;
    elapsed += deltaMs;

    trackPerformance(deltaMs);

    // Spawn scheduled beats and any deferred cues.
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

    const finaleAt =
      durationMs -
      (eventId === 'meteor' ? 1900 : eventId === 'lightning' ? 2300 : 5600);
    if (!finaleSpawned && elapsed >= Math.max(0, finaleAt)) {
      spawnFinale();
    }

    // Fade in quickly, fade out cleanly before the stage unmounts. The near
    // layer gets its own, later fade so golden sparks are never cut abruptly.
    const fadeIn = clamp(elapsed / 340, 0, 1);
    const fadeOut = clamp((durationMs - elapsed) / 900, 0, 1);
    const nearFadeOut = clamp((durationMs - elapsed) / 700, 0, 1);
    const globalAlpha = fadeIn * fadeOut;
    const nearAlpha = fadeIn * nearFadeOut;

    flash *= Math.pow(0.02, deltaSeconds);
    flash = clamp(flash, 0, 1.2);

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

    // Update first so the lightning haze and light use this frame's flash.
    farBatch.reset();
    nearBatch?.reset();
    if (meteors.length > 0) updateMeteors(deltaSeconds, globalAlpha);
    if (lightningStrikes.length > 0) updateLightning(deltaSeconds, globalAlpha);
    if (rockets.length > 0 || fireworks.length > 0) {
      updateFireworks(deltaSeconds, globalAlpha);
    }
    if (embers.length > 0) updateEmbers(deltaSeconds, globalAlpha);

    hazeStrength = eventId === 'lightning' ? 0.26 * globalAlpha + flash * 0.55 : 0;
    if (hazeStrength > 0.001 && farSurface.hazeAvailable) {
      farSurface.drawHaze({
        time: elapsed / 1000,
        alpha: hazeStrength,
        flash,
        flashPosition,
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
        finaleSpawned,
        farDropped: farBatch.dropped,
        nearDropped: nearBatch ? nearBatch.dropped : 0,
        byKind: fireworks.reduce((totals, shell) => {
          for (const particle of shell.particles) {
            totals[particle.kind] = (totals[particle.kind] || 0) + 1;
          }
          return totals;
        }, {}),
        qualitySteps: qualitySteps,
        nearDead: nearDead,
        globalAlpha: globalAlpha,
        lost: farSurface.gl.isContextLost(),
        glError: farSurface.gl.getError(),
        firstPoints: Array.from(farBatch.positions.slice(0, 8)),
        firstColors: Array.from(farBatch.colors.slice(0, 8)),
        firstSizes: Array.from(farBatch.sizes.slice(0, 6)),
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
    // Let the last frame's particles fade with the canvas, then clear it so no
    // frame is left over the artwork after the event.
    if (!contextLost) {
      farSurface.clear();
      if (nearSurface && !nearDead) nearSurface.clear();
    }
    if (doneHandler) doneHandler();
  }

  function handleResize() {
    resize();
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  const stopVisibilityListener = onVisibilityChange((visible) => {
    // Resume with a fresh frame delta so a hidden tab never skips the finale.
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
      if (lostHandler) lostHandler();
    },
  });

  const stopNearContextWatcher =
    foregroundCanvas && nearSurface
      ? watchContextLoss(foregroundCanvas, {
          onLost: () => {
            // Losing only the near context must not end the event; its points
            // fall back to the far surface for the remainder of the sequence.
            nearDead = true;
            try {
              nearSurface.clear();
            } catch {
              // The context is already gone.
            }
          },
        })
      : () => {};

  if (!reducedMotion) {
    animationFrame = window.requestAnimationFrame(frame);
  } else {
    // The caller normally does not mount the stage under reduced motion; if it
    // does, complete immediately instead of animating.
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

    farSurface.dispose();
    if (nearSurface) nearSurface.dispose();
  }

  return { destroy, hasForeground: Boolean(nearSurface) };
}
