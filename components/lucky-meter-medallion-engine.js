/**
 * The Lucky Meter's medallion as a lit three-dimensional object.
 *
 * A small dedicated WebGL surface draws one procedurally built coin: an outer
 * wall, a milled rim, a flat top annulus, a chamfer, a recessed step, a raised
 * inner bezel and a domed enamel well. The shading is metallic — a tight
 * specular lobe, a broad satin lobe, a Fresnel term and a procedural sky
 * reflection — so the gold responds like a polished object rather than a
 * gradient.
 *
 * The medallion tilts a few degrees toward the pointer, which sweeps the rim
 * highlight across the bevel and gives the disc a visible front face and
 * thickness. On coarse pointers it drifts slowly instead, and under reduced
 * motion it draws one composed frame and stops.
 *
 * The centre text stays in the DOM above this canvas, so the percentage and tier
 * are always real, selectable, accessible text.
 */

import {
  getRenderQuality,
  getWebGLContext,
  onVisibilityChange,
  prefersReducedMotion,
  watchContextLoss,
} from '../app/lib/graphics-capabilities';
import { buildMedallionGeometry } from '../app/lib/gpu-geometry';
import {
  beginMeshFrame,
  createMeshBuffers,
  createMeshProgram,
  drawMesh,
} from '../app/lib/gpu-lighting';
import { getSceneLights } from '../app/lib/gpu-scene-light';
import {
  composeTrs,
  normalMatrixFromMat4,
  perspectiveMat4,
  translationMat4,
} from '../app/lib/gpu-math';

const CAMERA_DISTANCE = 3.1;
const FIELD_OF_VIEW = (33 * Math.PI) / 180;
/** Scale that makes the unit-radius coin fill the ring box without clipping. */
const MEDALLION_SCALE = 0.855;
const BASE_TILT_X = -0.135;

const PHASE_PROFILES = {
  idle: { exposure: 0.9, key: 0.95, sweep: 0.55 },
  scrambling: { exposure: 1.0, key: 1.2, sweep: 1.0 },
  landed: { exposure: 1.06, key: 1.32, sweep: 0.75 },
};

/**
 * Shared scene lights are published in screen pixels. This converts them into
 * the medallion's local space so an explosion to the upper left really does
 * light the upper-left bevel.
 */
function packSceneLights(bus, pixelWidth, pixelHeight) {
  const packed = LIGHT_STATE;
  const halfWidth = Math.max(1, pixelWidth / 2);
  const halfHeight = Math.max(1, pixelHeight / 2);
  const worldHalfHeight = Math.tan(FIELD_OF_VIEW / 2) * CAMERA_DISTANCE;
  const count = Math.min(4, bus.count);

  for (let index = 0; index < count; index += 1) {
    const normalisedX = (bus.x[index] - halfWidth) / halfWidth;
    const normalisedY = (bus.y[index] - halfHeight) / halfHeight;
    packed.positions[index * 3] = normalisedX * worldHalfHeight;
    packed.positions[index * 3 + 1] = -normalisedY * worldHalfHeight;
    // In front of the coin, so the light reaches the face rather than the back.
    packed.positions[index * 3 + 2] = 1.1;
    packed.intensities[index] = Math.min(1.5, bus.intensity[index] * 1.6);
    packed.colors[index * 3] = bus.red[index];
    packed.colors[index * 3 + 1] = bus.green[index];
    packed.colors[index * 3 + 2] = bus.blue[index];
  }
  packed.count = count;
  return packed;
}

// Reused each frame; never resized.
const LIGHT_STATE = {
  count: 0,
  positions: new Float32Array(12),
  intensities: new Float32Array(4),
  colors: new Float32Array(12),
};

/**
 * Creates and starts the medallion renderer.
 *
 * @param {{
 *   canvas: HTMLCanvasElement|null,
 *   interactive?: boolean,
 *   onReady?: () => void,
 *   onUnavailable?: () => void,
 * }} options
 * @returns {{ destroy: () => void, setPhase: (phase: string) => void } | null}
 */
