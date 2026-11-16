import { describe, expect, it } from 'vitest';
import {
  COLOURS,
  ENTERTAINMENT_DISCLAIMER,
  EVENTS,
  LUCKY_NUMBERS_LABEL,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
  TIERS,
} from '../app/lib/lucky-meter/config';
import { LITTLE_SPARKS } from '../app/lib/lucky-meter/little-sparks';
import {
  createDailyResult,
  getEventForPercentage,
  getEventIdForTier,
  getTierForPercentage,
  pickColour,
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

describe('tier and event boundaries', () => {
  it('maps 5–30 Low, 31–65 Medium and 66–100 High exactly', () => {
    expect(getTierForPercentage(5)).toMatchObject({
      id: 'low',
      message: "You're riding a little low today, but you're still okay!",
    });
    expect(getTierForPercentage(30).id).toBe('low');
    expect(getTierForPercentage(31)).toMatchObject({
      id: 'medium',
      message: 'Your luck is in the mid-range today.',
    });
    expect(getTierForPercentage(65).id).toBe('medium');
    expect(getTierForPercentage(66)).toMatchObject({
      id: 'high',
      message: "Your luck is running high today!",
    });
    expect(getTierForPercentage(100).id).toBe('high');
    expect(getTierForPercentage(4)).toBeNull();
    expect(getTierForPercentage(101)).toBeNull();
  });

  it('derives the one event for a percentage from that tier', () => {
    expect(getEventForPercentage(5).id).toBe('meteor');
    expect(getEventForPercentage(30).id).toBe('meteor');
    expect(getEventForPercentage(31).id).toBe('lightning');
    expect(getEventForPercentage(65).id).toBe('lightning');
    expect(getEventForPercentage(66).id).toBe('fireworks');
    expect(getEventForPercentage(100).id).toBe('fireworks');
    expect(getEventForPercentage(4)).toBeNull();
    expect(getEventForPercentage(101)).toBeNull();
    expect(getEventIdForTier('low')).toBe('meteor');
    expect(getEventIdForTier('medium')).toBe('lightning');
    expect(getEventIdForTier('high')).toBe('fireworks');
    expect(getEventIdForTier('unknown')).toBeNull();
  });

  it('keeps the three approved triplets fixed on Low, Medium and High', () => {
    expect(TIERS.map((tier) => ({ id: tier.id, numbers: tier.numbers }))).toEqual([
      { id: 'low', numbers: [3, 9, 21] },
      { id: 'medium', numbers: [11, 22, 33] },
      { id: 'high', numbers: [7, 8, 77] },
    ]);
    for (const tier of TIERS) {
      expect(new Set(tier.numbers).size).toBe(3);
      expect(tier.numbers).not.toContain(13);
    }
    // The numbers belong to the tier: events carry no numbers or weights.
    for (const event of EVENTS) {
      expect(event.numbers).toBeUndefined();
      expect(event.weight).toBeUndefined();
    }
  });

  it('never disagrees between the number, the tier and the event', () => {
    const random = mulberry32(20261116);
    for (let index = 0; index < 4000; index += 1) {
      const result = createDailyResult({ dateKey: '2026-11-16', random });
      const tier = getTierForPercentage(result.percentage);
      expect(result.tier.id).toBe(tier.id);
      expect(result.tier.label).toBe(tier.label);
      expect(result.tier.numbers).toEqual(tier.numbers);
      expect(result.event.id).toBe(tier.eventId);
      expect(result.event).toEqual({
        id: tier.eventId,
        name: EVENTS.find((event) => event.id === tier.eventId).name,
      });
    }
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

  it('excludes exactly one event band when that event is blocked', () => {
    const random = mulberry32(808);
    const draws = Array.from({ length: 1200 }, () => pickPercentage([], random, 'lightning'));
    expect(draws.every((value) => getEventForPercentage(value).id !== 'lightning')).toBe(true);
    expect(new Set(draws.map((value) => getTierForPercentage(value).id))).toEqual(
      new Set(['low', 'high']),
    );

    const meteorDraws = Array.from({ length: 1200 }, () => pickPercentage([], random, 'meteor'));
    expect(meteorDraws.every((value) => value >= 31)).toBe(true);
    const fireworkDraws = Array.from({ length: 1200 }, () =>
      pickPercentage([], random, 'fireworks'),
    );
    expect(fireworkDraws.every((value) => value <= 65)).toBe(true);
  });
});

describe('three-day event repeat protection', () => {
  it('never lets the same event run three days in a row', () => {
    const random = mulberry32(31);
    let previous = null;
    let beforePrevious = null;
    let percentages = [];
    for (let index = 0; index < 3000; index += 1) {
      const result = createDailyResult({
        dateKey: '2026-11-16',
        history: {
          percentages,
          events: [previous, beforePrevious].filter(Boolean),
        },
        random,
      });
      expect(result.event.id).toBe(getEventForPercentage(result.percentage).id);
      if (previous && beforePrevious) {
        expect(result.event.id === previous && previous === beforePrevious).toBe(false);
      }
      percentages = [result.percentage, ...percentages].slice(0, 3);
      beforePrevious = previous;
      previous = result.event.id;
    }
  });

  it('ignores unknown event ids in the history instead of blocking wrongly', () => {
    const result = createDailyResult({
      dateKey: '2026-11-16',
      history: { events: ['unknown', 'unknown'] },
      random: () => 0,
    });
    expect(result.percentage).toBe(PERCENTAGE_MIN);
    expect(result.event.id).toBe('meteor');
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
    expect(result.tier.numbers).toEqual(
      TIERS.find((tier) => tier.id === result.tier.id).numbers,
    );
    expect(result.event.id).toBe(getEventForPercentage(result.percentage).id);
    expect(COLOURS.map((colour) => colour.id)).toContain(result.colour.id);
    expect(LITTLE_SPARKS.map((spark) => spark.id)).toContain(result.spark.id);
    expect(result.tier.numbers).not.toContain(13);
    expect(new Set(result.tier.numbers).size).toBe(3);
  });

  it('keeps colour and Spark independent of the percentage', () => {
    const seenPairs = new Set();
    const runs = new Set();
    const random = mulberry32(606);
    for (let index = 0; index < 2500; index += 1) {
      const result = createDailyResult({ dateKey, random });
      seenPairs.add(`${result.percentage}|${result.colour.id}|${result.spark.id}`);
      runs.add(`${result.event.id}|${result.colour.id}`);
    }
    const colours = new Set([...seenPairs].map((pair) => pair.split('|')[1]));
    const events = new Set([...runs].map((pair) => pair.split('|')[0]));
    // Every event can appear with any colour, but each event only appears with
    // percentages in its own tier band.
    expect(colours.size).toBe(12);
    expect(events).toEqual(new Set(['meteor', 'lightning', 'fireworks']));
  });

  it('marks light colours from the shared palette rather than hard-coded ids', () => {
    const cream = createDailyResult({ dateKey, random: () => 0.5 });
    expect(cream.colour.id).toBe('cream');
    expect(cream.colour.light).toBe(true);

    const mapleRed = createDailyResult({ dateKey, random: () => 0 });
    expect(mapleRed.colour.id).toBe('maple-red');
    expect(mapleRed.colour.light).toBe(false);
  });

  it('is accepted by validation and re-rendered from its stored ids', () => {
    const result = createDailyResult({ dateKey, random: mulberry32(9) });
    expect(validateDailyResult(result, dateKey)).toEqual(
      expect.objectContaining({
        dateKey,
        percentage: result.percentage,
        tier: expect.objectContaining({
          id: result.tier.id,
          numbers: result.tier.numbers,
        }),
        event: expect.objectContaining({ id: result.event.id }),
        colour: expect.objectContaining({ id: result.colour.id, hex: result.colour.hex }),
        spark: expect.objectContaining({ id: result.spark.id }),
      }),
    );
  });

  it('normalises a stale saved tier and event from its preserved percentage', () => {
    const saved = {
      dateKey,
      // 91 is High and must show Fireworks, but the payload says Low/Meteor
      // because it was written before the percentage decided the reveal.
      percentage: 91,
      tier: { id: 'low', label: 'Low Resonance', message: 'stale', numbers: [3, 9, 21] },
      event: { id: 'meteor', name: 'Meteor Shower' },
      colour: { id: 'maple-red', name: 'Maple Red', hex: '#B52B32', light: false },
      spark: { id: 'spark-04', message: 'Stored spark' },
      createdAt: 1234567890,
    };

    const normalized = validateDailyResult(saved, dateKey);
    expect(normalized.percentage).toBe(91);
    expect(normalized.tier).toEqual({
      id: 'high',
      label: 'High Resonance',
      message: "Your luck is running high today!",
      numbers: [7, 8, 77],
    });
    expect(normalized.event).toEqual({ id: 'fireworks', name: 'Fireworks' });
    // The saved reading is preserved, not rerolled. The Spark text is always
    // the canonical copy for its saved id, as it was before this change.
    expect(normalized.colour).toEqual(saved.colour);
    expect(normalized.spark).toEqual({
      id: 'spark-04',
      message: LITTLE_SPARKS.find((spark) => spark.id === 'spark-04').message,
    });
    expect(normalized.dateKey).toBe(dateKey);
    expect(normalized.createdAt).toBe(1234567890);
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
    expect(validateDailyResult({ ...result, colour: { id: 'unknown' } }, dateKey)).toBeNull();
    expect(validateDailyResult({ ...result, spark: { id: 'unknown' } }, dateKey)).toBeNull();
    // An event id is derived data now, so an old or missing one is normalised
    // rather than invalidating the visitor's saved reading.
    expect(validateDailyResult({ ...result, event: { id: 'unknown' } }, dateKey)).not.toBeNull();
    expect(validateDailyResult({ ...result, event: undefined }, dateKey)).not.toBeNull();
  });

  it('carries the entertainment-only Lucky Numbers wording', () => {
    expect(LUCKY_NUMBERS_LABEL).toBe('Your Lucky Numbers');
    expect(ENTERTAINMENT_DISCLAIMER).toMatch(/not lottery predictions or promises of winning/i);
  });
});
