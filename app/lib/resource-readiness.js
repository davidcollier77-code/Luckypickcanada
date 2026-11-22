/**
 * Site-wide resource-readiness hub.
 *
 * This module coordinates *preparation only*. It never plays audio, draws a
 * frame, renders a card or runs business logic: each experience keeps ownership
 * of playback, animation and rendering, and registers the resources it needs
 * with this hub. The hub then fetches, decodes and initialises those resources
 * once, in a bounded and interruptible way, and reports real readiness.
 *
 * It extends the existing adaptive layer rather than competing with it:
 * `getAdaptivePlan`, `subscribeToAdaptivePlan`, `allowSpeculativeAudio`,
 * `shouldPrefetchOnIntent` and `registerReleasableResource` are the only
 * policies used here. There is no second capability detector, frame governor,
 * network subscription or route prefetcher.
 *
 * Design rules:
 *   - Importing this module starts no listeners, timers or requests. Work
 *     begins only when an experience is prepared.
 *   - A resource is identified by its adapter kind and its exact URL or route,
 *     so two experiences that share an asset share one request. The registered
 *     version participates in that identity, so publishing a new version
 *     invalidates the prepared state without inventing query strings that would
 *     miss the browser's existing HTTP cache entry.
 *   - Preparation is bounded by the adaptive plan's parallel-request limit and
 *     paused for background work during an active experience, a hidden page or
 *     a Save-Data/slow connection. Running requests are never allowed to throw
 *     into a renderer.
 *   - Readiness is honest: `fetched`, `initialized`, `ready`, `failed` and
 *     `skipped` are reported per resource. Nothing is reported ready until its
 *     adapter has actually finished.
 *   - The hub never promises permanent retention. It relies on normal HTTP and
 *     browser caching; the browser may evict any entry at any time.
 *   - Retention is bounded. Every record carries a declared or estimated byte
 *     weight, and the hub enforces entry, weight and queue budgets for the
 *     current adaptive tier. Speculative work that does not fit is deferred
 *     rather than queued without limit.
 *   - Ownership is explicit. A lease pins the resources an active experience is
 *     using, so release, pressure, version replacement and eviction can never
 *     dispose a payload the visitor is still seeing. The hub disposes what it
 *     owns as soon as the last lease ends.
 */

import {
  PREFETCH_POLICY,
  allowSpeculativeAudio,
  getAdaptivePlan,
  registerReleasableResource,
  subscribeToAdaptivePlan,
} from './adaptive-performance.js';

/** Real readiness states reported for every registered resource. */
export const READINESS = Object.freeze({
  IDLE: 'idle',
  QUEUED: 'queued',
  PREPARING: 'preparing',
  FETCHED: 'fetched',
  INITIALIZED: 'initialized',
  READY: 'ready',
  FAILED: 'failed',
  /** The adapter deliberately did not prepare the resource (policy or budget). */
  SKIPPED: 'skipped',
});

/** How urgently an experience is being prepared. */
export const PREPARE_PRIORITY = Object.freeze({
  /** The experience the visitor is on or has committed to. */
  CRITICAL: 'critical',
  /** The visitor hovered, focused or pressed a link to the experience. */
  INTENT: 'intent',
  /** Idle spare capacity only; pauses for active experiences and constraints. */
  BACKGROUND: 'background',
});

const PRIORITY_RANK = Object.freeze({
  [PREPARE_PRIORITY.CRITICAL]: 0,
  [PREPARE_PRIORITY.INTENT]: 1,
  [PREPARE_PRIORITY.BACKGROUND]: 2,
});

const MAX_HUB_CONCURRENCY = 3;
const MAX_RESOURCE_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;
const RETRY_TIMER_SLACK_MS = 10;
// A reported failure is not retried again on every pointerover/focusin. An
// explicit retryExperience bypasses this cooldown.
const FAILED_RETRY_COOLDOWN_MS = 5000;
const IDLE_TIMEOUT_MS = 2000;

// Capacity budgets by adaptive tier. These bound the hub's own records and the
// payloads it retains; the browser's HTTP cache is never owned or accounted.
const RESOURCE_CAPACITY = Object.freeze({
  high: Object.freeze({
    maxEntries: 48,
    maxBytes: 24 * 1024 * 1024,
    maxQueue: 24,
    maxPendingPerExperience: 12,
  }),
  balanced: Object.freeze({
    maxEntries: 32,
    maxBytes: 16 * 1024 * 1024,
    maxQueue: 16,
    maxPendingPerExperience: 8,
  }),
  constrained: Object.freeze({
    maxEntries: 16,
    maxBytes: 8 * 1024 * 1024,
    maxQueue: 8,
    maxPendingPerExperience: 6,
  }),
});

// A resource without a declared size is charged a conservative estimate for its
// kind, so an unmeasured adapter cannot silently bypass the weight budget.
const DEFAULT_RESOURCE_WEIGHT = Object.freeze({
  image: 96 * 1024,
  texture: 512 * 1024,
  model: 512 * 1024,
  module: 256 * 1024,
  audio: 96 * 1024,
  code: 48 * 1024,
});
const UNKNOWN_RESOURCE_WEIGHT = 64 * 1024;
// Skipped admission decisions are kept in a small bounded ledger so readiness
// stays honest without letting metadata grow without limit.
const MAX_REJECTED_RECORDS = 32;
// Payloads of these kinds belong to another system: Howler/Web Audio, the
// Next.js router, or an evaluated engine module. The hub drops its reference but
// must never dispose them.
const DELEGATED_KINDS = new Set(['audio', 'code', 'module']);

// Identities of responsive images the hub has itself loaded. Once one derivative
// of an artwork is in memory, fetching another width of the same artwork would
// add bytes without adding any visible pixels.
const loadedImageIdentities = new Set();

const definitions = new Map();
const resourceEntries = new Map();
const resourceInflight = new Map();
const experienceRuns = new Map();
const experienceSnapshots = new Map();
const preparingExperiences = new Set();
const rejectedEntries = new Map();
const leases = new Map();
const pinnedKeys = new Map();
let leaseSequence = 0;

let queue = [];
let runningJobs = 0;
let jobSequence = 0;
let activeExperiences = 0;
let retryTimer = 0;
let retryDeadline = 0;
let planUnsubscribe = null;
let releaseRegistration = null;
let routePrefetch = null;
let pumping = false;

const adapters = new Map();

function now() {
  return Date.now();
}

