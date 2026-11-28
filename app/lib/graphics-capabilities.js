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

// Capability describes the device, not the current surface. A device can be
// highly capable while a large backing store still makes a render budget
// conservative; the two facts are reported separately.
export const CAPABILITY_TIER = Object.freeze({
  CONSTRAINED: 'constrained',
  BALANCED: 'balanced',
  HIGH: 'high',
});

export const CAPABILITY_CONFIDENCE = Object.freeze({
  HIGH: 'high',
  PARTIAL: 'partial',
  NONE: 'none',
});

export const DISPLAY_DEMAND = Object.freeze({
  LIGHT: 'light',
  MODERATE: 'moderate',
  HEAVY: 'heavy',
  EXTREME: 'extreme',
});

// Backing-store bands are about raster work, never about a device class. The
// 3 MP gate below is intentionally retained for now; removing it is deferred
// to the adaptive-rendering work because it changes visuals and GPU work.
export const DISPLAY_DEMAND_BANDS = Object.freeze({
  light: 1_500_000,
  moderate: 3_000_000,
  heavy: 6_000_000,
});

export const RENDER_GATES = Object.freeze({
  backingStorePixels: 3_000_000,
  coarsePointerPixelRatio: 3,
});

const CAPABILITY_LOW_VALUE = 2;
const CAPABILITY_PLENTIFUL_VALUE = 6;

