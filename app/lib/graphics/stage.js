/**
 * Cinematic Three.js stage for premium 3D effects.
 *
 * This is additive infrastructure: no page imports it yet, so it adds no
 * effect, no initial bundle chunk and no visual change until a commissioned
 * feature opts in. It is the supported entry point for future cinematic,
 * realistic or gaming-quality visuals (PBR materials, lighting, depth, shadows,
 * instancing and post-processing).
 *
 * Contract, from `docs/graphics-rendering-architecture.md`:
 *   - The browser chooses the graphics backend. There is no user-agent, vendor
 *     or renderer-string branching, no forced `powerPreference` and no
 *     `failIfMajorPerformanceCaveat`.
 *   - Quality comes from the shared `resolveRenderQuality` tiers, never from an
 *     assumed device class, and the pixel ratio is capped by that tier.
 *   - Three.js is loaded with a dynamic import on first use, so a page that
 *     does not render 3D never downloads it.
 *   - Frames come from the shared adaptive frame loop, so a hidden tab stops
 *     work, reduced motion paints a static frame and constrained devices get a
 *     lower frame rate.
 *   - Context loss stops cleanly and a restored context resumes.
 *   - Every call returns `null` instead of throwing when the browser cannot
 *     render. A `null` stage means "keep the caller's existing fallback".
 */

import {
  getRenderQuality,
  onReducedMotionChange,
  prefersReducedMotion,
  supportsWebGL,
  watchContextLoss,
} from '../graphics-capabilities.js';
import { createAdaptiveFrameLoop } from '../adaptive-performance.js';
import { disposeSceneResources } from './resources.js';

/**
 * Per-tier 3D budget. These are deliberately conservative: a constrained tier
 * still renders, it just renders less (no shadows, no MSAA, lower buffer).
 */
const STAGE_BUDGETS = Object.freeze({
  high: Object.freeze({
    tier: 'high',
    maxPixelRatio: 2,
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    anisotropy: 8,
    maxLights: 4,
  }),
  balanced: Object.freeze({
    tier: 'balanced',
    maxPixelRatio: 1.6,
    antialias: true,
    shadows: false,
    shadowMapSize: 1024,
    anisotropy: 4,
    maxLights: 2,
  }),
  constrained: Object.freeze({
    tier: 'constrained',
    maxPixelRatio: 1.25,
    antialias: false,
    shadows: false,
    shadowMapSize: 0,
    anisotropy: 1,
    maxLights: 1,
  }),
});

const TONE_MAPPING = Object.freeze({
  aces: 'aces',
  none: 'none',
});

/**
 * Creates the frame clock the scene reads. Three.js deprecated `Clock` in r183
 * in favour of `Timer`, which also avoids a multi-second delta after the tab was
 * hidden. The clock fallback keeps a future downgrade working instead of
 * breaking every scene.
 *
 * @param {any} THREE
 */
function createTimeSource(THREE) {
  if (typeof THREE.Timer === 'function') {
    const timer = new THREE.Timer();
    try {
      if (typeof document !== 'undefined') timer.connect(document);
    } catch {
      // Page Visibility support is an optimisation, not a requirement.
    }
    return {
      sample() {
        timer.update();
        return { delta: timer.getDelta(), elapsed: timer.getElapsed() };
      },
      reset() {
        timer.reset();
      },
      dispose() {
        try {
          timer.disconnect();
        } catch {
          // The document may already be gone.
        }
        try {
          timer.dispose();
        } catch {
          // Nothing further to release.
        }
      },
    };
  }

  const clock = new THREE.Clock();
  return {
    sample() {
      return { delta: clock.getDelta(), elapsed: clock.elapsedTime };
    },
    reset() {
      clock.getDelta();
    },
    dispose() {},
  };
}

/**
 * Resolves the render budget a tier is allowed to spend. Unknown or missing
 * tiers resolve to `balanced`, the same safe default the capability layer uses,
 * so a caller can never accidentally request the most expensive path.
 *
 * @param {{ tier?: string, maxPixelRatio?: number }} [quality]
 * @returns {{ tier: 'high'|'balanced'|'constrained', maxPixelRatio: number, antialias: boolean, shadows: boolean, shadowMapSize: number, anisotropy: number, maxLights: number }}
 */
