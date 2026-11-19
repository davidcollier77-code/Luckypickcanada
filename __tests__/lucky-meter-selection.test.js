import { describe, expect, it } from 'vitest';
import {
  ENTERTAINMENT_DISCLAIMER,
  EVENTS,
  LUCKY_COLOUR_LABEL,
  LUCKY_NUMBER_LABEL,
  LUCKY_NUMBER_MAX,
  LUCKY_NUMBER_MIN,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
  TIERS,
} from '../app/lib/lucky-meter/config';
import { LITTLE_SPARKS } from '../app/lib/lucky-meter/little-sparks';
import {
  ALL_COLOURS,
  getPaletteForSeasonKey,
  getSeasonForDateKey,
} from '../app/lib/lucky-meter/sparks-and-seasonal-colours';
import {
  createDailyResult,
  getEventForPercentage,
  getEventIdForTier,
  getTierForPercentage,
  hasValidLuckyNumber,
  pickColour,
  pickLuckyNumber,
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

  it('keeps tiers and events free of fixed number triplets and weights', () => {
    for (const tier of TIERS) {
      expect(tier.numbers).toBeUndefined();
    }
    for (const event of EVENTS) {
      expect(event.numbers).toBeUndefined();
      expect(event.weight).toBeUndefined();
    }
  });

  it('never disagrees between the percentage, the tier and the event', () => {
    const random = mulberry32(20261118);
    for (let index = 0; index < 4000; index += 1) {
      const result = createDailyResult({ dateKey: '2026-11-18', random });
      const tier = getTierForPercentage(result.percentage);
      expect(result.tier.id).toBe(tier.id);
      expect(result.tier.label).toBe(tier.label);
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

  it('excludes only the immediately preceding saved percentage', () => {
    const random = mulberry32(99);
    const history = [12, 55, 97];
    for (let index = 0; index < 3000; index += 1) {
      expect(pickPercentage(history, random)).not.toBe(12);
    }
  });

  it('lets older percentages — including the previous tier — become eligible again', () => {
    const random = mulberry32(4);
    // 8 is the immediately preceding value. 9, 10 and 80 are older and must be
    // eligible again, even though 9 and 10 share the previous tier.
    const history = [8, 9, 10, 80];
    const seen = new Set();
    for (let index = 0; index < 6000; index += 1) {
      seen.add(pickPercentage(history, random));
    }
    expect(seen.has(8)).toBe(false);
    expect(seen.has(9)).toBe(true);
    expect(seen.has(10)).toBe(true);
    expect(seen.has(80)).toBe(true);
  });

  it('keeps the original uniform distribution over the 95 remaining values', () => {
    const random = mulberry32(2026);
    const draws = 190_000;
    const counts = new Map();
    for (let index = 0; index < draws; index += 1) {
      const value = pickPercentage([77], random);
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    expect(counts.size).toBe(95);
    expect(counts.has(77)).toBe(false);
    for (const [value, count] of counts) {
      expect(value).toBeGreaterThanOrEqual(PERCENTAGE_MIN);
      expect(value).toBeLessThanOrEqual(PERCENTAGE_MAX);
      expect(count / draws).toBeCloseTo(1 / 95, 2);
    }
    // Both ends of the range are still reachable.
    expect(counts.has(5)).toBe(true);
    expect(counts.has(100)).toBe(true);
  });

  it('does not exclude a tier band or an event, so the same event can repeat', () => {
    const random = mulberry32(808);
    // The previous saved result was Low, but Low percentages remain eligible.
    const draws = Array.from({ length: 6000 }, () => pickPercentage([28], random));
    expect(draws.some((value) => value < 28 && value <= 30)).toBe(true);
    expect(draws.every((value) => value !== 28)).toBe(true);
    expect(new Set(draws.map((value) => getTierForPercentage(value).id))).toEqual(
      new Set(['low', 'medium', 'high']),
    );

    // Consecutive days may show the same event with a different percentage.
    const first = createDailyResult({ dateKey: '2026-11-17', random: () => 0 });
    const second = createDailyResult({
      dateKey: '2026-11-18',
      random: () => 0,
      history: {
        percentages: [first.percentage],
        numbers: [first.luckyNumber],
        colours: [first.colour.id],
        sparks: [first.spark.id],
      },
    });
    expect(first.percentage).toBe(5);
    expect(second.percentage).toBe(6);
    expect(second.event.id).toBe(first.event.id);
  });

  it('ignores legacy event history instead of blocking an event', () => {
    const result = createDailyResult({
      dateKey: '2026-11-18',
      random: () => 0,
      history: { events: ['meteor', 'meteor', 'meteor'], percentages: [] },
    });
    expect(result.percentage).toBe(PERCENTAGE_MIN);
    expect(result.event.id).toBe('meteor');
  });
});

describe('Lucky Number selection', () => {
  it('draws one integer from 1 to 50 with equal probability', () => {
    const random = mulberry32(4242);
    const draws = 95_000;
    const counts = new Map();
    for (let index = 0; index < draws; index += 1) {
      const value = pickLuckyNumber([], random);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(LUCKY_NUMBER_MIN);
      expect(value).toBeLessThanOrEqual(LUCKY_NUMBER_MAX);
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    expect(counts.size).toBe(50);
    for (const value of counts.keys()) {
      expect(counts.get(value) / draws).toBeCloseTo(1 / 50, 2);
    }
  });

  it('excludes only the number in the most recent saved result', () => {
    const random = mulberry32(15);
    const history = [17, 23];
    const seen = new Set();
    for (let index = 0; index < 6000; index += 1) {
      seen.add(pickLuckyNumber(history, random));
    }
    expect(seen.has(17)).toBe(false);
    // The previous-previous number is eligible again.
    expect(seen.has(23)).toBe(true);
    expect(seen.size).toBe(49);
  });

  it('is independent of the percentage and never a fixed triplet', () => {
    const random = mulberry32(606);
    const pairs = new Set();
    for (let index = 0; index < 4000; index += 1) {
      const result = createDailyResult({ dateKey: '2026-11-18', random });
      expect(Array.isArray(result.luckyNumber)).toBe(false);
      pairs.add(`${result.percentage}|${result.luckyNumber}`);
      // No tier owns numbers any more.
      expect(result.tier.numbers).toBeUndefined();
    }
    // Many different numbers appear across every tier.
    const numbers = new Set([...pairs].map((pair) => pair.split('|')[1]));
    expect(numbers.size).toBeGreaterThan(40);
    expect(pairs.size).toBeGreaterThan(600);
  });
});

describe('Lucky Colour selection', () => {
  it('uses the active season’s twelve exact values', () => {
    const autumn = getPaletteForSeasonKey('autumn');
    expect(autumn).toHaveLength(12);
    expect(autumn.map((colour) => colour.hex)).toEqual([
      '#A83232',
      '#C45A24',
      '#D87925',
      '#C99A24',
      '#B58A32',
      '#A65E3B',
      '#702D3D',
      '#A34B32',
      '#405B42',
      '#32666A',
      '#426789',
      '#B58A65',
    ]);
    expect(autumn.map((colour) => colour.name)).toEqual([
      'Maple Red',
      'Burnt Orange',
      'Pumpkin',
      'Goldenrod',
      'Mustard Gold',
      'Copper',
      'Burgundy',
      'Rust',
      'Forest Green',
      'Deep Teal',
      'Denim Blue',
      'Warm Camel',
    ]);
  });

  it('selects each remaining seasonal colour with equal probability', () => {
    const counts = new Map();
    const draws = 33_000;
    const random = mulberry32(88);
    const palette = getPaletteForSeasonKey('autumn');
    for (let index = 0; index < draws; index += 1) {
      const colour = pickColour(['maple-red'], random, palette);
      counts.set(colour.id, (counts.get(colour.id) || 0) + 1);
    }
    expect(counts.has('maple-red')).toBe(false);
    expect(counts.size).toBe(11);
    for (const colour of palette.filter((entry) => entry.id !== 'maple-red')) {
      expect(counts.get(colour.id) / draws).toBeCloseTo(1 / 11, 2);
    }
    // Every colour carries the palette's exact HEX and painted finish.
    for (const colour of palette) {
      expect(ALL_COLOURS.find((entry) => entry.id === colour.id)?.hex).toBe(colour.hex);
      expect(colour.texture.finish).toBeTruthy();
    }
  });

  it('excludes only the most recent colour, so older colours return', () => {
    const random = mulberry32(21);
    const seen = new Set();
    const palette = getPaletteForSeasonKey('winter');
    for (let index = 0; index < 3000; index += 1) {
      seen.add(pickColour(['winter-berry', 'winter-wool-red'], random, palette).id);
    }
    expect(seen.has('winter-berry')).toBe(false);
    expect(seen.has('winter-wool-red')).toBe(true);
    expect(seen.size).toBe(11);
  });

  it('draws from the season of the local date, not a fixed list', () => {
    const spring = createDailyResult({ dateKey: '2027-04-10', random: () => 0 });
    const winter = createDailyResult({ dateKey: '2027-01-10', random: () => 0 });
    expect(spring.season).toBe('spring');
    expect(winter.season).toBe('winter');
    expect(spring.colour.id).toBe(getPaletteForSeasonKey('spring')[0].id);
    expect(winter.colour.id).toBe(getPaletteForSeasonKey('winter')[0].id);
    expect(spring.colour.hex).not.toBe(winter.colour.hex);
  });
});

describe('Little Spark selection', () => {
  it('excludes only the most recent Spark and keeps the rest available', () => {
    const random = mulberry32(5);
    const history = ['spark-01', 'spark-02'];
    const seen = new Set();
    for (let index = 0; index < 6000; index += 1) {
      seen.add(pickSpark(history, random).id);
    }
    expect(seen.has('spark-01')).toBe(false);
    // Older Sparks become eligible again.
    expect(seen.has('spark-02')).toBe(true);
    expect(seen.size).toBe(29);
  });

  it('falls back to the full list when the stored id is unknown', () => {
    const random = mulberry32(2);
    const seen = new Set();
    for (let index = 0; index < 3000; index += 1) {
      seen.add(pickSpark(['not-a-spark'], random).id);
    }
    expect(seen.size).toBe(30);
  });
});

describe('complete daily result', () => {
  const dateKey = '2026-11-18';

  it('builds a complete, internally consistent result', () => {
    const result = createDailyResult({ dateKey, random: mulberry32(4242) });

    expect(result.dateKey).toBe(dateKey);
    expect(result.percentage).toBeGreaterThanOrEqual(PERCENTAGE_MIN);
    expect(result.percentage).toBeLessThanOrEqual(PERCENTAGE_MAX);
    expect(result.tier.id).toBe(getTierForPercentage(result.percentage).id);
    expect(result.event.id).toBe(getEventForPercentage(result.percentage).id);
    expect(Number.isInteger(result.luckyNumber)).toBe(true);
    expect(result.luckyNumber).toBeGreaterThanOrEqual(LUCKY_NUMBER_MIN);
    expect(result.luckyNumber).toBeLessThanOrEqual(LUCKY_NUMBER_MAX);
    expect(ALL_COLOURS.map((colour) => colour.id)).toContain(result.colour.id);
    expect(getSeasonForDateKey(dateKey)?.key).toBe(result.season);
    expect(LITTLE_SPARKS.map((spark) => spark.id)).toContain(result.spark.id);
  });

  it('keeps number, colour and Spark independent of the percentage', () => {
    const random = mulberry32(606);
    const tierCounts = new Map();
    const colourIds = new Set();
    const sparkIds = new Set();
    const numbers = new Set();
    for (let index = 0; index < 3000; index += 1) {
      const result = createDailyResult({ dateKey, random });
      const tier = result.tier.id;
      const entry = tierCounts.get(tier) || { colours: new Set(), numbers: new Set() };
      entry.colours.add(result.colour.id);
      entry.numbers.add(result.luckyNumber);
      tierCounts.set(tier, entry);
      colourIds.add(result.colour.id);
      sparkIds.add(result.spark.id);
      numbers.add(result.luckyNumber);
    }
    expect(colourIds.size).toBe(12);
    expect(sparkIds.size).toBe(30);
    expect(numbers.size).toBe(50);
    // Every tier can appear with every colour and a wide spread of numbers.
    expect(tierCounts.size).toBe(3);
    for (const entry of tierCounts.values()) {
      expect(entry.colours.size).toBe(12);
      expect(entry.numbers.size).toBeGreaterThan(30);
    }
  });

  it('marks light colours from the shared palette rather than hard-coded ids', () => {
    const snow = createDailyResult({ dateKey: '2027-01-10', random: () => 0 });
    expect(snow.colour.id).toBe('winter-snowfall');
    expect(snow.colour.light).toBe(true);

    const mapleRed = createDailyResult({ dateKey, random: () => 0 });
    expect(mapleRed.colour.id).toBe('maple-red');
    expect(mapleRed.colour.light).toBe(false);
  });

  it('honours the one-value exclusions from the saved history', () => {
    const result = createDailyResult({
      dateKey,
      random: () => 0.5,
      history: {
        percentages: [53],
        numbers: [26],
        colours: ['burgundy'],
        sparks: ['spark-16'],
      },
    });
    expect(result.percentage).toBe(52);
    expect(result.luckyNumber).not.toBe(26);
    expect(result.colour.id).not.toBe('burgundy');
    expect(result.spark.id).not.toBe('spark-16');
  });

  it('carries the entertainment-only single Lucky Number wording', () => {
    expect(LUCKY_NUMBER_LABEL).toBe('Lucky Number');
    expect(LUCKY_COLOUR_LABEL).toBe('Lucky Colour');
    expect(ENTERTAINMENT_DISCLAIMER).toMatch(/not lottery predictions or promises of winning/i);
  });
});

describe('saved result validation and lucky-number migration', () => {
  const dateKey = '2026-11-18';

  function legacyResult(overrides = {}) {
    return {
      dateKey,
      percentage: 91,
      tier: { id: 'low', label: 'Low Resonance', message: 'stale' },
      event: { id: 'meteor', name: 'Meteor Shower' },
      colour: { id: 'maple-red', name: 'Maple Red', hex: '#B52B32', light: false },
      spark: { id: 'spark-04', message: 'Stored spark' },
      createdAt: 1234567890,
      ...overrides,
    };
  }

  it('normalises the derived reveal from the preserved percentage', () => {
    const normalized = validateDailyResult(legacyResult(), dateKey, () => 0.5);
    expect(normalized.percentage).toBe(91);
    expect(normalized.tier).toEqual({
      id: 'high',
      label: 'High Resonance',
      message: "Your luck is running high today!",
    });
    expect(normalized.event).toEqual({ id: 'fireworks', name: 'Fireworks' });
    // The saved colour and Spark are preserved, not rerolled. A legacy value
    // keeps its exact stored HEX even though Maple Red now has a new one.
    expect(normalized.colour.id).toBe('maple-red');
    expect(normalized.colour.hex).toBe('#B52B32');
    expect(normalized.season).toBe('autumn');
    expect(normalized.spark.id).toBe('spark-04');
    expect(normalized.dateKey).toBe(dateKey);
    expect(normalized.createdAt).toBe(1234567890);
  });

  it('generates exactly one Lucky Number for a legacy result and keeps it afterwards', () => {
    const random = () => 0.5;
    const migrated = validateDailyResult(legacyResult(), dateKey, random);
    expect(hasValidLuckyNumber(legacyResult())).toBe(false);
    expect(migrated.luckyNumber).toBe(26);
    expect(hasValidLuckyNumber(migrated)).toBe(true);

    // Re-validating the migrated record is idempotent: the number is reused and
    // the random source is never consulted again.
    let calls = 0;
    const neverCalled = () => {
      calls += 1;
      return 0;
    };
    const again = validateDailyResult(migrated, dateKey, neverCalled);
    expect(again.luckyNumber).toBe(26);
    expect(calls).toBe(0);
  });

  it('preserves an existing lucky number even when the definition changed', () => {
    const saved = legacyResult({ luckyNumber: 7 });
    expect(validateDailyResult(saved, dateKey, () => 0.9).luckyNumber).toBe(7);
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
    // An invalid stored number is replaced once rather than rejecting the day.
    expect(
      validateDailyResult({ ...result, luckyNumber: 0 }, dateKey, () => 0.5).luckyNumber,
    ).toBe(26);
    expect(
      validateDailyResult({ ...result, luckyNumber: 51 }, dateKey, () => 0.5).luckyNumber,
    ).toBe(26);
  });
});
