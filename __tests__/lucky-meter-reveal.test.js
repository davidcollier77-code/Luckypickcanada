import { describe, expect, it } from 'vitest';
import { COLOURS, EVENTS } from '../app/lib/lucky-meter/config';
import {
  COLOUR_STEPS,
  DEGREES_PER_COLOUR,
  DIAL_TURNS,
  EVENT_START_MS,
  angleToLuckyNumber,
  angleToPercentage,
  buildColourSpin,
  buildDialSpin,
  buildNumberSpin,
  dialEase,
  getColourIdAt,
  getColourIndex,
  getEventDurationMs,
  luckyNumberToAngle,
  normalizeAngle,
  percentageToAngle,
  REVEAL_TIMING,
  rotationToColourIndex,
  sampleColourSpin,
  sampleDialSpin,
  sampleNumberSpin,
} from '../app/lib/lucky-meter/reveal';

const noJitter = () => 0.5;

/** Smallest absolute difference between two angles on a circle, in degrees. */
const angularGap = (left, right) => {
  const difference = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return Math.min(difference, 360 - difference);
};

describe('reveal timing', () => {
  it('starts all three motions together and settles them inside 1–1.5 seconds', () => {
    expect(REVEAL_TIMING.percentageSettleMs).toBeLessThan(REVEAL_TIMING.numberSettleMs);
    expect(REVEAL_TIMING.numberSettleMs).toBeLessThan(REVEAL_TIMING.colourSettleMs);
    expect(REVEAL_TIMING.colourSettleMs).toBeGreaterThanOrEqual(1000);
    expect(REVEAL_TIMING.colourSettleMs).toBeLessThanOrEqual(1500);
    expect(REVEAL_TIMING.percentageSettleMs).toBeGreaterThanOrEqual(400);
    // The shared motion window is the last settle, so nothing runs on after it.
    expect(REVEAL_TIMING.spinMs).toBe(REVEAL_TIMING.colourSettleMs);
  });

  it('begins the percentage-selected cinematic only after every settle', () => {
    expect(EVENT_START_MS).toBe(REVEAL_TIMING.colourSettleMs + REVEAL_TIMING.eventDelayMs);
    expect(EVENT_START_MS).toBeGreaterThan(REVEAL_TIMING.colourSettleMs);
    // The quill starts after the cinematic, never before it.
    expect(REVEAL_TIMING.sparkStartDelayMs).toBeGreaterThan(0);
    expect(REVEAL_TIMING.flashCount).toBeGreaterThanOrEqual(2);
    expect(REVEAL_TIMING.flashCount).toBeLessThanOrEqual(3);
  });
});

describe('percentage dial geometry', () => {
  it('maps the whole percentage range onto one turn of the dial', () => {
    expect(percentageToAngle(5)).toBeCloseTo(18, 6);
    expect(percentageToAngle(50)).toBeCloseTo(180, 6);
    expect(percentageToAngle(100)).toBeCloseTo(360, 6);
    for (const percentage of [5, 30, 31, 65, 66, 100]) {
      expect(angleToPercentage(percentageToAngle(percentage))).toBe(percentage);
    }
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(1170)).toBe(90);
  });
});