function getWindow() {
  return typeof window === 'undefined' ? null : window;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTarget(resource) {
  if (typeof resource.url === 'string' && resource.url.trim()) return resource.url.trim();
  if (typeof resource.route === 'string' && resource.route.trim()) return resource.route.trim();
  if (typeof resource.id === 'string' && resource.id.trim()) return resource.id.trim();
  return null;
}

function resourceKey(definition, resource) {
  const target = normalizeTarget(resource);
  const version = resource.version ?? definition.version;
  return `${resource.kind}::${target}::${version}`;
}

function resourceLabel(resource) {
  return resource.label ?? resource.id ?? normalizeTarget(resource) ?? 'resource';
}

function resourceWeight(resource) {
  if (Number.isFinite(resource?.bytes) && resource.bytes > 0) return Math.round(resource.bytes);
  const kind = typeof resource?.kind === 'string' ? resource.kind : '';
  return DEFAULT_RESOURCE_WEIGHT[kind] ?? UNKNOWN_RESOURCE_WEIGHT;
}

function planCapacity() {
  const tier = getAdaptivePlan()?.tier;
  return RESOURCE_CAPACITY[tier] ?? RESOURCE_CAPACITY.balanced;
}

function isPinned(key) {
  return (pinnedKeys.get(key) ?? 0) > 0;
}

function poolUsage() {
  let bytes = 0;
  let pinned = 0;
  let retired = 0;
  for (const entry of resourceEntries.values()) {
    bytes += entry.weightBytes ?? 0;
    if (isPinned(entry.key)) pinned += 1;
    if (entry.retired) retired += 1;
  }
  return { entries: resourceEntries.size, bytes, pinned, retired };
}

function pendingForExperience(id) {
  const jobs = new Set();
  for (const job of queue) {
    if (job.definition?.id === id) jobs.add(job);
  }
  for (const inflight of resourceInflight.values()) {
    if (inflight.job?.definition?.id === id) jobs.add(inflight.job);
  }
  return jobs.size;
}

/**
 * The identity of a responsive image: its path with any `-640w`, `-1024w` or
 * similar width token removed. Two derivatives of one artwork share an
 * identity, while different artwork, formats and directories do not.
 *
 * @param {string} url
 * @returns {string|null}
 */
export function imageIdentity(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let path;
  try {
    // `img.currentSrc` and resource-timing names are absolute, while manifest
    // URLs are root-relative; both must compare as the same identity.
    path = new URL(url.trim(), 'https://image.invalid').pathname;
  } catch {
    path = url.trim().split('?')[0].split('#')[0];
  }
  return path.replace(/-\d+w(\.[a-z0-9]+)$/i, '$1');
}

/**
 * Whether the page has already loaded any derivative of this image identity.
 * It checks rendered images, the browser's resource timing entries and the
 * hub's own successful loads, so a route that already painted the 1024w sky is
 * never asked to download its 640w variant as well.
 *
 * @param {string|null} identity
 * @returns {boolean}
 */
function imageIdentityIsLoaded(identity) {
  if (!identity) return false;
  if (loadedImageIdentities.has(identity)) return true;

  if (typeof document !== 'undefined' && document.images) {
    for (const image of Array.from(document.images)) {
      if (!image || image.complete !== true || !(image.naturalWidth > 0)) continue;
      if (imageIdentity(image.currentSrc || image.src) === identity) return true;
    }
  }

  if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
    const entries = performance.getEntriesByType('resource') || [];
    for (const entry of entries) {
      if (!entry) continue;
      const delivered =
        (entry.transferSize || 0) + (entry.encodedBodySize || 0) + (entry.decodedBodySize || 0);
      if (delivered <= 0) continue;
      if (imageIdentity(entry.name) === identity) return true;
    }
  }

  return false;
}

/* ------------------------------------------------------------------------- *
 * Registration contract
 * ------------------------------------------------------------------------- */

function validateDefinition(definition) {
  if (!isPlainObject(definition)) {
    throw new TypeError('resource registration requires an object');
  }
  if (typeof definition.id !== 'string' || !definition.id.trim()) {
    throw new TypeError('resource registration requires a non-empty id');
  }
  if (!Number.isFinite(definition.version) || definition.version <= 0) {
    throw new TypeError(`resource registration ${definition.id} requires a positive version`);
  }
  if (!Array.isArray(definition.resources)) {
    throw new TypeError(`resource registration ${definition.id} requires a resources array`);
  }
  if (definition.dependsOn !== undefined && !Array.isArray(definition.dependsOn)) {
    throw new TypeError(`resource registration ${definition.id} dependsOn must be an array`);
  }

  const seen = new Set();
  for (const resource of definition.resources) {
    if (!isPlainObject(resource)) {
      throw new TypeError(`resource registration ${definition.id} contains a non-object resource`);
    }
    if (typeof resource.kind !== 'string' || !resource.kind.trim()) {
      throw new TypeError(`resource registration ${definition.id} has a resource without a kind`);
    }
    if (!normalizeTarget(resource)) {
      throw new TypeError(
        `resource registration ${definition.id} resource ${resource.kind} needs a url, route or id`,
      );
    }
    const key = resourceKey(
      { version: definition.version },
      resource,
    );
    if (seen.has(key)) {
      throw new TypeError(`resource registration ${definition.id} repeats ${key}`);
    }
    seen.add(key);
  }

  return Object.freeze({
    ...definition,
    id: definition.id.trim(),
    label: definition.label ?? definition.id,
    routes: Object.freeze([...(definition.routes ?? [])]),
    dependsOn: Object.freeze([...(definition.dependsOn ?? [])]),
    resources: Object.freeze(definition.resources.map((resource) => Object.freeze({ ...resource }))),
  });
}

/**
 * Registers one experience's resources, dependencies, priority, version and
 * prepare/release behaviour.
 *
 * Registering the same id and version twice is a no-op so a module that is
 * evaluated more than once cannot create duplicate definitions. A new version
 * replaces the definition and drops that experience's prepared entries, so the
 * next preparation fetches the new assets instead of reporting stale readiness.
 *
 * @param {{
 *   id: string,
 *   version: number,
 *   label?: string,
 *   routes?: string[],
 *   dependsOn?: string[],
 *   resources: Array<{ id?: string, kind: string, url?: string, route?: string, background?: boolean, prepare?: () => Promise<unknown> }>,
 * }} definition
 * @returns {() => void} Idempotent unregister function.
 */
export function registerExperienceResources(definition) {
  const next = validateDefinition(definition);
  const existing = definitions.get(next.id);
  if (existing && existing.version === next.version) {
    return () => {};
  }

  definitions.set(next.id, next);
  if (existing) {
    for (const resource of existing.resources) {
      const key = resourceKey(existing, resource);
      rejectedEntries.delete(key);
      // A leased or in-flight record is retired rather than disposed: an
      // experience may still be using the old version while the new
      // registration lands, and the next settle completes the retirement.
      deleteEntry(key, 'version-changed', { retireInFlight: true });
    }
    experienceSnapshots.delete(next.id);
  }

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    if (definitions.get(next.id) !== next) return;
    definitions.delete(next.id);
    experienceSnapshots.delete(next.id);
  };
}

/** @returns {ReadonlyArray<object>} Every registered experience definition. */
export function getRegisteredExperiences() {
  return [...definitions.values()];
}

/** @returns {object|null} The registered definition for one experience. */
export function getExperienceDefinition(id) {
  return definitions.get(id) ?? null;
}

/* ------------------------------------------------------------------------- *
 * Adapters
 * ------------------------------------------------------------------------- */

