/**
 * Shared graphics capability detection for every client-side renderer.
 *
 * The browser owns the graphics path. This module never selects a browser, a
 * renderer, a GPU vendor or a software rasterizer; it asks only what the current
 * browser can actually do and lets it decide how to do it.
 *
 * Design rules:
 *   - Probes are lazy and cached for the page lifetime. Importing this module
 *     allocates nothing and runs no graphics work.
 *   - No user-agent, platform or renderer-vendor branching.
 *   - No `failIfMajorPerformanceCaveat`, because that option rejects a browser's
 *     legitimate software fallback (for example SwiftShader on a GPU-less device).
 *   - No forced `powerPreference`; the browser and OS choose the power/GPU profile.
 *   - Safe getters return null instead of throwing, so a renderer can fall back.
 */

const STANDARD_TIER = 'standard';
const CONSTRAINED_TIER = 'constrained';

const PIXEL_RATIO_CAPS = Object.freeze({
  [STANDARD_TIER]: 2,
  [CONSTRAINED_TIER]: 1.5,
});

const PARTICLE_SCALES = Object.freeze({
  [STANDARD_TIER]: 1,
  [CONSTRAINED_TIER]: 0.7,
});

/** Render-quality tiers used by the cinematic Lucky Meter effects. */
export const RENDER_QUALITY = Object.freeze({
  HIGH: 'high',
  BALANCED: 'balanced',
  CONSTRAINED: 'constrained',
});

const RENDER_QUALITY_PROFILES = Object.freeze({
  high: Object.freeze({
    tier: 'high',
    maxPixelRatio: 2,
    particleScale: 1.2,
    foreground: true,
    haze: true,
    sparkBudget: 900,
  }),
  balanced: Object.freeze({
    tier: 'balanced',
    maxPixelRatio: 1.6,
    particleScale: 0.85,
    foreground: true,
    haze: true,
    sparkBudget: 560,
  }),
  constrained: Object.freeze({
    tier: 'constrained',
    maxPixelRatio: 1.25,
    particleScale: 0.55,
    foreground: false,
    haze: false,
    sparkBudget: 280,
  }),
});

// Only transparency/depth choices that match the existing renderers. The shared
// WebGL getter strips any caller-supplied renderer-forcing option.
const DEFAULT_WEBGL_ATTRIBUTES = Object.freeze({
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false,
});

let cachedProfile = null;
let canvas2DSupport;
let webGLSupport;
let path2DSupport;

function getNavigator() {
  return typeof navigator === 'undefined' ? null : navigator;
}

function getMediaQuery(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
}

function createProbeCanvas() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  } catch {
    return null;
  }
}

function releaseProbeContext(context) {
  try {
    const loseContext = context.getExtension?.('WEBGL_lose_context');
    loseContext?.loseContext?.();
  } catch {
    // Releasing a probe is an optimisation, never a requirement.
  }
}

/**
 * Classifies a device from coarse, optional browser hints. Missing hints mean
 * `standard`, so privacy-hardened browsers keep the normal experience.
 *
 * @param {{ saveData?: boolean, deviceMemory?: number|null, hardwareConcurrency?: number|null }} [hints]
 * @returns {'standard'|'constrained'}
 */
export function resolveGraphicsTier({
  saveData = false,
  deviceMemory = null,
  hardwareConcurrency = null,
} = {}) {
  if (saveData) return CONSTRAINED_TIER;
  if (typeof deviceMemory === 'number' && deviceMemory > 0 && deviceMemory <= 2) {
    return CONSTRAINED_TIER;
  }
  if (
    typeof hardwareConcurrency === 'number' &&
    hardwareConcurrency > 0 &&
    hardwareConcurrency <= 2
  ) {
    return CONSTRAINED_TIER;
  }
  return STANDARD_TIER;
}

