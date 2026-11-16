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
 * them read as objects in the scene instead of stickers on the sky. They turn
 * within a limited arc, so they catch the light and show their bevelled edge
 * without ever collapsing into an edge-on sliver.
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
  AUTUMN_LEAF_COLOURS,
  pickLeafColour,
  sampleLeafTravel,
  sampleWindField,
} from '../app/lib/lucky-meter/leaf-wind';
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
    heightRange: [28, 58],
    depthRange: [0.34, 0.72],
    opacity: 0.98,
    fog: [0.035, 0.055, 0.105],
  },
  near: {
    leaves: { high: 5, balanced: 3, constrained: 0 },
    heightRange: [82, 132],
    depthRange: [1.15, 1.75],
    opacity: 1,
    fog: [0.02, 0.03, 0.06],
  },
};

/**
 * The copy column the near layer must stay out of, as viewport fractions.
 *
 * The near layer is the only one drawn in front of the interface, so it is the
 * only one that can actually hide a headline. The far layer sits behind the
 * copy and reads as background, so it keeps its full spread.
 */
// The lane covers the reading as well as the headline: the medallion, the
// Lucky Numbers plate, the supporting panels and the Share and countdown block
// all sit inside it, so a foreground leaf frames the reading instead of
// crossing its text or controls.
const COPY_LANE = { halfWidth: 0.24, top: 0.26, bottom: 0.93 };

/**
 * Picks a near-layer base position outside the copy lane.
 *
 * The lane is padded by the leaf's own footprint plus the drift range, so the
 * whole path avoids the text rather than just the spawn point. When the viewport
 * is too narrow for the side margins to clear the lane the surviving bands are
 * the ones above and below the copy, which is also where the meter sits.
 */
export function nearBaseSpot(random, leafHeight, viewport) {
  const vw = Math.max(1, viewport.width);
  const vh = Math.max(1, viewport.height);
  const padX = (leafHeight * 0.5 + 48) / vw;
  const padY = (leafHeight * 0.5 + 36) / vh;
  const leftEdge = 0.06;
  const rightEdge = 0.94;
  const topEdge = 0.04;
  const bottomEdge = 0.9;
  const innerLeft = 0.5 - COPY_LANE.halfWidth - padX;
  const innerRight = 0.5 + COPY_LANE.halfWidth + padX;
  const bands = [];

  if (innerLeft - leftEdge > 0.06) bands.push([leftEdge, innerLeft, topEdge, bottomEdge]);
  if (rightEdge - innerRight > 0.06) bands.push([innerRight, rightEdge, topEdge, bottomEdge]);
  if (COPY_LANE.top - padY - topEdge > 0.05) {
    bands.push([leftEdge, rightEdge, topEdge, COPY_LANE.top - padY]);
  }
  if (bottomEdge - (COPY_LANE.bottom + padY) > 0.05) {
    bands.push([leftEdge, rightEdge, COPY_LANE.bottom + padY, bottomEdge]);
  }
  if (bands.length === 0) {
    // If a viewport is too short for a full band, keep the leaf above the
    // reading lane and vary its position rather than stacking every leaf on it.
    return {
      x: leftEdge + random() * (rightEdge - leftEdge),
      y: Math.min(topEdge, COPY_LANE.top - padY - 0.02),
    };
  }

  const band = bands[Math.floor(random() * bands.length) % bands.length];
  return {
    x: band[0] + random() * (band[1] - band[0]),
    y: band[2] + random() * (band[3] - band[2]),
  };
}

/**
 * Builds the drifting leaf state for one layer. Positions are fractions of the
 * viewport so a resize keeps the composition.
 */
