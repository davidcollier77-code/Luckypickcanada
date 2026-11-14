/**
 * Cosmic event stage for the Daily Resonance reveal.
 *
 * Three GPU-rendered set pieces share one additive WebGL particle pipeline:
 *   - Meteor Shower: 12–16 depth-sorted meteors with a dominant close finale.
 *   - Cosmic Lightning: branching strikes with procedural cloud haze and light.
 *   - Fireworks: red/white opening bursts and a layered golden finale.
 *
 * The canvas is transparent and only ever adds light, so the existing Milky Way
 * artwork underneath is never replaced, covered or dimmed.
 *
 * Design notes:
 *   - Positions are CSS pixels, converted to clip space in the vertex shader.
 *   - Particle point sizes are multiplied by the device pixel ratio because
 *     gl_PointSize is expressed in physical pixels.
 *   - Nothing here runs when WebGL is unavailable; the caller shows a static
 *     fallback and keeps its own completion timer.
 */

const POINT_VERTEX_SHADER = `
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

const POINT_FRAGMENT_SHADER = `
precision mediump float;
varying vec4 v_color;
uniform float u_alpha;

void main() {
  vec2 offset = gl_PointCoord - vec2(0.5);
  float dist = length(offset) * 2.0;
  if (dist > 1.0) discard;
  float halo = pow(1.0 - dist, 1.7);
  float core = pow(1.0 - dist, 5.0);
  vec3 color = v_color.rgb * (core * 1.7 + halo * 0.85);
  float alpha = (core + halo * 0.72) * v_color.a * u_alpha;
  gl_FragColor = vec4(color, alpha);
}
`;

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
  float flash = u_flash * exp(-flashDistance / (u_resolution.y * 0.42));

  vec3 cloudColor = mix(vec3(0.26, 0.33, 0.5), vec3(0.86, 0.9, 1.0), clamp(flash * 1.6, 0.0, 1.0));
  float alpha = density * u_alpha + flash * 0.34 * u_alpha;
  gl_FragColor = vec4(cloudColor * (0.55 + flash * 1.9), alpha);
}
`;

function hexToRgb(hex) {
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(random, min, max) {
  return min + random() * (max - min);
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Cosmic event shader failed to compile:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
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
    console.error('Cosmic event program failed to link:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** Growable interleaved-free point batch; avoids per-frame object churn. */
class PointBatch {
  constructor(capacity = 2048) {
    this.capacity = capacity;
    this.count = 0;
    this.positions = new Float32Array(capacity * 2);
    this.colors = new Float32Array(capacity * 4);
    this.sizes = new Float32Array(capacity);
  }

  reset() {
    this.count = 0;
  }

  ensure(extra) {
    const required = this.count + extra;
    if (required <= this.capacity) return;
    let nextCapacity = this.capacity;
    while (nextCapacity < required) nextCapacity *= 2;
    const positions = new Float32Array(nextCapacity * 2);
    const colors = new Float32Array(nextCapacity * 4);
    const sizes = new Float32Array(nextCapacity);
    positions.set(this.positions);
    colors.set(this.colors);
    sizes.set(this.sizes);
    this.positions = positions;
    this.colors = colors;
    this.sizes = sizes;
    this.capacity = nextCapacity;
  }

  /**
   * @param {number} x CSS pixel x
   * @param {number} y CSS pixel y
   * @param {number} size CSS pixel point diameter
   * @param {number[]} color Normalized RGB
   * @param {number} alpha 0–1
   * @param {number} scale Device pixel ratio
   * @param {number} maxPoint Largest supported gl_PointSize
   */
  push(x, y, size, color, alpha, scale, maxPoint) {
    if (alpha <= 0.003 || size <= 0) return;
    this.ensure(1);
    const index = this.count;
    this.positions[index * 2] = x;
    this.positions[index * 2 + 1] = y;
    this.colors[index * 4] = color[0];
    this.colors[index * 4 + 1] = color[1];
    this.colors[index * 4 + 2] = color[2];
    this.colors[index * 4 + 3] = clamp(alpha, 0, 1);
    this.sizes[index] = Math.min(size * scale, maxPoint);
    this.count += 1;
  }
}

function buildBranchSegments({ startX, startY, endX, endY, roughness, generation, maxGeneration, branchProbability, segments }) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy);

  if (generation >= maxGeneration || length < 9) {
    segments.push({ startX, startY, endX, endY, generation });
    return;
  }

  const normalX = -dy / (length || 1);
  const normalY = dx / (length || 1);
  const variance = (Math.random() - 0.5) * roughness;
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
  });

  if (Math.random() < branchProbability) {
    const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * randomBetween(Math.random, 0.35, 0.95);
    const branchLength = length * randomBetween(Math.random, 0.4, 0.85);
    buildBranchSegments({
      startX: midX,
      startY: midY,
      endX: midX + Math.cos(angle) * branchLength,
      endY: midY + Math.sin(angle) * branchLength,
      roughness: roughness * 0.72,
      generation: generation + 1,
      maxGeneration,
      branchProbability: branchProbability * 0.22,
      segments,
    });
  }
}