/**
 * Returns the page-lifetime device profile. The values are deliberately coarse:
 * they only protect genuinely constrained devices and never identify a browser.
 *
 * @returns {{ tier: 'standard'|'constrained', maxPixelRatio: number, particleScale: number }}
 */
export function getGraphicsProfile() {
  if (cachedProfile) return cachedProfile;

  const navigatorObject = getNavigator();
  const connection =
    navigatorObject?.connection ??
    navigatorObject?.mozConnection ??
    navigatorObject?.webkitConnection ??
    null;
  const saveData = Boolean(connection?.saveData);
  const deviceMemory =
    typeof navigatorObject?.deviceMemory === 'number' ? navigatorObject.deviceMemory : null;
  const hardwareConcurrency =
    typeof navigatorObject?.hardwareConcurrency === 'number'
      ? navigatorObject.hardwareConcurrency
      : null;
  const tier = resolveGraphicsTier({ saveData, deviceMemory, hardwareConcurrency });

  cachedProfile = Object.freeze({
    tier,
    maxPixelRatio: PIXEL_RATIO_CAPS[tier],
    particleScale: PARTICLE_SCALES[tier],
  });
  return cachedProfile;
}

/**
 * Resolves the cinematic render quality from real device and viewport facts.
 *
 * The result is deliberately conservative about the expensive near/far layered
 * pass, but it never assumes a class of device is weak: a high-DPI phone with
 * many cores can still resolve to `high`, while a large 4K surface on modest
 * hardware resolves lower because its backing store, not its form factor, is
 * the cost.
 *
 * @param {{
 *   profileTier?: 'standard'|'constrained',
 *   saveData?: boolean,
 *   deviceMemory?: number|null,
 *   hardwareConcurrency?: number|null,
 *   viewportWidth?: number,
 *   viewportHeight?: number,
 *   pixelRatio?: number,
 *   coarsePointer?: boolean,
 * }} [options]
 * @returns {{ tier: 'high'|'balanced'|'constrained', maxPixelRatio: number, particleScale: number, foreground: boolean, haze: boolean, sparkBudget: number }}
 */
export function resolveRenderQuality({
  profileTier = STANDARD_TIER,
  saveData = false,
  deviceMemory = null,
  hardwareConcurrency = null,
  viewportWidth = 1280,
  viewportHeight = 800,
  pixelRatio = 1,
  coarsePointer = false,
} = {}) {
  const width = Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 1280;
  const height = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 800;
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  // Physical pixels actually rasterized, not the CSS footprint alone.
  const backingPixels = width * height * ratio * ratio;

  const constrained =
    profileTier === CONSTRAINED_TIER ||
    saveData ||
    (typeof deviceMemory === 'number' && deviceMemory > 0 && deviceMemory <= 2) ||
    (typeof hardwareConcurrency === 'number' &&
      hardwareConcurrency > 0 &&
      hardwareConcurrency <= 2);

  if (constrained) return RENDER_QUALITY_PROFILES.constrained;

  const plentifulCores =
    typeof hardwareConcurrency !== 'number' || hardwareConcurrency >= 6;
  const plentifulMemory =
    typeof deviceMemory !== 'number' || deviceMemory >= 6;
  const modestBackingStore = backingPixels <= 3_000_000;
  const touchHighDensity = coarsePointer && ratio >= 3;

  if (
    plentifulCores &&
    plentifulMemory &&
    modestBackingStore &&
    !touchHighDensity
  ) {
    return RENDER_QUALITY_PROFILES.high;
  }

  return RENDER_QUALITY_PROFILES.balanced;
}

/**
 * Reads the current browser facts and resolves the cinematic render quality.
 * Safe on the server: it falls back to the balanced profile.
 *
 * @returns {{ tier: 'high'|'balanced'|'constrained', maxPixelRatio: number, particleScale: number, foreground: boolean, haze: boolean, sparkBudget: number }}
 */
