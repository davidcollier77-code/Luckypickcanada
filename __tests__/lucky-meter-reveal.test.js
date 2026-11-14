import { describe, expect, it } from 'vitest';
import { EVENTS } from '../app/lib/lucky-meter/config';
import {
  buildRevealKeyframes,
  getEventDurationMs,
  REVEAL_TIMING,
  sampleRevealNumber,
} from '../app/lib/lucky-meter/reveal';

const noJitter = () => 0.5;

describe('reveal timing', () => {
  it('holds the real percentage for 4.5 seconds, flashes, then reveals the details', () => {
    expect(REVEAL_TIMING.scrambleMs).toBe(4500);
    expect(REVEAL_TIMING.flashCount).toBeGreaterThanOrEqual(2);
    expect(REVEAL_TIMING.flashCount).toBeLessThanOrEqual(3);
    expect(REVEAL_TIMING.flashMs).toBe(600);
    expect(REVEAL_TIMING.detailsDelayMs).toBe(800);
    expect(REVEAL_TIMING.eventDelayMs).toBe(600);
  });
});

describe('unpredictable scramble', () => {
  it('builds a climb-drop-jump path with anchors that never equal the result', () => {
    const final = 53;
    const keyframes = buildRevealKeyframes(final, noJitter);
    expect(keyframes).toHaveLength(8);
    expect(keyframes[0].at).toBe(0);
    expect(keyframes[keyframes.length - 1].at).toBe(REVEAL_TIMING.scrambleMs);
    for (let index = 1; index < keyframes.length; index += 1) {
      expect(keyframes[index].at).toBeGreaterThan(keyframes[index - 1].at);
    }
    expect(keyframes.every((frame) => frame.value !== final)).toBe(true);

    const sampled = keyframes.map((frame) => sampleRevealNumber(frame.at, keyframes, final, noJitter));
    expect(Math.max(...sampled)).toBeGreaterThan(80);
    expect(Math.min(...sampled)).toBeLessThan(20);
    // The path climbs high, drops low, then climbs high again.
    expect(sampled[1]).toBeGreaterThan(80);
    expect(sampled[2]).toBeLessThan(20);
    expect(sampled[3]).toBeGreaterThan(80);
  });

  it('never shows the real percentage and never leaves the 5–100 range', () => {
    for (const final of [5, 6, 40, 53, 79, 80, 99, 100]) {
      const keyframes = buildRevealKeyframes(final, noJitter);
      for (let elapsed = 0; elapsed <= REVEAL_TIMING.scrambleMs; elapsed += 25) {
        const value = sampleRevealNumber(elapsed, keyframes, final, () => 0.13);
        expect(value).not.toBe(final);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(100);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).not.toBe(0);
      }
    }
  });

  it('produces a different path for different jitter', () => {
    const first = buildRevealKeyframes(53, () => 0.1).map((frame) => frame.value);
    const second = buildRevealKeyframes(53, () => 0.9).map((frame) => frame.value);
    expect(first).not.toEqual(second);
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
    expect([8500, 9500]).toContain(getEventDurationMs('meteor', () => 0));
    expect(getEventDurationMs('lightning', () => 0.5)).toBe(10000);
    expect(getEventDurationMs('fireworks', () => 0)).toBe(11000);
    expect(getEventDurationMs('unknown', () => 0.5)).toBe(0);
  });
});
