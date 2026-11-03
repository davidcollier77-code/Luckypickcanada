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
 * Lucky Reveal applause.
 * The reveal used to carry a synthesised pulse under the number-ball glow and a
 * musical chime at the finish. Both are gone: a real recording of a small group
 * applauding and cheering now plays once, as the celebration finishes, and the
 * reveal has no continuous sound underneath it.
 *
 * Every playback belongs to one reveal session. Closing, unmounting, or
 * reopening the reveal invalidates the session, so a decode that finishes late
 * can never start the applause after the reveal is gone, and a session can
 * request it only once.
 */
const REVEAL_APPLAUSE_URL = '/sounds/reveal-applause.wav';
const REVEAL_APPLAUSE_VOLUME = 0.55;
let revealApplauseLoadPromise = null;
// Bumped whenever a reveal opens or closes; callbacks holding an older id stop.
let revealAudioSessionId = 0;
let applauseRequestedSessionId = null;
let applauseSoundId = null;

/**
 * Starts a fresh reveal audio session. Any applause still playing or pending
 * from a previous reveal is stopped first, so reopening never stacks a second
 * copy.
 *
 * @returns {number} The new session id to pass to `playRevealApplause`.
 */
export function beginRevealAudioSession() {
  revealAudioSessionId += 1;
  applauseRequestedSessionId = null;
  stopApplausePlayback();
  return revealAudioSessionId;
}

/**
 * Ends the current reveal audio session and stops the applause immediately.
 * Safe to call more than once and safe when nothing is playing.
 */
export function endRevealAudioSession() {
  revealAudioSessionId += 1;
  applauseRequestedSessionId = null;
  stopApplausePlayback();
}

function stopApplausePlayback() {
  const sound = audioCache.revealApplause;
  const soundId = applauseSoundId;
  applauseSoundId = null;
  if (!sound) return;

  if (soundId !== null && soundId !== undefined) {
    sound.stop(soundId);
    return;
  }

  sound.stop();
}

/**
 * Load and decode the applause before the celebration reaches its finish, so
 * the cue is not delayed by a network request. Sharing the promise prevents
 * duplicate Howl instances.
 *
 * @returns {Promise<void>} Resolves when the sound is ready to play.
 */
export function preloadRevealApplause() {
  if (typeof window === 'undefined') return Promise.resolve();

  if (audioCache.revealApplause?.state() === 'loaded') return Promise.resolve();
  if (revealApplauseLoadPromise) return revealApplauseLoadPromise;

  revealApplauseLoadPromise = import('howler')
    .then(({ Howl }) => new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [REVEAL_APPLAUSE_URL],
        // A single recorded one-shot, played from the media element.
        html5: true,
        volume: REVEAL_APPLAUSE_VOLUME,
        preload: true,
      });
      sound.on('playerror', (_id, error) => {
        // A blocked or unsupported decode must never break the reveal.
        console.warn('Reveal applause playback failed:', error);
      });
      audioCache.revealApplause = sound;

      if (sound.state() === 'loaded') {
        resolve();
        return;
      }

      sound.once('load', () => resolve());
      sound.once('loaderror', (_id, error) => {
        reject(new Error(`Reveal applause failed to load: ${String(error)}`));
      });
    }))
    .catch((error) => {
      revealApplauseLoadPromise = null;
      audioCache.revealApplause = null;
      throw error;
    });

  return revealApplauseLoadPromise;
}

/**
 * Plays the applause once for the given reveal session. If the sound is still
 * loading, playback begins only when the load completes *and* that same reveal
 * session is still active; a late load after a close does nothing. Repeated
 * calls for the same session are ignored, so the applause can never play twice.
 *
 * @param {number} sessionId Session returned by `beginRevealAudioSession`.
 * @returns {Promise<boolean>} Resolves true when playback actually started.
 */
export function playRevealApplause(sessionId) {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (sessionId !== revealAudioSessionId) return Promise.resolve(false);
  if (applauseRequestedSessionId === sessionId) return Promise.resolve(false);
  applauseRequestedSessionId = sessionId;

  const startPlayback = () => {
    if (sessionId !== revealAudioSessionId) return false;

    const sound = audioCache.revealApplause;
    if (sound?.state() !== 'loaded') return false;

    // Never stack a second copy: clear anything left before starting this one.
    sound.stop();
    applauseSoundId = sound.play();
    return applauseSoundId !== null && applauseSoundId !== undefined;
  };

  if (startPlayback()) return Promise.resolve(true);

  return preloadRevealApplause()
    .then(startPlayback)
    .catch((error) => {
      console.warn('Reveal applause unavailable', error);
      // Clear the request guard so the cue can be retried if the session is still active.
      if (applauseRequestedSessionId === sessionId) applauseRequestedSessionId = null;
      return false;
    });
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