export function getRenderQuality() {
  if (typeof window === 'undefined') return RENDER_QUALITY_PROFILES.balanced;

  const navigatorObject = getNavigator();
  const connection =
    navigatorObject?.connection ??
    navigatorObject?.mozConnection ??
    navigatorObject?.webkitConnection ??
    null;
  const profile = getGraphicsProfile();
  const coarsePointer = getMediaQuery('(pointer: coarse)')?.matches ?? false;

  return resolveRenderQuality({
    profileTier: profile.tier,
    saveData: Boolean(connection?.saveData),
    deviceMemory:
      typeof navigatorObject?.deviceMemory === 'number' ? navigatorObject.deviceMemory : null,
    hardwareConcurrency:
      typeof navigatorObject?.hardwareConcurrency === 'number'
        ? navigatorObject.hardwareConcurrency
        : null,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    coarsePointer,
  });
}

/**
 * Returns the device pixel ratio clamped to the shared profile cap. Callers keep
 * their existing CSS sizing and coordinate space; only the backing store is
 * bounded.
 *
 * @param {number} [maxPixelRatio]
 * @returns {number}
 */
export function getCanvasPixelRatio(maxPixelRatio = getGraphicsProfile().maxPixelRatio) {
  const devicePixelRatio =
    typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio)
      ? window.devicePixelRatio
      : 1;
  const cap =
    Number.isFinite(maxPixelRatio) && maxPixelRatio > 0
      ? maxPixelRatio
      : getGraphicsProfile().maxPixelRatio;
  return Math.max(1, Math.min(devicePixelRatio, cap));
}

/** @returns {boolean} Whether the visitor prefers reduced motion. */
export function prefersReducedMotion() {
  return getMediaQuery('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * Subscribes to reduced-motion changes with the modern listener API and the
 * legacy Safari fallback. Returns an idempotent cleanup.
 *
 * @param {(matches: boolean) => void} listener
 * @returns {() => void}
 */
export function onReducedMotionChange(listener) {
  if (typeof listener !== 'function') return () => {};
  const mediaQuery = getMediaQuery('(prefers-reduced-motion: reduce)');
  if (!mediaQuery) return () => {};

  const handler = (event) => {
    listener(
      event && typeof event.matches === 'boolean' ? event.matches : mediaQuery.matches,
    );
  };

  try {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
      return () => {
        try {
          mediaQuery.removeEventListener('change', handler);
        } catch {
          // A detached media query needs no cleanup.
        }
      };
    }
    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handler);
      return () => {
        try {
          mediaQuery.removeListener?.(handler);
        } catch {
          // A detached media query needs no cleanup.
        }
      };
    }
  } catch {
    // Some embedded browsers expose a partial MediaQueryList; a missing
    // subscription only means the initial preference applies.
  }
  return () => {};
}

