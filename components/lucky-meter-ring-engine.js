/**
 * Circular meter energy trails.
 *
 * A deliberately small additive WebGL renderer: three slow comet trails and a
 * field of drifting gold dust orbit the gold ring. It shares the point shaders
 * with the cosmic event stage, caps its backing store through the shared
 * quality profile, draws a single static frame under reduced motion, pauses when
 * the document is hidden and always releases its GPU resources on teardown.
 *
 * The CSS ring underneath remains the readable structure; this layer only adds
 * light, so a browser without WebGL loses the trails and keeps the meter.
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

const GOLD = hexToRgb('#ffcf7a');
const WARM_WHITE = hexToRgb('#fff4d2');
const AMBER = hexToRgb('#ff9d3c');
const PALE_BLUE = hexToRgb('#bcd8ff');

const PHASE_PROFILES = {
  idle: { speed: 1, brightness: 0.82 },
  scrambling: { speed: 2.1, brightness: 1.2 },
  landed: { speed: 1.35, brightness: 1.42 },
};

function readSize(canvas) {
  const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
  const height = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
  const size = Math.min(width, height);
  return size > 0 ? size : 320;
}

export function createLuckyMeterRingEngine({ canvas }) {
  if (!canvas || typeof window === 'undefined') return null;

  const gl = getWebGLContext(canvas, {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
  });
  if (!gl) return null;

  let program = createProgram(gl, POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);
  if (!program) return null;

  const locations = {
    position: gl.getAttribLocation(program, 'a_position'),
    color: gl.getAttribLocation(program, 'a_color'),
    size: gl.getAttribLocation(program, 'a_size'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    alpha: gl.getUniformLocation(program, 'u_alpha'),
    maxPoint: gl.getUniformLocation(program, 'u_max_point'),
  };
  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const sizeBuffer = gl.createBuffer();
  const quality = getRenderQuality();
  const batch = new PointBatch(quality.tier === 'constrained' ? 420 : 900, 1400);
  const maxPointSize = readMaxPointSize(gl);
  const reducedMotion = prefersReducedMotion();

  let cssSize = readSize(canvas);
  let pixelRatio = Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio);
  let width = 1;
  let height = 1;
  let phase = 'idle';
  let intensity = PHASE_PROFILES.idle.brightness;
  let speedScale = PHASE_PROFILES.idle.speed;
  let targetIntensity = intensity;
  let targetSpeed = speedScale;
  let elapsed = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let destroyed = false;
  let contextLost = false;

  const dust = Array.from({ length: quality.tier === 'constrained' ? 18 : 40 }, () => ({
    radius: randomBetween(Math.random, 0.72, 0.94),
    angle: randomBetween(Math.random, 0, Math.PI * 2),
    speed: randomBetween(Math.random, 0.015, 0.06) * (Math.random() > 0.5 ? 1 : -1),
    size: randomBetween(Math.random, 1.1, 2.8),
    phase: randomBetween(Math.random, 0, Math.PI * 2),
    colour: Math.random() > 0.65 ? WARM_WHITE : GOLD,
  }));

  const trails = [
    { radius: 0.895, speed: 0.19, span: 1.15, colour: GOLD, width: 3.2, tilt: 0 },
    { radius: 0.855, speed: -0.14, span: 0.95, colour: WARM_WHITE, width: 2.8, tilt: 0.35 },
    { radius: 0.918, speed: 0.1, span: 0.8, colour: AMBER, width: 3.8, tilt: -0.28 },
  ];

  function resize() {
    cssSize = readSize(canvas);
    pixelRatio = Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio);
    width = Math.max(1, Math.round(cssSize));
    height = Math.max(1, Math.round(cssSize));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function push(x, y, size, colour, alpha) {
    batch.push(x, y, size, colour, alpha, pixelRatio, maxPointSize);
  }

  function draw(seconds) {
    if (contextLost) return;
    intensity += (targetIntensity - intensity) * 0.04;
    speedScale += (targetSpeed - speedScale) * 0.03;

    const centre = cssSize / 2;
    const baseRadius = cssSize / 2;

    batch.reset();

    // Orbiting dust: very slow, very quiet, gives the ring depth.
    for (const mote of dust) {
      const angle = mote.angle + seconds * mote.speed * speedScale;
      const radius = baseRadius * mote.radius;
      const x = centre + Math.cos(angle) * radius;
      const y = centre + Math.sin(angle) * radius * 0.98;
      const twinkle = 0.55 + 0.45 * Math.sin(seconds * 1.4 + mote.phase);
      push(x, y, mote.size, mote.colour, twinkle * 0.46 * intensity);
    }

    // Three smooth comet trails around the ring. Head first, fading tail.
    for (const trail of trails) {
      const headAngle = seconds * trail.speed * speedScale + trail.tilt;
      const samples = quality.tier === 'constrained' ? 64 : 120;
      for (let index = 0; index < samples; index += 1) {
        const progress = index / samples;
        const angle = headAngle - progress * trail.span;
        const radius = baseRadius * trail.radius;
        const x = centre + Math.cos(angle) * radius;
        const y = centre + Math.sin(angle) * radius;
        const fade = Math.pow(1 - progress, 1.7);
        push(
          x,
          y,
          trail.width * (1 - progress * 0.55) + 0.4,
          trail.colour,
          fade * 0.8 * intensity,
        );
      }

      const headX = centre + Math.cos(headAngle) * baseRadius * trail.radius;
      const headY = centre + Math.sin(headAngle) * baseRadius * trail.radius;
      push(headX, headY, trail.width * 8.5, trail.colour, 0.34 * intensity);
      push(headX, headY, trail.width * 2.2, WARM_WHITE, 1 * intensity);
    }

    // Two faint counter-orbits read as reflected light inside the band.
    for (let index = 0; index < 2; index += 1) {
      const direction = index === 0 ? 1 : -1;
      const angle = seconds * 0.07 * direction * speedScale + index * Math.PI;
      const radius = baseRadius * (index === 0 ? 0.84 : 0.925);
      const x = centre + Math.cos(angle) * radius;
      const y = centre + Math.sin(angle) * radius;
      push(x, y, 24, PALE_BLUE, 0.13 * intensity);
      push(x, y, 5.6, WARM_WHITE, 0.38 * intensity);
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (batch.count === 0) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(program);
    gl.uniform2f(locations.resolution, width, height);
    gl.uniform1f(locations.alpha, 1);
    gl.uniform1f(locations.maxPoint, maxPointSize);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, batch.positions.subarray(0, batch.count * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, batch.colors.subarray(0, batch.count * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(locations.color);
    gl.vertexAttribPointer(locations.color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, batch.sizes.subarray(0, batch.count), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(locations.size);
    gl.vertexAttribPointer(locations.size, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, batch.count);
  }

  function frame(timestamp) {
    if (destroyed || contextLost) return;
    if (!lastFrame) lastFrame = timestamp;
    const delta = Math.min(64, timestamp - lastFrame);
    lastFrame = timestamp;
    elapsed += delta;
    draw(elapsed / 1000);
    animationFrame = window.requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || contextLost || animationFrame) return;
    if (reducedMotion) {
      draw(0);
      return;
    }
    animationFrame = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
  }

  const handleResize = () => {
    resize();
    if (reducedMotion || !animationFrame) draw(elapsed / 1000);
  };

  let resizeObserver = null;
  if (typeof ResizeObserver === 'function') {
    try {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas.parentElement || canvas);
    } catch {
      resizeObserver = null;
    }
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  const stopVisibility = onVisibilityChange((visible) => {
    if (visible) {
      stop();
      start();
    } else {
      stop();
    }
  });

  const stopContextWatcher = watchContextLoss(canvas, {
    onLost: () => {
      contextLost = true;
      stop();
    },
    onRestored: () => {
      // A restored context needs fresh programs and buffers; the CSS ring keeps
      // the meter complete until the page is next loaded, so stop cleanly.
      contextLost = true;
      stop();
    },
  });

  resize();
  start();

  return {
    setPhase(nextPhase) {
      if (!PHASE_PROFILES[nextPhase] || nextPhase === phase) return;
      phase = nextPhase;
      targetIntensity = PHASE_PROFILES[phase].brightness;
      targetSpeed = PHASE_PROFILES[phase].speed;
      if (reducedMotion) draw(elapsed / 1000);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      stopVisibility();
      stopContextWatcher();
      resizeObserver?.disconnect?.();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(colorBuffer);
      gl.deleteBuffer(sizeBuffer);
      if (program) gl.deleteProgram(program);
      program = null;
      // Buffers and programs are released explicitly. The context itself is
      // left to the browser: forcing a loss here would poison the same canvas
      // when React re-runs the effect (Strict Mode or a fast remount).
    },
  };
}
