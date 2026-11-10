import { describe, expect, it } from 'vitest';
import {
  GREETINGS,
  GREETING_STORAGE_KEY,
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
  it('keeps the three approved greetings and adds a fourth', () => {
    expect(GREETINGS).toHaveLength(4);
    expect(new Set(GREETINGS).size).toBe(4);
    expect(GREETINGS[0]).toBe("Well, look who's feeling lucky today.");
    expect(GREETINGS[1]).toBe("Let's see what the universe has up its sleeve, eh?");
    expect(GREETINGS[2]).toBe(
      "I've been waiting for you. Not that I'm keeping track or anything.",
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

    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
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
    const nextDay = readDailyGreeting(blocked, '2099-12-30', () => 0.999999);
    const nextDay = readDailyGreeting(blocked, '2030-01-02', () => 0.4);

    expect(sameDay).toEqual({ index: first.index, text: first.text, reused: true });
    expect(nextDay.index).not.toBe(first.index);
  });
});