export function resolveStageBudget(quality) {
  const tier = quality?.tier;
  const profile =
    tier === 'high' || tier === 'constrained' ? STAGE_BUDGETS[tier] : STAGE_BUDGETS.balanced;
  const maxPixelRatio =
    Number.isFinite(quality?.maxPixelRatio) && quality.maxPixelRatio > 0
      ? quality.maxPixelRatio
      : profile.maxPixelRatio;

  return Object.freeze({ ...profile, maxPixelRatio });
}

/**
 * Measures the canvas in CSS pixels and clamps the device pixel ratio to the
 * resolved cap. CSS size and layout are never changed by the renderer.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} cap
 * @returns {{ width: number, height: number, pixelRatio: number }}
 */
function measureCanvas(canvas, cap) {
  const rect = typeof canvas.getBoundingClientRect === 'function' ? canvas.getBoundingClientRect() : null;
  const width = Math.max(1, Math.round(rect?.width || canvas.clientWidth || 1));
  const height = Math.max(1, Math.round(rect?.height || canvas.clientHeight || 1));
  const devicePixelRatio =
    typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;

  return {
    width,
    height,
    pixelRatio: Math.max(1, Math.min(devicePixelRatio, cap > 0 ? cap : 1)),
  };
}

/**
 * Creates a renderer, scene and perspective camera on a caller-owned canvas.
 *
 * The result is intentionally small: the caller owns the scene content, and a
 * feature that needs post-processing adds `createCinematicEffects`. Nothing is
 * drawn until `start()` or `render()` is called, so creating a stage behind a
 * closed dialog costs no frames.
 *
 * @param {{
 *   canvas?: HTMLCanvasElement,
 *   quality?: { tier?: string, maxPixelRatio?: number },
 *   fov?: number,
 *   near?: number,
 *   far?: number,
 *   cameraPosition?: { x?: number, y?: number, z?: number },
 *   shadows?: boolean,
 *   toneMapping?: 'aces'|'none',
 *   maxPixelRatio?: number,
 *   onFrame?: (frame: { three: any, renderer: any, scene: any, camera: any, delta: number, elapsed: number, quality: object, budget: object }) => void,
 *   onResize?: (size: { width: number, height: number, pixelRatio: number, camera: any, renderer: any }) => void,
 *   onContextLost?: () => void,
 *   onContextRestored?: () => void,
 *   onError?: (error: unknown) => void,
 *   onDispose?: () => void,
 * }} [options]
 * @returns {Promise<null | {
 *   three: any, renderer: any, scene: any, camera: any,
 *   quality: object, budget: object,
 *   readonly size: { width: number, height: number, pixelRatio: number },
 *   readonly running: boolean,
 *   start: () => void, stop: () => void, render: () => void,
 *   resize: () => void, dispose: () => void,
 * }>}
 */
