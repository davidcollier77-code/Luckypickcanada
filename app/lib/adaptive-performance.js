/**
 * Shared adaptive performance and rendering system.
 *
 * This module is the single place that answers "what can this visitor's device
 * and connection actually do right now?" for every client-side renderer. It
 * extends the existing `graphics-capabilities` probes instead of replacing
 * them: those stay responsible for safe Canvas 2D/WebGL acquisition and the
 * cinematic quality tiers, while this layer adds network measurements,
 * accessibility preferences, memory pressure, one shared condition
 * subscription, an animation frame governor and a resource-release registry.
 *
 * Design rules:
 *   - Every value is derived from an actual capability signal. Network labels
 *     (`effectiveType`) are only a coarse fallback when no measurement exists,
 *     and no label is ever read as "5G" or "5G Advanced"; the API does not
 *     identify either reliably.
 *   - Missing signals never restrict a device. Privacy-hardened browsers that
 *     hide `deviceMemory`, `hardwareConcurrency` or the Network Information API
 *     keep the full experience.
 *   - Importing this module allocates nothing and starts no work. Listeners,
 *     timers and probes begin only when a consumer subscribes or asks.
 *   - Adaptations are reversible. When a condition improves, the next
 *     reassessment restores the fuller experience.
 *   - No cookies, storage or user-agent string is read. Browser storage does
 *     not provide additional RAM, so it is never consulted for memory limits.
 */

import {
  getRenderQuality,
  prefersReducedMotion,
  supportsCanvas2D,
  supportsPath2D,
  supportsWebGL,
} from './graphics-capabilities.js';

/** Coarse network classes derived from measured throughput and latency. */
export const NETWORK_CLASS = Object.freeze({
  FAST: 'fast',
  MODERATE: 'moderate',
  SLOW: 'slow',
  UNKNOWN: 'unknown',
});

/** Coarse performance tiers. Missing device hints resolve to `high`. */
export const PERFORMANCE_TIER = Object.freeze({
  HIGH: 'high',
  BALANCED: 'balanced',
  CONSTRAINED: 'constrained',
});

/** Prefetch policies, strongest restriction first. */
export const PREFETCH_POLICY = Object.freeze({
  INTENT: 'intent',
  STRONG_INTENT: 'strong-intent',
  NONE: 'none',
});

const MEDIA_QUERIES = Object.freeze({
  reducedMotion: '(prefers-reduced-motion: reduce)',
  coarsePointer: '(pointer: coarse)',
});

const KNOWN_EFFECTIVE_TYPES = Object.freeze(['slow-2g', '2g', '3g', '4g']);

// A measured connection is only "fast" when it has both throughput and, if it
// reports latency, a responsive round trip.
const FAST_DOWNLINK_MBPS = 4;
const FAST_RTT_MS = 200;
const SLOW_DOWNLINK_MBPS = 1;
const SLOW_RTT_MS = 500;

const HEAP_PRESSURE_RATIO = 0.85;
const HEAP_POLL_INTERVAL_MS = 20_000;
const REASSESS_DEBOUNCE_MS = 120;

const FRAME_RATE = Object.freeze({ FULL: 60, CONSTRAINED: 30, PAUSED: 0 });

/** Server-rendered default: permissive, never restricting. */
const SERVER_PLAN = Object.freeze({
  tier: PERFORMANCE_TIER.BALANCED,
  networkClass: NETWORK_CLASS.UNKNOWN,
  saveData: false,
  visible: true,
  reducedMotion: false,
  frameRate: FRAME_RATE.FULL,
  animationBudget: 'full',
  prefetch: PREFETCH_POLICY.INTENT,
  audioPreload: 'eager',
  imageQuality: 'full',
  maxParallelRequests: 4,
  releaseIdleResources: false,
  reasons: Object.freeze([]),
});

const DEFAULT_DEVICE = Object.freeze({
  memoryGb: null,
  cores: null,
  pixelRatio: 1,
  viewportWidth: 1280,
  viewportHeight: 800,
  reducedMotion: false,
  coarsePointer: false,
});

const DEFAULT_NETWORK = Object.freeze({
  supported: false,
  saveData: false,
  effectiveType: null,
  downlinkMbps: null,
  rttMs: null,
});

let cachedPlan = null;
let lastPlanSignature = '';

/** @returns {Navigator|null} */
function getNavigator() {
  return typeof navigator === 'undefined' ? null : navigator;
}

