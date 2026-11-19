/**
 * Sound-reactive visuals: the bridge between the sound a visitor actually
 * hears and the creative layer's particles, lights and animated values.
 *
 * The site already owns its audio system — Howler playing same-origin
 * recordings through Web Audio, prepared by the resource-readiness hub. This
 * module adds no sound, no player and no second audio system. It taps the
 * existing mix with one `AnalyserNode` and turns the measured signal into a
 * small, smoothed envelope a renderer can read every frame:
 *
 *   { level, bass, mids, highs, transient, peak, beat, available }
 *
 * A feature then binds that envelope to what it already animates:
 *
 *   reactive.bindLightRig(rig);                       // event flashes + breathing
 *   reactive.bindParticleField(motes);                 // density/opacity follows the mix
 *   reactive.bindValue(material, 'emissiveIntensity'); // any numeric property
 *   reactive.onBeat((strength) => { … });              // discrete accents
 *
 * Rules it inherits from the rest of the layer:
 *   - It never creates an `AudioContext`. Analysis attaches to the audio graph
 *     Howler already created, so autoplay policy, unlock and volume stay exactly
 *     as they are.
 *   - The tap is silent: the analyser is fed through a zero-gain branch, so the
 *     audible mix is untouched.
 *   - Reduced motion switches reactivity off entirely; a static or
 *     CSS-animated visual never starts analysing sound.
 *   - A hidden page freezes the envelope instead of reading it.
 *   - Nothing here throws: a missing analyser, a blocked context or a bad
 *     binding resolves to a neutral envelope (all zeros) and the visual simply
 *     keeps its authored resting state.
 *
 * Known limitation: Howler's `html5: true` sounds play through a media element
 * and bypass Web Audio, so they cannot be analysed without re-routing audio the
 * site already ships. Web Audio cues — including the Lucky Meter sound set and
 * the Crystal Ball sounds — are measured normally.
 */

import { isPageVisible, prefersReducedMotion } from '../graphics-capabilities.js';

/** Envelope values a binding can read. */
export const REACTIVITY_BAND = Object.freeze({
  LEVEL: 'level',
  BASS: 'bass',
  MIDS: 'mids',
  HIGHS: 'highs',
  TRANSIENT: 'transient',
  PEAK: 'peak',
});

const DEFAULT_FFT_SIZE = 64;
const DEFAULT_SMOOTHING = 0.8;
// Fast rise, slow fall: a sound should appear at once and fade naturally.
const DEFAULT_ATTACK = 0.45;
const DEFAULT_RELEASE = 0.12;
const DEFAULT_BEAT_THRESHOLD = 0.16;
const BEAT_COOLDOWN_MS = 140;
const TRANSIENT_DECAY_SECONDS = 0.22;
const ATTACH_RETRY_MS = 750;
const MAX_ATTACH_ATTEMPTS = 40;
const MAX_STEP_SECONDS = 0.25;

/**
 * Whether this browser can analyse audio at all. Reads the constructor only;
 * no context, node or graph is created.
 *
 * @returns {boolean}
 */
export function supportsAudioAnalysis() {
  if (typeof window === 'undefined') return false;
  const Constructor = window.AudioContext || window.webkitAudioContext;
  return (
    typeof Constructor === 'function' &&
    typeof Constructor.prototype?.createAnalyser === 'function'
  );
}

/* ------------------------------------------------------------------------- *
 * Existing-audio tap
 * ------------------------------------------------------------------------- */

// One analyser is shared by the whole page: a second tap on the same mix would
// add a second zero-gain branch and duplicate the analysis work for nothing.
let sharedGraph = null;
let sharedGraphPromise = null;
// How many live reactive objects hold the shared tap. The branch is released
// only when the last one disposes, so one consumer unmounting cannot silence
// another consumer's analysis.
let sharedTapHolders = 0;

function retainSharedTap() {
  sharedTapHolders += 1;
}

function releaseSharedTap() {
  sharedTapHolders = Math.max(0, sharedTapHolders - 1);
  if (sharedTapHolders === 0) releaseHowlerAnalyser();
}

/**
 * Taps the audio graph Howler already built and returns a shared `AnalyserNode`.
 *
 * Howler creates its context lazily (usually on the visitor's first gesture), so
 * a call before then resolves `null`; `createAudioReactive` retries on a throttle
 * until the graph exists.
 *
 * The branch is `masterGain → analyser → silent gain (0) → destination`. The
 * zero gain keeps the existing mix exactly as it is, and the path to the
 * destination is what makes the browser pull the analyser every render block.
 *
 * @param {{ fftSize?: number, smoothing?: number }} [options]
 * @returns {Promise<AnalyserNode|null>}
 */
