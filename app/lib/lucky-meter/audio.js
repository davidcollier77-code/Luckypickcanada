/**
 * The Lucky Meter sound set.
 *
 * Every cue is an existing same-origin recording the site already ships; the
 * redesign adds no new download, licence or provider. The set is created once
 * and shared with the resource-readiness hub, which may warm the opening cues
 * before Start while the adaptive plan allows speculative audio. The
 * celebration cues are created without a preload so route-time preparation
 * does not spend their bytes before the visitor commits; activation asks for
 * them explicitly. Preparation never unlocks or plays anything: the Start
 * press still owns playback.
 */
const SOUND_SOURCES = Object.freeze({
  // These two legacy recordings ship from the web root, not /sounds/; keep
  // their exact paths so the existing files continue to resolve.
  buildup: { src: ['/freesound_community-starship-rail-gun-charge-35904.mp3'], volume: 0.8 },
  segmentOpen: {
    src: ['/sounds/crystal-ball-leaf.mp3', '/sounds/crystal-ball-leaf.wav'],
    volume: 0.7,
  },
  colourPour: { src: ['/sounds/mixkit-magic-sparkles.mp3'], volume: 0.7 },
  dockChime: { src: ['/sounds/chime-sound.mp3'], volume: 0.7 },
  impactMeteor: { src: ['/dragon-studio-whoosh-cinematic-376875.mp3'], volume: 1.0 },
  impactLightning: { src: ['/sounds/mixkit-cinematic-impact.mp3'], volume: 1.0 },
  fireworkBurst: { src: ['/freesound_community-fireworks-1-94483.mp3'], volume: 1.0 },
  fireworkBurstAlt: { src: ['/sounds/mixkit-magical-impact.mp3'], volume: 1.0 },
  willowCrackle: { src: ['/sounds/mixkit-firework-crackle.mp3'], volume: 1.0 },
  fireworkLaunch: { src: ['/sounds/mixkit-firework-whistle.mp3'], volume: 0.5 },
  finaleBoom: { src: ['/sounds/lucky-meter-finale-boom.wav'], volume: 1.0 },
  thunderRumble: { src: ['/sounds/lucky-meter-thunder-rumble.wav'], volume: 0.24 },
});

/**
 * The cues needed to begin the ritual. They stay eager so the opening sound is
 * ready when Start is pressed. The celebration set is fetched only after the
 * visitor commits.
 */
const CORE_SOUND_KEYS = Object.freeze(['buildup', 'segmentOpen', 'colourPour', 'dockChime']);
const CORE_SOUND_KEY_SET = new Set(CORE_SOUND_KEYS);

export const LUCKY_METER_SOUND_KEYS = Object.freeze(Object.keys(SOUND_SOURCES));
export const LUCKY_METER_CORE_SOUND_KEYS = CORE_SOUND_KEYS;

let soundSet = null;
let loadPromise = null;

function reset() {
  soundSet = null;
  loadPromise = null;
}

/**
 * Loads the sound set once. A failure rejects and clears the shared promise so
 * the next activation can try again; the reveal never waits on it.
 *
 * `loadEventCues` is the activation switch: route-time preparation leaves the
 * celebration cues deferred, while the Start press loads them so each file is
 * already on its way before its scheduled moment. It uses the same Howl set
 * and never plays anything.
 *
 * @param {{ loadEventCues?: boolean }} [options]
 * @returns {Promise<Record<string, any> | null>}
 */
export function prepareLuckyMeterAudio({ loadEventCues = false } = {}) {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const finish = (set) => {
    if (!loadEventCues || !set) return set;
    for (const [key, sound] of Object.entries(set)) {
      if (CORE_SOUND_KEY_SET.has(key)) continue;
      try {
        sound?.load?.();
      } catch {
        // Optional audio only.
      }
    }
    return set;
  };

  if (soundSet) return Promise.resolve(finish(soundSet));
  if (loadPromise) return loadPromise.then(finish);

  loadPromise = import('howler')
    .then(({ Howl }) => {
      // A cue that fails to load must never stop the reveal, but it should be
      // diagnosable in the field instead of failing silently.
      const onLoadError = (id, error) => {
        console.warn('Lucky Meter audio load failed:', id, error);
      };
      const next = {};
      for (const [key, source] of Object.entries(SOUND_SOURCES)) {
        next[key] = new Howl({
          src: source.src,
          volume: source.volume,
          preload: CORE_SOUND_KEY_SET.has(key),
          onloaderror: onLoadError,
        });
      }
      soundSet = next;
      return soundSet;
    })
    .catch((error) => {
      reset();
      throw error;
    });

  return loadPromise.then(finish);
}

/** The already-prepared set, or null. Never starts a load. */
export function getLuckyMeterAudio() {
  return soundSet;
}

/** Unloads the shared set. Used on unmount and in tests. */
export function releaseLuckyMeterAudio() {
  const set = soundSet;
  reset();
  if (!set) return;
  Object.values(set).forEach((sound) => {
    try {
      sound?.unload?.();
    } catch {
      // Optional audio only.
    }
  });
}

/** The exact files the hub may prepare, for manifest documentation and tests. */
export const LUCKY_METER_AUDIO_FILES = Object.freeze(
  Array.from(new Set(Object.values(SOUND_SOURCES).flatMap((source) => source.src))),
);