/** @returns {Window|null} */
function getWindow() {
  return typeof window === 'undefined' ? null : window;
}

function mediaQueryMatches(windowObject, query) {
  if (!windowObject || typeof windowObject.matchMedia !== 'function') return false;
  try {
    return windowObject.matchMedia(query)?.matches === true;
  } catch {
    return false;
  }
}

function getMediaQueryList(windowObject, query) {
  if (!windowObject || typeof windowObject.matchMedia !== 'function') return null;
  try {
    return windowObject.matchMedia(query);
  } catch {
    return null;
  }
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function toNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/**
 * Reads the Network Information API without assuming it exists. Browsers may
 * expose it under a prefixed name, and values can be absent even when the
 * object is present.
 *
 * @param {Navigator|null} [navigatorObject]
 * @returns {{ supported: boolean, saveData: boolean, effectiveType: string|null, downlinkMbps: number|null, rttMs: number|null }}
 */
export function readNetworkState(navigatorObject = getNavigator()) {
  const connection =
    navigatorObject?.connection ?? navigatorObject?.mozConnection ?? navigatorObject?.webkitConnection;

  if (!connection || typeof connection !== 'object') {
    return { ...DEFAULT_NETWORK };
  }

  const rawEffectiveType =
    typeof connection.effectiveType === 'string' ? connection.effectiveType.toLowerCase() : null;

  return {
    supported: true,
    saveData: connection.saveData === true,
    effectiveType: KNOWN_EFFECTIVE_TYPES.includes(rawEffectiveType) ? rawEffectiveType : null,
    downlinkMbps: toPositiveNumber(connection.downlink),
    rttMs: toNonNegativeNumber(connection.rtt),
  };
}

/**
 * Classifies a connection from measurements first. Labels are only used when
 * there is no usable measurement, and "4g" is deliberately not treated as fast
 * because the label carries no throughput guarantee.
 *
 * @param {ReturnType<typeof readNetworkState>} [network]
 * @returns {'fast'|'moderate'|'slow'|'unknown'}
 */
export function classifyNetwork(network = DEFAULT_NETWORK) {
  if (network?.saveData) return NETWORK_CLASS.SLOW;

  const downlink = network?.downlinkMbps ?? null;
  const rtt = network?.rttMs ?? null;

  if (downlink !== null) {
    if (downlink >= FAST_DOWNLINK_MBPS && (rtt === null || rtt <= FAST_RTT_MS)) {
      return NETWORK_CLASS.FAST;
    }
    if (downlink < SLOW_DOWNLINK_MBPS || (rtt !== null && rtt >= SLOW_RTT_MS)) {
      return NETWORK_CLASS.SLOW;
    }
    return NETWORK_CLASS.MODERATE;
  }

  if (rtt !== null && rtt >= SLOW_RTT_MS) return NETWORK_CLASS.SLOW;
  if (rtt !== null && rtt <= FAST_RTT_MS) return NETWORK_CLASS.MODERATE;

  if (network?.effectiveType === 'slow-2g' || network?.effectiveType === '2g') {
    return NETWORK_CLASS.SLOW;
  }
  if (network?.effectiveType === '3g') return NETWORK_CLASS.MODERATE;

  // No measurement and no restrictive label: never invent a constraint.
  return NETWORK_CLASS.UNKNOWN;
}

/**
 * Reads device hints. `deviceMemory` and `hardwareConcurrency` are coarse
 * privacy-reduced values and are absent in several browsers, so absent values
 * stay `null` and are treated as capable.
 *
 * @param {{ navigatorObject?: Navigator|null, windowObject?: Window|null }} [sources]
 * @returns {typeof DEFAULT_DEVICE}
 */
export function readDeviceState({ navigatorObject = getNavigator(), windowObject = getWindow() } = {}) {
  const memory =
    typeof navigatorObject?.deviceMemory === 'number' ? navigatorObject.deviceMemory : null;
  const cores =
    typeof navigatorObject?.hardwareConcurrency === 'number' &&
    Number.isFinite(navigatorObject.hardwareConcurrency) &&
    navigatorObject.hardwareConcurrency > 0
      ? navigatorObject.hardwareConcurrency
      : null;

  const pixelRatio =
    windowObject && Number.isFinite(windowObject.devicePixelRatio) && windowObject.devicePixelRatio > 0
      ? windowObject.devicePixelRatio
      : DEFAULT_DEVICE.pixelRatio;
  const viewportWidth =
    windowObject && Number.isFinite(windowObject.innerWidth) && windowObject.innerWidth > 0
      ? windowObject.innerWidth
      : DEFAULT_DEVICE.viewportWidth;
  const viewportHeight =
    windowObject && Number.isFinite(windowObject.innerHeight) && windowObject.innerHeight > 0
      ? windowObject.innerHeight
      : DEFAULT_DEVICE.viewportHeight;

  return {
    memoryGb: memory !== null && memory > 0 ? memory : null,
    cores,
    pixelRatio,
    viewportWidth,
    viewportHeight,
    reducedMotion:
      mediaQueryMatches(windowObject, MEDIA_QUERIES.reducedMotion) || prefersReducedMotion(),
    coarsePointer: mediaQueryMatches(windowObject, MEDIA_QUERIES.coarsePointer),
  };
}

/**
 * Reads the optional, Chromium-only JS heap counters. Other browsers get
 * `{ supported: false }` and are never penalised for the missing API.
 *
 * @param {Performance|null} [performanceObject]
 * @returns {{ supported: boolean, ratio: number|null, pressure: boolean }}
 */
export function readHeapPressure(performanceObject = typeof performance === 'undefined' ? null : performance) {
  const memory = performanceObject?.memory;
  if (
    !memory ||
    !Number.isFinite(memory.usedJSHeapSize) ||
    !Number.isFinite(memory.jsHeapSizeLimit) ||
    memory.jsHeapSizeLimit <= 0
  ) {
    return { supported: false, ratio: null, pressure: false };
  }

  const ratio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
  return { supported: true, ratio, pressure: ratio >= HEAP_PRESSURE_RATIO };
}

/**
 * Builds the adaptation plan. Pure and deterministic for a given input, so the
 * behaviour can be tested across device and network profiles without a browser.
 *
 * A capable device keeps 60 fps, full-size media and speculative prefetch. Only
 * a measured constraint or an explicit preference reduces a budget, and no
 * budget removes a feature: motion becomes a static frame for reduced motion,
 * prefetch waits for stronger intent, and audio loads on demand.
 *
 * @param {{
 *   network?: ReturnType<typeof readNetworkState>,
 *   device?: ReturnType<typeof readDeviceState>,
 *   heap?: ReturnType<typeof readHeapPressure>,
 *   visible?: boolean,
 * }} [input]
 * @returns {typeof SERVER_PLAN}
 */
export function resolveAdaptivePlan({
  network = DEFAULT_NETWORK,
  device = DEFAULT_DEVICE,
  heap = { supported: false, ratio: null, pressure: false },
  visible = true,
} = {}) {
  const networkClass = classifyNetwork(network);
  const saveData = Boolean(network?.saveData);
  const reducedMotion = Boolean(device?.reducedMotion);
  const memoryPressure = Boolean(heap?.pressure);

  const lowMemory = device?.memoryGb !== null && device?.memoryGb !== undefined && device.memoryGb <= 2;
  const lowCores = device?.cores !== null && device?.cores !== undefined && device.cores <= 2;

  const constrained = saveData || lowMemory || lowCores || memoryPressure;
  const plentifulCores = device?.cores === null || device?.cores === undefined || device.cores >= 6;
  const plentifulMemory =
    device?.memoryGb === null || device?.memoryGb === undefined || device.memoryGb >= 6;

  let tier = PERFORMANCE_TIER.BALANCED;
  if (constrained) tier = PERFORMANCE_TIER.CONSTRAINED;
  else if (plentifulCores && plentifulMemory) tier = PERFORMANCE_TIER.HIGH;

  const reasons = [];
  if (saveData) reasons.push('save-data');
  if (lowMemory) reasons.push('low-memory');
  if (lowCores) reasons.push('low-cores');
  if (memoryPressure) reasons.push('memory-pressure');
  if (networkClass === NETWORK_CLASS.SLOW && !saveData) reasons.push('slow-network');
  if (networkClass === NETWORK_CLASS.MODERATE) reasons.push('moderate-network');
  if (reducedMotion) reasons.push('reduced-motion');
  if (!visible) reasons.push('hidden-page');
  if (tier === PERFORMANCE_TIER.HIGH) reasons.push('capable-device');

  let prefetch = PREFETCH_POLICY.INTENT;
  if (saveData || networkClass === NETWORK_CLASS.SLOW) prefetch = PREFETCH_POLICY.NONE;
  else if (networkClass === NETWORK_CLASS.MODERATE) prefetch = PREFETCH_POLICY.STRONG_INTENT;

  let audioPreload = 'eager';
  if (constrained || saveData || networkClass === NETWORK_CLASS.SLOW) audioPreload = 'intent';

  let imageQuality = 'full';
  if (saveData || networkClass === NETWORK_CLASS.SLOW) imageQuality = 'economy';
  else if (constrained || networkClass === NETWORK_CLASS.MODERATE) imageQuality = 'balanced';

  let maxParallelRequests = 6;
  if (networkClass === NETWORK_CLASS.SLOW || saveData) maxParallelRequests = 2;
  else if (constrained || networkClass === NETWORK_CLASS.MODERATE) maxParallelRequests = 4;

  const frameRate =
    reducedMotion || !visible
      ? FRAME_RATE.PAUSED
      : constrained
        ? FRAME_RATE.CONSTRAINED
        : FRAME_RATE.FULL;

  const animationBudget = reducedMotion ? 'minimal' : constrained ? 'reduced' : 'full';

  return {
    tier,
    networkClass,
    saveData,
    visible: Boolean(visible),
    reducedMotion,
    frameRate,
    animationBudget,
    prefetch,
    audioPreload,
    imageQuality,
    maxParallelRequests,
    releaseIdleResources: memoryPressure || (constrained && !visible),
    reasons,
  };
}

/**
 * Reads every accessible capability signal and resolves the current plan.
 *
 * @returns {typeof SERVER_PLAN}
 */
function computeLivePlan() {
  const windowObject = getWindow();
  if (!windowObject) return SERVER_PLAN;

  return resolveAdaptivePlan({
    network: readNetworkState(),
    device: readDeviceState({ windowObject }),
    heap: readHeapPressure(),
    visible: typeof document === 'undefined' || document.visibilityState !== 'hidden',
  });
}

function planSignature(plan) {
  return [
    plan.tier,
    plan.networkClass,
    plan.saveData ? 1 : 0,
    plan.visible ? 1 : 0,
    plan.reducedMotion ? 1 : 0,
    plan.frameRate,
    plan.animationBudget,
    plan.prefetch,
    plan.audioPreload,
    plan.imageQuality,
    plan.maxParallelRequests,
    plan.releaseIdleResources ? 1 : 0,
    plan.reasons.join(','),
  ].join('|');
}

const subscribers = new Set();
let wiring = null;
let debounceTimer = 0;
let pressureReleaseApplied = false;

function runRegisteredReleases() {
  releaseRegisteredResources('memory-pressure');
}

function notifySubscribers(plan) {
  if (plan.releaseIdleResources && !pressureReleaseApplied) {
    pressureReleaseApplied = true;
    runRegisteredReleases();
  } else if (!plan.releaseIdleResources) {
    pressureReleaseApplied = false;
  }

  for (const listener of [...subscribers]) {
    try {
      listener(plan);
    } catch {
      // One failing consumer must not stop the others.
    }
  }
}

function emitIfChanged(plan) {
  const signature = planSignature(plan);
  if (signature === lastPlanSignature) return plan;
  lastPlanSignature = signature;
  cachedPlan = plan;
  if (subscribers.size > 0) notifySubscribers(plan);
  return plan;
}

function scheduleReassessment() {
  if (typeof window === 'undefined' || subscribers.size === 0) return;
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    debounceTimer = 0;
    refreshAdaptivePlan();
  }, REASSESS_DEBOUNCE_MS);
}

