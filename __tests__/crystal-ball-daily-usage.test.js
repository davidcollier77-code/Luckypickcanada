import { describe, expect, it } from 'vitest';
import {
  DAILY_STORAGE_KEY,
  createFreshUsage,
  getLocalDateKey,
  readDailyUsage,
  writeDailyUsage,
} from '../app/crystal-ball-client/daily-usage.js';

function createStorage(initial = null) {
  const values = new Map();
  if (initial !== null) values.set(DAILY_STORAGE_KEY, initial);
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

describe('Crystal Ball visitor-local daily allowance', () => {
  it('starts a fresh state with one fortune and one follow-up available', () => {
    const date = new Date(2026, 10, 9, 12, 0, 0, 0);
    expect(createFreshUsage(date)).toEqual({
      date: getLocalDateKey(date),
      fortuneUsed: false,
      fortune: null,
      followUpUsed: false,
      followUpQuestion: null,
      followUpAnswer: null,
    });
  });

  it('does not reuse a stored fortune from a previous local day', () => {
    const yesterday = new Date(2026, 10, 8, 23, 59, 0, 0);
    const today = new Date(2026, 10, 9, 0, 1, 0, 0);
    const storage = createStorage(JSON.stringify({
      date: getLocalDateKey(yesterday),
      fortuneUsed: true,
      fortune: 'Yesterday’s fortune.',
      followUpUsed: true,
      followUpQuestion: 'Yesterday’s question?',
      followUpAnswer: 'Yesterday’s answer.',
    }));

    expect(readDailyUsage(storage, today)).toEqual(createFreshUsage(today));
  });

  it('persists the fortune and follow-up allowances independently', () => {
    const today = new Date(2026, 10, 9, 12, 0, 0, 0);
    const storage = createStorage();

    const afterFortune = writeDailyUsage(
      { ...createFreshUsage(today), fortuneUsed: true, fortune: 'A steady, warm day.' },
      storage,
    );
    expect(afterFortune.fortuneUsed).toBe(true);
    expect(afterFortune.followUpUsed).toBe(false);
    expect(readDailyUsage(storage, today)).toEqual(afterFortune);

    const afterFollowUp = writeDailyUsage(
      {
        ...afterFortune,
        followUpUsed: true,
        followUpQuestion: 'Should I take the long way home?',
        followUpAnswer: 'The long way has the better view.',
      },
      storage,
    );
    expect(afterFollowUp.followUpUsed).toBe(true);
    expect(readDailyUsage(storage, today)).toEqual(afterFollowUp);
  });

  it('does not consume an allowance when the stored reading is unusable', () => {
    const today = new Date(2026, 10, 9, 12, 0, 0, 0);
    const storage = createStorage(JSON.stringify({
      date: getLocalDateKey(today),
      fortuneUsed: true,
      fortune: '   ',
      followUpUsed: true,
      followUpQuestion: 'A question?',
      followUpAnswer: '',
    }));

    const usage = readDailyUsage(storage, today);
    expect(usage.fortuneUsed).toBe(false);
    expect(usage.fortune).toBeNull();
    expect(usage.followUpUsed).toBe(false);
    expect(usage.followUpAnswer).toBeNull();
  });

  it('keeps the state for the current page lifetime when storage is unavailable', () => {
    const today = new Date(2026, 10, 9, 12, 0, 0, 0);
    writeDailyUsage(
      { ...createFreshUsage(today), fortuneUsed: true, fortune: 'In-memory fortune.' },
      null,
    );
    expect(readDailyUsage(null, today)).toEqual({
      date: getLocalDateKey(today),
      fortuneUsed: true,
      fortune: 'In-memory fortune.',
      followUpUsed: false,
      followUpQuestion: null,
      followUpAnswer: null,
    });
  });
});
