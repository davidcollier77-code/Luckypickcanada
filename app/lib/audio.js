const audioCache = {};

/**
 * Plays the button-click sound in the browser, loading Howler on demand and
 * reusing the cached sound instance. Does nothing when called on the server.
 *
 * @returns {Promise<void>} Resolves after requesting playback, not when playback ends.
 * Rejects on import failure or a synchronous error during sound creation or playback.
 */
export async function playButtonClick() {
  if (typeof window === 'undefined') return;

  if (!audioCache.buttonClick) {
    const { Howl } = await import('howler');
    audioCache.buttonClick = new Howl({
      src: ['/sounds/button-click.wav'],
      volume: 0.5,
    });
  }

  audioCache.buttonClick.play();
}

/**
 * Load and decode the Explore Your Luck chime before the user activates the
 * interaction. Sharing the promise prevents duplicate Howl instances.
 *
 * @returns {Promise<void>} Resolves when the sound is ready to play.
 */
let magicalChimeLoadPromise = null;

export function preloadMagicalChime() {
  if (typeof window === 'undefined') return Promise.resolve();

  if (audioCache.magicalChime?.state() === 'loaded') return Promise.resolve();
  if (magicalChimeLoadPromise) return magicalChimeLoadPromise;

  magicalChimeLoadPromise = import('howler')
    .then(({ Howl }) => new Promise((resolve, reject) => {
      const sound = new Howl({
        src: ['/sounds/mixkit-magic-sparkles.mp3'],
        volume: 0.45,
        preload: true,
      });
      audioCache.magicalChime = sound;

      if (sound.state() === 'loaded') {
        resolve();
        return;
      }

      sound.once('load', () => resolve());
      sound.once('loaderror', (_id, error) => {
        reject(new Error(`Magical chime failed to load: ${String(error)}`));
      });
    }))
    .catch((error) => {
      magicalChimeLoadPromise = null;
      audioCache.magicalChime = null;
      throw error;
    });

  return magicalChimeLoadPromise;
}

/**
 * Starts the already-loaded chime synchronously in the button activation path.
 * If preload has not finished, prepare it for the next activation instead of
 * allowing an unexpected sound to start after the scroll has completed.
 *
 * @returns {Promise<void>} Resolves after requesting playback or preload.
 */
export function playMagicalChime() {
  if (typeof window === 'undefined') return Promise.resolve();

  const sound = audioCache.magicalChime;
  if (sound?.state() === 'loaded') {
    sound.play();
    return Promise.resolve();
  }

  return preloadMagicalChime();
}