function reportState(entry, state) {
  entry.state = state;
  entry.updatedAt = now();
}

/**
 * Disposes a payload the hub owns. Delegated payloads and results without a
 * disposal contract are left alone. Never throws: a renderer that already freed
 * a resource must not break preparation, release or reset.
 *
 * @param {object|null} entry
 * @param {string} reason
 * @returns {boolean} Whether something was disposed.
 */
function disposeEntry(entry, reason) {
  if (!entry || DELEGATED_KINDS.has(entry.kind)) return false;
  const result = entry.result;
  if (!result || typeof result !== 'object') return false;
  try {
    if (typeof result.dispose === 'function') {
      result.dispose();
    } else if (result.image && typeof result.image.src === 'string') {
      // The hub created this HTMLImageElement itself, so clearing its source
      // releases the decoded bitmap without touching artwork the page renders.
      result.image.src = '';
    } else {
      return false;
    }
  } catch {
    return false;
  }
  entry.result = null;
  entry.retired = false;
  entry.disposedAt = now();
  entry.disposedReason = reason;
  return true;
}

function markRetired(entry, reason) {
  if (entry.retired) return;
  entry.retired = true;
  entry.retiredReason = reason;
  entry.retiredAt = now();
}

/**
 * Drops one settled record unless a lease still owns it. A leased record is
 * retired instead, and the lease release disposes it later.
 *
 * @param {string} key
 * @param {string} reason
 * @param {{ retireInFlight?: boolean }} [options] A version change retires a
 *   queued or preparing record so the next settle releases it; an explicit
 *   release leaves in-flight work alone unless a lease already owns it.
 * @returns {boolean} Whether the record was removed.
 */
function deleteEntry(key, reason, { retireInFlight = false } = {}) {
  const entry = resourceEntries.get(key);
  if (!entry) return false;
  if (entry.state === READINESS.PREPARING || entry.state === READINESS.QUEUED) {
    if (retireInFlight || isPinned(key)) markRetired(entry, reason);
    return false;
  }
  if (isPinned(key)) {
    markRetired(entry, reason);
    return false;
  }
  resourceEntries.delete(key);
  disposeEntry(entry, reason);
  return true;
}

/** Completes retirements whose last lease has ended. */
function sweepRetiredEntries(reason = 'lease-released') {
  let released = 0;
  for (const [key, entry] of resourceEntries) {
    if (!entry.retired || isPinned(key)) continue;
    if (entry.state === READINESS.PREPARING || entry.state === READINESS.QUEUED) continue;
    resourceEntries.delete(key);
    disposeEntry(entry, reason);
    released += 1;
  }
  return released;
}

function recordRejection(key, entry) {
  // Refresh insertion order so the bounded ledger evicts the least recently
  // rejected decision, not the one that happened to be first seen.
  rejectedEntries.delete(key);
  rejectedEntries.set(key, entry);
  while (rejectedEntries.size > MAX_REJECTED_RECORDS) {
    const oldest = rejectedEntries.keys().next().value;
    if (oldest === undefined) break;
    rejectedEntries.delete(oldest);
  }
}

function prepareImageResource(resource, context) {
  if (typeof Image === 'undefined') {
    return Promise.resolve({ skipped: true, reason: 'images-unavailable' });
  }

  // A responsive `<picture>` may already have painted a different width of this
  // artwork. Reuse it: the browser chose that derivative for the rendered box,
  // and downloading a second width cannot improve what is on screen.
  const identity = imageIdentity(resource.url);
  if (imageIdentityIsLoaded(identity)) {
    return Promise.resolve({ reused: true, identity, reason: 'same-image-loaded' });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    let abortListener = null;

    const settle = (callback) => {
      if (settled) return;
      settled = true;
      if (abortListener && context.signal) {
        context.signal.removeEventListener('abort', abortListener);
      }
      callback();
    };

    image.onload = () => {
      if (settled) return;
      context.report(READINESS.FETCHED);
      if (identity) loadedImageIdentities.add(identity);
      const decoded = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
      decoded.then(
        () => {
          context.report(READINESS.INITIALIZED);
          settle(() => resolve({ image, decoded: true }));
        },
        () => {
          // A decode failure after a successful fetch still leaves the bytes in
          // the HTTP cache; the browser can decode them when it displays the
          // image. This is not a failed request.
          settle(() => resolve({ image, decoded: false }));
        },
      );
    };
    image.onerror = () => settle(() => reject(new Error(`Image failed to load: ${resource.url}`)));
    if (context.signal) {
      abortListener = () => {
        image.src = '';
        settle(() => reject(new Error('aborted')));
      };
      context.signal.addEventListener('abort', abortListener, { once: true });
    }
    image.decoding = 'async';
    image.src = resource.url;
    // A cached image can already be complete before the handlers are attached.
    if (image.complete && image.naturalWidth > 0) image.onload();
  });
}

function isCurrentRoute(route) {
  if (typeof route !== 'string' || typeof window === 'undefined') return false;
  const pathname = window.location?.pathname;
  if (typeof pathname !== 'string') return false;
  const path = pathname.replace(/\/+$/, '') || '/';
  const target = route.replace(/\/+$/, '') || '/';
  return path === target || path.startsWith(`${target}/`);
}

function prepareCodeResource(resource, context) {
  if (typeof routePrefetch !== 'function') {
    return Promise.resolve({ skipped: true, reason: 'no-route-prefetcher' });
  }
  // The route bundle for the page already on screen is loading or loaded. A
  // second prefetch would add duplicate flight requests without helping the
  // visitor, so the current route is reported skipped instead.
  if (isCurrentRoute(resource.route)) {
    return Promise.resolve({ skipped: true, reason: 'current-route' });
  }
  // The adaptive plan is the single prefetch authority, so speculative route
  // warming must obey it exactly like a Link's own prefetch. Save-Data or a
  // measured slow connection disables it; a moderate one waits for the press,
  // tap or keyboard focus that the delegated strong-intent path represents.
  const plan = getAdaptivePlan();
  if (plan?.prefetch === PREFETCH_POLICY.NONE) {
    return Promise.resolve({ skipped: true, reason: 'prefetch-disabled' });
  }
  if (
    plan?.prefetch === PREFETCH_POLICY.STRONG_INTENT &&
    context?.priority !== PREPARE_PRIORITY.INTENT &&
    context?.priority !== PREPARE_PRIORITY.CRITICAL
  ) {
    return Promise.resolve({ skipped: true, reason: 'prefetch-strong-intent' });
  }
  const result = routePrefetch(resource.route);
  return Promise.resolve(result).then(() => ({ route: resource.route }));
}

function prepareAudioResource(resource, context) {
  // Preparing audio never authorises playback. It only warms the existing
  // Howler/Web Audio loader while the plan allows speculative loading; the
  // activation path still owns unlock and play.
  if (!allowSpeculativeAudio()) {
    return Promise.resolve({ skipped: true, reason: 'speculative-audio-deferred' });
  }
  if (typeof resource.prepare !== 'function') {
    return Promise.reject(new Error(`Audio resource ${resourceLabel(resource)} has no prepare function`));
  }
  context.report(READINESS.FETCHED);
  return Promise.resolve(resource.prepare()).then((value) => ({ prepared: value ?? true }));
}