export function attachHowlerAnalyser({ fftSize = DEFAULT_FFT_SIZE, smoothing = DEFAULT_SMOOTHING } = {}) {
  if (sharedGraph) return Promise.resolve(sharedGraph.analyser);
  if (sharedGraphPromise) return sharedGraphPromise;

  sharedGraphPromise = import('howler')
    .then(({ Howler }) => {
      const context = Howler?.ctx;
      const master = Howler?.masterGain;
      if (!context || !master || typeof context.createAnalyser !== 'function') return null;

      const analyser = context.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;

      let silent = null;
      try {
        silent = context.createGain();
        silent.gain.value = 0;
        master.connect(analyser);
        analyser.connect(silent);
        silent.connect(context.destination);
      } catch {
        try {
          analyser.disconnect();
        } catch {
          // Nothing was connected.
        }
        return null;
      }

      sharedGraph = { analyser, context, master, silent };
      return analyser;
    })
    .catch(() => null)
    .finally(() => {
      sharedGraphPromise = null;
    });

  return sharedGraphPromise;
}

/**
 * Releases the shared tap. The audio itself is untouched: only the extra
 * analysis branch is disconnected. Safe to call when nothing is attached.
 *
 * @returns {boolean} Whether a graph was disconnected.
 */
export function releaseHowlerAnalyser() {
  const graph = sharedGraph;
  sharedGraph = null;
  if (!graph) return false;

  try {
    graph.master.disconnect(graph.analyser);
  } catch {
    // The graph may already be closed.
  }
  try {
    graph.analyser.disconnect();
  } catch {
    // Nothing downstream.
  }
  try {
    graph.silent.disconnect();
  } catch {
    // Nothing downstream.
  }
  return true;
}

/* ------------------------------------------------------------------------- *
 * Envelope
 * ------------------------------------------------------------------------- */

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function createEnvelope(available, reason) {
  return {
    level: 0,
    bass: 0,
    mids: 0,
    highs: 0,
    transient: 0,
    peak: 0,
    beat: false,
    available,
    reason,
  };
}

/**
 * Averages a slice of the frequency bins into a 0–1 band value.
 *
 * @param {Uint8Array} data
 * @param {number} from Inclusive bin index.
 * @param {number} to Exclusive bin index.
 */
function bandAverage(data, from, to) {
  const start = Math.max(0, Math.floor(from));
  const end = Math.min(data.length, Math.ceil(to));
  if (end <= start) return 0;
  let sum = 0;
  for (let index = start; index < end; index += 1) sum += data[index];
  return sum / (end - start) / 255;
}

function maxBin(data) {
  let peak = 0;
  for (let index = 0; index < data.length; index += 1) {
    if (data[index] > peak) peak = data[index];
  }
  return peak / 255;
}

/**
 * Creates a sound-reactive envelope over the existing audio mix.
 *
 * @param {{
 *   analyser?: any,
 *   attach?: () => Promise<any> | any,
 *   autoAttach?: boolean,
 *   fftSize?: number,
 *   smoothing?: number,
 *   attack?: number,
 *   release?: number,
 *   beatThreshold?: number,
 *   sensitivity?: number,
 *   reducedMotion?: boolean,
 *   onError?: (error: unknown) => void,
 * }} [options]
 * @returns {{
 *   readonly available: boolean,
 *   readonly reducedMotion: boolean,
 *   getEnvelope: () => object,
 *   update: (delta?: number) => object,
 *   bindLightRig: (rig: any, options?: object) => () => void,
 *   bindParticleField: (field: any, options?: object) => () => void,
 *   bindValue: (target: any, key: string, options?: object) => () => void,
 *   onBeat: (listener: (strength: number) => void) => () => void,
 *   refresh: () => boolean,
 *   reset: () => void,
 *   dispose: () => void,
 * }}
 */
