import { beforeEach, describe, expect, it } from 'vitest';
import {
  DAILY_QUESTION_LIMIT,
  DAILY_STORAGE_KEY,
  getLocalDateKey,
  getNextLocalMidnight,
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
  it('uses the visitor local calendar date and resets at the next local midnight', () => {
    const date = new Date(2026, 9, 17, 23, 30, 0, 0);
    expect(getLocalDateKey(date)).toBe(
      date.getFullYear() + '-10-17'
    );

    const expectedMidnight = new Date(2026, 9, 18, 0, 0, 0, 0);
    expect(getNextLocalMidnight(date).getTime()).toBe(expectedMidnight.getTime());
  });

  it('starts a fresh three-question allowance when stored usage is from yesterday', () => {
    const yesterday = new Date(2026, 9, 16, 23, 59, 0, 0);
    const today = new Date(2026, 9, 17, 0, 1, 0, 0);
    const storage = createStorage(JSON.stringify({
      date: getLocalDateKey(yesterday),
      used: DAILY_QUESTION_LIMIT,
    }));

    expect(readDailyUsage(storage, today)).toEqual({ date: getLocalDateKey(today), used: 0 });
  });

  it('persists a valid count and clamps saved usage to the configured limit', () => {
    const today = new Date(2026, 9, 17, 12, 0, 0, 0);
    const storage = createStorage();
    const saved = writeDailyUsage({ date: getLocalDateKey(today), used: 99 }, storage);

    expect(DAILY_QUESTION_LIMIT).toBe(3);
    expect(saved).toEqual({ date: getLocalDateKey(today), used: 3 });
    expect(JSON.parse(storage.getItem(DAILY_STORAGE_KEY))).toEqual(saved);
    expect(readDailyUsage(storage, today)).toEqual(saved);
  });

  it('keeps the count for the current page lifetime when browser storage is unavailable', () => {
    const today = new Date(2026, 9, 17, 12, 0, 0, 0);
    writeDailyUsage({ date: getLocalDateKey(today), used: 2 }, null);
    expect(readDailyUsage(null, today)).toEqual({ date: getLocalDateKey(today), used: 2 });
  });
});