function detachWiring() {
  if (!wiring) return;
  if (debounceTimer && typeof window !== 'undefined') {
    window.clearTimeout(debounceTimer);
    debounceTimer = 0;
  }
  for (const cleanup of wiring.cleanups) {
    try {
      cleanup();
    } catch {
      // Detaching a listener that is already gone is harmless.
    }
  }
  if (wiring.heapPoll) {
    try {
      clearInterval(wiring.heapPoll);
    } catch {
      // Nothing to clear.
    }
  }
  wiring = null;
}

function attachWiring() {
  if (wiring || typeof window === 'undefined' || typeof document === 'undefined') return;

  const cleanups = [];
  const windowObject = window;

  const listen = (target, type, handler, options) => {
    if (!target || typeof target.addEventListener !== 'function') return;
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  const reassess = () => scheduleReassessment();
  const reassessNow = () => refreshAdaptivePlan();

  listen(windowObject, 'resize', reassess);
  listen(windowObject, 'orientationchange', reassess);
  listen(windowObject, 'online', reassessNow);
  listen(windowObject, 'offline', reassessNow);
  listen(document, 'visibilitychange', reassessNow);

  const connection =
    windowObject.navigator?.connection ??
    windowObject.navigator?.mozConnection ??
    windowObject.navigator?.webkitConnection ??
    null;
  if (connection && typeof connection.addEventListener === 'function') {
    listen(connection, 'change', reassess);
  } else if (connection && typeof connection.addListener === 'function') {
    const handler = () => reassess();
    connection.addListener(handler);
    cleanups.push(() => connection.removeListener?.(handler));
  }

  const motionQuery = getMediaQueryList(windowObject, MEDIA_QUERIES.reducedMotion);
  if (motionQuery) {
    const handler = () => reassessNow();
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', handler);
      cleanups.push(() => motionQuery.removeEventListener?.('change', handler));
    } else if (typeof motionQuery.addListener === 'function') {
      motionQuery.addListener(handler);
      cleanups.push(() => motionQuery.removeListener?.(handler));
    }
  }

  let heapPoll = null;
  if (readHeapPressure().supported) {
    heapPoll = setInterval(() => {
      if (subscribers.size > 0) refreshAdaptivePlan();
    }, HEAP_POLL_INTERVAL_MS);
    // Polling must never keep a Node test runner or a closing tab alive.
    heapPoll?.unref?.();
  }

  wiring = { cleanups, heapPoll };
}