function rasterizeSegments(segments, { step, coreSize, coreColor, depth }) {
  const points = [];
  for (const segment of segments) {
    const branchDepth = depth * (1 - segment.generation * 0.075);
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    const length = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(length / step));
    const size = coreSize * (segment.generation === 0 ? 1 : 0.68) * (0.85 + branchDepth * 0.35);
    const alpha = (segment.generation === 0 ? 1 : 0.78) * (0.7 + branchDepth * 0.3);
    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      points.push({
        x: segment.startX + dx * progress,
        y: segment.startY + dy * progress,
        size,
        alpha,
        color: coreColor,
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
 *   eventId: 'meteor' | 'lightning' | 'fireworks',
 *   durationMs: number,
 *   onCue?: (cue: string) => void,
 *   onDone?: () => void,
 * }} options
 * @returns {{ destroy: () => void } | null} Null when WebGL cannot be created.
 */
export function createCosmicEventEngine({ canvas, eventId, durationMs, onCue, onDone }) {
  if (!canvas || typeof window === 'undefined') return null;

  const gl =
    canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    }) ||
    canvas.getContext('experimental-webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
    });

  if (!gl) return null;

  const pointProgram = createProgram(gl, POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);
  const hazeProgram = createProgram(gl, HAZE_VERTEX_SHADER, HAZE_FRAGMENT_SHADER);
  if (!pointProgram || !hazeProgram) {
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
  const hazeLocations = {
    uv: gl.getAttribLocation(hazeProgram, 'a_uv'),
    time: gl.getUniformLocation(hazeProgram, 'u_time'),
    alpha: gl.getUniformLocation(hazeProgram, 'u_alpha'),
    resolution: gl.getUniformLocation(hazeProgram, 'u_resolution'),
    flashPosition: gl.getUniformLocation(hazeProgram, 'u_flash_pos'),
    flash: gl.getUniformLocation(hazeProgram, 'u_flash'),
  };

  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const sizeBuffer = gl.createBuffer();
  const hazeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, hazeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const maxPointSize = (() => {
    try {
      const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
      return Array.isArray(range) && range.length > 1 ? range[1] : 128;
    } catch {
      return 128;
    }
  })();

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const isMobileViewport = window.innerWidth < 768;
  const isCompact = coarsePointer || isMobileViewport;

  let width = Math.max(1, window.innerWidth);
  let height = Math.max(1, window.innerHeight);
  let pixelRatio = Math.min(window.devicePixelRatio || 1, isCompact ? 1.35 : 1.75);

  const batch = new PointBatch(isCompact ? 2600 : 6200);
  // Opening bursts are strictly red and white; gold/amber is reserved for the finale.
  const redPalette = [hexToRgb('#ff3b45'), hexToRgb('#ffffff')];
  const finalePalette = [hexToRgb('#ffcf7a'), hexToRgb('#ffb020'), hexToRgb('#fff3c4'), hexToRgb('#ffd166')];
  const emberPalette = [hexToRgb('#ffb347'), hexToRgb('#ffd08a'), hexToRgb('#ff8a3d')];

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
  let cueHandler = typeof onCue === 'function' ? onCue : null;
  let doneHandler = typeof onDone === 'function' ? onDone : null;

  const planRandom = Math.random;
  const plan = [];
  let nextSpawnIndex = 0;
  let finaleSpawned = false;
  let flash = 0;
  let flashPosition = [width * 0.5, height * 0.2];
  let hazeStrength = 0;

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const previousWidth = canvas.width / pixelRatio || width;
    const previousHeight = canvas.height / pixelRatio || height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, isCompact ? 1.35 : 1.75);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    gl.viewport(0, 0, canvas.width, canvas.height);

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
    }
    for (const firework of fireworks) {
      for (const particle of firework.particles) {
        particle.x *= scaleX;
        particle.y *= scaleY;
        particle.history = particle.history.map((entry) => ({ x: entry.x * scaleX, y: entry.y * scaleY }));
      }
    }
    for (const rocket of rockets) {
      rocket.x *= scaleX;
      rocket.y *= scaleY;
      rocket.targetX *= scaleX;
      rocket.targetY *= scaleY;
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

  function spawnMeteor(spec, isFinale = false) {
    const depth = isFinale ? 1.25 : randomBetween(planRandom, 0.16, 0.92);
    const angle = spec.fromRight
      ? -randomBetween(planRandom, 0.34, 0.68)
      : randomBetween(planRandom, 0.34, 0.68);
    const speed = 170 + depth * 420;
    const x = spec.x;
    const y = spec.y;

    meteors.push({
      x,
      y,
      // The finale crosses the foreground horizontally instead of falling
      // straight down, which reads as a dominant close sweep.
      vx: isFinale ? width * 1.05 : Math.sin(angle) * speed,
      vy: isFinale ? height * 0.45 : Math.cos(angle) * speed,
      depth,
      length: isFinale ? Math.max(width, height) * 1.1 : 220 + depth * 480,
      thickness: isFinale ? 14 : 3 + depth * 5,
      color: isFinale ? hexToRgb('#fff1c4') : (depth > 0.6 ? hexToRgb('#ffffff') : hexToRgb('#a8dcff')),
      trailColor: depth > 0.6 ? hexToRgb('#ffd9a0') : hexToRgb('#5fa8ff'),
      alpha: isFinale ? 1 : 0.5 + depth * 0.5,
      // Dense samples keep the trail a continuous streak instead of dots.
      samples: isFinale ? 220 : 120 + Math.round(depth * 60),
      isFinale,
    });
    emitCue(isFinale ? 'meteor-finale' : 'meteor');
  }

  function spawnLightning(spec, isFinale = false) {
    const depth = isFinale ? 1.35 : randomBetween(planRandom, 0.35, 1);
    const scale = (isFinale ? 1.9 : 0.75 + depth * 0.75) * (width < 768 ? 0.8 : 1);
    const segments = [];
    const maxGeneration = isCompact ? 6 : isFinale ? 8 : 7;
    const startX = spec.x;
    const startY = -30;
    const targetX = startX + randomBetween(planRandom, -0.32, 0.32) * width * scale;
    const targetY = startY + height * (isFinale ? 1.05 : 0.55 + depth * 0.25) * scale;

    buildBranchSegments({
      startX,
      startY,
      endX: targetX,
      endY: targetY,
      roughness: (isMobileViewport ? 105 : 165) * scale,
      generation: 0,
      maxGeneration,
      branchProbability: isFinale ? 0.42 : 0.2 + depth * 0.12,
      segments,
    });

    // The finale's outer branches spread toward the viewer, reading as an
    // enormous close strike that reaches past the frame.
    if (isFinale) {
      for (let index = 0; index < 4; index += 1) {
        buildBranchSegments({
          startX,
          startY,
          endX: startX + randomBetween(planRandom, -0.7, 0.7) * width,
          endY: height * randomBetween(planRandom, 0.8, 1.25),
          roughness: 120,
          generation: 2,
          maxGeneration: 6,
          branchProbability: 0.3,
          segments,
        });
      }
    }

    const points = rasterizeSegments(segments, {
      step: isCompact ? 1.8 : 1.4,
      // CSS pixels; PointBatch applies the device pixel ratio once.
      coreSize: isFinale ? 12 : 4.2 + depth * 3,
      coreColor: hexToRgb('#dce7ff'),
      depth,
    });

    lightningStrikes.push({
      points,
      age: 0,
      life: isFinale ? 1.5 : randomBetween(planRandom, 0.55, 1.1),
      peakFlash: isFinale ? 1 : 0.35 + depth * 0.5,
      rootX: startX,
      rootY: -20,
      isFinale,
    });
    emitCue(isFinale ? 'lightning-finale' : 'lightning');
  }

  function spawnBurst(x, y, spec) {
    const particles = [];
    const palette = spec.palette;
    const sizeMultiplier = spec.sizeMultiplier;
    const count = Math.round(spec.count * (isCompact ? 0.58 : 1));

    const pushParticle = (angle, speed, color, options = {}) => {
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        life: options.life || randomBetween(planRandom, 1.6, 2.7),
        color,
        size: options.size || randomBetween(planRandom, 1.4, 2.6) * (0.8 + sizeMultiplier * 0.35),
        gravity: options.gravity ?? 95,
        drag: options.drag ?? 0.975,
        trail: options.trail || 5,
        history: [],
        twinkle: randomBetween(planRandom, 0, Math.PI * 2),
      });
    };

    if (spec.type === 'ring') {
      const ringCount = Math.round(count * 0.75);
      for (let index = 0; index < ringCount; index += 1) {
        const angle = (index / ringCount) * Math.PI * 2;
        pushParticle(angle, spec.speed * (0.94 + planRandom() * 0.12), palette[index % palette.length], {
          trail: 6,
          drag: 0.982,
        });
      }
      // Layered inner ring gives the burst visible depth.
      for (let index = 0; index < Math.round(count * 0.25); index += 1) {
        const angle = (index / Math.max(1, Math.round(count * 0.25))) * Math.PI * 2 + 0.2;
        pushParticle(angle, spec.speed * 0.55, palette[(index + 1) % palette.length], {
          trail: 4,
          drag: 0.978,
          size: randomBetween(planRandom, 1, 1.9) * (0.8 + sizeMultiplier * 0.3),
        });
      }
    } else if (spec.type === 'willow') {
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2 + randomBetween(planRandom, -0.04, 0.04);
        const speed = spec.speed * randomBetween(planRandom, 0.55, 1);
        pushParticle(angle, speed, palette[index % palette.length], {
          life: randomBetween(planRandom, 2.6, 4.1),
          gravity: 130,
          drag: 0.991,
          trail: 12,
          size: randomBetween(planRandom, 1.3, 2.4) * (0.7 + sizeMultiplier * 0.3),
        });
      }
    } else {
      // Peony / chrysanthemum: layered spherical shells with long trails.
      const layers = spec.type === 'chrysanthemum' ? [1, 0.78, 0.55] : [1, 0.72];
      const perLayer = Math.max(1, Math.round(count / layers.length));
      for (const layer of layers) {
        for (let index = 0; index < perLayer; index += 1) {
          const angle = planRandom() * Math.PI * 2;
          // Slight clustering toward the shell edge reads as a real break.
          const speedScale = layer * (0.82 + Math.pow(planRandom(), 0.35) * 0.3);
          pushParticle(angle, spec.speed * speedScale, palette[index % palette.length], {
            life: randomBetween(planRandom, 1.5, 2.9),
            gravity: 88,
            drag: 0.974,
            trail: spec.type === 'chrysanthemum' ? 8 : 5,
            size: randomBetween(planRandom, 1.4, 2.7) * (0.75 + sizeMultiplier * 0.35),
          });
        }
      }
    }

    fireworks.push({
      particles,
      bornAt: elapsed,
      light: spec.sizeMultiplier,
      lightColor: spec.palette[0],
    });
  }

  function launchFirework(spec, isFinale = false) {
    const originX = spec.originX;
    const targetY = spec.targetY;
    const speed = isFinale ? height * 0.72 : randomBetween(planRandom, 330, 520);

    rockets.push({
      x: originX,
      y: height + 8,
      targetX: spec.targetX,
      targetY,
      vy: -speed,
      vx: ((spec.targetX - originX) / Math.max(1, height + 8 - targetY)) * speed,
      spec,
      isFinale,
      history: [],
    });
    emitCue(isFinale ? 'firework-finale' : 'firework-launch');
  }

  function spawnEmbers(count) {
    for (let index = 0; index < count; index += 1) {
      embers.push({
        x: planRandom() * width,
        y: height * randomBetween(planRandom, 0.82, 1.04),
        vx: randomBetween(planRandom, -14, 14),
        vy: randomBetween(planRandom, -42, -14),
        age: 0,
        life: randomBetween(planRandom, 2.6, 5.2),
        size: randomBetween(planRandom, 1.8, 4.6),
        color: emberPalette[Math.floor(planRandom() * emberPalette.length)],
        phase: randomBetween(planRandom, 0, Math.PI * 2),
      });
    }
  }

  // --- Event choreography -------------------------------------------------

  const meteorCount = Math.round(randomBetween(planRandom, 12, 16));
  const lightningCount = Math.round(randomBetween(planRandom, 5, 7));
  const fireworkCount = Math.round(randomBetween(planRandom, 5, 7));

  if (eventId === 'meteor') {
    for (let index = 0; index < meteorCount - 1; index += 1) {
      const fromRight = index % 2 === 1;
      plan.push({
        at: (index / Math.max(1, meteorCount - 1)) * durationMs * 0.58 + randomBetween(planRandom, 0, 380),
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
    finaleSpawned = false;
  } else if (eventId === 'lightning') {
    hazeStrength = 0.5;
    for (let index = 0; index < lightningCount - 1; index += 1) {
      plan.push({
        at: 260 + (index / Math.max(1, lightningCount - 1)) * durationMs * 0.58,
        type: 'lightning',
        x: width * randomBetween(planRandom, 0.08, 0.92),
      });
    }
    finaleSpawned = false;
  } else if (eventId === 'fireworks') {
    for (let index = 0; index < fireworkCount - 1; index += 1) {
      plan.push({
        at: 220 + (index / Math.max(1, fireworkCount - 1)) * durationMs * 0.56,
        type: 'firework',
        spec: {
          originX: width * randomBetween(planRandom, 0.1, 0.9),
          targetX: width * randomBetween(planRandom, 0.12, 0.88),
          targetY: height * randomBetween(planRandom, 0.14, 0.4),
          type: index % 3 === 2 ? 'ring' : 'peony',
          speed: randomBetween(planRandom, 90, 150) * (width < 768 ? 0.8 : 1),
          count: randomBetween(planRandom, 120, 175),
          sizeMultiplier: randomBetween(planRandom, 0.72, 1.2),
          // Opening bursts are strictly red/white.
          palette: redPalette,
        },
      });
    }
    finaleSpawned = false;
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
      // The finale is a huge gold chrysanthemum plus willow streamers, with
      // warm foreground embers for the last seconds of the event.
      spawnBurst(centerX, height * 0.22, {
        type: 'chrysanthemum',
        speed: Math.max(width, height) * 0.17,
        count: 260,
        sizeMultiplier: 2.2,
        palette: finalePalette,
      });
      spawnBurst(centerX, height * 0.22, {
        type: 'willow',
        speed: Math.max(width, height) * 0.1,
        count: 180,
        sizeMultiplier: 2,
        palette: finalePalette,
      });
      spawnEmbers(isCompact ? 20 : 34);
      emitCue('firework-willow');
    }
  }

  // --- Rendering ----------------------------------------------------------

  function drawHaze(timeSeconds) {
    gl.useProgram(hazeProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, hazeBuffer);
    gl.enableVertexAttribArray(hazeLocations.uv);
    gl.vertexAttribPointer(hazeLocations.uv, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(hazeLocations.time, timeSeconds);
    gl.uniform1f(hazeLocations.alpha, hazeStrength);
    gl.uniform2f(hazeLocations.resolution, width, height);
    gl.uniform2f(hazeLocations.flashPosition, flashPosition[0], flashPosition[1]);
    gl.uniform1f(hazeLocations.flash, flash);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function drawBatch(globalAlpha) {
    if (batch.count === 0) return;
    gl.useProgram(pointProgram);
    gl.uniform2f(pointLocations.resolution, width, height);
    gl.uniform1f(pointLocations.alpha, globalAlpha);
    gl.uniform1f(pointLocations.maxPoint, maxPointSize);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, batch.positions.subarray(0, batch.count * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(pointLocations.position);
    gl.vertexAttribPointer(pointLocations.position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, batch.colors.subarray(0, batch.count * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(pointLocations.color);
    gl.vertexAttribPointer(pointLocations.color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, batch.sizes.subarray(0, batch.count), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(pointLocations.size);
    gl.vertexAttribPointer(pointLocations.size, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, batch.count);
  }

  function updateMeteors(deltaSeconds, globalAlpha) {
    for (let index = meteors.length - 1; index >= 0; index -= 1) {
      const meteor = meteors[index];
      meteor.x += meteor.vx * deltaSeconds;
      meteor.y += meteor.vy * deltaSeconds;

      if (meteor.y > height + 260 || meteor.x < -width * 0.6 || meteor.x > width * 1.6) {
        meteors.splice(index, 1);
        continue;
      }

      const speed = Math.hypot(meteor.vx, meteor.vy) || 1;
      const directionX = meteor.vx / speed;
      const directionY = meteor.vy / speed;

      for (let sample = 0; sample < meteor.samples; sample += 1) {
        const progress = sample / meteor.samples;
        const trailX = meteor.x - directionX * meteor.length * progress;
        const trailY = meteor.y - directionY * meteor.length * progress;
        const trailAlpha = meteor.alpha * (1 - progress * 0.82);
        const size = meteor.thickness * (1 - progress * 0.55) * (sample === 0 ? 2.2 : 1.15);
        batch.push(
          trailX,
          trailY,
          size,
          sample === 0 ? meteor.color : meteor.trailColor,
          trailAlpha * globalAlpha,
          pixelRatio,
          maxPointSize,
        );
        // Soft outer glow along the trail adds the atmospheric bloom of a
        // real meteor rather than a line of hard dots.
        batch.push(
          trailX,
          trailY,
          size * 2.6,
          meteor.trailColor,
          trailAlpha * 0.2 * globalAlpha,
          pixelRatio,
          maxPointSize,
        );
      }

      // Hot head and soft atmospheric bloom.
      batch.push(meteor.x, meteor.y, meteor.thickness * 8, meteor.trailColor, meteor.alpha * 0.3 * globalAlpha, pixelRatio, maxPointSize);
      batch.push(meteor.x, meteor.y, meteor.thickness * 2.4, meteor.color, meteor.alpha * globalAlpha, pixelRatio, maxPointSize);
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
      // Sharp attack, irregular flicker, quick decay.
      const attack = Math.min(1, strike.age / 0.05);
      const decay = Math.pow(1 - lifeProgress, 0.5);
      const flicker = lifeProgress < 0.55
        ? (Math.sin(strike.age * 74 + index) > -0.35 ? 1 : 0.78)
        : (Math.sin(strike.age * 53 + index) > 0.15 ? 0.95 : 0.72);
      const intensity = attack * decay * flicker;

      if (intensity > strongestFlash) {
        strongestFlash = intensity * strike.peakFlash;
        flashPosition = [strike.rootX, Math.max(30, strike.rootY)];
      }

      for (const point of strike.points) {
        const pointSize = point.size * (1 + (1 - lifeProgress) * 0.12);
        batch.push(
          point.x,
          point.y,
          pointSize,
          point.color,
          point.alpha * intensity * globalAlpha,
          pixelRatio,
          maxPointSize,
        );
        // Wide halo around the core makes the bolt read as light, not a line.
        batch.push(
          point.x,
          point.y,
          pointSize * 5,
          point.color,
          point.alpha * intensity * 0.32 * globalAlpha,
          pixelRatio,
          maxPointSize,
        );
      }
    }

    const targetFlash = strongestFlash;
    flash += (targetFlash - flash) * Math.min(1, deltaSeconds * 26);
  }

  function updateFireworks(deltaSeconds, globalAlpha) {
    // Rockets
    for (let index = rockets.length - 1; index >= 0; index -= 1) {
      const rocket = rockets[index];
      rocket.history.push({ x: rocket.x, y: rocket.y });
      if (rocket.history.length > 7) rocket.history.shift();
      rocket.x += rocket.vx * deltaSeconds;
      rocket.y += rocket.vy * deltaSeconds;

      for (let trailIndex = 0; trailIndex < rocket.history.length; trailIndex += 1) {
        const point = rocket.history[trailIndex];
        const progress = trailIndex / Math.max(1, rocket.history.length - 1);
        batch.push(
          point.x,
          point.y,
          (1.4 + progress * 1.8) * (rocket.isFinale ? 1.7 : 1),
          rocket.isFinale ? finalePalette[0] : redPalette[1],
          (0.25 + progress * 0.6) * globalAlpha,
          pixelRatio,
          maxPointSize,
        );
      }

      if (rocket.y <= rocket.targetY) {
        if (rocket.isFinale) {
          // The finale burst is spawned directly by spawnFinale().
        } else if (rocket.spec) {
          spawnBurst(rocket.x, rocket.y, rocket.spec);
          spawnBurst(rocket.x, rocket.y, {
            ...rocket.spec,
            type: 'ring',
            count: rocket.spec.count * 0.45,
            speed: rocket.spec.speed * 0.62,
            sizeMultiplier: rocket.spec.sizeMultiplier * 0.8,
          });
          emitCue('firework-burst');
        }
        rockets.splice(index, 1);
      }
    }

    // Burst particles with cascading trails.
    for (let fireworkIndex = fireworks.length - 1; fireworkIndex >= 0; fireworkIndex -= 1) {
      const firework = fireworks[fireworkIndex];
      const particles = firework.particles;
      let alive = 0;

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
        const alpha = Math.pow(1 - lifeProgress, 1.25) * (0.8 + 0.2 * Math.sin(particle.twinkle + particle.age * 9));

        for (let trailIndex = 0; trailIndex < particle.history.length; trailIndex += 1) {
          const point = particle.history[trailIndex];
          const trailProgress = trailIndex / Math.max(1, particle.history.length - 1);
          batch.push(
            point.x,
            point.y,
            particle.size * (0.55 + trailProgress * 0.45),
            particle.color,
            alpha * trailProgress * 0.75 * globalAlpha,
            pixelRatio,
            maxPointSize,
          );
        }

        batch.push(particle.x, particle.y, particle.size, particle.color, alpha * globalAlpha, pixelRatio, maxPointSize);
        batch.push(particle.x, particle.y, particle.size * 4.5, particle.color, alpha * 0.16 * globalAlpha, pixelRatio, maxPointSize);
      }

      if (alive === 0) {
        fireworks.splice(fireworkIndex, 1);
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
      const alpha = Math.sin(lifeProgress * Math.PI) * (0.55 + 0.45 * Math.sin(ember.age * 7 + ember.phase));
      batch.push(ember.x, ember.y, ember.size, ember.color, alpha * globalAlpha, pixelRatio, maxPointSize);
      batch.push(ember.x, ember.y, ember.size * 5, ember.color, alpha * 0.18 * globalAlpha, pixelRatio, maxPointSize);
    }
  }

  function frame(timestamp) {
    if (destroyed) return;

    if (!lastFrame) lastFrame = timestamp;
    const deltaMs = Math.min(64, timestamp - lastFrame);
    lastFrame = timestamp;
    const deltaSeconds = deltaMs / 1000;
    elapsed += deltaMs;

    // Spawn scheduled beats.
    while (nextSpawnIndex < plan.length && elapsed >= plan[nextSpawnIndex].at) {
      const beat = plan[nextSpawnIndex];
      if (beat.type === 'meteor') spawnMeteor(beat);
      else if (beat.type === 'lightning') spawnLightning(beat);
      else if (beat.type === 'firework') launchFirework(beat.spec);
      nextSpawnIndex += 1;
    }

    const finaleAt = durationMs - (eventId === 'meteor' ? 1900 : eventId === 'lightning' ? 2300 : 3600);
    if (!finaleSpawned && elapsed >= finaleAt) {
      spawnFinale();
    }

    // Fade in quickly, fade out cleanly before the stage unmounts.
    const fadeIn = clamp(elapsed / 380, 0, 1);
    const fadeOut = clamp((durationMs - elapsed) / 1100, 0, 1);
    const globalAlpha = fadeIn * fadeOut;

    flash *= Math.pow(0.02, deltaSeconds);
    flash = clamp(flash, 0, 1.2);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    // Update first so the lightning haze and light use this frame's flash.
    batch.reset();
    if (meteors.length > 0) updateMeteors(deltaSeconds, globalAlpha);
    if (lightningStrikes.length > 0) updateLightning(deltaSeconds, globalAlpha);
    if (rockets.length > 0 || fireworks.length > 0) updateFireworks(deltaSeconds, globalAlpha);
    if (embers.length > 0) updateEmbers(deltaSeconds, globalAlpha);

    hazeStrength = eventId === 'lightning' ? 0.42 * globalAlpha + flash * 0.22 : 0;
    if (hazeStrength > 0.001) {
      drawHaze(elapsed / 1000);
    }
    drawBatch(globalAlpha);

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
    // Clear the canvas so no frame is left over the artwork after the event.
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (doneHandler) doneHandler();
  }

  function handleVisibility() {
    // Resume with a fresh frame delta so a hidden tab never skips the finale.
    lastFrame = 0;
  }

  function handleResize() {
    resize();
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  document.addEventListener('visibilitychange', handleVisibility);

  if (!prefersReducedMotion) {
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
    document.removeEventListener('visibilitychange', handleVisibility);

    cueHandler = null;
    doneHandler = null;
    meteors.length = 0;
    lightningStrikes.length = 0;
    rockets.length = 0;
    fireworks.length = 0;
    embers.length = 0;

    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(colorBuffer);
    gl.deleteBuffer(sizeBuffer);
    gl.deleteBuffer(hazeBuffer);
    gl.deleteProgram(pointProgram);
    gl.deleteProgram(hazeProgram);

    // Free the backing surface promptly on mobile browsers.
    try {
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
    } catch {
      // Losing the context is an optimisation, never a requirement.
    }
  }

  return { destroy };
}