adapters.set('image', prepareImageResource);
adapters.set('code', prepareCodeResource);
adapters.set('audio', prepareAudioResource);

/**
 * Registers an adapter for a resource kind. Built-in kinds are `image`, `code`
 * and `audio`; future Canvas, WebGL or WebGPU texture/buffer descriptors can use
 * their own kind here without changing the hub or its scheduling.
 *
 * @param {string} kind
 * @param {(resource: object, context: { report: (state: string) => void, signal?: AbortSignal }) => Promise<unknown>} adapter
 * @returns {() => void} Restores the previous adapter, if any.
 */
export function registerResourceAdapter(kind, adapter) {
  if (typeof kind !== 'string' || !kind.trim()) {
    throw new TypeError('resource adapter requires a kind');
  }
  if (typeof adapter !== 'function') {
    throw new TypeError(`resource adapter ${kind} must be a function`);
  }
  const previous = adapters.get(kind);
  adapters.set(kind, adapter);
  return () => {
    if (previous) adapters.set(kind, previous);
    else adapters.delete(kind);
  };
}

/**
 * Supplies the route prefetcher used by `code` resources. The app passes the
 * Next.js router's `prefetch`; the hub never imports a router itself so the
 * contract stays renderer- and framework-agnostic.
 *
 * @param {((route: string) => unknown)|null} prefetch
 */
export function configureRoutePrefetch(prefetch) {
  routePrefetch = typeof prefetch === 'function' ? prefetch : null;
}

/* ------------------------------------------------------------------------- *
 * Capacity and admission
 * ------------------------------------------------------------------------- */

/**
 * Evicts settled, unleased records until the incoming weight fits. Critical
 * work may evict any settled record; intent may evict only background records;
 * background never evicts. Least valuable, then least recently used, goes first.
 *
 * @param {number} weight
 * @param {string} priority
 * @param {string} definitionId The requesting experience, whose own records are
 *   never evicted to make room for itself.
 * @returns {boolean} Whether the incoming record now fits.
 */
function evictForCapacity(weight, priority, definitionId) {
  const capacity = planCapacity();
  const fits = () => {
    const usage = poolUsage();
    return usage.entries < capacity.maxEntries && usage.bytes + weight <= capacity.maxBytes;
  };
  if (fits()) return true;

  const candidates = [...resourceEntries.values()]
    .filter((entry) => !isPinned(entry.key) && !entry.retired)
    .filter((entry) => entry.definitionId !== definitionId)
    .filter((entry) => entry.state !== READINESS.PREPARING && entry.state !== READINESS.QUEUED)
    .filter(
      (entry) =>
        priority === PREPARE_PRIORITY.CRITICAL || entry.priority === PREPARE_PRIORITY.BACKGROUND,
    )
    .sort(
      (first, second) =>
        PRIORITY_RANK[second.priority] - PRIORITY_RANK[first.priority] ||
        (first.lastAccessAt ?? first.updatedAt) - (second.lastAccessAt ?? second.updatedAt),
    );

  for (const candidate of candidates) {
    deleteEntry(candidate.key, 'capacity-evicted');
    if (fits()) return true;
  }
  return false;
}

/**
 * Removes one queued speculative job so committed work can be admitted. An
 * in-flight job and any leased job are never shed.
 *
 * @param {{ allowIntent?: boolean }} [options]
 * @returns {boolean} Whether a job was shed.
 */
function shedQueuedJob({ allowIntent = false } = {}) {
  let candidateIndex = -1;
  for (let index = 0; index < queue.length; index += 1) {
    const job = queue[index];
    if (isPinned(job.key)) continue;

    if (job.priority === PREPARE_PRIORITY.BACKGROUND) {
      if (candidateIndex === -1) {
        candidateIndex = index;
        continue;
      }
      const best = queue[candidateIndex];
      if (best.priority !== PREPARE_PRIORITY.BACKGROUND || job.sequence < best.sequence) {
        candidateIndex = index;
      }
      continue;
    }

    if (!allowIntent || job.priority !== PREPARE_PRIORITY.INTENT) continue;
    const best = candidateIndex === -1 ? null : queue[candidateIndex];
    if (!best || best.priority === PREPARE_PRIORITY.BACKGROUND) candidateIndex = index;
    else if (job.sequence < best.sequence) candidateIndex = index;
  }
  if (candidateIndex === -1) return false;

  const [job] = queue.splice(candidateIndex, 1);
  job.entry.state = READINESS.SKIPPED;
  job.entry.reason = 'capacity-shed';
  job.entry.updatedAt = now();
  // A shed job was never admitted as a retained resource. Drop its record and
  // keep only the bounded rejection metadata so it cannot consume capacity.
  if (resourceEntries.get(job.key) === job.entry) resourceEntries.delete(job.key);
  recordRejection(job.key, job.entry);
  const inflight = resourceInflight.get(job.key);
  if (inflight && inflight.job === job) resourceInflight.delete(job.key);
  job.settle(job.entry);
  return true;
}

/**
 * Decides whether a resource may consume a queue slot and a retained record.
 * Validation and duplicate identity are handled before this point, so an
 * invalid or repeated entry never reaches a capacity decision.
 *
 * @param {object} definition
 * @param {string} priority
 * @param {number} weight
 * @returns {string|null} A skip reason, or null when admitted.
 */
