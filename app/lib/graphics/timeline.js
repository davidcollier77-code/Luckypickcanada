/**
 * Declarative motion timelines powered by GSAP.
 *
 * GSAP is imported only when a timeline is actually created, so a page that
 * never choreographs anything never downloads it. The wrapper exists so every
 * feature inherits the same reduced-motion rule: a reduced-motion visitor gets
 * the *final* state of the timeline immediately, never the animation.
 *
 * A failed import returns `null`; callers keep their CSS transition or static
 * state. This mirrors the toolkit's "fail soft" contract.
 */

import { prefersReducedMotion } from '../graphics-capabilities.js';

/**
 * @param {{
 *   reducedMotion?: boolean,
 *   paused?: boolean,
 *   defaults?: Record<string, unknown>,
 * }} [options]
 * @returns {Promise<null | {
 *   timeline: any,
 *   reducedMotion: boolean,
 *   to: (...args: any[]) => any,
 *   fromTo: (...args: any[]) => any,
 *   add: (...args: any[]) => any,
 *   addLabel: (name: string, position?: any) => any,
 *   call: (callback: () => void, position?: any) => any,
 *   play: () => void,
 *   pause: () => void,
 *   seek: (time: number) => void,
 *   progress: (value: number) => void,
 *   dispose: () => void,
 * }>}
 */
export async function createMotionTimeline({ reducedMotion, paused = true, defaults } = {}) {
  let gsap;
  try {
    ({ gsap } = await import('gsap'));
  } catch {
    return null;
  }
  if (!gsap || typeof gsap.timeline !== 'function') return null;

  const calm = typeof reducedMotion === 'boolean' ? reducedMotion : prefersReducedMotion();
  let timeline;
  try {
    timeline = gsap.timeline({ paused, defaults });
  } catch {
    return null;
  }

  let disposed = false;

  return {
    timeline,
    reducedMotion: calm,
    to: (...args) => timeline.to(...args),
    fromTo: (...args) => timeline.fromTo(...args),
    add: (...args) => timeline.add(...args),
    addLabel: (name, position) => timeline.addLabel(name, position),
    call: (callback, position) => timeline.call(callback, [], position),
    play() {
      if (disposed) return;
      if (calm) {
        // The end state is the accessible presentation: apply it without
        // scheduling any frames.
        timeline.progress(1, false);
        return;
      }
      timeline.play();
    },
    pause() {
      if (disposed) return;
      timeline.pause();
    },
    seek(time) {
      if (disposed) return;
      timeline.seek(time);
    },
    progress(value) {
      if (disposed) return;
      timeline.progress(value);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        timeline.kill();
      } catch {
        // A timeline already killed by its owner needs no further teardown.
      }
    },
  };
}
