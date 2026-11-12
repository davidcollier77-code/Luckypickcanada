'use client';

import { useSyncExternalStore } from 'react';
import {
  formatDailyResetRemaining,
  getDailyResetState,
} from '../app/lib/daily-reset';

/**
 * One store owns the only countdown interval. Every display subscribes to the
 * same snapshot, so Card Reveal, Crystal Ball and Lucky Meter cannot drift.
 */
const listeners = new Set();
let intervalId = null;
let currentNow = 0;

function notify() {
  currentNow = Date.now();
  for (const listener of [...listeners]) listener();
}

function handleWake() {
  if (listeners.size > 0) notify();
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') handleWake();
}

function subscribe(listener) {
  listeners.add(listener);

  if (listeners.size === 1) {
    currentNow = Date.now();
    intervalId = window.setInterval(notify, 1000);
    window.addEventListener('focus', handleWake);
    window.addEventListener('pageshow', handleWake);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      window.clearInterval(intervalId);
      intervalId = null;
      currentNow = 0;
      window.removeEventListener('focus', handleWake);
      window.removeEventListener('pageshow', handleWake);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
}

function getSnapshot() {
  return currentNow;
}

function getServerSnapshot() {
  return 0;
}

/**
 * Reads the shared next-local-midnight countdown.
 *
 * @returns {{ ready: boolean, now: number, dateKey: string | null, deadlineMs: number, remainingMs: number, formatted: string }}
 *   `ready` is false during server rendering and the first hydration paint.
 *   `now` is the shared one-second clock timestamp, so time-of-day displays can
 *   update from the same interval as the countdown instead of starting another.
 */
export function useDailyResetCountdown() {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (now === 0) {
    return {
      ready: false,
      now: 0,
      dateKey: null,
      deadlineMs: 0,
      remainingMs: 0,
      formatted: '--:--:--',
    };
  }

  const state = getDailyResetState(new Date(now));
  return {
    ready: true,
    now,
    ...state,
    formatted: formatDailyResetRemaining(state.remainingMs),
  };
}