function admissionRefusal(definition, priority, weight) {
  const capacity = planCapacity();

  if (
    priority !== PREPARE_PRIORITY.CRITICAL &&
    pendingForExperience(definition.id) >= capacity.maxPendingPerExperience
  ) {
    return 'experience-queue-full';
  }

  if (queue.length >= capacity.maxQueue) {
    if (priority === PREPARE_PRIORITY.BACKGROUND) return 'queue-full';
    const allowIntent = priority === PREPARE_PRIORITY.CRITICAL;
    if (!shedQueuedJob({ allowIntent }) && priority !== PREPARE_PRIORITY.CRITICAL) {
      return 'queue-full';
    }
    // A committed experience is never refused because speculative work filled
    // the soft queue cap; it may exceed the cap by its own remaining resources.
  }

  if (!evictForCapacity(weight, priority, definition.id)) {
    return priority === PREPARE_PRIORITY.BACKGROUND ? 'capacity-full' : 'capacity-exhausted';
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * Scheduling
 * ------------------------------------------------------------------------- */

function planConcurrency() {
  const plan = getAdaptivePlan();
  const limit = Number.isFinite(plan?.maxParallelRequests) ? plan.maxParallelRequests : 2;
  return Math.max(1, Math.min(limit, MAX_HUB_CONCURRENCY));
}

function backgroundAllowed() {
  const windowObject = getWindow();
  if (!windowObject) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
  if (activeExperiences > 0) return false;
  return getAdaptivePlan()?.prefetch !== 'none';
}

function ensurePlanSubscription() {
  if (planUnsubscribe || typeof window === 'undefined') return;
  planUnsubscribe = subscribeToAdaptivePlan(() => pump());
}

function teardownPlanSubscription() {
  if (!planUnsubscribe) return;
  planUnsubscribe();
  planUnsubscribe = null;
}

function supports(priority) {
  if (priority === PREPARE_PRIORITY.BACKGROUND) return backgroundAllowed();
  return true;
}

/**
 * A resource the definition itself marks as `background` never competes with a
 * foreground experience, even when its experience was requested at critical
 * priority. Route warm-up that starts after the page has settled is not critical
 * to the visitor, and letting it run during a reveal is the competition the
 * audit measured. Non-background critical and intent work still runs.
 *
 * @param {object} job
 * @returns {boolean}
 */
function foregroundAllows(job) {
  if (job.resource?.background !== true) return true;
  if (job.priority === PREPARE_PRIORITY.BACKGROUND) return backgroundAllowed();
  return activeExperiences === 0;
}

function nextRunnableIndex(limit) {
  const timestamp = now();
  for (let index = 0; index < queue.length; index += 1) {
    const job = queue[index];
    if (job.notBefore && job.notBefore > timestamp) continue;
    if (!foregroundAllows(job)) continue;
    if (job.priority === PREPARE_PRIORITY.BACKGROUND) {
      // A background resource must also be allowed to run in the background and
      // must fit the conservative idle budget declared in the manifest.
      if (job.resource.background === false) continue;
      if (!supports(job.priority)) continue;
    }
    if (runningJobs >= limit) return -1;
    return index;
  }
  return -1;
}

function pump() {
  if (pumping || typeof window === 'undefined') return;
  pumping = true;
  try {
    const limit = planConcurrency();
    let index = nextRunnableIndex(limit);
    while (index !== -1 && runningJobs < limit) {
      const [job] = queue.splice(index, 1);
      runningJobs += 1;
      void executeJob(job);
      index = nextRunnableIndex(limit);
    }

    if (queue.length === 0 && runningJobs === 0) {
      teardownPlanSubscription();
      if (retryTimer && typeof window !== 'undefined') {
        window.clearTimeout(retryTimer);
        retryTimer = 0;
        retryDeadline = 0;
      }
    } else if (queue.length > 0) {
      // A paused background queue waits for a plan, visibility or activity
      // change. The existing shared subscription delivers that change, so the
      // hub adds no second polling loop of its own.
      ensurePlanSubscription();
      // A retry waits for a deadline, not a plan change. Re-arm for the earliest
      // pending deadline so a job that failed while another retry timer was
      // already armed is never left in the queue with no wake-up.
      scheduleRetry();
    }
  } finally {
    pumping = false;
  }
}

function nextRetryDeadline(timestamp = now()) {
  let earliest = 0;
  for (const job of queue) {
    if (!job.notBefore || job.notBefore <= timestamp) continue;
    if (!earliest || job.notBefore < earliest) earliest = job.notBefore;
  }
  return earliest;
}

/**
 * Arms one timer for the earliest queued retry deadline. A timer that is already
 * armed for the same or an earlier deadline is kept; one armed for a later
 * deadline is replaced, so two staggered failures cannot strand the later job.
 */
function scheduleRetry() {
  const windowObject = getWindow();
  if (!windowObject) return;
  const deadline = nextRetryDeadline();
  if (!deadline) return;
  if (retryTimer && retryDeadline <= deadline) return;
  if (retryTimer) {
    windowObject.clearTimeout(retryTimer);
    retryTimer = 0;
  }
  retryDeadline = deadline;
  retryTimer = /* DevSkim: ignore DS172411 */ windowObject.setTimeout(() => {
    retryTimer = 0;
    retryDeadline = 0;
    pump();
  }, Math.max(0, deadline - now()) + RETRY_TIMER_SLACK_MS);
}

async function executeJob(job) {
  const entry = job.entry;
  if (!entry) return;

  const adapter = adapters.get(job.resource.kind);
  if (typeof adapter !== 'function') {
    entry.state = READINESS.FAILED;
    entry.error = `No adapter registered for resource kind "${job.resource.kind}"`;
    entry.retryAfter = now() + FAILED_RETRY_COOLDOWN_MS;
    settleJob(job);
    return;
  }

  entry.attempts += 1;
  reportState(entry, READINESS.PREPARING);
  const context = {
    report: (state) => reportState(entry, state),
    signal: job.controller.signal,
    priority: job.priority,
  };

  try {
    const result = await adapter(job.resource, context);
    if (result && result.skipped) {
      entry.state = READINESS.SKIPPED;
      entry.reason = result.reason ?? 'skipped';
    } else {
      entry.state = READINESS.READY;
      entry.result = result;
      entry.readyAt = now();
    }
    delete entry.error;
  } catch (error) {
    if (entry.attempts < MAX_RESOURCE_ATTEMPTS && !job.controller.signal?.aborted) {
      entry.state = READINESS.QUEUED;
      delete entry.retryAfter;
      job.notBefore = now() + RETRY_DELAY_MS;
      runningJobs = Math.max(0, runningJobs - 1);
      queue.push(job);
      scheduleRetry();
      // The retry wait must not block unrelated critical or intent work.
      pump();
      return;
    }
    entry.state = READINESS.FAILED;
    entry.error = error instanceof Error ? error.message : String(error);
    entry.retryAfter = now() + FAILED_RETRY_COOLDOWN_MS;
  }

  settleJob(job);
}

function settleJob(job) {
  runningJobs = Math.max(0, runningJobs - 1);
  const inflight = resourceInflight.get(job.key);
  if (inflight && inflight.job === job) resourceInflight.delete(job.key);
  // A record retired while it was preparing is disposed as soon as it settles
  // and no lease owns it any more.
  if (job.entry?.retired && !isPinned(job.key)) {
    resourceEntries.delete(job.key);
    disposeEntry(job.entry, job.entry.retiredReason ?? 'retired');
  }
  job.settle(job.entry);
  pump();
}

function requestResource(definition, resource, priority) {
  const key = resourceKey(definition, resource);
  const weight = resourceWeight(resource);
  const cached = resourceEntries.get(key);
  if (cached && cached.state === READINESS.READY) {
    cached.lastAccessAt = now();
    if (PRIORITY_RANK[priority] < PRIORITY_RANK[cached.priority]) cached.priority = priority;
    return Promise.resolve(cached);
  }
  if (cached && cached.state === READINESS.FAILED && cached.retryAfter && cached.retryAfter > now()) {
    return Promise.resolve(cached);
  }
  // A skip is not cached as terminal. Skips such as `current-route`,
  // `speculative-audio-deferred` and a capacity deferral depend on where the
  // visitor is and on the current plan, so the same resource must be
  // re-evaluated when either changes.

  const inflight = resourceInflight.get(key);
  if (inflight) return inflight.promise;

  const refusal = admissionRefusal(definition, priority, weight);
  if (refusal) {
    // A stale skip or expired failure from an earlier attempt is not a retained
    // resource. Drop it unless a lease still protects it, so a refusal cannot
    // leave dead weight in the capacity accounting.
    if (cached && cached === resourceEntries.get(key) && !isPinned(key)) {
      resourceEntries.delete(key);
    }
    const rejected = {
      key,
      kind: resource.kind,
      label: resourceLabel(resource),
      state: READINESS.SKIPPED,
      reason: refusal,
      attempts: 0,
      weightBytes: weight,
      priority,
      definitionId: definition.id,
      updatedAt: now(),
    };
    recordRejection(key, rejected);
    return Promise.resolve(rejected);
  }
  rejectedEntries.delete(key);

  const entry = {
    key,
    kind: resource.kind,
    label: resourceLabel(resource),
    state: READINESS.QUEUED,
    attempts: cached?.state === READINESS.QUEUED ? cached.attempts : 0,
    weightBytes: weight,
    priority,
    definitionId: definition.id,
    lastAccessAt: now(),
    updatedAt: now(),
  };
  resourceEntries.set(key, entry);

  const job = {
    key,
    resource,
    definition,
    entry,
    priority,
    sequence: jobSequence++,
    controller: typeof AbortController === 'function' ? new AbortController() : { signal: undefined },
  };
  const promise = new Promise((resolve) => {
    job.settle = resolve;
  });
  resourceInflight.set(key, { job, promise });
  queue.push(job);
  queue.sort((first, second) => {
    const rank = PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority];
    return rank !== 0 ? rank : first.sequence - second.sequence;
  });
  pump();
  return promise;
}

/* ------------------------------------------------------------------------- *
 * Experience preparation
 * ------------------------------------------------------------------------- */

function snapshotResources(definition, keys) {
  return keys.map((key) => {
    const entry = resourceEntries.get(key) ?? rejectedEntries.get(key);
    return {
      key,
      kind: entry?.kind ?? 'unknown',
      label: entry?.label ?? key,
      state: entry?.state ?? READINESS.IDLE,
      attempts: entry?.attempts ?? 0,
      error: entry?.error,
      reason: entry?.reason,
    };
  });
}

function publishSnapshot(id, snapshot) {
  experienceSnapshots.set(id, snapshot);
  return snapshot;
}

function failedDefinitionSnapshot(id, error, version = 0) {
  return publishSnapshot(id, {
    id,
    version,
    state: READINESS.FAILED,
    reason: error,
    resources: [],
    partial: false,
    startedAt: now(),
    readyAt: null,
  });
}

async function runExperience(definition, priority, trigger) {
  const keys = definition.resources.map((resource) => resourceKey(definition, resource));
  publishSnapshot(definition.id, {
    id: definition.id,
    version: definition.version,
    state: READINESS.PREPARING,
    reason: trigger,
    resources: snapshotResources(definition, keys),
    partial: false,
    startedAt: now(),
    readyAt: null,
  });

  for (const dependency of definition.dependsOn) {
    const dependencySnapshot = await prepareExperience(dependency, {
      priority,
      trigger: `dependency:${definition.id}`,
    });
    if (dependencySnapshot.state === READINESS.FAILED) {
      return publishSnapshot(definition.id, {
        id: definition.id,
        version: definition.version,
        state: READINESS.FAILED,
        reason: `dependency-failed:${dependency}`,
        resources: snapshotResources(definition, keys),
        partial: false,
        startedAt: now(),
        readyAt: null,
      });
    }
  }

  const deferredForBackground = new Set();
  const requests = [];
  for (const resource of definition.resources) {
    if (priority === PREPARE_PRIORITY.BACKGROUND && resource.background === false) {
      deferredForBackground.add(resourceKey(definition, resource));
      continue;
    }
    requests.push(requestResource(definition, resource, priority));
  }

  // Republish once the resource entries exist so a consumer polling readiness
  // sees each resource move from queued to preparing/fetched instead of a stale
  // idle snapshot for the whole run.
  publishSnapshot(definition.id, {
    id: definition.id,
    version: definition.version,
    state: READINESS.PREPARING,
    reason: trigger,
    resources: snapshotResources(definition, keys),
    partial: deferredForBackground.size > 0,
    startedAt: now(),
    readyAt: null,
  });

  const entries = await Promise.all(requests);
  const failed = entries.filter((entry) => entry.state === READINESS.FAILED);
  const skipped = entries.filter((entry) => entry.state === READINESS.SKIPPED);
  const partial = deferredForBackground.size > 0 || skipped.length > 0;

  return publishSnapshot(definition.id, {
    id: definition.id,
    version: definition.version,
    state: failed.length > 0 ? READINESS.FAILED : READINESS.READY,
    reason: failed.length > 0 ? 'resource-failed' : trigger,
    resources: snapshotResources(definition, keys),
    partial,
    startedAt: now(),
    readyAt: failed.length > 0 ? null : now(),
    retryAfter: failed.length > 0 ? now() + FAILED_RETRY_COOLDOWN_MS : null,
  });
}

/**
 * Prepares one registered experience. Concurrent calls for the same experience
 * share one run, resources shared with other experiences share one request, and
 * a repeated call after readiness returns the existing snapshot without doing
 * any work.
 *
 * @param {string} id Registered experience id.
 * @param {{ priority?: string, trigger?: string }} [options]
 * @returns {Promise<object>} The experience readiness snapshot.
 */
export function prepareExperience(id, { priority = PREPARE_PRIORITY.CRITICAL, trigger = 'manual' } = {}) {
  if (typeof window === 'undefined') {
    return Promise.resolve({
      id,
      version: 0,
      state: READINESS.IDLE,
      reason: 'server',
      resources: [],
      partial: false,
      startedAt: null,
      readyAt: null,
    });
  }

  const definition = definitions.get(id);
  if (!definition) return Promise.resolve(failedDefinitionSnapshot(id, 'unknown-experience'));

  const cached = experienceSnapshots.get(id);
  if (
    cached &&
    cached.state === READINESS.FAILED &&
    cached.retryAfter &&
    cached.retryAfter > now()
  ) {
    // The failure was already reported. Returning the failed snapshot keeps a
    // pointerover/focusin/pointerdown burst from issuing an adapter request per
    // event against an asset that just failed. retryExperience bypasses this.
    return Promise.resolve(cached);
  }
  if (
    cached &&
    cached.state === READINESS.READY &&
    (cached.partial !== true || priority === PREPARE_PRIORITY.BACKGROUND)
  ) {
    // A background run deliberately leaves heavy assets for the route/intent
    // run; a later critical request must still prepare them. Ready resources
    // inside that run are reused, so only the deferred work repeats.
    return Promise.resolve(cached);
  }

  const inFlight = experienceRuns.get(id);
  if (inFlight) {
    if (PRIORITY_RANK[priority] < PRIORITY_RANK[inFlight.priority]) {
      // A background run defers `background: false` resources and publishes a
      // partial snapshot. A committed caller must not inherit that result, so
      // run once more at the higher priority after the current run settles.
      return inFlight.promise.then(() => prepareExperience(id, { priority, trigger }));
    }
    return inFlight.promise;
  }
  if (preparingExperiences.has(id)) {
    return Promise.resolve(failedDefinitionSnapshot(id, 'dependency-cycle', definition.version));
  }

  if (!releaseRegistration) {
    releaseRegistration = registerReleasableResource((reason) => {
      releaseAllPreparedResources(reason);
    });
  }

  preparingExperiences.add(id);
  const run = runExperience(definition, priority, trigger).finally(() => {
    preparingExperiences.delete(id);
    experienceRuns.delete(id);
  });
  experienceRuns.set(id, { promise: run, priority });
  return run;
}

/**
 * Prepares a short list of likely next experiences once the page has spare
 * capacity. The count follows the adaptive plan: one on a constrained device,
 * two on a measured moderate connection and three on a capable connection. A
 * Save-Data or slow connection prepares nothing. Already prepared experiences
 * are skipped, so revisits do no work.
 *
 * @param {string[]} experienceIds Ordered by likelihood.
 * @param {{ maxExperiences?: number, trigger?: string }} [options]
 * @returns {() => void} Cancels an idle preparation that has not started.
 */
export function prepareExperiencesWhenIdle(experienceIds, { maxExperiences, trigger = 'idle' } = {}) {
  if (typeof window === 'undefined' || !Array.isArray(experienceIds) || experienceIds.length === 0) {
    return () => {};
  }
  if (getAdaptivePlan()?.prefetch === 'none') return () => {};

  const plan = getAdaptivePlan();
  const limit =
    maxExperiences ??
    (plan.tier === 'constrained' ? 1 : plan.networkClass === 'moderate' ? 2 : 3);

  let cancelled = false;
  const cancelIdle = whenIdle(() => {
    if (cancelled) return;
    const ids = experienceIds.filter((id) => !isExperiencePrepared(id)).slice(0, Math.max(1, limit));
    for (const id of ids) {
      void prepareExperience(id, { priority: PREPARE_PRIORITY.BACKGROUND, trigger });
    }
  }, { timeout: IDLE_TIMEOUT_MS });

  return () => {
    cancelled = true;
    cancelIdle();
  };
}

/**
 * Runs a callback in an idle period, with a bounded timeout so the work still
 * happens when the browser never reports a genuinely idle frame.
 *
 * @param {() => void} callback
 * @param {{ timeout?: number }} [options]
 * @returns {() => void} Cancels the callback if it has not run yet.
 */
export function whenIdle(callback, { timeout = IDLE_TIMEOUT_MS } = {}) {
  const windowObject = getWindow();
  if (!windowObject || typeof callback !== 'function') return () => {};
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    callback();
  };

  if (typeof windowObject.requestIdleCallback === 'function') {
    const handle = windowObject.requestIdleCallback(run, { timeout });
    return () => {
      cancelled = true;
      if (typeof windowObject.cancelIdleCallback === 'function') {
        windowObject.cancelIdleCallback(handle);
      }
    };
  }

  const handle = /* DevSkim: ignore DS172411 */ windowObject.setTimeout(run, Math.min(timeout, 300));
  return () => {
    cancelled = true;
    windowObject.clearTimeout(handle);
  };
}

