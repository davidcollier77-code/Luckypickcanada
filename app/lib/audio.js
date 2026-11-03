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


/*
 * Lucky Reveal opening sparkle.
 * The reveal used to open in silence; this is a short same-origin chime played
 * once as the reveal appears, before the finishing confetti pop. Both are brief
 * and share the existing Howler dependency.
 */
const REVEAL_SPARKLE_URL = '/sounds/chime-sound.mp3';
let revealSparkleLoadPromise = null;

/**
 * Load and decode the reveal's opening sparkle before the reveal opens.
 * Sharing the promise prevents duplicate Howl instances.
 *
 * @returns {Promise<void>} Resolves when the sound is ready to play.
 */
export function preloadRevealSparkle() {
  if (typeof window === 'undefined') return Promise.resolve();

  if (audioCache.revealSparkle?.state() === 'loaded') return Promise.resolve();
  if (revealSparkleLoadPromise) return revealSparkleLoadPromise;

  revealSparkleLoadPromise = import('howler')
    .then(({ Howl }) => new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [REVEAL_SPARKLE_URL],
        html5: true,
        // Brief and quiet: the sparkle sits under the reveal, not over it.
        volume: 0.28,
        preload: true,
      });
      sound.on('playerror', (_id, error) => {
        // Browsers may refuse playback before any user interaction; never throw.
        console.warn('Reveal sparkle playback failed:', error);
      });
      audioCache.revealSparkle = sound;

      if (sound.state() === 'loaded') {
        resolve();
        return;
      }

      sound.once('load', () => resolve());
      sound.once('loaderror', (_id, error) => {
        reject(new Error(`Reveal sparkle failed to load: ${String(error)}`));
      });
    }))
    .catch((error) => {
      revealSparkleLoadPromise = null;
      audioCache.revealSparkle = null;
      throw error;
    });

  return revealSparkleLoadPromise;
}

/**
 * Plays the already-loaded opening sparkle once for this reveal.
 *
 * @returns {Promise<void>} Resolves after requesting playback or preload.
 */
export function playRevealSparkle() {
  if (typeof window === 'undefined') return Promise.resolve();

  const sound = audioCache.revealSparkle;
  if (sound?.state() === 'loaded') {
    // Restart on every reveal instead of stacking a second overlapping chime.
    sound.stop();
    sound.play();
    return Promise.resolve();
  }

  return preloadRevealSparkle();
}


/*
 * Lucky Reveal finishing shimmer.
 * The confetti pop lands with the final number; this is the softer cue that
 * closes the reveal, played once when the maple leaves have left the screen and
 * together with the four golden number-ball pulses. The opening sparkle and the
 * confetti pop are unchanged.
 */
const REVEAL_FINISH_CHIME_URL = '/sounds/reveal-finish-chime.mp3';
let revealFinishChimeLoadPromise = null;

/**
 * Load and decode the finishing shimmer before it is needed.
 *
 * @returns {Promise<void>} Resolves when the sound is ready to play.
 */
export function preloadRevealFinishChime() {
  if (typeof window === 'undefined') return Promise.resolve();

  if (audioCache.revealFinishChime?.state() === 'loaded') return Promise.resolve();
  if (revealFinishChimeLoadPromise) return revealFinishChimeLoadPromise;

  revealFinishChimeLoadPromise = import('howler')
    .then(({ Howl }) => new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [REVEAL_FINISH_CHIME_URL],
        html5: true,
        // Gentle and quiet: the shimmer closes the reveal, it does not announce it.
        volume: 0.3,
        preload: true,
      });
      sound.on('playerror', (_id, error) => {
        // A blocked or unsupported decode must never break the reveal finish.
        console.warn('Reveal finishing chime playback failed:', error);
      });
      audioCache.revealFinishChime = sound;

      if (sound.state() === 'loaded') {
        resolve();
        return;
      }

      sound.once('load', () => resolve());
      sound.once('loaderror', (_id, error) => {
        reject(new Error(`Reveal finishing chime failed to load: ${String(error)}`));
      });
    }))
    .catch((error) => {
      revealFinishChimeLoadPromise = null;
      audioCache.revealFinishChime = null;
      throw error;
    });

  return revealFinishChimeLoadPromise;
}

/**
 * Plays the finishing shimmer once for this reveal.
 *
 * @returns {Promise<void>} Resolves after requesting playback or preload.
 */
export function playRevealFinishChime() {
  if (typeof window === 'undefined') return Promise.resolve();

  const sound = audioCache.revealFinishChime;
  if (sound?.state() === 'loaded') {
    sound.stop();
    sound.play();
    return Promise.resolve();
  }

  return preloadRevealFinishChime();
}