export function createAudioReactive({
  analyser: providedAnalyser = null,
  attach = attachHowlerAnalyser,
  autoAttach = true,
  fftSize = DEFAULT_FFT_SIZE,
  smoothing = DEFAULT_SMOOTHING,
  attack = DEFAULT_ATTACK,
  release = DEFAULT_RELEASE,
  beatThreshold = DEFAULT_BEAT_THRESHOLD,
  sensitivity = 1,
  reducedMotion,
  onError,
} = {}) {
  const calm = typeof reducedMotion === 'boolean' ? reducedMotion : prefersReducedMotion();
  const envelope = createEnvelope(false, calm ? 'reduced-motion' : 'pending');

  // Only the module's own helper shares a page-level graph that has to be
  // reference counted; an injected analyser is owned by the caller.
  const usesSharedTap = attach === attachHowlerAnalyser;

  let node = providedAnalyser ?? null;
  let disposed = false;
  let attachInFlight = false;
  let attachAttempts = 0;
  let lastAttemptAt = 0;
  let holdsSharedTap = false;
  let data = null;

  const smoothed = { level: 0, bass: 0, mids: 0, highs: 0 };
  let previousLevel = 0;
  let transient = 0;
  let lastBeatAt = 0;

  const binders = new Set();
  const beatListeners = new Set();

  function report(error) {
    if (typeof onError !== 'function') return;
    try {
      onError(error);
    } catch {
      // A reporter that throws must not break the visual.
    }
  }

  function ensureAnalyser() {
    if (node || !autoAttach || disposed || calm || attachInFlight) return;
    if (attachAttempts >= MAX_ATTACH_ATTEMPTS) return;
    const now = Date.now();
    if (lastAttemptAt && now - lastAttemptAt < ATTACH_RETRY_MS) return;

    lastAttemptAt = now;
    attachAttempts += 1;
    attachInFlight = true;
    Promise.resolve()
      .then(() => (typeof attach === 'function' ? attach() : null))
      .then((result) => {
        if (disposed) return;
        node = result?.analyser ?? result ?? null;
        if (node) {
          if (usesSharedTap) {
            retainSharedTap();
            holdsSharedTap = true;
          }
          envelope.available = true;
          envelope.reason = null;
        } else if (attachAttempts >= MAX_ATTACH_ATTEMPTS) {
          envelope.available = false;
          envelope.reason = 'audio-unavailable';
        }
      })
      .catch((error) => {
        report(error);
      })
      .finally(() => {
        attachInFlight = false;
      });
  }

  function measure() {
    const count = Number(node?.frequencyBinCount);
    if (!Number.isFinite(count) || count <= 0) return null;
    if (!data || data.length !== count) data = new Uint8Array(count);

    try {
      node.getByteFrequencyData(data);
    } catch (error) {
      report(error);
      node = null;
      envelope.available = false;
      envelope.reason = 'analysis-failed';
      // The page's audio graph can be closed and rebuilt (a Howler context is
      // torn down on unload). Drop the dead tap and give attachment a fresh
      // budget so the next frame can reconnect instead of staying silent.
      if (holdsSharedTap) {
        holdsSharedTap = false;
        releaseSharedTap();
      }
      attachAttempts = 0;
      lastAttemptAt = 0;
      return null;
    }

    const bassEnd = Math.max(1, Math.round(count * 0.35));
    const midsEnd = Math.max(bassEnd + 1, Math.round(count * 0.75));
    const gain = Number.isFinite(sensitivity) && sensitivity > 0 ? sensitivity : 1;

    return {
      bass: clamp01(bandAverage(data, 0, bassEnd) * gain),
      mids: clamp01(bandAverage(data, bassEnd, midsEnd) * gain),
      highs: clamp01(bandAverage(data, midsEnd, count) * gain),
      level: clamp01(bandAverage(data, 0, count) * gain),
      peak: clamp01(maxBin(data) * gain),
    };
  }

  function applyBindings(beat) {
    for (const binder of binders) {
      try {
        binder(envelope);
      } catch (error) {
        report(error);
      }
    }
    if (!beat) return;
    for (const listener of beatListeners) {
      try {
        listener(envelope.transient);
      } catch (error) {
        report(error);
      }
    }
  }

  /**
   * Advances the envelope by one frame and applies every registered binding.
   * Safe to call before the audio graph exists: the envelope stays neutral.
   *
   * @param {number} [delta] Seconds since the previous update.
   * @returns {object} The live envelope (read it, do not retain and mutate it).
   */
  function update(delta = 1 / 60) {
    if (disposed) return envelope;
    const step =
      Number.isFinite(delta) && delta > 0 ? Math.min(delta, MAX_STEP_SECONDS) : 1 / 60;

    if (calm) {
      transient = 0;
      envelope.transient = 0;
      envelope.beat = false;
      return envelope;
    }

    if (!node) {
      ensureAnalyser();
      if (!node) return envelope;
    }

    // A hidden page has no listener: freeze rather than spend analysis work.
    if (!isPageVisible()) {
      envelope.beat = false;
      return envelope;
    }

    const raw = measure();
    if (!raw) return envelope;

    const fade = (target, previous) => {
      const rate = target > previous ? attack : release;
      return 1 - Math.pow(1 - Math.min(0.99, Math.max(0.01, rate)), step * 60);
    };

    smoothed.level += (raw.level - smoothed.level) * fade(raw.level, smoothed.level);
    smoothed.bass += (raw.bass - smoothed.bass) * fade(raw.bass, smoothed.bass);
    smoothed.mids += (raw.mids - smoothed.mids) * fade(raw.mids, smoothed.mids);
    smoothed.highs += (raw.highs - smoothed.highs) * fade(raw.highs, smoothed.highs);

    const now = Date.now();
    const rise = raw.level - previousLevel;
    let beat = false;
    if (rise > beatThreshold && raw.level > 0.06 && now - lastBeatAt >= BEAT_COOLDOWN_MS) {
      lastBeatAt = now;
      transient = clamp01(0.55 + rise * 2);
      beat = true;
    }
    previousLevel = raw.level;
    // Decay carries the previous frames' value forward; the frame that sets a
    // fresh transient publishes it at full strength.
    if (!beat) transient = Math.max(0, transient - step / TRANSIENT_DECAY_SECONDS);

    envelope.level = clamp01(smoothed.level);
    envelope.bass = clamp01(smoothed.bass);
    envelope.mids = clamp01(smoothed.mids);
    envelope.highs = clamp01(smoothed.highs);
    envelope.peak = raw.peak;
    envelope.transient = transient;
    envelope.beat = beat;
    envelope.available = true;
    envelope.reason = null;

    applyBindings(beat);
    return envelope;
  }

  function addBinder(binder) {
    if (typeof binder !== 'function' || disposed) return () => {};
    binders.add(binder);
    return () => {
      binders.delete(binder);
    };
  }

  return {
    get available() {
      return envelope.available;
    },
    get reducedMotion() {
      return calm;
    },
    getEnvelope() {
      return envelope;
    },
    update,
    /**
     * Flashes the rig on a beat and keeps a gentle glow proportional to the
     * current level. Uses the rig's own `pulse`, so its decay stays authored by
     * `lighting.js` rather than duplicated here.
     */
    bindLightRig(rig, { levelGain = 0.35, beatGain = 1, color = 0xffd479 } = {}) {
      if (!rig || typeof rig.pulse !== 'function') return () => {};
      return addBinder((value) => {
        if (value.transient > 0) rig.pulse(value.transient * beatGain, color);
        if (value.level > 0.02) rig.pulse(value.level * levelGain);
      });
    },
    /**
     * Drives a bounded particle field's intensity. The field keeps its own
     * budget and disposal; only its brightness/spread response changes.
     */
    bindParticleField(field, { base = 0.45, range = 0.85, beatGain = 0.25 } = {}) {
      if (!field || typeof field.setIntensity !== 'function') return () => {};
      return addBinder((value) => {
        field.setIntensity(base + value.level * range + value.transient * beatGain);
      });
    },
    /**
     * Writes one numeric property (emissive intensity, exposure, opacity, scale)
     * from a chosen band, with its own smoothing so a value never jumps on a
     * single loud frame.
     */
    bindValue(target, key, { band = REACTIVITY_BAND.LEVEL, min = 0, max = 1, smoothing: glide = 0.35 } = {}) {
      if (!target || typeof key !== 'string' || !key) return () => {};
      const low = Number.isFinite(min) ? min : 0;
      const high = Number.isFinite(max) ? max : 1;
      const rate = Number.isFinite(glide) ? Math.min(1, Math.max(0.01, glide)) : 0.35;
      let current = null;

      return addBinder((value) => {
        const source = clamp01(value[band]);
        const next = low + (high - low) * source;
        if (current === null) current = next;
        current += (next - current) * rate;
        try {
          target[key] = current;
        } catch (error) {
          report(error);
        }
      });
    },
    onBeat(listener) {
      if (typeof listener !== 'function' || disposed) return () => {};
      beatListeners.add(listener);
      return () => {
        beatListeners.delete(listener);
      };
    },
    /**
     * Tries to attach now instead of waiting for the next frame. A feature that
     * starts audio while its scene is paused calls this so the first frame after
     * playback resumes already has an analyser.
     *
     * @returns {boolean} Whether an analyser is attached.
     */
    refresh() {
      if (disposed || calm) return false;
      if (!node) {
        // A cue can start long after mount. Re-arm the retry budget so a first
        // cue played after the earlier attempts ran out is still measured.
        attachAttempts = 0;
        lastAttemptAt = 0;
        ensureAnalyser();
      }
      return Boolean(node);
    },
    reset() {
      smoothed.level = 0;
      smoothed.bass = 0;
      smoothed.mids = 0;
      smoothed.highs = 0;
      previousLevel = 0;
      transient = 0;
      lastBeatAt = 0;
      envelope.level = 0;
      envelope.bass = 0;
      envelope.mids = 0;
      envelope.highs = 0;
      envelope.transient = 0;
      envelope.peak = 0;
      envelope.beat = false;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      binders.clear();
      beatListeners.clear();
      data = null;
      node = null;
      envelope.beat = false;
      if (holdsSharedTap) {
        holdsSharedTap = false;
        releaseSharedTap();
      }
    },
  };
}
