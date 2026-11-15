/**
 * Golden Canadian maple leaves as three-dimensional ornaments.
 *
 * One engine instance drives one layer. The page mounts a far layer behind the
 * interface and, on capable profiles only, a near layer above it, so leaves
 * genuinely pass in front of the medallion as well as behind it.
 *
 * Each leaf is the procedurally built, extruded and bevelled maple-leaf mesh from
 * `app/lib/gpu-geometry.js`, shaded by the shared metallic shader. Leaves differ
 * in depth: size, brightness and haze change with distance, which is what makes
 * them read as objects in the scene instead of stickers on the sky. They rotate
 * slowly, so they turn past edge-on and show their thickness and edge highlights.
 *
 * The layer is decorative: it is pointer-transparent, hidden from assistive
 * technology, and drawn at a capped backing-store ratio because these are soft
 * depth elements rather than crisp foreground detail.
 */

import {
  getRenderQuality,
  getWebGLContext,
  onVisibilityChange,
  prefersReducedMotion,
  watchContextLoss,
} from '../app/lib/graphics-capabilities';
import { buildMapleLeafGeometry } from '../app/lib/gpu-geometry';
import {
  beginMeshFrame,
  createMeshBuffers,
  createMeshProgram,
  drawMesh,
} from '../app/lib/gpu-lighting';
import { getSceneLights } from '../app/lib/gpu-scene-light';
import {
  composeTrs,
  identityMat4,
  normalMatrixFromMat4,
  orthographicMat4,
} from '../app/lib/gpu-math';

/** The outline is about 1.69 units tall, so sizes are authored in pixels tall. */
const OUTLINE_HEIGHT = 1.69;

const LAYER_PROFILES = {
  far: {
    leaves: { high: 9, balanced: 7, constrained: 5 },
    heightRange: [26, 54],
    depthRange: [0.34, 0.72],
    opacity: 0.92,
    fog: [0.035, 0.055, 0.105],
  },
      near: {
      leaves: { high: 5, balanced: 3, constrained: 0 },
      heightRange: [80, 148],
      depthRange: [1.15, 1.75],
      opacity: 1,
      fog: [0.02, 0.03, 0.06],
    },
};

/**
 * Builds the drifting leaf state for one layer. Positions are fractions of the
 * viewport so a resize keeps the composition.
 */
function createLeaves(count, layer, random) {
  const profile = LAYER_PROFILES[layer];
  const leaves = [];

  for (let index = 0; index < count; index += 1) {
    const depth =
      profile.depthRange[0] + random() * (profile.depthRange[1] - profile.depthRange[0]);
    // Spread across the frame, but the near layer is pushed toward the middle
    // band so it genuinely crosses the meter rather than hugging the edges.
    const baseX =
      layer === 'near' ? 0.16 + random() * 0.68 : 0.06 + random() * 0.88;
    const baseY =
      layer === 'near' ? 0.24 + random() * 0.5 : 0.08 + random() * 0.72;

    leaves.push({
      depth,
      baseX,
      baseY,
      height: profile.heightRange[0] + random() * (profile.heightRange[1] - profile.heightRange[0]),
      driftX: 14 + random() * 34,
      driftY: 10 + random() * 26,
      driftSpeed: 0.06 + random() * 0.1,
      spinY: (random() > 0.5 ? 1 : -1) * (0.16 + random() * 0.34),
      spinX: (random() > 0.5 ? 1 : -1) * (0.1 + random() * 0.22),
      spinZ: (random() > 0.5 ? 1 : -1) * (0.04 + random() * 0.1),
      phase: random() * Math.PI * 2,
      tilt: -0.35 + random() * 0.7,
    });
  }

  return leaves;
}

// Reused each frame; never resized.
const LIGHT_STATE = {
  count: 0,
  positions: new Float32Array(12),
  intensities: new Float32Array(4),
  colors: new Float32Array(12),
};