/**
 * Runs a callback once the page has finished loading and its most important
 * paint has stopped moving. `load` alone is not enough: on a slow connection the
 * largest-contentful-paint image can still be decoding after `load`, and an idle
 * callback can fire in that window. This waits for `load` plus a quiet period
 * after the last LCP candidate and the last completed resource, so scheduled
 * preparation cannot add requests or main-thread work while the page is still
 * settling.
 *
 * The wait is bounded so preparation still starts on a page that never reports
 * an LCP entry, and the returned cancel function removes every observer and
 * timer.
 *
 * @param {() => void} callback
 * @param {{ quietMs?: number, maxWaitMs?: number }} [options]
 * @returns {() => void} Cancels the callback if it has not run yet.
 */
export function whenPageSettled(callback, { quietMs = 600, maxWaitMs = 20_000 } = {}) {
  const windowObject = getWindow();
  if (!windowObject || typeof callback !== 'function') return () => {};
  const perf = windowObject.performance;
  if (!perf || typeof perf.now !== 'function') {
    return whenIdle(callback, { timeout: IDLE_TIMEOUT_MS });
  }

  let cancelled = false;
  let finished = false;
  let lastActivity = perf.now();
  let lastLcp = 0;
  const observers = [];
  const startedAt = lastActivity;

  const touch = () => {
    if (!finished && !cancelled) lastActivity = perf.now();
  };

  const observe = (type, onEntry) => {
    if (typeof windowObject.PerformanceObserver !== 'function') return;
    try {
      const observer = new windowObject.PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (!entries || entries.length === 0) return;
        for (const entry of entries) onEntry(entry);
        touch();
      });
      observer.observe({ type, buffered: true });
      observers.push(observer);
    } catch {
      // An unsupported entry type must not block scheduling; the readyState and
      // bounded wait below still provide a safe lower bound.
    }
  };

  observe('largest-contentful-paint', (entry) => {
    lastLcp = Math.max(lastLcp, Number(entry.startTime) || 0);
  });
  observe('resource', () => {});

  let poll = 0;
  let cap = 0;
  const cleanup = () => {
    for (const observer of observers) {
      try {
        observer.disconnect();
      } catch {
        // Ignore a disconnect from a browser that already tore it down.
      }
    }
    observers.length = 0;
    windowObject.clearInterval(poll);
    windowObject.clearTimeout(cap);
  };

  const finish = () => {
    if (finished || cancelled) return;
    finished = true;
    cleanup();
    callback();
  };

  const evaluate = () => {
    if (finished || cancelled) return;
    if (windowObject.document?.readyState !== 'complete') return;
    const current = perf.now();
    // The small floor keeps a cached revisit from preparing in the same task as
    // hydration; the LCP and resource timestamps keep slow connections honest.
    const quietSince = Math.max(startedAt + 250, lastLcp, lastActivity);
    if (current - quietSince >= quietMs) finish();
  };

  poll = windowObject.setInterval(evaluate, 100);
  cap = windowObject.setTimeout(finish, maxWaitMs);

  return () => {
    cancelled = true;
    cleanup();
  };
}

