import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DAILY_STORAGE_KEY,
  createFreshUsage,
  getLocalDateKey,
  readDailyUsage,
  writeDailyUsage,
  withDailyUsageLock,
} from '../app/crystal-ball-client/daily-usage.js';

afterEach(() => {
  vi.useRealTimers();
});

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
    vi.useFakeTimers();
    vi.setSystemTime(today);
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
    vi.useFakeTimers();
    vi.setSystemTime(today);
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
  it('serializes same-day allowance operations through the Web Locks API', async () => {
    const queues = new Map();
    const lockManager = {
      request(name, options, callback) {
        expect(name).toBe(`${DAILY_STORAGE_KEY}:2026-11-09`);
        expect(options).toEqual({ mode: 'exclusive' });
        const previous = queues.get(name) || Promise.resolve();
        let release;
        const current = new Promise((resolve) => {
          release = resolve;
        });
        const queued = previous.then(() => current);
        queues.set(name, queued);

        return previous.then(callback).finally(() => {
          release();
          if (queues.get(name) === queued) queues.delete(name);
        });
      },
    };

    let active = 0;
    let maximumActive = 0;
    const run = (label) => withDailyUsageLock(
      '2026-11-09',
      async () => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await Promise.resolve();
        active -= 1;
        return label;
      },
      lockManager,
    );

    await expect(Promise.all([run('fortune'), run('follow-up')])).resolves.toEqual([
      'fortune',
      'follow-up',
    ]);
    expect(maximumActive).toBe(1);
  });

  it('serializes same-tab operations when Web Locks are unavailable', async () => {
    let active = 0;
    let maximumActive = 0;
    const run = () => withDailyUsageLock(
      '2026-11-09',
      async () => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await Promise.resolve();
        active -= 1;
      },
      null,
    );

    await Promise.all([run(), run()]);
    expect(maximumActive).toBe(1);
  });

  it('releases the fallback queue after a synchronous throw', async () => {
    const first = withDailyUsageLock(
      '2026-11-09',
      () => {
        throw new Error('synchronous failure');
      },
      null,
    );
    const second = withDailyUsageLock(
      '2026-11-09',
      async () => 'next caller runs',
      null,
    );

    await expect(first).rejects.toThrow('synchronous failure');
    await expect(second).resolves.toBe('next caller runs');
  });

  it('releases the fallback queue after a rejected operation', async () => {
    const first = withDailyUsageLock(
      '2026-11-09',
      async () => {
        throw new Error('asynchronous failure');
      },
      null,
    );
    const second = withDailyUsageLock(
      '2026-11-09',
      async () => 'next caller still runs',
      null,
    );

    await expect(first).rejects.toThrow('asynchronous failure');
    await expect(second).resolves.toBe('next caller still runs');
  });

});