describe('percentage dial spin', () => {
  it('spins two to three full turns and lands on the exact result angle', () => {
    for (const percentage of [5, 6, 30, 31, 65, 66, 79, 99, 100]) {
      const spin = buildDialSpin(percentage, noJitter);
      expect(spin.turns).toBeGreaterThanOrEqual(DIAL_TURNS.min);
      expect(spin.turns).toBeLessThanOrEqual(DIAL_TURNS.max);
      expect(spin.startAngle).toBeGreaterThanOrEqual(0);
      expect(spin.startAngle).toBeLessThan(360);
      expect(spin.endAngle).toBeCloseTo(percentageToAngle(percentage), 6);
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

  it('decelerates heavily and never runs backwards', () => {
    expect(dialEase(0)).toBe(0);
    expect(dialEase(1)).toBe(1);
    expect(dialEase(0.5)).toBeGreaterThan(0.9);
    let previous = -1;
    for (let step = 0; step <= 20; step += 1) {
      const value = dialEase(step / 20);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it('never shows the result before the landing frame', () => {
    for (const final of [5, 6, 30, 31, 53, 65, 66, 91, 99, 100]) {
      const spin = buildDialSpin(final, () => 0.37);
      let previousAngle = -Infinity;
      for (let elapsed = 0; elapsed < REVEAL_TIMING.percentageSettleMs; elapsed += 20) {
        const sample = sampleDialSpin(elapsed, spin, final);
        expect(sample.angle).toBeGreaterThanOrEqual(previousAngle);
        previousAngle = sample.angle;
        expect(sample.percentage).not.toBe(final);
        expect(sample.percentage).toBeGreaterThanOrEqual(5);
        expect(sample.percentage).toBeLessThanOrEqual(100);
      }
      const landed = sampleDialSpin(REVEAL_TIMING.percentageSettleMs, spin, final);
      expect(angularGap(landed.angle, percentageToAngle(final))).toBeLessThan(1e-6);
      expect(landed.percentage).toBe(final);
    }
  });

  it('survives a missing spin without throwing', () => {
    const sample = sampleDialSpin(300, null, 42);
    expect(Number.isFinite(sample.angle)).toBe(true);
    expect(sample.percentage).not.toBe(42);
  });
});

describe('Lucky Number pointer', () => {
  it('gives every number its own sector across the full 1–50 circle', () => {
    expect(luckyNumberToAngle(1)).toBeCloseTo(3.6, 6);
    expect(luckyNumberToAngle(50)).toBeCloseTo(356.4, 6);
    for (let number = 1; number <= 50; number += 1) {
      const angle = luckyNumberToAngle(number);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(360);
      expect(angleToLuckyNumber(angle)).toBe(number);
    }
  });

  it('spins and lands on the selected number, never on the percentage angle', () => {
    const finalNumber = 37;
    const spin = buildNumberSpin(finalNumber, () => 0.42);
    expect(angularGap(spin.startAngle + spin.totalSweep, luckyNumberToAngle(finalNumber))).toBeLessThan(1e-6);

    let previousAngle = -Infinity;
    for (let elapsed = 0; elapsed < REVEAL_TIMING.numberSettleMs; elapsed += 20) {
      const sample = sampleNumberSpin(elapsed, spin, finalNumber);
      expect(sample.angle).toBeGreaterThanOrEqual(previousAngle);
      previousAngle = sample.angle;
      expect(sample.number).not.toBe(finalNumber);
      expect(sample.number).toBeGreaterThanOrEqual(1);
      expect(sample.number).toBeLessThanOrEqual(50);
    }

    const landed = sampleNumberSpin(REVEAL_TIMING.numberSettleMs, spin, finalNumber);
    expect(landed.number).toBe(finalNumber);
    expect(angularGap(landed.angle, luckyNumberToAngle(finalNumber))).toBeLessThan(1e-6);
    // 37 is not the pointer position the percentage uses; the two dials are
    // geometrically separate and cannot represent each other.
    expect(angularGap(landed.angle, percentageToAngle(5))).toBeGreaterThan(1);
  });

  it('has its own turn bounds and tolerates a missing spin', () => {
    const spin = buildNumberSpin(12, noJitter);
    expect(spin.turns).toBeGreaterThanOrEqual(DIAL_TURNS.min);
    expect(spin.turns).toBeLessThanOrEqual(DIAL_TURNS.max);
    const sample = sampleNumberSpin(500, null, 12);
    expect(Number.isFinite(sample.angle)).toBe(true);
    expect(Number.isFinite(sample.number)).toBe(true);
  });
});

describe('segmented Lucky Colour ring', () => {
  it('has one segment per approved colour and settles the chosen one at the marker', () => {
    expect(COLOUR_STEPS).toBe(12);
    expect(COLOURS).toHaveLength(COLOUR_STEPS);
    for (let index = 0; index < COLOURS.length; index += 1) {
      const colour = COLOURS[index];
      expect(getColourIndex(colour.id)).toBe(index);
      const spin = buildColourSpin(colour.id, noJitter);
      expect(angularGap(spin.startRotation + spin.totalSweep, spin.endRotation)).toBeLessThan(1e-6);
      // At rest the marker reads the selected segment.
      expect(rotationToColourIndex(spin.endRotation)).toBe(index);
      // The ring is drawn a whole number of turns from its start.
      expect(spin.totalSweep).toBeGreaterThan(360);
    }
  });

  it('samples its own rotation and only reveals the colour on its landing frame', () => {
    const finalIndex = 4;
    const finalColour = COLOURS[finalIndex];
    const spin = buildColourSpin(finalColour.id, () => 0.3);
    for (let elapsed = 0; elapsed < REVEAL_TIMING.colourSettleMs; elapsed += 20) {
      const sample = sampleColourSpin(elapsed, spin, finalColour.id);
      expect(sample.colourIndex).toBeGreaterThanOrEqual(0);
      expect(sample.colourIndex).toBeLessThan(COLOUR_STEPS);
      expect(sample.colourId).not.toBe(finalColour.id);
    }
    const landed = sampleColourSpin(REVEAL_TIMING.colourSettleMs, spin, finalColour.id);
    expect(landed.colourId).toBe(finalColour.id);
    expect(rotationToColourIndex(landed.rotation)).toBe(finalIndex);
  });

  it('cannot select: the percentage conversion ignores the ring angle', () => {
    // The ring pipeline shares no state with the percentage dial: evaluating
    // the ring's landing index leaves the percentage angle unchanged.
    const beforeRing = percentageToAngle(53);
    getColourIdAt(rotationToColourIndex(137));
    expect(percentageToAngle(53)).toBe(beforeRing);
    // A colour rotation is never a percentage input; the dial geometry is
    // unchanged by any ring position.
    for (const colour of COLOURS) {
      const spin = buildColourSpin(colour.id, noJitter);
      expect(percentageToAngle(53)).toBeCloseTo(190.8, 6);
      expect(spin.endRotation).toBeLessThan(360);
    }
    expect(DEGREES_PER_COLOUR).toBe(30);
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