/* ------------------------------------------------------------------------- *
 * Readiness
 * ------------------------------------------------------------------------- */

/**
 * Returns the latest readiness snapshot for an experience. Resource entries are
 * merged from live state so a caller can observe `fetched` or `initialized`
 * while preparation is still running.
 *
 * @returns {object|null}
 */
export function getExperienceReadiness(id) {
  const snapshot = experienceSnapshots.get(id);
  if (!snapshot) return null;
  const definition = definitions.get(id);
  if (!definition) return snapshot;
  return {
    ...snapshot,
    resources: snapshotResources(
      definition,
      definition.resources.map((resource) => resourceKey(definition, resource)),
    ),
  };
}

/** @returns {boolean} True when the experience's resources are all ready. */
export function isExperiencePrepared(id) {
  return (
    experienceSnapshots.get(id)?.state === READINESS.READY &&
    experienceSnapshots.get(id)?.partial === false
  );
}

/**
 * Clears failed resource state for an experience and prepares it again. Ready
 * resources are reused, so a retry only repeats what failed.
 *
 * @param {string} id
 * @param {{ priority?: string }} [options]
 * @returns {Promise<object>}
 */
export function retryExperience(id, { priority = PREPARE_PRIORITY.CRITICAL } = {}) {
  const definition = definitions.get(id);
  if (!definition) return Promise.resolve(failedDefinitionSnapshot(id, 'unknown-experience'));
  for (const resource of definition.resources) {
    const key = resourceKey(definition, resource);
    const entry = resourceEntries.get(key);
    rejectedEntries.delete(key);
    if (!entry || entry.state === READINESS.FAILED) deleteEntry(key, 'retry');
  }
  experienceSnapshots.delete(id);
  return prepareExperience(id, { priority, trigger: 'retry' });
}

