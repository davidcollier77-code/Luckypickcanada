import { describe, expect, it } from 'vitest';
import {
  COLOURS,
  ENTERTAINMENT_DISCLAIMER,
  EVENTS,
  LUCKY_NUMBERS_LABEL,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
} from '../app/lib/lucky-meter/config';
import { LITTLE_SPARKS } from '../app/lib/lucky-meter/little-sparks';
import {
  createDailyResult,
  getTierForPercentage,
  pickColour,
  pickEvent,
  pickPercentage,
  pickSpark,
  validateDailyResult,
} from '../app/lib/lucky-meter/selection';

/** Small deterministic PRNG so distribution checks are stable. */
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Little Sparks data file', () => {
  it('contains exactly 30 original messages with unique ids', () => {
    expect(LITTLE_SPARKS).toHaveLength(30);
    const ids = new Set(LITTLE_SPARKS.map((spark) => spark.id));
    const messages = new Set(LITTLE_SPARKS.map((spark) => spark.message));
    expect(ids.size).toBe(30);
    expect(messages.size).toBe(30);
    expect(LITTLE_SPARKS.every((spark) => spark.id.startsWith('spark-'))).toBe(true);
  });

  it('keeps every message brief, motivational and free of fortune claims', () => {
    const forbidden = /lottery|jackpot|win|fortune|predict|guarantee|will bring you/i;
    for (const spark of LITTLE_SPARKS) {
      expect(spark.message.length).toBeGreaterThan(20);
      expect(spark.message.length).toBeLessThanOrEqual(140);
      expect(spark.message).not.toMatch(forbidden);
    }
    expect(LITTLE_SPARKS.map((spark) => spark.message)).toContain(
      'Even a small step forward can change the direction of your day.',
    );
  });
});

describe('tier definitions', () => {
  it('maps the documented percentage boundaries to the exact tier messages', () => {
    expect(getTierForPercentage(5)).toMatchObject({
      id: 'low',
      message: "You're riding a little low today, but you're still okay!",
    });
    expect(getTierForPercentage(39).id).toBe('low');
    expect(getTierForPercentage(40)).toMatchObject({
      id: 'medium',
      message: 'Your luck is in the mid-range today.',
    });
    expect(getTierForPercentage(79).id).toBe('medium');
    expect(getTierForPercentage(80)).toMatchObject({
      id: 'high',
      message: "Your luck is running high today!",
    });
    expect(getTierForPercentage(100).id).toBe('high');
    expect(getTierForPercentage(4)).toBeNull();
    expect(getTierForPercentage(101)).toBeNull();
  });
});

describe('daily percentage selection', () => {
  it('always returns an integer from 5 to 100 and never zero', () => {
    const random = mulberry32(12345);
    for (let index = 0; index < 3000; index += 1) {
      const value = pickPercentage([], random);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(PERCENTAGE_MIN);
      expect(value).toBeLessThanOrEqual(PERCENTAGE_MAX);
      expect(value).not.toBe(0);
    }
  });

  it('avoids the last three persisted percentages', () => {
    const random = mulberry32(99);
    const recent = [12, 55, 97];
    for (let index = 0; index < 2000; index += 1) {
      expect(recent).not.toContain(pickPercentage(recent, random));
    }
  });

  it('can still produce values that were used more than three days ago', () => {
    const random = mulberry32(4);
    const recent = [8, 9, 10, 80];
    const seen = new Set();
    for (let index = 0; index < 400; index += 1) {
      seen.add(pickPercentage(recent, random));
    }
    // 80 is the fourth-newest value, so it is allowed again.
    expect(seen.has(80)).toBe(true);
    expect([8, 9, 10].some((value) => seen.has(value))).toBe(false);
  });

  it('reaches the low and high ends of the range', () => {
    const random = mulberry32(2026);
    const values = Array.from({ length: 6000 }, () => pickPercentage([], random));
    expect(Math.min(...values)).toBeLessThanOrEqual(8);
    expect(Math.max(...values)).toBeGreaterThanOrEqual(97);
  });
});