function createLeaves(count, layer, random, viewport = { width: 1440, height: 900 }) {
  const profile = LAYER_PROFILES[layer];
  const leaves = [];

  for (let index = 0; index < count; index += 1) {
    const depth =
      profile.depthRange[0] + random() * (profile.depthRange[1] - profile.depthRange[0]);
    const height =
      profile.heightRange[0] + random() * (profile.heightRange[1] - profile.heightRange[0]);
    // The far layer spreads across the whole frame because it sits behind the
    // copy; the near layer is placed around the copy instead of over it.
    const spot =
      layer === 'near'
        ? nearBaseSpot(random, height, viewport)
        : { x: 0.06 + random() * 0.88, y: 0.08 + random() * 0.72 };
    const baseX = spot.x;
    const baseY = spot.y;

    leaves.push({
      depth,
      baseX,
      baseY,
      height,
      // Autumn pigment is chosen per leaf and deliberately takes no tier or
      // event input, so the colour variation never tracks the daily reading.
      colour: pickLeafColour(random),
      driftX: 14 + random() * 34,
      driftY: 10 + random() * 26,
      driftSpeed: 0.06 + random() * 0.1,
      spinY: (random() > 0.5 ? 1 : -1) * (0.16 + random() * 0.34),
      spinX: (random() > 0.5 ? 1 : -1) * (0.1 + random() * 0.22),
      spinZ: (random() > 0.5 ? 1 : -1) * (0.04 + random() * 0.1),
      phase: random() * Math.PI * 2,
      tilt: -0.35 + random() * 0.7,
      // Wind-carried travel for the far layer: a slow crossing that wraps and
      // gives every leaf a real path through the scene instead of an orbit.
      travelOffset: random(),
      travelSpeed: 0.008 + random() * 0.009,
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

  // Rebuildable, because a lost WebGL context invalidates every program and
  // buffer while the same canvas and context object come back on restore.
  let meshProgram = null;
  let geometry = null;
  let buffers = null;

  function buildResources() {
    // A little more thickness than a real leaf so an edge-on ornament reads as a
    // solid gold sliver with a lit edge instead of a one-pixel needle.
    // Thinner, sharper bevel and a deeper dome: the edge catches a crisp
    // highlight and the face carries a soft curve instead of a flat card.
    // A neutral albedo lets each leaf's autumn tint define its pigment.
    geometry = buildMapleLeafGeometry({
      thickness: 0.125,
      bevel: 0.05,
      dome: 0.058,
      albedo: [1, 1, 1],
    });
    meshProgram = createMeshProgram(gl);
    buffers = meshProgram ? createMeshBuffers(gl, geometry) : null;
    if (!meshProgram || !buffers) {
      if (meshProgram) gl.deleteProgram(meshProgram.program);
      meshProgram = null;
      buffers = null;
      return false;
    }
    return true;
  }

  if (!buildResources()) {
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
  const canvasRect = canvas.getBoundingClientRect();
  let activeLeaves = createLeaves(requested, layer, Math.random, {
    width: canvasRect.width || window.innerWidth,
    height: canvasRect.height || window.innerHeight,
  });
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
    // One shared wind field: every leaf is carried by the same gust, which is
    // what makes the motion read as weather rather than independent spin.
    const wind = sampleWindField(seconds);
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
      // Far leaves cross the frame with the wind and wrap; near leaves sway
      // inside their safe band so they can never drift over the copy.
      const travelX =
        layer === 'far' && !reducedMotion
          ? sampleLeafTravel(leaf, seconds, wind).x
          : leaf.baseX;
      const orbitX = reducedMotion
        ? 0
        : Math.sin(time * leaf.driftSpeed + leaf.phase) * leaf.driftX * 0.55;
      const orbitY = reducedMotion
        ? 0
        : Math.cos(time * leaf.driftSpeed * 0.74 + leaf.phase) * leaf.driftY * 0.6;
      // The gust pushes and lifts every leaf together, with depth-scaled force.
      const gustX = reducedMotion ? 0 : wind.gust * leaf.driftX * 0.7;
      const gustY = reducedMotion ? 0 : wind.lift * leaf.driftY * 0.5;
      const x = (travelX - 0.5) * width + orbitX + gustX;
      const y = (0.5 - leaf.baseY) * height + orbitY + gustY;

      const depthScale = 0.7 / Math.max(0.2, leaf.depth);
      const worldScale = (leaf.height / OUTLINE_HEIGHT) * depthScale;
      // Push far leaves away from the camera so haze separates them.
      const z = -leaf.depth * 1100;

      composeTrs(
        {
          x,
          y,
          z,
          // Yaw oscillates inside roughly +/-35 degrees instead of spinning a
          // full turn. A flat ornament seen exactly edge-on is a sliver, and with
          // a dozen leaves a third of them were edge-on at any moment; keeping
          // them near face-on means the gold always reads as a maple leaf while
          // still turning enough to catch the light.
          rotationX: reducedMotion
            ? leaf.tilt
            : Math.sin(time * leaf.spinX + leaf.phase) * 0.45 + leaf.tilt + wind.lift * 0.16,
          rotationY: reducedMotion
            ? leaf.tilt
            : Math.sin(time * leaf.spinY + leaf.phase) * 0.62 + wind.gust * 0.2,
          rotationZ: reducedMotion
            ? 0
            : Math.sin(time * leaf.spinZ + leaf.phase) * 0.2 + wind.cross * 0.12,
          scale: worldScale,
        },
        model,
      );
      normalMatrixFromMat4(model, normalMatrix);

      drawMesh(gl, meshProgram, buffers, {
        model,
        normalMatrix,
        // Gold stays metallic; the reds, russet and burgundy read as pigment.
        metal: leaf.colour.metal,
        exposure: profile.opacity,
        albedoTint: leaf.colour.albedo,
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
        palette: AUTUMN_LEAF_COLOURS.length,
        colours: activeLeaves.map((leaf) => leaf.colour.id),
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
    onRestored: () => {
      if (destroyed) return;
      contextLost = false;
      // The loss invalidated the program and the buffers; recreate them before
      // the next draw, then carry on with the same leaf composition.
      if (!buildResources()) {
        onUnavailable?.();
        return;
      }
      announcedReady = false;
      lastFrame = 0;
      resize();
      start();
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
      buffers?.dispose();
      if (meshProgram) gl.deleteProgram(meshProgram.program);
      buffers = null;
      meshProgram = null;
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
