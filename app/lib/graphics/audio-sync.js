/**
 * Synchronised audio for creative experiences.
 *
 * A visual timeline and a sound cue have to agree without either owning the
 * other. This helper sits between them: a feature registers named cues, asks for
 * one at a visual beat, and the helper guarantees a cue plays at most once per
 * run, never after teardown, and never at all when audio is muted or the
 * visitor prefers reduced motion.
 *
 * It does not load or unlock audio. Cue resolution is supplied by the caller,
 * so it reuses the existing Howler/Web Audio path (and the hub, which prepares
 * those sounds) instead of adding a second audio system.
 */

/**
 * @param {{
 *   resolve?: (name: string) => any,
 *   shouldPlay?: () => boolean,
 *   onError?: (error: unknown, name: string) => void,
 * }} [options]
 * @returns {{
 *   cue: (name: string, options?: { repeat?: boolean, volume?: number }) => boolean,
 *   attach: (timeline: any, schedule?: Array<{ at: number|string, cue: string }>) => void,
 *   // `timeline` is a `createMotionTimeline` wrapper or a raw GSAP timeline.
 *   reset: () => void,
 *   dispose: () => void,
 * }}
 */
export function createAudioSync({ resolve, shouldPlay, onError } = {}) {
  const played = new Set();
  let disposed = false;

  function allowed() {
    if (disposed) return false;
    if (typeof shouldPlay === 'function') {
      try {
        return shouldPlay() !== false;
      } catch {
        return false;
      }
    }
    return true;
  }

  function cue(name, { repeat = false } = {}) {
    if (typeof name !== 'string' || !name) return false;
    if (!allowed()) return false;
    if (!repeat && played.has(name)) return false;
    played.add(name);

    if (typeof resolve !== 'function') return false;
    try {
      const sound = resolve(name);
      if (!sound) return false;
      if (typeof sound.play === 'function') sound.play();
      return true;
    } catch (error) {
      // A blocked or unavailable sound must never break the visual sequence.
      if (typeof onError === 'function') onError(error, name);
      return false;
    }
  }

  return {
    cue,
    /**
     * Places every scheduled cue on a motion timeline. Positions are passed
     * through unchanged, so labels and seconds both work.
     *
     * A `createMotionTimeline` wrapper takes `(callback, position)`; a raw GSAP
     * timeline takes `(callback, params, position)`, so it needs the empty
     * params array or the position would be spread as the argument list.
     */
    attach(timeline, schedule = []) {
      if (!timeline || typeof timeline.call !== 'function') return;
      const isWrapper = timeline.isMotionTimeline === true;
      for (const entry of schedule) {
        if (!entry || typeof entry.cue !== 'string') continue;
        if (isWrapper) timeline.call(() => cue(entry.cue), entry.at);
        else timeline.call(() => cue(entry.cue), [], entry.at);
      }
    },
    reset() {
      played.clear();
    },
    dispose() {
      disposed = true;
      played.clear();
    },
  };
}
