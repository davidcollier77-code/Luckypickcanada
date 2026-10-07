'use client';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-api';
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_LOAD_TIMEOUT_MS = 15000;
const TURNSTILE_POLL_INTERVAL_MS = 100;

let turnstileLoadPromise = null;

function getTurnstileApi() {
  if (typeof window === 'undefined') {
    return null;
  }

  const api = window.turnstile;

  return api && typeof api.render === 'function' ? api : null;
}

function findTurnstileScript() {
  if (typeof document === 'undefined') {
    return null;
  }

  const script = document.getElementById(TURNSTILE_SCRIPT_ID);
  if (script?.tagName === 'SCRIPT') {
    return script;
  }

  return Array.from(document.querySelectorAll('script[src]')).find(
    (candidate) => candidate.src === TURNSTILE_SCRIPT_SRC,
  ) || null;
}

export function loadTurnstile() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Turnstile can only load in a browser.'));
  }

  const readyApi = getTurnstileApi();

  if (readyApi) {
    return Promise.resolve(readyApi);
  }

  if (turnstileLoadPromise) {
    return turnstileLoadPromise;
  }

  const promise = new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId;
    let pollId;

    const script = findTurnstileScript() || document.createElement('script');

    const cleanup = () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      window.clearTimeout(timeoutId);
      window.clearInterval(pollId);
    };

    const finish = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (error) {
        // Remove a failed script so a later explicit retry can start cleanly.
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(error);
        return;
      }

      resolve(getTurnstileApi());
    };

    const checkReady = () => {
      const api = getTurnstileApi();

      if (api) {
        finish(null);
      }
    };

    const handleLoad = () => {
      checkReady();

      if (!getTurnstileApi() && !settled) {
        // Keep polling briefly because script load and global API exposure are
        // separate observable events in some browser/runtime combinations.
        return;
      }
    };

    const handleError = () => {
      finish(new Error('Unable to load the Cloudflare Turnstile script.'));
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    if (!script.id) {
      script.id = TURNSTILE_SCRIPT_ID;
    }

    if (!script.src) {
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    checkReady();

    if (!settled) {
      pollId = window.setInterval(checkReady, TURNSTILE_POLL_INTERVAL_MS);
      timeoutId = window.setTimeout(() => {
        finish(new Error('Timed out waiting for Cloudflare Turnstile to initialize.'));
      }, TURNSTILE_LOAD_TIMEOUT_MS);
    }
  });

  turnstileLoadPromise = promise.catch((error) => {
    turnstileLoadPromise = null;
    throw error;
  });

  return turnstileLoadPromise;
}

export const TURNSTILE_SCRIPT_URL = TURNSTILE_SCRIPT_SRC;
