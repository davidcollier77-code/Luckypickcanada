import { describe, expect, it } from 'vitest';
import { EVENTS } from '../app/lib/lucky-meter/config';
import {
  angleToPercentage,
  buildDialSpin,
  DIAL_TURNS,
  dialEase,
  EVENT_START_MS,
  getEventDurationMs,
  normalizeAngle,
  percentageToAngle,
  REVEAL_TIMING,
  sampleDialSpin,
} from '../app/lib/lucky-meter/reveal';

const noJitter = () => 0.5;

/** Smallest absolute difference between two angles on a circle, in degrees. */
const angularGap = (left, right) => {
  const difference = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return Math.min(difference, 360 - difference);
};

describe('reveal timing', () => {
  it('holds the real percentage for 4.5 seconds, flashes, then reveals the details', () => {
    expect(REVEAL_TIMING.scrambleMs).toBe(4500);
    expect(REVEAL_TIMING.flashCount).toBeGreaterThanOrEqual(2);
    expect(REVEAL_TIMING.flashCount).toBeLessThanOrEqual(3);
    expect(REVEAL_TIMING.flashMs).toBe(600);
    // Percentage/tier land first, then the tier's numbers, then the supporting
    // panels, then the event. Every beat is long enough to be read.
    expect(REVEAL_TIMING.numbersDelayMs).toBe(800);
    expect(REVEAL_TIMING.detailsDelayMs).toBe(600);
    expect(REVEAL_TIMING.eventDelayMs).toBe(600);
    expect(EVENT_START_MS).toBe(6500);
  });
});

describe('dial geometry', () => {
  it('maps the whole percentage range onto one turn of the dial', () => {
    expect(percentageToAngle(5)).toBeCloseTo(18, 6);
    expect(percentageToAngle(50)).toBeCloseTo(180, 6);
    expect(percentageToAngle(100)).toBeCloseTo(360, 6);
    for (const percentage of [5, 30, 31, 65, 66, 100]) {
      expect(angleToPercentage(percentageToAngle(percentage))).toBe(percentage);
    }
    // Wrapping is stable for the multi-turn values the animation produces.
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(1170)).toBe(90);
  });
});

describe('dial spin', () => {
  it('spins three to five full turns and lands on the exact result angle', () => {
    for (const percentage of [5, 6, 30, 31, 65, 66, 79, 99, 100]) {
      const spin = buildDialSpin(percentage, noJitter);
      expect(spin.turns).toBeGreaterThanOrEqual(DIAL_TURNS.min);
      expect(spin.turns).toBeLessThanOrEqual(DIAL_TURNS.max);
      expect(spin.startAngle).toBeGreaterThanOrEqual(0);
      expect(spin.startAngle).toBeLessThan(360);
      expect(spin.endAngle).toBeCloseTo(percentageToAngle(percentage), 6);
      // The final pointer position is the percentage, not a rounded neighbour.
      expect(angularGap(spin.startAngle + spin.totalSweep, spin.endAngle)).toBeLessThan(1e-6);
      expect(spin.totalSweep).toBeGreaterThan(360);
    }
  });

  it('is unpredictable: different draws produce different spins', () => {
    const first = buildDialSpin(53, () => 0.1);
    const second = buildDialSpin(53, () => 0.9);
    expect(first.startAngle).not.toBeCloseTo(second.startAngle, 3);
    expect(first.turns).not.toBe(second.turns);
  });

  it('decelerates heavily so the pointer creeps into its last degrees', () => {
    expect(dialEase(0)).toBe(0);
    expect(dialEase(1)).toBe(1);
    expect(dialEase(0.5)).toBeGreaterThan(0.9);
    // Monotonic, so the pointer never runs backwards.
    let previous = -1;
    for (let step = 0; step <= 20; step += 1) {
      const value = dialEase(step / 20);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe('sampled dial and number', () => {
  it('reads the number from the pointer and never shows the result early', () => {
    for (const final of [5, 6, 30, 31, 53, 65, 66, 91, 99, 100]) {
      const spin = buildDialSpin(final, () => 0.37);
      let previousAngle = -Infinity;
      for (let elapsed = 0; elapsed < REVEAL_TIMING.scrambleMs; elapsed += 25) {
        const sample = sampleDialSpin(elapsed, spin, final);
        expect(sample.angle).toBeGreaterThanOrEqual(previousAngle);
        previousAngle = sample.angle;
        expect(sample.percentage).not.toBe(final);
        expect(sample.percentage).toBeGreaterThanOrEqual(5);
        expect(sample.percentage).toBeLessThanOrEqual(100);
        expect(Number.isInteger(sample.percentage)).toBe(true);
        expect(sample.percentage).not.toBe(0);
      }
    }
  });

  it('finishes on the result angle, so the stop and the number agree', () => {
    for (const final of [5, 30, 31, 65, 66, 100]) {
      const spin = buildDialSpin(final, () => 0.62);
      const landed = sampleDialSpin(REVEAL_TIMING.scrambleMs, spin, final);
      expect(angularGap(landed.angle, percentageToAngle(final))).toBeLessThan(1e-6);
      expect(angleToPercentage(landed.angle)).toBe(final);
    }
  });

  it('survives a missing spin without throwing', () => {
    const sample = sampleDialSpin(1200, null, 42);
    expect(Number.isFinite(sample.angle)).toBe(true);
    expect(sample.percentage).not.toBe(42);
  });
});

describe('event duration selection', () => {
  it('keeps every event inside its documented window', () => {
    for (const event of EVENTS) {
      const shortest = getEventDurationMs(event.id, () => 0);
      const longest = getEventDurationMs(event.id, () => 0.999999);
      expect(shortest).toBe(event.minDurationMs);
      expect(longest).toBe(event.maxDurationMs);
    }
    expect(getEventDurationMs('lightning', () => 0.5)).toBe(10000);
    expect(getEventDurationMs('fireworks', () => 0)).toBe(11000);
    expect(getEventDurationMs('unknown', () => 0.5)).toBe(0);
  });
});