/*
 * Crystal Ball sound design.
 * Same-origin sounds are preloaded on entry; playback is limited to the
 * question action and reveal transitions. Howler is already a project dependency.
 */
let crystalBallAudioLoadPromise = null;

const CRYSTAL_BALL_SOUNDS = {
  crystalEnergy: { src: ['/sounds/crystal-ball-energy.wav'], volume: 0.16, loop: true },
  crystalReveal: { src: ['/sounds/crystal-ball-reveal.wav'], volume: 0.28 },
  crystalLeaf: { src: ['/sounds/crystal-ball-leaf.wav'], volume: 0.26 },
};

export function preloadCrystalBallAudio() {
  if (typeof window === 'undefined') return Promise.resolve();
  const keys = Object.keys(CRYSTAL_BALL_SOUNDS);
  if (keys.every((key) => audioCache[key]?.state() === 'loaded')) return Promise.resolve();
  if (crystalBallAudioLoadPromise) return crystalBallAudioLoadPromise;

  crystalBallAudioLoadPromise = import('howler')
    .then(({ Howl }) => new Promise((resolve) => {
      let remaining = keys.length;
      const markSettled = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
      };

      for (const [key, config] of Object.entries(CRYSTAL_BALL_SOUNDS)) {
        if (audioCache[key]) {
          const existing = audioCache[key];
          if (existing.state() === 'loaded' || existing.state() === 'unloaded') {
            markSettled();
          } else {
            existing.once('load', markSettled);
            existing.once('loaderror', markSettled);
          }
          continue;
        }

        let settled = false;
        const settleOnce = () => {
          if (settled) return;
          settled = true;
          markSettled();
        };
        audioCache[key] = new Howl({
          ...config,
          preload: true,
          onload: settleOnce,
          onloaderror: (_id, error) => {
            console.error('Crystal Ball audio failed to load:', key, error);
            settleOnce();
          },
        });
        if (audioCache[key].state() === 'loaded') settleOnce();
      }
    }))
    .catch((error) => {
      console.error('Crystal Ball audio initialization failed:', error);
    })
    .finally(() => {
      crystalBallAudioLoadPromise = null;
    });

  return crystalBallAudioLoadPromise;
}

function playCrystalBallOneShot(key) {
  if (typeof window === 'undefined') return;
  const sound = audioCache[key];
  if (sound?.state() === 'loaded') {
    sound.stop();
    sound.play();
    return;
  }
  // Prepare for the next visitor action; never play after the animation moves on.
  void preloadCrystalBallAudio();
}

export function playCrystalBallEnergy() {
  if (typeof window === 'undefined') return;
  audioCache.crystalEnergyRequested = true;

  const startWhenReady = () => {
    if (!audioCache.crystalEnergyRequested) return;
    const sound = audioCache.crystalEnergy;
    if (sound?.state() !== 'loaded') return;
    const activeId = audioCache.crystalEnergyId;
    if (activeId !== undefined && activeId !== null && sound.playing(activeId)) return;
    sound.volume(CRYSTAL_BALL_SOUNDS.crystalEnergy.volume);
    audioCache.crystalEnergyId = sound.play();
  };

  startWhenReady();
  // Start after decode only if the visitor is still in the loading phase.
  void preloadCrystalBallAudio().then(startWhenReady);
}

export function stopCrystalBallEnergy() {
  if (typeof window === 'undefined') return;
  audioCache.crystalEnergyRequested = false;
  const sound = audioCache.crystalEnergy;
  const soundId = audioCache.crystalEnergyId;
  if (!sound || soundId === undefined || soundId === null) return;

  if (sound.state() === 'loaded' && sound.playing(soundId)) {
    sound.fade(CRYSTAL_BALL_SOUNDS.crystalEnergy.volume, 0, 160, soundId);
    const stoppedId = soundId;
    setTimeout(() => {
      sound.stop(stoppedId);
      if (audioCache.crystalEnergyId === stoppedId) {
        sound.volume(CRYSTAL_BALL_SOUNDS.crystalEnergy.volume);
        audioCache.crystalEnergyId = null;
      }
    }, 160);
  } else {
    sound.stop(soundId);
    audioCache.crystalEnergyId = null;
  }
}

export function playCrystalBallReveal() {
  playCrystalBallOneShot('crystalReveal');
}

export function playCrystalBallLeaf() {
  playCrystalBallOneShot('crystalLeaf');
}