/* ------------------------------------------------------------------------- *
 * Active-experience protection
 * ------------------------------------------------------------------------- */

/**
 * Marks an experience as active (a reveal, a cinematic, a paid animation). While
 * any experience is active, queued background preparation does not start; it
 * resumes when the returned release function runs. Critical and intent
 * preparation still run so a visitor's committed navigation is never stalled.
 *
 * @param {string} [label]
 * @returns {() => void} Idempotent release.
 */
export function beginActiveExperience(label = 'experience') {
  if (typeof window === 'undefined') return () => {};
  activeExperiences += 1;
  // When the caller names a registered experience, its prepared records are
  // leased for the active period, so no release, pressure sweep, version change
  // or capacity decision can dispose what the visitor is using.
  const lease = definitions.has(label) ? leaseExperienceResources(label, 'active-experience') : null;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (lease) lease();
    activeExperiences = Math.max(0, activeExperiences - 1);
    if (activeExperiences === 0) pump();
  };
}

/** @returns {boolean} Whether any experience currently holds the foreground. */
export function isExperienceActive() {
  return activeExperiences > 0;
}

/* ------------------------------------------------------------------------- *
 * Ownership and diagnostics
 * ------------------------------------------------------------------------- */

/**
 * Leases every resource identity of a registered experience for as long as an
 * active experience is using it. Leases are counted, so two active owners can
 * hold the same resource and neither release disposes it early.
 *
 * @param {string} id Registered experience id.
 * @param {string} [label]
 * @returns {() => void} Idempotent lease release.
 */
export function leaseExperienceResources(id, label = 'experience') {
  if (typeof window === 'undefined') return () => {};
  const definition = definitions.get(id);
  if (!definition) return () => {};

  const leaseId = ++leaseSequence;
  const keys = new Set(definition.resources.map((resource) => resourceKey(definition, resource)));
  leases.set(leaseId, { id, label, keys });
  for (const key of keys) pinnedKeys.set(key, (pinnedKeys.get(key) ?? 0) + 1);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    leases.delete(leaseId);
    for (const key of keys) {
      const remaining = (pinnedKeys.get(key) ?? 1) - 1;
      if (remaining > 0) pinnedKeys.set(key, remaining);
      else pinnedKeys.delete(key);
    }
    sweepRetiredEntries('lease-released');
  };
}

/**
 * Returns a payload-free view of retention against the current tier's limits.
 *
 * @returns {object}
 */
export function getResourcePoolStats() {
  const capacity = planCapacity();
  const usage = poolUsage();
  return Object.freeze({
    entries: usage.entries,
    queued: queue.length,
    running: runningJobs,
    residentBytes: usage.bytes,
    pinnedEntries: usage.pinned,
    retiredEntries: usage.retired,
    leases: leases.size,
    rejected: rejectedEntries.size,
    capacity: Object.freeze({
      maxEntries: capacity.maxEntries,
      maxBytes: capacity.maxBytes,
      maxQueue: capacity.maxQueue,
      maxPendingPerExperience: capacity.maxPendingPerExperience,
    }),
  });
}

/* ------------------------------------------------------------------------- *
 * Release
 * ------------------------------------------------------------------------- */

/**
 * Drops the hub's prepared state for one experience. HTTP cache entries are
 * untouched, so a later preparation is normally a cache hit; this releases the
 * decoded image references the hub itself holds.
 *
 * @param {string} id
 * @param {string} [reason]
 * @returns {number} Number of resources released.
 */
export function releaseExperienceResources(id, reason = 'manual') {
  const definition = definitions.get(id);
  if (!definition) return 0;
  let released = 0;
  for (const resource of definition.resources) {
    const key = resourceKey(definition, resource);
    rejectedEntries.delete(key);
    if (deleteEntry(key, reason)) released += 1;
  }
  if (released > 0) experienceSnapshots.delete(id);
  return released;
}

/**
 * Drops every settled prepared entry. Registered with the existing adaptive
 * release registry, so it runs on memory pressure without a new memory detector.
 * A queued or in-flight preparation is left alone rather than cancelled under a
 * renderer.
 *
 * @param {string} [reason]
 * @returns {number} Number of resources released.
 */
export function releaseAllPreparedResources(reason = 'manual') {
  let released = 0;
  for (const key of [...resourceEntries.keys()]) {
    if (deleteEntry(key, reason)) released += 1;
  }
  rejectedEntries.clear();
  if (released > 0) {
    for (const [id, snapshot] of experienceSnapshots) {
      if (snapshot.state !== READINESS.PREPARING) experienceSnapshots.delete(id);
    }
  }
  return released;
}

/**
 * Test-only reset: clears definitions, entries, queue and timers that belong to
 * this module. It never touches the adaptive layer, audio or the browser cache.
 */
export function resetResourceReadiness() {
  for (const job of queue) {
    if (typeof job.settle === 'function') {
      job.settle({ ...job.entry, state: READINESS.IDLE });
    }
  }
  queue = [];
  definitions.clear();
  for (const [key, entry] of resourceEntries) {
    resourceEntries.delete(key);
    disposeEntry(entry, 'reset');
  }
  rejectedEntries.clear();
  leases.clear();
  pinnedKeys.clear();
  leaseSequence = 0;
  resourceInflight.clear();
  experienceRuns.clear();
  experienceSnapshots.clear();
  preparingExperiences.clear();
  loadedImageIdentities.clear();
  runningJobs = 0;
  activeExperiences = 0;
  jobSequence = 0;
  teardownPlanSubscription();
  if (releaseRegistration) {
    releaseRegistration();
    releaseRegistration = null;
  }
  if (retryTimer) {
    const windowObject = getWindow();
    if (windowObject) windowObject.clearTimeout(retryTimer);
    retryTimer = 0;
    retryDeadline = 0;
  }
  routePrefetch = null;
}