export function createLuckyMeterMedallionEngine({
  canvas,
  interactive = true,
  onReady,
  onUnavailable,
}) {
  if (!canvas || typeof window === 'undefined') return null;

  const quality = getRenderQuality();
  const gl = getWebGLContext(canvas, {
    alpha: true,
    antialias: quality.tier !== 'constrained',
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
  });
  if (!gl) {
    onUnavailable?.();
    return null;
  }

  const meshProgram = createMeshProgram(gl);
  const geometry = meshProgram
    ? buildMedallionGeometry({ segments: quality.meshSegments ?? 160 })
    : null;
  const buffers = geometry ? createMeshBuffers(gl, geometry) : null;
  if (!meshProgram || !buffers) {
    if (meshProgram) gl.deleteProgram(meshProgram.program);
    onUnavailable?.();
    return null;
  }

  const reducedMotion = prefersReducedMotion();
  const maxPixelRatio =
    quality.tier === 'high' ? 2 : quality.tier === 'balanced' ? 1.5 : 1.25;

  let cssSize = 320;
  let pixelRatio = 1;
  let phase = 'idle';
  let exposure = PHASE_PROFILES.idle.exposure;
  let targetExposure = exposure;
  let keyBoost = PHASE_PROFILES.idle.key;
  let targetKey = keyBoost;
  let sweep = PHASE_PROFILES.idle.sweep;
  let targetSweep = sweep;

  // Pointer-driven tilt targets and the smoothed value actually drawn.
  let targetTiltX = BASE_TILT_X;
  let targetTiltY = 0;
  let tiltX = BASE_TILT_X;
  let tiltY = 0;

  let elapsed = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let destroyed = false;
  let contextLost = false;
  let announcedReady = false;

  const projection = perspectiveMat4(FIELD_OF_VIEW, 1, 0.1, 24);
  const view = translationMat4(0, 0, -CAMERA_DISTANCE);
  const model = new Float32Array(16);
  const normalMatrix = new Float32Array(9);
  const composed = new Float32Array(16);
  const camera = new Float32Array([0, 0, CAMERA_DISTANCE]);
  const keyDir = new Float32Array([-0.36, 0.86, 0.54]);
  const keyColor = new Float32Array([1.0, 0.95, 0.86]);
  const skyColor = new Float32Array([0.2, 0.27, 0.4]);
  const groundColor = new Float32Array([0.3, 0.18, 0.07]);
  const fogColor = new Float32Array([0.02, 0.03, 0.05]);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssSize = Math.max(48, Math.round(Math.min(rect.width || 320, rect.height || 320)));
    pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    canvas.width = Math.round(cssSize * pixelRatio);
    canvas.height = Math.round(cssSize * pixelRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function handlePointerMove(event) {
    if (!interactive || reducedMotion) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const normalisedX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const normalisedY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    targetTiltY = Math.max(-1, Math.min(1, normalisedX)) * 0.19 * sweep;
    targetTiltX = BASE_TILT_X + Math.max(-1, Math.min(1, normalisedY)) * 0.12 * sweep;
  }

  function handlePointerLeave() {
    targetTiltX = BASE_TILT_X;
    targetTiltY = 0;
  }

  function draw() {
    if (destroyed) return;

    exposure += (targetExposure - exposure) * 0.06;
    keyBoost += (targetKey - keyBoost) * 0.06;
    sweep += (targetSweep - sweep) * 0.05;

    // Smooth the tilt so the highlight travels instead of snapping.
    tiltX += (targetTiltX - tiltX) * 0.09;
    tiltY += (targetTiltY - tiltY) * 0.09;

    const idleDrift = reducedMotion ? 0 : Math.sin(elapsed / 5200) * 0.045 * sweep;

    composeTrs(
      {
        rotationX: tiltX,
        rotationY: tiltY + idleDrift,
        rotationZ: Math.cos(elapsed / 9000) * 0.012 * sweep,
        scale: MEDALLION_SCALE,
      },
      composed,
    );
    // The medallion is centred at the origin, so the model matrix is the
    // composition alone; copying avoids aliasing the multiply's output.
    model.set(composed);
    normalMatrixFromMat4(model, normalMatrix);

    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const lights = packSceneLights(getSceneLights(), canvas.width / pixelRatio, canvas.height / pixelRatio);

    beginMeshFrame(gl, meshProgram, {
      projection,
      view,
      camera,
      keyDir,
      keyColor: [keyColor[0] * keyBoost, keyColor[1] * keyBoost, keyColor[2] * keyBoost],
      skyColor,
      groundColor,
      fogColor,
      fogNear: 40,
      fogFar: 80,
      lights,
    });

    drawMesh(gl, meshProgram, buffers, {
      model,
      normalMatrix,
      metal: 1,
      exposure,
    });

    if (!announcedReady) {
      announcedReady = true;
      onReady?.();
    }
  }

  function frame(timestamp) {
    if (destroyed || contextLost) return;
    if (!lastFrame) lastFrame = timestamp;
    const delta = Math.min(64, timestamp - lastFrame);
    lastFrame = timestamp;
    elapsed += delta;
    draw();
    animationFrame = window.requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || contextLost || animationFrame) return;
    if (reducedMotion) {
      draw();
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
    if (reducedMotion || !animationFrame) draw();
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
  if (interactive) {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  }

  const stopVisibility = onVisibilityChange((visible) => {
    if (visible) {
      start();
    } else {
      stop();
    }
  });

  const stopContextWatcher = watchContextLoss(canvas, {
    onLost: () => {
      contextLost = true;
      stop();
      onUnavailable?.();
    },
  });

  resize();
  start();

  return {
    setPhase(nextPhase) {
      const profile = PHASE_PROFILES[nextPhase];
      if (!profile) return;
      phase = nextPhase;
      targetExposure = profile.exposure;
      targetKey = profile.key;
      targetSweep = profile.sweep;
      if (reducedMotion) draw();
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
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerleave', handlePointerLeave);
      }
      buffers.dispose();
      if (meshProgram) gl.deleteProgram(meshProgram.program);
      // The context itself is left to the browser: forcing a loss poisons the
      // same canvas when React re-runs the effect after a Strict Mode remount.
      onReady = null;
      onUnavailable = null;
    },
    get phase() {
      return phase;
    },
  };
}
