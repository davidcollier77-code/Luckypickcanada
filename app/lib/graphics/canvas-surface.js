/**
 * A managed Canvas 2D surface for creative experiences.
 *
 * The site already has several hand-written Canvas 2D renderers. This is the
 * reusable version for new work and for experiences that want the same
 * guarantees without re-implementing them: a tier-capped backing store, frames
 * from the shared adaptive loop, one static frame under reduced motion, resize
 * re-composition, context-loss handling and deterministic teardown.
 *
 * It never owns artwork. The caller draws through `onFrame`; this module only
 * owns the lifecycle around that callback.
 */

import {
  getCanvas2DContext,
  getCanvasPixelRatio,
  getRenderQuality,
  onReducedMotionChange,
  prefersReducedMotion,
  watchContextLoss,
} from '../graphics-capabilities.js';
import { createAdaptiveFrameLoop } from '../adaptive-performance.js';

/**
 * Measures the canvas in CSS pixels. The CSS size is never changed here.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {{ width: number, height: number }}
 */
function measure(canvas) {
  const rect = typeof canvas.getBoundingClientRect === 'function' ? canvas.getBoundingClientRect() : null;
  return {
    width: Math.max(1, Math.round(rect?.width || canvas.clientWidth || 1)),
    height: Math.max(1, Math.round(rect?.height || canvas.clientHeight || 1)),
  };
}

/**
 * Creates a managed 2D drawing surface.
 *
 * @param {{
 *   canvas?: HTMLCanvasElement,
 *   quality?: { tier?: string, maxPixelRatio?: number },
 *   alpha?: boolean,
 *   onFrame?: (frame: { context: CanvasRenderingContext2D, size: { width: number, height: number }, delta: number, elapsed: number }) => void,
 *   onResize?: (size: { width: number, height: number, pixelRatio: number }) => void,
 *   onContextLost?: () => void,
 *   onContextRestored?: () => void,
 *   onError?: (error: unknown) => void,
 * }} [options]
 * @returns {null | {
 *   kind: 'canvas2d',
 *   context: CanvasRenderingContext2D,
 *   readonly size: { width: number, height: number, pixelRatio: number },
 *   readonly running: boolean,
 *   start: () => void,
 *   stop: () => void,
 *   render: () => void,
 *   resize: () => void,
 *   dispose: () => void,
 * }}
 */
export function createCanvas2DSurface({
  canvas,
  quality,
  alpha = true,
  onFrame,
  onResize,
  onContextLost,
  onContextRestored,
  onError,
} = {}) {
  if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return null;

  const context = getCanvas2DContext(canvas, { alpha });
  if (!context) return null;

  const resolvedQuality = quality ?? getRenderQuality();
  const pixelRatio = getCanvasPixelRatio(resolvedQuality?.maxPixelRatio);
  const measured = measure(canvas);
  const size = { width: measured.width, height: measured.height, pixelRatio };

  const loop = createAdaptiveFrameLoop();
  let disposed = false;
  let wantsAnimation = false;
  let elapsed = 0;
  let lastFrameAt = 0;

  function applySize() {
    canvas.width = Math.max(1, Math.round(size.width * size.pixelRatio));
    canvas.height = Math.max(1, Math.round(size.height * size.pixelRatio));
    // Draw in CSS pixels; the backing store keeps the tier's resolution.
    context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
  }

  function draw() {
    if (disposed) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const delta = lastFrameAt ? Math.max(0, now - lastFrameAt) : 0;
    lastFrameAt = now;
    elapsed += delta;
    try {
      if (typeof onFrame === 'function') onFrame({ context, size: { ...size }, delta, elapsed });
    } catch (error) {
      stop();
      if (typeof onError === 'function') onError(error);
    }
  }

  function start() {
    if (disposed) return;
    wantsAnimation = true;
    if (prefersReducedMotion()) {
      // Reduced motion keeps one composed frame and never animates it.
      draw();
      return;
    }
    loop.request(draw);
  }

  function stop() {
    wantsAnimation = false;
    loop.cancel();
  }

  function resize() {
    if (disposed) return;
    const next = measure(canvas);
    if (next.width === size.width && next.height === size.height) return;
    size.width = next.width;
    size.height = next.height;
    applySize();
    if (typeof onResize === 'function') onResize({ ...size });
    if (!loop.scheduled) draw();
  }

  applySize();

  let stopResize = () => {};
  if (typeof ResizeObserver === 'function') {
    try {
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      stopResize = () => observer.disconnect();
    } catch {
      stopResize = () => {};
    }
  } else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('resize', resize);
    stopResize = () => window.removeEventListener('resize', resize);
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
      // A restored 2D context has lost its transform and paint state.
      applySize();
      lastFrameAt = 0;
      if (typeof onContextRestored === 'function') onContextRestored();
      if (wantsAnimation) loop.request(draw);
      else draw();
    },
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    loop.cancel();
    loop.dispose();
    stopResize();
    stopMotionWatch();
    stopContextWatch();
  }

  return {
    kind: 'canvas2d',
    context,
    get size() {
      return { ...size };
    },
    get running() {
      return loop.scheduled;
    },
    start,
    stop,
    render: draw,
    resize,
    dispose,
  };
}
