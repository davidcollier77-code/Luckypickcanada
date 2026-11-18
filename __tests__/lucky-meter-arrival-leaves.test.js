import { describe, expect, it } from 'vitest';
import {
  ARRIVAL_TIMING,
  createArrivalLeaves,
  getArrivalDurationMs,
  sampleArrivalLeaf,
  sampleArrivalWind,
} from '../app/lib/lucky-meter/arrival-leaves';

const still = () => 0.5;

describe('arrival leaves composition', () => {
  it('places small leaves around the edges, never over the copy column', () => {
    const leaves = createArrivalLeaves(still, 5, { width: 1440, height: 900 });

    expect(leaves).toHaveLength(5);
    for (const leaf of leaves) {
      expect(leaf.x <= 0.25 || leaf.x >= 0.75).toBe(true);
      expect(leaf.y).toBeGreaterThanOrEqual(0.2);
      expect(leaf.y).toBeLessThanOrEqual(0.92);
      expect(leaf.size).toBeGreaterThanOrEqual(28);
      expect(leaf.size).toBeLessThanOrEqual(44);
      expect(leaf.colour.albedo).toHaveLength(3);
      expect(leaf.id).toMatch(/^arrival-leaf-/);
    }
  });

  it('uses smaller leaves on a phone without moving them into the meter', () => {
    const mobile = createArrivalLeaves(still, 5, { width: 390, height: 844 });
    const desktop = createArrivalLeaves(still, 5, { width: 1440, height: 900 });

    expect(Math.max(...mobile.map((leaf) => leaf.size))).toBeLessThan(
      Math.max(...desktop.map((leaf) => leaf.size)),
    );
    for (const leaf of mobile) {
      expect(leaf.x <= 0.12 || leaf.x >= 0.88).toBe(true);
      // The phone headline spans the width, so the leaves stay below it.
      expect(leaf.y).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('is deterministic for a fixed random source and varies otherwise', () => {
    const first = createArrivalLeaves(still, 5, { width: 1440, height: 900 });
    const second = createArrivalLeaves(still, 5, { width: 1440, height: 900 });
    expect(second).toEqual(first);

    let value = 0;
    const stepping = () => {
      value = (value + 0.137) % 1;
      return value;
    };
    const varied = createArrivalLeaves(stepping, 5, { width: 1440, height: 900 });
    expect(varied.map((leaf) => leaf.x)).not.toEqual(first.map((leaf) => leaf.x));
  });
});

describe('arrival leaves motion', () => {
  const leaf = {
    x: 0.1,
    y: 0.4,
    rotation: 0.2,
    tilt: 0.8,
    liftDelay: 100,
    flightMs: 2000,
    driftX: 0.25,
    rise: 0.2,
    spin: 1.5,
    flutterSpeed: 6,
    flutterPhase: 0.3,
    swayAmp: 0.002,
    swayPhase: 0.5,
  };

  it('rests for the first second without lifting', () => {
    for (const elapsed of [0, 500, ARRIVAL_TIMING.restMs]) {
      const state = sampleArrivalLeaf(leaf, elapsed, { gust: 0, cross: 0 });
      expect(state.visible).toBe(true);
      expect(state.lifted).toBe(false);
      expect(state.alpha).toBe(1);
      expect(state.progress).toBe(0);
    }
  });

  it('lifts after the breeze reaches the leaf and travels across the sky', () => {
    const start = ARRIVAL_TIMING.restMs + leaf.liftDelay + 200;
    const state = sampleArrivalLeaf(leaf, start, { gust: 0.4, cross: 0.2 });
    const later = sampleArrivalLeaf(leaf, start + 900, { gust: 0.4, cross: 0.2 });

    expect(state.lifted).toBe(true);
    expect(state.visible).toBe(true);
    expect(state.progress).toBeGreaterThan(0);
    expect(later.x).toBeGreaterThan(state.x);
    expect(later.y).toBeLessThan(state.y);
    expect(later.alpha).toBe(1);
  });

  it('fades and disappears exactly at the end of its crossing', () => {
    const end = ARRIVAL_TIMING.restMs + leaf.liftDelay + leaf.flightMs;
    const fading = sampleArrivalLeaf(leaf, end - 200, { gust: 0, cross: 0 });
    const gone = sampleArrivalLeaf(leaf, end, { gust: 0, cross: 0 });

    expect(fading.alpha).toBeGreaterThan(0);
    expect(fading.alpha).toBeLessThan(1);
    expect(gone.alpha).toBe(0);
    expect(gone.visible).toBe(false);
  });

  it('reports the full duration from every leaf', () => {
    const leaves = [
      { liftDelay: 0, flightMs: 1000 },
      { liftDelay: 240, flightMs: 2350 },
    ];
    expect(getArrivalDurationMs(leaves)).toBe(ARRIVAL_TIMING.restMs + 240 + 2350);
    expect(getArrivalDurationMs([])).toBe(ARRIVAL_TIMING.restMs);
  });

  it('uses the shared, finite wind field', () => {
    const wind = sampleArrivalWind(1800);
    for (const value of Object.values(wind)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