/** @returns {boolean} Whether the document is currently visible. */
export function isPageVisible() {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

/**
 * Subscribes to page visibility changes. Returns an idempotent cleanup.
 *
 * @param {(visible: boolean) => void} listener
 * @returns {() => void}
 */
export function onVisibilityChange(listener) {
  if (typeof document === 'undefined' || typeof listener !== 'function') return () => {};
  const handler = () => listener(isPageVisible());
  try {
    document.addEventListener('visibilitychange', handler);
  } catch {
    return () => {};
  }
  return () => {
    try {
      document.removeEventListener('visibilitychange', handler);
    } catch {
      // The document is already gone; nothing to clean up.
    }
  };
}

/**
 * Lazily checks whether the browser can create a usable 2D context. The result
 * is cached, and no canvas is allocated until this is called.
 *
 * @returns {boolean}
 */
export function supportsCanvas2D() {
  if (canvas2DSupport !== undefined) return canvas2DSupport;

  const canvas = createProbeCanvas();
  if (!canvas) {
    canvas2DSupport = false;
    return canvas2DSupport;
  }

  let context = null;
  try {
    context = canvas.getContext('2d');
  } catch {
    context = null;
  }

  canvas2DSupport = Boolean(
    context &&
      typeof context.fillRect === 'function' &&
      typeof context.createLinearGradient === 'function',
  );
  return canvas2DSupport;
}

/**
 * Lazily checks whether the browser can create a WebGL context. The probe context
 * is released immediately and the boolean is cached. Software rendering still
 * counts as supported because the browser chose it.
 *
 * @returns {boolean}
 */
export function supportsWebGL() {
  if (webGLSupport !== undefined) return webGLSupport;

  const canvas = createProbeCanvas();
  if (!canvas) {
    webGLSupport = false;
    return webGLSupport;
  }

  let context = null;
  try {
    context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch {
    context = null;
  }

  webGLSupport = Boolean(context);
  if (context) releaseProbeContext(context);
  return webGLSupport;
}

/** @returns {boolean} Whether the browser exposes the Path2D constructor. */
export function supportsPath2D() {
  if (path2DSupport !== undefined) return path2DSupport;
  path2DSupport = typeof Path2D === 'function';
  return path2DSupport;
}

/**
 * Creates a 2D context without throwing. Returns null when the browser cannot
 * provide one, so the caller can keep its existing static fallback.
 *
 * @param {HTMLCanvasElement|null|undefined} canvas
 * @param {CanvasRenderingContext2DSettings} [options]
 * @returns {CanvasRenderingContext2D|null}
 */
export function getCanvas2DContext(canvas, options) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  try {
    return (options === undefined ? canvas.getContext('2d') : canvas.getContext('2d', options)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Creates a WebGL context without forcing a renderer. Tries the standard name
 * first and the legacy name second. Returns null when neither is available.
 *
 * @param {HTMLCanvasElement|null|undefined} canvas
 * @param {WebGLContextAttributes} [options]
 * @returns {WebGLRenderingContext|null}
 */
export function getWebGLContext(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;

  const attributes = { ...DEFAULT_WEBGL_ATTRIBUTES, ...options };
  // These two options would let a caller force or reject a rendering path. The
  // browser must remain free to choose, so the shared getter never forwards them.
  delete attributes.failIfMajorPerformanceCaveat;
  delete attributes.powerPreference;

  try {
    return (
      canvas.getContext('webgl', attributes) ||
      canvas.getContext('experimental-webgl', attributes) ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Observes canvas context loss and restoration without throwing on browsers that
 * do not support the events.
 *
 * WebGL loss is cancelled so the browser may restore the context. The 2D
 * `contextlost` event is observed only: cancelling it prevents restoration, and
 * it is not available in every browser.
 *
 * @param {HTMLCanvasElement|null|undefined} canvas
 * @param {{ onLost?: (event: Event) => void, onRestored?: (event: Event) => void }} [handlers]
 * @returns {() => void} Cleanup.
 */
export function watchContextLoss(canvas, { onLost, onRestored } = {}) {
  if (!canvas || typeof canvas.addEventListener !== 'function') return () => {};

  let lost = false;

  const handleLost = (event) => {
    if (lost) return;
    lost = true;
    if (event?.type === 'webglcontextlost' && typeof event.preventDefault === 'function') {
      // Required for the browser to be allowed to restore a WebGL context.
      event.preventDefault();
    }
    if (typeof onLost === 'function') onLost(event);
  };

  const handleRestored = (event) => {
    lost = false;
    if (typeof onRestored === 'function') onRestored(event);
  };

  const listeners = [
    ['webglcontextlost', handleLost],
    ['webglcontextrestored', handleRestored],
    ['contextlost', handleLost],
    ['contextrestored', handleRestored],
  ];

  try {
    for (const [name, handler] of listeners) {
      canvas.addEventListener(name, handler, false);
    }
  } catch {
    return () => {};
  }

  return () => {
    for (const [name, handler] of listeners) {
      try {
        canvas.removeEventListener(name, handler, false);
      } catch {
        // The canvas is already detached; nothing to clean up.
      }
    }
  };
}
