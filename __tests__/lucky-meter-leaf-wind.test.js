import { describe, expect, it } from 'vitest';
import {
  AUTUMN_LEAF_COLOURS,
  pickLeafColour,
  sampleLeafTravel,
  sampleWindField,
} from '../app/lib/lucky-meter/leaf-wind';

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

describe('autumn maple-leaf palette', () => {
  it('is the coherent Canadian autumn set, warm gold included', () => {
    expect(AUTUMN_LEAF_COLOURS.map((colour) => colour.name)).toEqual([
      'Warm Gold',
      'Amber',
      'Copper',
      'Maple Red',
      'Burnt Orange',
      'Burgundy',
      'Russet',
    ]);
    const ids = new Set(AUTUMN_LEAF_COLOURS.map((colour) => colour.id));
    expect(ids.size).toBe(7);
  });

  it('keeps every pigment a valid, visible albedo with a sane metal response', () => {
    for (const colour of AUTUMN_LEAF_COLOURS) {
      expect(colour.albedo).toHaveLength(3);
      for (const channel of colour.albedo) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
      expect(colour.albedo[0]).toBeGreaterThan(colour.albedo[2]);
      expect(colour.metal).toBeGreaterThan(0);
      expect(colour.metal).toBeLessThanOrEqual(1);
      expect(colour.weight).toBeGreaterThan(0);
    }
    // Gold is the most likely pigment, so the scene still reads as golden.
    const gold = AUTUMN_LEAF_COLOURS.find((colour) => colour.id === 'warm-gold');
    expect(Math.max(...AUTUMN_LEAF_COLOURS.map((colour) => colour.weight))).toBe(gold.weight);
  });

  it('selects every colour deterministically across a seeded run', () => {
    const random = mulberry32(2026);
    const seen = new Set();
    for (let index = 0; index < 4000; index += 1) {
      seen.add(pickLeafColour(random).id);
    }
    expect(seen.size).toBe(AUTUMN_LEAF_COLOURS.length);
  });

  it('has no tier or event input, so colour variation cannot track the reading', () => {
    // The selector's only parameter is the random source.
    expect(pickLeafColour.length).toBeLessThanOrEqual(1);
    expect(pickLeafColour(() => 0).id).toBe('warm-gold');
    expect(pickLeafColour(() => 0.999999).id).toBe('russet');
  });
});

describe('shared wind field', () => {
  it('is bounded and deterministic', () => {
    for (let seconds = 0; seconds <= 120; seconds += 0.37) {
      const wind = sampleWindField(seconds);
      expect(wind.gust).toBeGreaterThanOrEqual(-1);
      expect(wind.gust).toBeLessThanOrEqual(1);
      expect(wind.lift).toBeGreaterThanOrEqual(-1);
      expect(wind.lift).toBeLessThanOrEqual(1);
      expect(wind.cross).toBeGreaterThanOrEqual(-1);
      expect(wind.cross).toBeLessThanOrEqual(1);
    }
    expect(sampleWindField(12.5)).toEqual(sampleWindField(12.5));
    expect(sampleWindField(undefined)).toEqual(sampleWindField(0));
  });

  it('gusts rather than sitting at a constant strength', () => {
    const samples = [];
    for (let seconds = 0; seconds < 40; seconds += 0.5) {
      samples.push(sampleWindField(seconds).gust);
    }
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.6);
  });

  it('carries a leaf across the frame and wraps it around', () => {
    const leaf = { travelOffset: 0.2, travelSpeed: 0.02, depth: 0.6 };
    const wind = sampleWindField(0);
    const start = sampleLeafTravel(leaf, 0, wind).x;
    const later = sampleLeafTravel(leaf, 5, wind).x;
    expect(later).toBeGreaterThan(start);

    // After one full wrap the leaf returns to the same place in the window.
    const speed = leaf.travelSpeed * (0.55 + leaf.depth * 0.55);
    const cycle = 1.18 / speed;
    const wrapped = sampleLeafTravel(leaf, cycle, { gust: 0 }).x;
    expect(Math.abs(wrapped - start)).toBeLessThan(0.05);
  });

  it('keeps the travel inside a sane viewport band', () => {
    const leaf = { travelOffset: 0.9, travelSpeed: 0.015, depth: 0.4 };
    for (let seconds = 0; seconds < 200; seconds += 1.7) {
      const { x, progress } = sampleLeafTravel(leaf, seconds, { gust: 0.3 });
      expect(x).toBeGreaterThan(-0.1);
      expect(x).toBeLessThan(1.1);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });
});