describe('event selection and fixed Lucky Numbers', () => {
  it('uses the exact fixed, unique numbers and never 13', () => {
    expect(EVENTS.map((event) => ({ id: event.id, numbers: event.numbers }))).toEqual([
      { id: 'meteor', numbers: [3, 9, 21] },
      { id: 'lightning', numbers: [11, 22, 33] },
      { id: 'fireworks', numbers: [7, 8, 77] },
    ]);
    for (const event of EVENTS) {
      expect(new Set(event.numbers).size).toBe(3);
      expect(event.numbers).not.toContain(13);
    }
  });

  it('draws with the documented 42/38/20 weights', () => {
    expect(pickEvent([], () => 0).id).toBe('meteor');
    expect(pickEvent([], () => 0.4199).id).toBe('meteor');
    expect(pickEvent([], () => 0.42).id).toBe('lightning');
    expect(pickEvent([], () => 0.7999).id).toBe('lightning');
    expect(pickEvent([], () => 0.8).id).toBe('fireworks');
    expect(pickEvent([], () => 0.9999).id).toBe('fireworks');
  });

  it('matches the weights within tolerance over many draws', () => {
    const random = mulberry32(777);
    const counts = { meteor: 0, lightning: 0, fireworks: 0 };
    const draws = 30000;
    for (let index = 0; index < draws; index += 1) {
      counts[pickEvent([], random).id] += 1;
    }
    expect(counts.meteor / draws).toBeCloseTo(0.42, 2);
    expect(counts.lightning / draws).toBeCloseTo(0.38, 2);
    expect(counts.fireworks / draws).toBeCloseTo(0.2, 2);
  });

  it('prevents three consecutive repeats by weighted re-selection, not rotation', () => {
    // Two meteors in a row: meteor is removed, and the normal weighted draw runs
    // over the remaining two events.
    expect(pickEvent(['meteor', 'meteor'], () => 0).id).toBe('lightning');
    // A different random value still lands on the other remaining event.
    expect(pickEvent(['meteor', 'meteor'], () => 0.999).id).toBe('fireworks');
    expect(pickEvent(['lightning', 'lightning'], () => 0).id).toBe('meteor');
    expect(pickEvent(['fireworks', 'fireworks'], () => 0).id).toBe('meteor');

    // Two different recent events do not block anything, so the full weights
    // apply and a repeat is allowed. This is not a fixed rotation.
    expect(pickEvent(['meteor', 'lightning'], () => 0).id).toBe('meteor');
  });

  it('reselects a fresh event when a repeated draw would make three in a row', () => {
    const random = mulberry32(31);
    let previous = null;
    let beforePrevious = null;
    for (let index = 0; index < 4000; index += 1) {
      const next = pickEvent([previous, beforePrevious].filter(Boolean), random).id;
      const triple = next === previous && previous === beforePrevious;
      expect(triple).toBe(false);
      beforePrevious = previous;
      previous = next;
    }
  });
});

describe('colour selection', () => {
  it('offers the twelve approved colours exactly', () => {
    expect(COLOURS).toHaveLength(12);
    expect(COLOURS.map((colour) => colour.hex)).toEqual([
      '#B52B32',
      '#28543C',
      '#23395B',
      '#722F3E',
      '#2855A6',
      '#45484D',
      '#F1E8D5',
      '#C49A35',
      '#F7F5EF',
      '#28666B',
      '#C96A25',
      '#B68A5A',
    ]);
    expect(COLOURS.map((colour) => colour.name)).toEqual([
      'Maple Red',
      'Forest Green',
      'Navy Blue',
      'Burgundy',
      'Royal Blue',
      'Charcoal',
      'Cream',
      'Mustard Gold',
      'Winter White',
      'Deep Teal',
      'Pumpkin Orange',
      'Warm Camel',
    ]);
  });

  it('selects each colour with equal probability', () => {
    const counts = new Map();
    const draws = 24000;
    const random = mulberry32(88);
    for (let index = 0; index < draws; index += 1) {
      const colour = pickColour(random);
      counts.set(colour.id, (counts.get(colour.id) || 0) + 1);
    }
    expect(counts.size).toBe(12);
    for (const colour of COLOURS) {
      expect(counts.get(colour.id) / draws).toBeCloseTo(1 / 12, 2);
    }
  });
});