/**
 * Returns the current plan, computing it once and caching it until a condition
 * change or an explicit refresh.
 *
 * @param {{ refresh?: boolean }} [options]
 * @returns {typeof SERVER_PLAN}
 */
export function getAdaptivePlan({ refresh = false } = {}) {
  if (typeof window === 'undefined') return SERVER_PLAN;
  if (refresh || !cachedPlan) {
    const plan = computeLivePlan();
    cachedPlan = plan;
    lastPlanSignature = planSignature(plan);
    return plan;
  }
  return cachedPlan;
}

/**
 * Recomputes the plan immediately and notifies subscribers only when something
 * meaningful changed. Safe to call from event handlers and tests.
 *
 * @returns {typeof SERVER_PLAN}
 */
export function refreshAdaptivePlan() {
  if (typeof window === 'undefined') return SERVER_PLAN;
  return emitIfChanged(computeLivePlan());
}

/**
 * Subscribes to plan changes through one shared set of listeners, no matter how
 * many components subscribe. The last unsubscribe removes every listener and
 * timer, so a closed page or unmounted tree leaves nothing behind.
 *
 * @param {(plan: typeof SERVER_PLAN) => void} listener
 * @param {{ immediate?: boolean }} [options]
 * @returns {() => void} Idempotent cleanup.
 */
