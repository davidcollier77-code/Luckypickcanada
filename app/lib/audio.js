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
 * Plays a magical chime sound in the browser for special events (e.g., golden arrow activation).
 * Loads Howler on demand and reuses the cached sound instance. Does nothing on the server.
 *
 * @returns {Promise<void>} Resolves after requesting playback.
 * Rejects on import failure or a synchronous error during sound creation.
 */
export async function playMagicalChime() {
  if (typeof window === 'undefined') return;

  if (!audioCache.magicalChime) {
    const { Howl } = await import('howler');
    audioCache.magicalChime = new Howl({
      src: ['/sounds/mixkit-magic-sparkles.mp3'],
      volume: 0.6,
    });
  }

  audioCache.magicalChime.play();
}