describe('Little Spark selection', () => {
  it('avoids recently used ids', () => {
    const random = mulberry32(5);
    const recent = LITTLE_SPARKS.slice(0, 8).map((spark) => spark.id);
    for (let index = 0; index < 800; index += 1) {
      expect(recent).not.toContain(pickSpark(recent, random).id);
    }
  });

  it('falls back to the full list when every Spark is recent', () => {
    const allIds = LITTLE_SPARKS.map((spark) => spark.id);
    const spark = pickSpark(allIds, mulberry32(2));
    expect(allIds).toContain(spark.id);
  });
});

describe('complete daily result', () => {
  const dateKey = '2026-11-14';

  it('builds a complete, internally consistent result', () => {
    const result = createDailyResult({ dateKey, random: mulberry32(4242) });

    expect(result.dateKey).toBe(dateKey);
    expect(result.percentage).toBeGreaterThanOrEqual(PERCENTAGE_MIN);
    expect(result.percentage).toBeLessThanOrEqual(PERCENTAGE_MAX);
    expect(result.tier.id).toBe(getTierForPercentage(result.percentage).id);
    expect(result.event.numbers).toEqual(EVENTS.find((event) => event.id === result.event.id).numbers);
    expect(COLOURS.map((colour) => colour.id)).toContain(result.colour.id);
    expect(LITTLE_SPARKS.map((spark) => spark.id)).toContain(result.spark.id);
    expect(result.event.numbers).not.toContain(13);
    expect(new Set(result.event.numbers).size).toBe(3);
  });

  it('selects event, colour and Spark independently of the percentage', () => {
    // Every percentage should still be able to pair with every event/colour.
    const seenPairs = new Set();
    const random = mulberry32(606);
    for (let index = 0; index < 2500; index += 1) {
      const result = createDailyResult({ dateKey, random });
      seenPairs.add(`${result.percentage}|${result.event.id}|${result.colour.id}`);
    }
    const events = new Set([...seenPairs].map((pair) => pair.split('|')[1]));
    const colours = new Set([...seenPairs].map((pair) => pair.split('|')[2]));
    expect(events.size).toBe(3);
    expect(colours.size).toBe(12);
  });

  it('is accepted by validation and re-rendered from its stored ids', () => {
    const result = createDailyResult({ dateKey, random: mulberry32(9) });
    expect(validateDailyResult(result, dateKey)).toEqual(
      expect.objectContaining({
        dateKey,
        percentage: result.percentage,
        tier: expect.objectContaining({ id: result.tier.id }),
        event: expect.objectContaining({ id: result.event.id, numbers: result.event.numbers }),
        colour: expect.objectContaining({ id: result.colour.id, hex: result.colour.hex }),
        spark: expect.objectContaining({ id: result.spark.id }),
      }),
    );
  });

  it('rejects invalid persisted results instead of rendering partial data', () => {
    const result = createDailyResult({ dateKey, random: mulberry32(10) });
    expect(validateDailyResult(null)).toBeNull();
    expect(validateDailyResult({})).toBeNull();
    expect(validateDailyResult({ ...result, percentage: 0 }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, percentage: 4 }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, percentage: 101 }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, percentage: 12.5 }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, dateKey: 'other-day' }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, event: { id: 'unknown' } }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, colour: { id: 'unknown' } }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, spark: { id: 'unknown' } }, dateKey)).toBeNull();
  });

  it('carries the entertainment-only Lucky Numbers wording', () => {
    expect(LUCKY_NUMBERS_LABEL).toBe('Your Lucky Numbers');
    expect(ENTERTAINMENT_DISCLAIMER).toMatch(/not lottery predictions or promises of winning/i);
  });
});