const RENDER_QUALITY_PROFILES = Object.freeze({
  high: Object.freeze({
    tier: 'high',
    maxPixelRatio: 2,
    particleScale: 1.2,
    foreground: true,
    haze: true,
    sparkBudget: 900,
    // Radial segment count for the medallion lathe. Higher is a smoother rim.
    meshSegments: 192,
    // Golden maple-leaf ornaments per layer. The near layer is the expensive
    // one because those leaves are large, so it is dropped first.
    ornament: Object.freeze({ far: 9, near: 5 }),
  }),
  balanced: Object.freeze({
    tier: 'balanced',
    maxPixelRatio: 1.6,
    particleScale: 0.85,
    foreground: true,
    haze: true,
    sparkBudget: 560,
    meshSegments: 160,
    ornament: Object.freeze({ far: 7, near: 3 }),
  }),
  constrained: Object.freeze({
    tier: 'constrained',
    maxPixelRatio: 1.25,
    particleScale: 0.55,
    foreground: false,
    haze: false,
    sparkBudget: 280,
    meshSegments: 128,
    ornament: Object.freeze({ far: 5, near: 0 }),
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
let cachedDeviceAssessment = null;
let cachedGraphicsFeatures = null;
let cachedWebGLFeatures = null;
let canvas2DSupport;
let path2DSupport;

function getNavigator() {
  return typeof navigator === 'undefined' ? null : navigator;
}

function getWindow() {
  return typeof window === 'undefined' ? null : window;
}

function getMediaQuery(query, windowObject = getWindow()) {
  if (!windowObject || typeof windowObject.matchMedia !== 'function') return null;
  try {
    return windowObject.matchMedia(query);
  } catch {
    return null;
  }
}

function normalizePositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function readSaveData(navigatorObject = getNavigator()) {
  const connection =
    navigatorObject?.connection ??
    navigatorObject?.mozConnection ??
    navigatorObject?.webkitConnection ??
    null;
  return connection?.saveData === true;
}

function readCoarsePointer(windowObject = getWindow()) {
  return getMediaQuery('(pointer: coarse)', windowObject)?.matches === true;
}

/**
 * Reads the coarse hardware hints once. Invalid, zero and absent values stay
 * `null`; no user-agent, platform or renderer string is involved.
 *
 * @param {{ navigatorObject?: Navigator|null }} [sources]
 * @returns {{ memoryGb: number|null, cores: number|null }}
 */
export function readDeviceSignals({ navigatorObject = getNavigator() } = {}) {
  return {
    memoryGb: normalizePositiveNumber(navigatorObject?.deviceMemory),
    cores: normalizePositiveNumber(navigatorObject?.hardwareConcurrency),
  };
}

/**
 * Classifies a device from its coarse hardware hints. Missing signals are never
 * evidence of weakness: with no hints the device is `balanced`, not
 * `constrained`, and one plentiful known hint is enough for `high`.
 *
 * @param {{ memoryGb?: number|null, cores?: number|null }} [signals]
 * @returns {{
 *   capabilityTier: 'constrained'|'balanced'|'high',
 *   confidence: 'high'|'partial'|'none',
 *   unknownSignals: string[],
 *   memoryGb: number|null,
 *   cores: number|null,
 *   reasons: string[],
 * }}
 */
export function assessDeviceCapabilities({ memoryGb = null, cores = null } = {}) {
  const memory = normalizePositiveNumber(memoryGb);
  const coreCount = normalizePositiveNumber(cores);
  const unknownSignals = [];
  if (memory === null) unknownSignals.push('memory');
  if (coreCount === null) unknownSignals.push('cores');

  const lowMemory = memory !== null && memory <= CAPABILITY_LOW_VALUE;
  const lowCores = coreCount !== null && coreCount <= CAPABILITY_LOW_VALUE;
  const knownCount = (memory === null ? 0 : 1) + (coreCount === null ? 0 : 1);

  let capabilityTier = CAPABILITY_TIER.BALANCED;
  if (lowMemory || lowCores) {
    capabilityTier = CAPABILITY_TIER.CONSTRAINED;
  } else if (knownCount > 0) {
    const memoryPlentiful = memory === null || memory >= CAPABILITY_PLENTIFUL_VALUE;
    const coresPlentiful = coreCount === null || coreCount >= CAPABILITY_PLENTIFUL_VALUE;
    if (memoryPlentiful && coresPlentiful) capabilityTier = CAPABILITY_TIER.HIGH;
  }

  const confidence =
    knownCount === 2
      ? CAPABILITY_CONFIDENCE.HIGH
      : knownCount === 1
        ? CAPABILITY_CONFIDENCE.PARTIAL
        : CAPABILITY_CONFIDENCE.NONE;

  const reasons = [];
  if (lowMemory) reasons.push('low-memory');
  if (lowCores) reasons.push('low-cores');
  if (knownCount < 2) reasons.push('missing-signals');
  if (capabilityTier === CAPABILITY_TIER.HIGH) reasons.push('capable-device');
  else if (!lowMemory && !lowCores) reasons.push('moderate-capability');

  return Object.freeze({
    capabilityTier,
    confidence,
    unknownSignals: Object.freeze(unknownSignals),
    memoryGb: memory,
    cores: coreCount,
    reasons: Object.freeze(reasons),
  });
}

/**
 * Returns the cached device assessment shared by every capability consumer.
 * The adaptive plan explicitly refreshes it when it reassesses, so a privacy
 * setting or a browser that changes its coarse hint can still recover. Injected
 * sources are for deterministic tests and bypass the cache.
 *
 * @param {{ navigatorObject?: Navigator|null }} [sources]
 * @returns {ReturnType<typeof assessDeviceCapabilities>}
 */
export function getDeviceAssessment({ navigatorObject } = {}) {
  const injected = navigatorObject !== undefined;
  if (!injected && cachedDeviceAssessment) return cachedDeviceAssessment;

  const assessment = assessDeviceCapabilities(
    readDeviceSignals({ navigatorObject: injected ? navigatorObject : getNavigator() }),
  );
  if (!injected) cachedDeviceAssessment = assessment;
  return assessment;
}

/**
 * Re-reads the hardware hints and replaces the shared assessment. This is the
 * explicit boundary used by the adaptive plan's existing reassessment, not a
 * per-frame read. The cached graphics profile is invalidated with it.
 *
 * @returns {ReturnType<typeof assessDeviceCapabilities>}
 */
export function refreshDeviceAssessment() {
  cachedProfile = null;
  cachedDeviceAssessment = assessDeviceCapabilities(readDeviceSignals());
  return cachedDeviceAssessment;
}

/**
 * Classifies the current backing store, independent of device capability.
 *
 * @param {number} backingPixels
 * @returns {'light'|'moderate'|'heavy'|'extreme'}
 */
export function classifyDisplayDemand(backingPixels) {
  if (!Number.isFinite(backingPixels) || backingPixels <= DISPLAY_DEMAND_BANDS.light) {
    return DISPLAY_DEMAND.LIGHT;
  }
  if (backingPixels <= DISPLAY_DEMAND_BANDS.moderate) return DISPLAY_DEMAND.MODERATE;
  if (backingPixels <= DISPLAY_DEMAND_BANDS.heavy) return DISPLAY_DEMAND.HEAVY;
  return DISPLAY_DEMAND.EXTREME;
}

/**
 * Reads the live display demand. Unlike capability, this deliberately changes
 * with the viewport and DPR; it is never cached with the hardware assessment.
 *
 * @param {{
 *   windowObject?: Window|null,
 *   viewportWidth?: number,
 *   viewportHeight?: number,
 *   pixelRatio?: number,
 * }} [sources]
 * @returns {{
 *   width: number,
 *   height: number,
 *   pixelRatio: number,
 *   backingPixels: number,
 *   demand: 'light'|'moderate'|'heavy'|'extreme',
 * }}
 */
export function getDisplayDemand({
  windowObject = getWindow(),
  viewportWidth,
  viewportHeight,
  pixelRatio,
} = {}) {
  const width =
    normalizePositiveNumber(viewportWidth) ??
    normalizePositiveNumber(windowObject?.innerWidth) ??
    1280;
  const height =
    normalizePositiveNumber(viewportHeight) ??
    normalizePositiveNumber(windowObject?.innerHeight) ??
    800;
  const ratio =
    normalizePositiveNumber(pixelRatio) ??
    normalizePositiveNumber(windowObject?.devicePixelRatio) ??
    1;
  const backingPixels = Math.round(width * height * ratio * ratio);

  return Object.freeze({
    width,
    height,
    pixelRatio: ratio,
    backingPixels,
    demand: classifyDisplayDemand(backingPixels),
  });
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

  const assessment = getDeviceAssessment();
  const tier = resolveGraphicsTier({
    saveData: readSaveData(),
    deviceMemory: assessment.memoryGb,
    hardwareConcurrency: assessment.cores,
  });

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
  const modestBackingStore = backingPixels <= RENDER_GATES.backingStorePixels;
  const touchHighDensity = coarsePointer && ratio >= RENDER_GATES.coarsePointerPixelRatio;

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

  const assessment = getDeviceAssessment();
  const display = getDisplayDemand();

  return resolveRenderQuality({
    profileTier: getGraphicsProfile().tier,
    saveData: readSaveData(),
    deviceMemory: assessment.memoryGb,
    hardwareConcurrency: assessment.cores,
    viewportWidth: display.width,
    viewportHeight: display.height,
    pixelRatio: display.pixelRatio,
    coarsePointer: readCoarsePointer(),
  });
}

/**
 * Explains the resolved render budget without changing it. Capability, display
 * demand and policy are reported separately, and the retained legacy gates are
 * named so a high-capability device is not mistaken for a weak one.
 *
 * The 3 MP backing-store gate and the coarse-pointer DPR-3 gate intentionally
 * remain active. Removing either is deferred because it changes rendered
 * density and GPU work; the monitor gathers the evidence for that decision.
 *
 * @param {{
 *   quality?: ReturnType<typeof getRenderQuality>,
 *   assessment?: ReturnType<typeof getDeviceAssessment>,
 *   display?: ReturnType<typeof getDisplayDemand>,
 *   saveData?: boolean,
 *   coarsePointer?: boolean,
 * }} [input]
 * @returns {{
 *   render: ReturnType<typeof getRenderQuality>,
 *   assessment: ReturnType<typeof getDeviceAssessment>,
 *   display: ReturnType<typeof getDisplayDemand>,
 *   limitedBy: string[],
 *   gates: {
 *     backingStore: { limit: number, value: number, active: boolean },
 *     coarsePointerDensity: { ratio: number, coarsePointer: boolean, pixelRatio: number, active: boolean },
 *   },
 * }}
 */
export function describeRenderBudget({
  quality,
  assessment,
  display,
  saveData,
  coarsePointer,
} = {}) {
  const resolvedQuality = quality ?? getRenderQuality();
  const resolvedAssessment = assessment ?? getDeviceAssessment();
  const resolvedDisplay = display ?? getDisplayDemand();
  const resolvedSaveData = typeof saveData === 'boolean' ? saveData : readSaveData();
  const resolvedCoarsePointer =
    typeof coarsePointer === 'boolean' ? coarsePointer : readCoarsePointer();

  const backingStore = Object.freeze({
    limit: RENDER_GATES.backingStorePixels,
    value: resolvedDisplay.backingPixels,
    active: resolvedDisplay.backingPixels > RENDER_GATES.backingStorePixels,
  });
  const coarsePointerDensity = Object.freeze({
    ratio: RENDER_GATES.coarsePointerPixelRatio,
    coarsePointer: resolvedCoarsePointer,
    pixelRatio: resolvedDisplay.pixelRatio,
    active:
      resolvedCoarsePointer &&
      resolvedDisplay.pixelRatio >= RENDER_GATES.coarsePointerPixelRatio,
  });

  const limitedBy = [];
  if (resolvedQuality.tier === RENDER_QUALITY.CONSTRAINED) {
    if (resolvedSaveData) limitedBy.push('policy');
    if (resolvedAssessment.capabilityTier === CAPABILITY_TIER.CONSTRAINED) {
      limitedBy.push('capability');
    }
    // `resolveRenderQuality` also honours a constrained graphics profile. If the
    // cached assessment has not caught up with that profile, a constrained
    // render would otherwise have no stated cause; report the capability path
    // rather than an empty explanation.
    if (limitedBy.length === 0) limitedBy.push('capability');
  } else {
    if (backingStore.active) limitedBy.push('surface');
    if (coarsePointerDensity.active) limitedBy.push('legacy-pointer-density');
    const capabilityLimited =
      resolvedAssessment.capabilityTier === CAPABILITY_TIER.CONSTRAINED ||
      (resolvedAssessment.capabilityTier === CAPABILITY_TIER.BALANCED &&
        resolvedAssessment.confidence !== CAPABILITY_CONFIDENCE.NONE);
    if (resolvedQuality.tier === RENDER_QUALITY.BALANCED && capabilityLimited) {
      limitedBy.push('capability');
    }
  }

  return Object.freeze({
    render: resolvedQuality,
    assessment: resolvedAssessment,
    display: resolvedDisplay,
    limitedBy: Object.freeze(limitedBy),
    gates: Object.freeze({ backingStore, coarsePointerDensity }),
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

function readWebGLLimits(context) {
  if (!context || typeof context.getParameter !== 'function') return null;

  const readScalar = (name) => {
    const parameter = context[name];
    if (typeof parameter !== 'number') return null;
    try {
      const value = context.getParameter(parameter);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  };

  let maxViewportDims = null;
  if (typeof context.MAX_VIEWPORT_DIMS === 'number') {
    try {
      const dims = context.getParameter(context.MAX_VIEWPORT_DIMS);
      if (dims && Number.isFinite(dims[0]) && Number.isFinite(dims[1])) {
        maxViewportDims = Object.freeze([dims[0], dims[1]]);
      }
    } catch {
      maxViewportDims = null;
    }
  }

  return Object.freeze({
    maxTextureSize: readScalar('MAX_TEXTURE_SIZE'),
    maxRenderbufferSize: readScalar('MAX_RENDERBUFFER_SIZE'),
    maxViewportDims,
    maxVertexAttribs: readScalar('MAX_VERTEX_ATTRIBS'),
    maxTextureUnits: readScalar('MAX_TEXTURE_IMAGE_UNITS'),
    maxCombinedTextureUnits: readScalar('MAX_COMBINED_TEXTURE_IMAGE_UNITS'),
  });
}

/**
 * Probes WebGL once. WebGL2 is tried first because the current Three.js build
 * uses it; if it is unavailable the probe falls back to WebGL1. Only scalar
 * limits are read: no vendor, renderer or unmasked identity string is ever
 * requested. The probe context is released immediately.
 *
 * @returns {{ webgl: boolean, webgl2: boolean, limits: object|null }}
 */
function probeWebGLFeatures() {
  if (cachedWebGLFeatures) return cachedWebGLFeatures;

  const canvas = createProbeCanvas();
  if (!canvas) {
    cachedWebGLFeatures = Object.freeze({ webgl: false, webgl2: false, limits: null });
    return cachedWebGLFeatures;
  }

  let context = null;
  let webgl2 = false;
  try {
    context = canvas.getContext('webgl2');
    webgl2 = Boolean(context);
  } catch {
    context = null;
  }

  if (!context) {
    try {
      context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch {
      context = null;
    }
  }

  const features = Object.freeze({
    webgl: Boolean(context),
    webgl2,
    limits: readWebGLLimits(context),
  });
  if (context) releaseProbeContext(context);
  cachedWebGLFeatures = features;
  return features;
}

/**
 * Reports the browser's rendering features and scalar WebGL limits. The probes
 * are lazy and page-lifetime cached, and importing this module still allocates
 * no canvas.
 *
 * @returns {{
 *   canvas2d: boolean,
 *   webgl: boolean,
 *   webgl2: boolean,
 *   path2d: boolean,
 *   limits: object|null,
 * }}
 */
export function getGraphicsFeatures() {
  if (cachedGraphicsFeatures) return cachedGraphicsFeatures;

  const canvas2d = supportsCanvas2D();
  const path2d = supportsPath2D();
  const webgl = probeWebGLFeatures();
  cachedGraphicsFeatures = Object.freeze({
    canvas2d,
    webgl: webgl.webgl,
    webgl2: webgl.webgl2,
    path2d,
    limits: webgl.limits,
  });
  return cachedGraphicsFeatures;
}

/**
 * Lazily checks whether the browser can create a WebGL context. Either WebGL2
 * or WebGL1 counts; software rendering still counts because the browser chose
 * it. The probe is shared with `getGraphicsFeatures()`.
 *
 * @returns {boolean}
 */
export function supportsWebGL() {
  return probeWebGLFeatures().webgl;
}

/** @returns {boolean} Whether the browser exposes a WebGL2 context. */
export function supportsWebGL2() {
  return probeWebGLFeatures().webgl2;
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
