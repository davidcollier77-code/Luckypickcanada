/**
 * Event audio cue map for the Lucky Meter cinematic.
 *
 * The WebGL event engine emits a small vocabulary of action cues. This module
 * turns each cue into the exact Howler layers that should play, so the mapping,
 * the mix and the layering are data that can be tested deterministically
 * without a browser audio context.
 *
 * Rules the map encodes:
 *
 *   - One action, one sound. A launch whistles, a burst pops, a strike cracks,
 *     a burnout thuds, and thunder follows a strike rather than preceding it.
 *   - Regular firework bursts are a single crisp pop. The finale deliberately
 *     layers a deep boom with a slower, lower body layer so it is audibly
 *     bigger and fuller than any of the pops that came before it.
 *   - Thunder is a separate, delayed cue sized by the strike's apparent depth,
 *     so far lightning arrives later and softer than close lightning.
 *   - Jitter is small, opt-in per cue, and neutral at random() === 0.5.
 */

/** Sound keys must exist in `DailyResonance`'s Howler set. */
export const EVENT_CUE_LAYERS = Object.freeze({
  // The spaces between the editable stages. Every cue reuses a recording the
  // site already ships, so no new licence or download is introduced:
  //   wheel-start  the existing charge-up
  //   wheel-stop   the existing crystal reveal, pitched up into a soft stop
  //   segment-open the existing leaf recording, as a short metallic slide
  //   colour-pour  the existing sparkle recording, slowed into a pour
  //   message-write / spark-write  the leaf recording at two soft rates
  //
  // The arrival breeze is visual only: browsers block audio before the visitor
  // interacts, so a whoosh at page load could never play reliably.
  //   dock-arrive  the existing chime
  'wheel-start': [{ sound: 'buildup', rate: 0.94, volume: 0.62 }],
  'wheel-stop': [{ sound: 'segmentOpen', rate: 0.78, volume: 0.34 }],
  'segment-open': [{ sound: 'segmentOpen', rate: 1.04, volume: 0.42 }],
  'colour-pour': [{ sound: 'colourPour', rate: 0.86, volume: 0.4 }],
  'message-write': [{ sound: 'segmentOpen', rate: 1.3, volume: 0.2, jitter: 0.03 }],
  'spark-write': [{ sound: 'segmentOpen', rate: 0.9, volume: 0.26, jitter: 0.03 }],
  'dock-arrive': [{ sound: 'dockChime', rate: 1, volume: 0.24 }],

  // Meteors: the whoosh belongs to the moment the head enters the frame, and a
  // short thud belongs to the burnout at the end of its pass.
  'meteor-enter': [{ sound: 'impactMeteor', rate: 1.22, volume: 0.5, jitter: 0.03 }],
  'meteor-impact': [{ sound: 'impactLightning', rate: 1.55, volume: 0.24 }],
  'meteor-finale': [{ sound: 'impactMeteor', rate: 0.68, volume: 0.95 }],
  'meteor-finale-impact': [{ sound: 'impactLightning', rate: 0.88, volume: 0.4 }],

  // Lightning: the strike cracks immediately; thunder is queued by the engine.
  lightning: [{ sound: 'impactLightning', rate: 1, volume: 0.55 }],
  'lightning-finale': [{ sound: 'impactLightning', rate: 0.8, volume: 1 }],
  'thunder-near': [{ sound: 'thunderRumble', rate: 1.06, volume: 0.3 }],
  'thunder-far': [{ sound: 'thunderRumble', rate: 0.9, volume: 0.2 }],
  'thunder-finale': [{ sound: 'thunderRumble', rate: 0.84, volume: 0.34 }],

  // Fireworks: whistle on launch, a crisp pop on the burst.
  'firework-launch': [{ sound: 'fireworkLaunch', rate: 1, volume: 0.4, jitter: 0.04 }],
  'firework-burst': [{ sound: 'fireworkBurst', rate: 1.08, volume: 0.55, jitter: 0.04 }],
  'firework-burst-silver': [
    { sound: 'fireworkBurstAlt', rate: 1.14, volume: 0.44, jitter: 0.04 },
  ],
  // The finale's launch whistle is deeper and louder than an opening rocket.
  'firework-finale': [{ sound: 'fireworkLaunch', rate: 0.76, volume: 0.72 }],
  'firework-willow': [{ sound: 'willowCrackle', rate: 1, volume: 0.8 }],

  // Finale: two layers. The recorded boom carries the weight; the second layer
  // is the same burst recording slowed down, which adds body below the pop
  // without raising the peak into clipping.
  'finale-boom': [
    { sound: 'finaleBoom', rate: 1, volume: 0.96 },
    { sound: 'fireworkBurst', rate: 0.72, volume: 0.5 },
  ],
});

/** Every cue the engine is allowed to emit. */
export const EVENT_CUE_NAMES = Object.freeze(Object.keys(EVENT_CUE_LAYERS));

/** Sounds that outlive a single action and must be faded when the stage ends. */
export const SUSTAINED_EVENT_SOUNDS = Object.freeze([
  'thunderRumble',
  'willowCrackle',
  'finaleBoom',
]);

/** Thunder follows the flash by a distance-dependent delay instead of stacking on it. */
export const THUNDER_DELAY_MS = Object.freeze({
  near: 260,
  far: 980,
  finale: 320,
});

/**
 * Delay from a lightning strike's flash to its thunder.
 *
 * @param {number} depth The strike's apparent depth; larger is closer.
 * @param {boolean} [isFinale] The huge close strike uses the shortest delay.
 * @returns {number} Milliseconds.
 */
export function getThunderDelayMs(depth, isFinale = false) {
  if (isFinale) return THUNDER_DELAY_MS.finale;
  const value = Number(depth);
  const normalised = Number.isFinite(value) ? Math.max(0, Math.min(1, (value - 0.4) / 1.15)) : 0.5;
  return Math.round(
    THUNDER_DELAY_MS.far + (THUNDER_DELAY_MS.near - THUNDER_DELAY_MS.far) * normalised,
  );
}

/** Near strikes get the closer, louder rumble. */
export function getThunderCue(depth, isFinale = false) {
  if (isFinale) return 'thunder-finale';
  return Number(depth) >= 1.1 ? 'thunder-near' : 'thunder-far';
}

/**
 * Resolves a cue to its playable layers.
 *
 * @param {string} cue Cue name emitted by the event engine.
 * @param {() => number} [random] Injectable source for the opt-in rate jitter.
 * @returns {{ sound: string, rate: number, volume: number }[]} Empty when the cue is unknown.
 */
export function getCueLayers(cue, random = Math.random) {
  const layers = EVENT_CUE_LAYERS[cue];
  if (!layers) return [];
  return layers.map((layer) => {
    const jitter = layer.jitter ?? 0;
    const value = typeof random === 'function' ? random() : 0.5;
    const signed = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) - 0.5 : 0;
    return {
      sound: layer.sound,
      rate: layer.rate * (1 + signed * 2 * jitter),
      volume: layer.volume,
    };
  });
}

/** True when the engine may emit this cue. */
export function isEventCue(cue) {
  return typeof cue === 'string' && Object.prototype.hasOwnProperty.call(EVENT_CUE_LAYERS, cue);
}

/**
 * Sum of a cue's layer volumes. Used to keep the finale audibly stronger than
 * an opening pop and to keep every cue inside a safe mix budget.
 */
export function getCueLoudness(cue) {
  return getCueLayers(cue, () => 0.5).reduce((total, layer) => total + layer.volume, 0);
}