export async function createThreeStage({
  canvas,
  quality,
  fov = 45,
  near = 0.1,
  far = 100,
  cameraPosition = {},
  shadows,
  toneMapping = TONE_MAPPING.aces,
  maxPixelRatio,
  onFrame,
  onResize,
  onContextLost,
  onContextRestored,
  onError,
  onDispose,
} = {}) {
  // Fail before touching the DOM or downloading Three.js.
  if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return null;
  if (!supportsWebGL()) return null;

  const resolvedQuality = quality ?? getRenderQuality();
  const budget = resolveStageBudget(resolvedQuality);
  const pixelRatioCap =
    Number.isFinite(maxPixelRatio) && maxPixelRatio > 0 ? maxPixelRatio : budget.maxPixelRatio;

  let THREE;
  try {
    THREE = await import('three');
  } catch {
    // A failed chunk load is a fallback, not a page error.
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  camera.position.set(
    Number.isFinite(cameraPosition.x) ? cameraPosition.x : 0,
    Number.isFinite(cameraPosition.y) ? cameraPosition.y : 0,
    Number.isFinite(cameraPosition.z) ? cameraPosition.z : 6,
  );

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: budget.antialias,
      depth: true,
      stencil: false,
    });
  } catch {
    return null;
  }

  const useShadows = typeof shadows === 'boolean' ? shadows : budget.shadows;
  const useACES = toneMapping !== TONE_MAPPING.none;

  try {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = useACES ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = useShadows;
    if (useShadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Transparent clear so the page's artwork stays visible behind the scene.
    renderer.setClearColor(0x000000, 0);
  } catch {
    try {
      renderer.dispose();
    } catch {
      // Nothing further to release.
    }
    return null;
  }

  const size = measureCanvas(canvas, pixelRatioCap);

  function applySize() {
    renderer.setPixelRatio(size.pixelRatio);
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  }

  applySize();

  const timeSource = createTimeSource(THREE);
  const loop = createAdaptiveFrameLoop();
  let wantsAnimation = false;
  let disposed = false;

  function draw() {
    if (disposed) return;
    const { delta, elapsed } = timeSource.sample();
    try {
      if (typeof onFrame === 'function') {
        onFrame({
          three: THREE,
          renderer,
          scene,
          camera,
          delta,
          elapsed,
          quality: resolvedQuality,
          budget,
        });
      } else {
        renderer.render(scene, camera);
      }
    } catch (error) {
      // One broken frame stops the scene instead of retrying it 60 times a
      // second; the caller decides whether to keep its fallback.
      stop();
      if (typeof onError === 'function') onError(error);
    }
  }

  function start() {
    if (disposed) return;
    wantsAnimation = true;
    if (prefersReducedMotion()) {
      // Reduced motion keeps the composed frame but never animates it.
      draw();
      return;
    }
    loop.request(draw);
  }

  function stop() {
    wantsAnimation = false;
    loop.cancel();
  }

  function handleResize() {
    if (disposed) return;
    const next = measureCanvas(canvas, pixelRatioCap);
    if (
      next.width === size.width &&
      next.height === size.height &&
      next.pixelRatio === size.pixelRatio
    ) {
      return;
    }
    size.width = next.width;
    size.height = next.height;
    size.pixelRatio = next.pixelRatio;
    applySize();
    if (typeof onResize === 'function') onResize({ ...size, camera, renderer });
    if (!loop.scheduled) draw();
  }

  let stopResize = () => {};
  if (typeof ResizeObserver === 'function') {
    try {
      const observer = new ResizeObserver(handleResize);
      observer.observe(canvas);
      stopResize = () => observer.disconnect();
    } catch {
      stopResize = () => {};
    }
  } else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('resize', handleResize);
    stopResize = () => window.removeEventListener('resize', handleResize);
  }

  const stopMotionWatch = onReducedMotionChange((reduced) => {
    if (disposed) return;
    if (reduced) {
      loop.cancel();
      if (wantsAnimation) draw();
      return;
    }
    if (wantsAnimation) loop.request(draw);
  });

  const stopContextWatch = watchContextLoss(canvas, {
    onLost: () => {
      loop.cancel();
      if (typeof onContextLost === 'function') onContextLost();
    },
    onRestored: () => {
      // The renderer restores its own WebGL state; the clock must not report a
      // multi-second frame delta after the gap.
      timeSource.reset();
      if (typeof onContextRestored === 'function') onContextRestored();
      if (wantsAnimation) loop.request(draw);
      else draw();
    },
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    wantsAnimation = false;
    loop.cancel();
    loop.dispose();
    stopResize();
    stopMotionWatch();
    stopContextWatch();
    timeSource.dispose();
    disposeSceneResources(scene);
    try {
      renderer.dispose();
    } catch {
      // The context may already be gone.
    }
    try {
      renderer.forceContextLoss?.();
    } catch {
      // Releasing the context is an optimisation, never a requirement.
    }
    if (typeof onDispose === 'function') onDispose();
  }

  return {
    three: THREE,
    renderer,
    scene,
    camera,
    quality: resolvedQuality,
    budget,
    get size() {
      return { ...size };
    },
    get running() {
      return loop.scheduled;
    },
    start,
    stop,
    render: draw,
    resize: handleResize,
    dispose,
  };
}