export function subscribeToAdaptivePlan(listener, { immediate = true } = {}) {
  if (typeof listener !== 'function') return () => {};

  subscribers.add(listener);
  if (typeof window !== 'undefined') {
    attachWiring();
    if (immediate) {
      const plan = getAdaptivePlan();
      if (plan.releaseIdleResources && !pressureReleaseApplied) {
        pressureReleaseApplied = true;
        runRegisteredReleases();
      }
      try {
        listener(plan);
      } catch {
        // A consumer that throws on its first plan must not break the caller.
      }
    }
  }

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    subscribers.delete(listener);
    if (subscribers.size === 0) detachWiring();
  };
}

/**
 * Whether a link may prefetch for the given intent strength. `hover` is a weak
 * signal; `pointerdown`, `focus` and `touchstart` are strong.
 *
 * @param {typeof SERVER_PLAN} [plan]
 * @param {'hover'|'strong'} [intent]
 * @returns {boolean}
 */
export function shouldPrefetchOnIntent(plan = getAdaptivePlan(), intent = 'strong') {
  if (!plan || plan.prefetch === PREFETCH_POLICY.NONE) return false;
  if (plan.prefetch === PREFETCH_POLICY.STRONG_INTENT) return intent === 'strong';
  return true;
}

/**
 * Whether speculative audio may be fetched before the visitor acts. Playback
 * paths pass `force` to their loaders, so a deferred sound still plays on the
 * interaction that needs it.
 *
 * @param {typeof SERVER_PLAN} [plan]
 * @returns {boolean}
 */
export function allowSpeculativeAudio(plan = getAdaptivePlan()) {
  return plan?.audioPreload !== 'intent';
}

