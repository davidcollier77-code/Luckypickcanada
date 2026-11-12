import { describe, expect, it } from 'vitest';
import {
  GREETINGS,
  GREETING_STORAGE_KEY,
  composeGreeting,
  getQuietGreeting,
  readDailyGreeting,
} from '../app/crystal-ball-client/greetings.js';

function createStorage(initial) {
  const values = new Map();
  if (initial !== undefined) values.set(GREETING_STORAGE_KEY, initial);
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
    read(key) {
      return values.has(key) ? values.get(key) : null;
    },
  };
}

const dayKey = (day) => `2026-11-${String(day).padStart(2, '0')}`;

function seededRandom(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('Crystal Ball daily greeting', () => {
  it('keeps the four approved greetings and expands the pool', () => {
    expect(GREETINGS).toHaveLength(10);
    expect(new Set(GREETINGS).size).toBe(GREETINGS.length);
    expect(GREETINGS[0]).toBe("Well, look who's feeling lucky today.");
    expect(GREETINGS[1]).toBe("Let's see what the universe has up its sleeve, eh?");
    expect(GREETINGS[2]).toBe(
      "I've been waiting for you. Not that I'm keeping track or anything.",
    );
    expect(GREETINGS[3]).toBe(
      'Pull up a chair, friend — the mists kept the good seat warm for you.',
    );
    for (const greeting of GREETINGS) {
      expect(greeting.trim().length).toBeGreaterThan(10);
    }
  });

  it('keeps the same greeting for the rest of the local day', () => {
    const storage = createStorage();
    const first = readDailyGreeting(storage, dayKey(10), () => 0.7);
    const later = readDailyGreeting(storage, dayKey(10), () => 0.1);
    const otherTab = readDailyGreeting(storage, dayKey(10), () => 0.99);

    expect(first.reused).toBe(false);
    expect(later).toEqual({ index: first.index, text: first.text, reused: true });
    expect(otherTab).toEqual({ index: first.index, text: first.text, reused: true });
  });

  it('never repeats the previous local day across a long run', () => {
    const storage = createStorage();
    const random = seededRandom(7);
    let previous = null;
    const seen = new Set();

    for (let day = 1; day <= 200; day += 1) {
      const selected = readDailyGreeting(storage, dayKey((day % 28) + 1), random);
      if (previous !== null) expect(selected.index).not.toBe(previous);
      previous = selected.index;
      seen.add(selected.index);
    }

    expect([...seen].sort((left, right) => left - right)).toEqual(
      GREETINGS.map((_, index) => index),
    );
  });

  it('picks uniformly from the greetings other than the previous one', () => {
    const storage = createStorage(
      JSON.stringify({ date: dayKey(9), index: 0 }),
    );

    // The lowest roll cannot return the excluded greeting.
    expect(readDailyGreeting(storage, dayKey(10), () => 0).index).toBe(1);
    // The highest roll can.
    const highest = readDailyGreeting(storage, dayKey(11), () => 0.999999);
    expect(highest.index).not.toBe(1);
  });

  it('allows a greeting to return after a different greeting appeared', () => {
    const storage = createStorage();
    const dayOne = readDailyGreeting(storage, dayKey(1), () => 0);
    const dayTwo = readDailyGreeting(storage, dayKey(2), () => 0.999999);
    const dayThree = readDailyGreeting(storage, dayKey(3), () => 0);

    expect(dayTwo.index).not.toBe(dayOne.index);
    expect(dayThree.index).not.toBe(dayTwo.index);
    expect(dayThree.index).toBe(0);
  });

  it.each([
    ['malformed JSON', '{not-json'],
    ['a wrong shape', JSON.stringify({ date: 10, index: 1 })],
    ['an out-of-range index', JSON.stringify({ date: '2026-11-09', index: 99 })],
    ['a fractional index', JSON.stringify({ date: '2026-11-09', index: 1.5 })],
    ['an empty string', ''],
  ])('starts fresh when storage holds %s', (_label, stored) => {
    const storage = createStorage(stored);
    const selected = readDailyGreeting(storage, dayKey(10), () => 0.5);

    expect(selected.index).toBeGreaterThanOrEqual(0);
    expect(selected.index).toBeLessThan(GREETINGS.length);
    expect(selected.reused).toBe(false);
    expect(JSON.parse(storage.read(GREETING_STORAGE_KEY))).toEqual({
      date: dayKey(10),
      index: selected.index,
    });
  });

  it('keeps working when storage is blocked or unavailable', () => {
    const blocked = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    // Use a date key that is unique to this test to avoid cross-test bleed
    // through the module-level inMemoryGreeting fallback.
    const uniqueDate = '2099-12-31';
    const first = readDailyGreeting(blocked, uniqueDate, () => 0.4);
    const sameDay = readDailyGreeting(blocked, uniqueDate, () => 0.9);
    const nextDay = readDailyGreeting(blocked, '2030-01-02', () => 0.4);

    expect(sameDay).toEqual({ index: first.index, text: first.text, reused: true });
    expect(nextDay.index).not.toBe(first.index);
  });
});

describe('Crystal Ball time-aware greeting', () => {
  it.each([
    ['2026-11-12', 'morning', `Good morning. ${GREETINGS[0]}`],
    ['2026-11-12', 'afternoon', `Good afternoon. ${GREETINGS[0]}`],
    ['2026-11-12', 'evening', `Good evening. ${GREETINGS[0]}`],
    ['2026-11-12', 'late-night', `Still up, eh? ${GREETINGS[0]}`],
  ])('composes %s %s with the local salutation', (dateKey, period, expected) => {
    expect(composeGreeting(GREETINGS[0], { dateKey, period })).toBe(expected);
  });

  it('returns no greeting until the daily personality is ready', () => {
    expect(composeGreeting('', { dateKey: '2026-11-12', period: 'morning' })).toBe('');
  });

  it('keeps Remembrance Day quiet and free of the playful personality', () => {
    expect(getQuietGreeting('2026-11-11')).toBe(
      'Today the glass is quiet. Take a moment to remember.',
    );
    const greeting = composeGreeting(GREETINGS[0], {
      dateKey: '2026-11-11',
      period: 'morning',
    });
    expect(greeting).toBe('Today the glass is quiet. Take a moment to remember.');
    expect(greeting).not.toContain('Good morning');
    expect(greeting).not.toContain('lucky');
  });

  it('keeps the National Day for Truth and Reconciliation reflective', () => {
    const greeting = composeGreeting(GREETINGS[0], {
      dateKey: '2026-09-30',
      period: 'evening',
    });
    expect(greeting).toBe('Today the mists are listening. Take a moment to reflect.');
    expect(greeting).not.toContain('Good evening');
  });

  it('keeps Good Friday restrained without suppressing ordinary days', () => {
    expect(getQuietGreeting('2026-04-03')).toBe(
      'The glass is quiet today. Take the day gently.',
    );
    expect(getQuietGreeting('2026-11-12')).toBeNull();
  });
});