function packSceneLights(bus, width, height) {
  const packed = LIGHT_STATE;
  const count = Math.min(4, bus.count);
  for (let index = 0; index < count; index += 1) {
    packed.positions[index * 3] = bus.x[index] - width / 2;
    packed.positions[index * 3 + 1] = -(bus.y[index] - height / 2);
    // In front of the leaf plane so the light lands on the visible face.
    packed.positions[index * 3 + 2] = 260;
    packed.intensities[index] = Math.min(1.6, bus.intensity[index] * 2.1);
    packed.colors[index * 3] = bus.red[index];
    packed.colors[index * 3 + 1] = bus.green[index];
    packed.colors[index * 3 + 2] = bus.blue[index];
  }
  packed.count = count;
  return packed;
}

/**
 * Creates and starts one ornament layer.
 *
 * @param {{
 *   canvas: HTMLCanvasElement|null,
 *   layer?: 'far' | 'near',
 *   onReady?: () => void,
 *   onUnavailable?: () => void,
 * }} options
 * @returns {{ destroy: () => void, leafCount: number } | null}
 */
export function createLuckyMeterOrnamentEngine({
  canvas,
  layer = 'far',
  onReady,
  onUnavailable,
}) {
  if (!canvas || typeof window === 'undefined') return null;
  const profile = LAYER_PROFILES[layer] ?? LAYER_PROFILES.far;
  const quality = getRenderQuality();
  const requested = quality.ornament?.[layer] ?? profile.leaves[quality.tier] ?? 0;
  if (requested <= 0) return null;
  if (typeof window !== 'undefined' && window.__LUCKY_METER_DEBUG__ === true) {
    window.__luckyOrnamentBoot = window.__luckyOrnamentBoot || [];
    window.__luckyOrnamentBoot.push({ layer, requested });
  }

  const gl = getWebGLContext(canvas, {
    alpha: true,
    antialias: false,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
  });
  if (!gl) {
    onUnavailable?.();
    return null;
  }

  const meshProgram = createMeshProgram(gl);
  const geometry = buildMapleLeafGeometry({ thickness: 0.105, bevel: 0.05, dome: 0.028 });
  const buffers = meshProgram ? createMeshBuffers(gl, geometry) : null;
  if (!meshProgram || !buffers) {
    if (meshProgram) gl.deleteProgram(meshProgram.program);
    onUnavailable?.();
    return null;
  }

  const reducedMotion = prefersReducedMotion();
  // These are soft depth elements, so a modest backing store is enough and keeps
  // the fill cost of a second full-viewport surface small.
  const maxPixelRatio = quality.tier === 'constrained' ? 1 : 1.25;

  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let activeLeaves = createLeaves(requested, layer, Math.random);
  let elapsed = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let drawCount = 0;
  let destroyed = false;
  let contextLost = false;
  let announcedReady = false;

  // Frame governor: sustained low frame rate trims the leaf population before
  // anything else is dropped, because leaves are the least load-bearing element.
  let frameAccum = 0;
  let frameCount = 0;
  let qualitySteps = 0;

  const projection = new Float32Array(16);
  // Leaves are authored directly in this layer's screen-space world units, so
  // the view is the identity: the camera sits at the origin looking down -Z.
  const view = identityMat4(new Float32Array(16));
  const model = new Float32Array(16);
  const normalMatrix = new Float32Array(9);
  const camera = new Float32Array([0, 0, 900]);
  const keyDir = new Float32Array([-0.42, 0.8, 0.5]);
  const keyColor = new Float32Array([1.0, 0.96, 0.88]);
  const skyColor = new Float32Array([0.17, 0.23, 0.36]);
  const groundColor = new Float32Array([0.26, 0.15, 0.06]);
  const fogColor = new Float32Array(profile.fog);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width || window.innerWidth));
    height = Math.max(1, Math.round(rect.height || window.innerHeight));
    pixelRatio = Math.max(0.75, Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    orthographicMat4(-width / 2, width / 2, -height / 2, height / 2, -4000, 4000, projection);
  }

  function draw() {
    if (destroyed) return;

    const seconds = elapsed / 1000;
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    beginMeshFrame(gl, meshProgram, {
      projection,
      view,
      camera,
      keyDir,
      keyColor,
      skyColor,
      groundColor,
      fogColor,
      // No haze on this layer: the background is photographic, so mixing toward a
      // dark fog colour only dims the leaves into the sky. Depth is carried by
      // size, brightness and occlusion instead.
      fogNear: 6000,
      fogFar: 12000,
      lights: packSceneLights(getSceneLights(), width, height),
    });

    for (const leaf of activeLeaves) {
      const time = reducedMotion ? leaf.phase : seconds;
      const orbitX = Math.sin(time * leaf.driftSpeed + leaf.phase) * leaf.driftX;
      const orbitY = Math.cos(time * leaf.driftSpeed * 0.74 + leaf.phase) * leaf.driftY;
      const x = (leaf.baseX - 0.5) * width + orbitX;
      const y = (0.5 - leaf.baseY) * height + orbitY;

      const depthScale = 0.7 / Math.max(0.2, leaf.depth);
      const worldScale = (leaf.height / OUTLINE_HEIGHT) * depthScale;
      // Push far leaves away from the camera so haze separates them.
      const z = -leaf.depth * 1100;

      composeTrs(
        {
          x,
          y,
          z,
          rotationX: reducedMotion ? leaf.tilt : Math.sin(time * leaf.spinX + leaf.phase) * 0.85 + leaf.tilt,
          rotationY: reducedMotion ? leaf.phase : time * leaf.spinY + leaf.phase,
          rotationZ: reducedMotion ? 0 : Math.sin(time * leaf.spinZ + leaf.phase) * 0.22,
          scale: worldScale,
        },
        model,
      );
      normalMatrixFromMat4(model, normalMatrix);

      drawMesh(gl, meshProgram, buffers, {
        model,
        normalMatrix,
        metal: 1,
        exposure: profile.opacity,
      });
    }

    drawCount += 1;
    if (typeof window !== 'undefined' && window.__LUCKY_METER_DEBUG__ === true) {
      window.__luckyOrnaments = {
        layer,
        leaves: activeLeaves.length,
        draws: drawCount,
        width,
        height,
        pixelRatio,
      };
    }

    if (!announcedReady) {
      announcedReady = true;
      onReady?.();
    }
  }

  function trackPerformance(deltaMs) {
    if (elapsed < 1200 || qualitySteps >= 2) return;
    frameAccum += deltaMs;
    frameCount += 1;
    if (frameAccum < 1400) return;

    const fps = (frameCount * 1000) / frameAccum;
    frameAccum = 0;
    frameCount = 0;
    if (fps >= 44) return;

    qualitySteps += 1;
    const keep = qualitySteps === 1 ? 0.66 : 0.4;
    activeLeaves = activeLeaves.slice(0, Math.max(2, Math.round(activeLeaves.length * keep)));
  }

  // Leaves drift slowly, so the layer is drawn at half rate. That halves the
  // clear and metallic-fragment cost of a full-viewport surface with no visible
  // change to the motion, which is pure gain on every device.
  const drawInterval = 1000 / 30;
  let rateAccum = drawInterval;

  function frame(timestamp) {
    if (destroyed || contextLost) return;
    if (!lastFrame) lastFrame = timestamp;
    const delta = Math.min(64, timestamp - lastFrame);
    lastFrame = timestamp;
    elapsed += delta;
    rateAccum += delta;
    if (rateAccum >= drawInterval) {
      rateAccum = 0;
      trackPerformance(delta);
      draw();
    }
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
      resizeObserver.observe(canvas);
    } catch {
      resizeObserver = null;
    }
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

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
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      stopVisibility();
      stopContextWatcher();
      resizeObserver?.disconnect?.();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      activeLeaves = [];
      buffers.dispose();
      if (meshProgram) gl.deleteProgram(meshProgram.program);
      // The browser owns the context; forcing a loss would poison the canvas on
      // a Strict Mode remount.
      onReady = null;
      onUnavailable = null;
    },
    get leafCount() {
      return activeLeaves.length;
    },
  };
}
