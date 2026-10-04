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
