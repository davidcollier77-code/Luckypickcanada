import { CONFETTI_POP_URL } from './confettiPopSource.mjs';

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
let confettiPopLoadPromise = null;

export function preloadConfettiPop() {
  if (typeof window === 'undefined') return Promise.resolve();

  if (audioCache.confettiPop?.state() === 'loaded') return Promise.resolve();
  if (confettiPopLoadPromise) return confettiPopLoadPromise;

  confettiPopLoadPromise = import('howler')
    .then(({ Howl }) => new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [CONFETTI_POP_URL],
        html5: true,
        volume: 0.45,
        preload: true,
      });
      sound.on('playerror', (_id, error) => {
        // Howler reports asynchronous HTML5 media-policy failures through this event.
        console.error('Confetti pop playback failed:', error);
      });
      audioCache.confettiPop = sound;

      if (sound.state() === 'loaded') {
        resolve();
        return;
      }

      sound.once('load', () => resolve());
      sound.once('loaderror', (_id, error) => {
        reject(new Error(`Confetti pop failed to load: ${String(error)}`));
      });
    }))
    .catch((error) => {
      confettiPopLoadPromise = null;
      audioCache.confettiPop = null;
      throw error;
    });

  return confettiPopLoadPromise;
}

/**
 * Starts the already-loaded chime synchronously in the button activation path.
 * If preload has not finished, prepare it for the next activation instead of
 * allowing an unexpected sound to start after the scroll has completed.
 *
 * @returns {Promise<void>} Resolves after requesting playback or preload.
 */
export function playConfettiPop() {
  if (typeof window === 'undefined') return Promise.resolve();

  const sound = audioCache.confettiPop;
  if (sound?.state() === 'loaded') {
    sound.play();
    return Promise.resolve();
  }

  return preloadConfettiPop();
}
