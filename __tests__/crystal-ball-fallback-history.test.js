import { describe, expect, it } from 'vitest';
import {
  FALLBACK_HISTORY_STORAGE_KEY,
  getFallbackFortuneToAvoid,
  getPreviousLocalDateKey,
  readFallbackHistory,
  writeFallbackHistory,
} from '../app/crystal-ball-client/fallback-history.js';

function createStorage(initial = null) {
  const values = new Map();
  if (initial !== null) values.set(FALLBACK_HISTORY_STORAGE_KEY, initial);
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

describe('Crystal Ball fallback history', () => {
  it('stores only the last fallback ID and local date', () => {
    const storage = createStorage();
    const date = new Date(2026, 10, 9, 12, 0, 0, 0);

    expect(writeFallbackHistory('seasonal-winter-03', storage, date)).toEqual({
      id: 'seasonal-winter-03',
      date: '2026-11-09',
    });

    const raw = storage.getItem(FALLBACK_HISTORY_STORAGE_KEY);
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['date', 'id']);
    expect(raw).not.toContain('mists');
    expect(raw).not.toContain('fortune text');
    expect(readFallbackHistory(storage)).toEqual({
      id: 'seasonal-winter-03',
      date: '2026-11-09',
    });
  });

  it('ignores missing, corrupt, or invalid records', () => {
    expect(readFallbackHistory(null)).toBeNull();
    expect(readFallbackHistory(createStorage())).toBeNull();
    expect(readFallbackHistory(createStorage('not-json'))).toBeNull();
    expect(
      readFallbackHistory(createStorage(JSON.stringify({ id: 'Bad ID!', date: '2026-11-09' }))),
    ).toBeNull();
    expect(
      readFallbackHistory(createStorage(JSON.stringify({ id: 'general-01', date: 'nope' }))),
    ).toBeNull();
  });

  it('does not throw when storage is blocked', () => {
    const blocked = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };

    expect(readFallbackHistory(blocked)).toBeNull();
    expect(() => writeFallbackHistory('general-01', blocked)).not.toThrow();
  });

  it('avoids only a fallback received on the previous local calendar day', () => {
    const today = new Date(2026, 10, 9, 12, 0, 0, 0);
    const yesterday = new Date(2026, 10, 8, 20, 0, 0, 0);
    const twoDaysAgo = new Date(2026, 10, 7, 20, 0, 0, 0);

    expect(
      getFallbackFortuneToAvoid({ id: 'general-01', date: '2026-11-08' }, today),
    ).toBe('general-01');
    expect(
      getFallbackFortuneToAvoid({ id: 'general-01', date: '2026-11-09' }, today),
    ).toBeNull();
    expect(
      getFallbackFortuneToAvoid(
        { id: 'general-01', date: getPreviousLocalDateKey(twoDaysAgo) },
        today,
      ),
    ).toBeNull();
    expect(getFallbackFortuneToAvoid(null, today)).toBeNull();
  });

  it('finds the previous local day across month and year boundaries', () => {
    expect(getPreviousLocalDateKey(new Date(2026, 11, 1, 0, 30, 0, 0))).toBe('2026-11-30');
    expect(getPreviousLocalDateKey(new Date(2027, 0, 1, 0, 30, 0, 0))).toBe('2026-12-31');
    expect(getPreviousLocalDateKey(new Date(2024, 2, 1, 0, 30, 0, 0))).toBe('2024-02-29');
  });
});