/**
 * Reports the browser features and cinematic render quality beside the current
 * plan. Probes are the existing lazy, page-lifetime-cached ones, so this is safe
 * to call from a consumer that needs the full picture and is not used on every
 * frame.
 *
 * @returns {{
 *   plan: typeof SERVER_PLAN,
 *   features: { canvas2d: boolean, webgl: boolean, path2d: boolean },
 *   renderQuality: ReturnType<typeof getRenderQuality>,
 * }}
 */
export function getAdaptiveCapabilities() {
  return {
    plan: getAdaptivePlan(),
    features: {
      canvas2d: supportsCanvas2D(),
      webgl: supportsWebGL(),
      path2d: supportsPath2D(),
    },
    renderQuality: getRenderQuality(),
  };
}

/* ------------------------------------------------------------------------- *
 * Animation frame governor
 * ------------------------------------------------------------------------- */

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * Creates a plan-governed animation loop. Callers keep their own `draw`
 * function and simply schedule it through the returned controller instead of
 * calling `requestAnimationFrame` directly.
 *
 * A capable device paints every frame. A constrained device drops to the plan's
 * frame rate, a hidden page or reduced-motion preference stops scheduling, and
 * the next `request` after the condition improves resumes at full rate. The
 * plan is read from the cache on each frame, so no listener is required.
 *
 * @param {{ requestFrame?: (callback: (time: number) => void) => number, cancelFrame?: (id: number) => void }} [override]
 * @returns {{ request: (draw: (time?: number) => void) => void, cancel: () => void, dispose: () => void, get scheduled: () => boolean }}
 */
export function createAdaptiveFrameLoop({ requestFrame, cancelFrame } = {}) {
  const request =
    requestFrame ??
    (typeof requestAnimationFrame === 'function'
      ? (callback) => requestAnimationFrame(callback)
      : (callback) => setTimeout(() => callback(nowMs()), 16));
  const cancel =
    cancelFrame ??
    (typeof cancelAnimationFrame === 'function'
      ? (identifier) => cancelAnimationFrame(identifier)
      : (identifier) => clearTimeout(identifier));

  let frameId = 0;
  let callback = null;
  let lastPaint = -Infinity;

  const tick = (time) => {
    frameId = 0;
    if (!callback) return;

    const plan = getAdaptivePlan();
    if (!plan.visible || plan.frameRate <= 0) {
      // Nothing to paint: stop until the consumer requests a frame again, which
      // its existing visibility/reduced-motion handling already does.
      callback = null;
      return;
    }

    const interval = plan.frameRate >= FRAME_RATE.FULL ? 0 : 1000 / plan.frameRate;
    const stamp = Number.isFinite(time) ? time : nowMs();
    if (interval > 0 && stamp - lastPaint < interval - 1) {
      frameId = request(tick);
      return;
    }

    lastPaint = stamp;
    const draw = callback;
    try {
      draw(stamp);
    } finally {
      // Keep the loop alive even when a consumer's draw no longer re-requests
      // (for example after it switches to a static reduced-motion frame).
      // `cancel()` clears the callback, so an explicit stop is never undone.
      if (!frameId && callback) frameId = request(tick);
    }
  };

  return {
    request(draw) {
      if (typeof draw !== 'function') return;
      callback = draw;
      if (!frameId) frameId = request(tick);
    },
    cancel() {
      callback = null;
      if (frameId) cancel(frameId);
      frameId = 0;
    },
    dispose() {
      this.cancel();
    },
    get scheduled() {
      return frameId !== 0;
    },
  };
}

/* ------------------------------------------------------------------------- *
 * Resource release registry
 * ------------------------------------------------------------------------- */

const releasableResources = new Set();

/**
 * Registers a cleanup callback that runs when the plan reports memory pressure.
 * Returns an unregister function; unregistering is idempotent.
 *
 * @param {(reason: string) => void} release
 * @returns {() => void}
 */
export function registerReleasableResource(release) {
  if (typeof release !== 'function') return () => {};
  releasableResources.add(release);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    releasableResources.delete(release);
  };
}

/**
 * Runs every registered release callback with the given reason. Callbacks are
 * isolated, so one failure cannot block the rest.
 *
 * @param {string} [reason]
 * @returns {number} Number of registered callbacks invoked.
 */
export function releaseRegisteredResources(reason = 'manual') {
  const callbacks = [...releasableResources];
  for (const release of callbacks) {
    try {
      release(reason);
    } catch {
      // Releasing is best-effort by design.
    }
  }
  return callbacks.length;
}
