import { describe, expect, it } from 'vitest';
import {
  COLOUR_STEPS,
  DEGREES_PER_COLOUR,
  POINTER_ANGLE_DEGREES,
  REVEAL_TIMING,
  WHEEL_TURNS,
  buildColourSpin,
  colourPointerRotation,
  dialEase,
  getColourIdAt,
  getColourIndex,
  normalizeAngle,
  rotationToColourIndex,
  sampleColourSpin,
  sampleGenerationPercentage,
} from '../app/lib/lucky-meter/reveal';
import {
  CELEBRATION_MS,
  DRAIN_END_MS,
  FILL_END_MS,
  FULL_HOLD_END_MS,
  REVEAL_COMPLETE_MS,
  REVEAL_MOTION_MS,
  STORYBOARD_TIMING,
  buildStoryboard,
  getCelebrationEndMs,
  getDockMs,
  getEventStartMs,
  getExperienceTotalMs,
  getMessageTypingMs,
  getSparkCharacterScheduleMs,
  getSparkWritingMs,
} from '../app/lib/lucky-meter/storyboard';
import { getPaletteForSeasonKey } from '../app/lib/lucky-meter/sparks-and-seasonal-colours';

const autumn = getPaletteForSeasonKey('autumn');
const noJitter = () => 0.5;

const TIER_MESSAGE = 'Your luck is in the mid-range today.';
const SPARK_MESSAGE = 'Even a small step forward can change the direction of your day.';

const angularGap = (left, right) => {
  const difference = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return Math.min(difference, 360 - difference);
};

describe('twelve-stage storyboard timing', () => {
  it('uses the approved stage lengths', () => {
    expect(REVEAL_TIMING.anticipationMs).toBe(1200);
    expect(REVEAL_TIMING.generationMs).toBe(5600);
    expect(REVEAL_TIMING.landingMs).toBe(600);
    expect(REVEAL_TIMING.settlePauseMs).toBe(1800);
    expect(REVEAL_TIMING.segmentOpenMs).toBe(1400);
    expect(REVEAL_TIMING.fillMs).toBe(5000);
    expect(REVEAL_TIMING.fullHoldMs).toBe(700);
    expect(REVEAL_TIMING.drainMs).toBe(4000);
    expect(REVEAL_TIMING.highlightMs).toBe(1600);
    expect(REVEAL_TIMING.celebrationMs).toBe(12000);
    expect(REVEAL_TIMING.numberFlashCount).toBe(2);
    expect(REVEAL_TIMING.sparkMinMs).toBe(3800);
    expect(REVEAL_TIMING.sparkMaxMs).toBe(5200);
    // The final hold is a real hold, and the dock follows it.
    expect(REVEAL_TIMING.finalHoldMs).toBeGreaterThanOrEqual(2600);
    expect(REVEAL_TIMING.dockDelayMs).toBeGreaterThan(REVEAL_TIMING.finalHoldMs);
  });

  it('stops the percentage and the wheel on the same frame', () => {
    expect(REVEAL_MOTION_MS).toBe(REVEAL_TIMING.anticipationMs + REVEAL_TIMING.generationMs);
    expect(FILL_END_MS).toBeGreaterThan(REVEAL_MOTION_MS);
    expect(REVEAL_COMPLETE_MS).toBe(DRAIN_END_MS + REVEAL_TIMING.highlightMs);
  });

  it('builds twelve ordered stages whose ends meet cleanly', () => {
    const stages = buildStoryboard({
      tierMessage: TIER_MESSAGE,
      eventDurationMs: CELEBRATION_MS,
      sparkMessage: SPARK_MESSAGE,
    });
    expect(stages.map((stage) => stage.id)).toEqual([
      'anticipation',
      'generation',
      'landing',
      'colourSelect',
      'vesselOpen',
      'pour',
      'numberReveal',
      'message',
      'celebration',
      'spark',
      'hold',
      'dock',
    ]);
    for (let index = 0; index < stages.length - 1; index += 1) {
      expect(stages[index].endMs).toBeLessThanOrEqual(stages[index + 1].startMs);
      expect(stages[index].durationMs).toBeGreaterThanOrEqual(0);
    }
    expect(stages.at(-1).id).toBe('dock');
    expect(stages.at(-1).startMs).toBe(getDockMs(TIER_MESSAGE, CELEBRATION_MS, SPARK_MESSAGE));
  });

  it('takes the approved 54–57 seconds from first paint to the dock', () => {
    const total = getExperienceTotalMs(TIER_MESSAGE, CELEBRATION_MS, SPARK_MESSAGE);
    expect(total).toBeGreaterThanOrEqual(54_000);
    expect(total).toBeLessThanOrEqual(57_000);
  });

  it('gives every tier the same 12,000 ms celebration', () => {
    expect(CELEBRATION_MS).toBe(12_000);
    const stages = buildStoryboard({
      tierMessage: TIER_MESSAGE,
      eventDurationMs: CELEBRATION_MS,
      sparkMessage: SPARK_MESSAGE,
    });
    const celebration = stages.find((stage) => stage.id === 'celebration');
    expect(celebration.startMs).toBe(getEventStartMs(TIER_MESSAGE));
    expect(celebration.durationMs).toBe(12_000);
    expect(getCelebrationEndMs(TIER_MESSAGE, CELEBRATION_MS)).toBe(
      getEventStartMs(TIER_MESSAGE) + 12_000,
    );
  });

  it('fills, holds and drains the vessel before the number is whole', () => {
    const stages = buildStoryboard({
      tierMessage: TIER_MESSAGE,
      eventDurationMs: CELEBRATION_MS,
      sparkMessage: SPARK_MESSAGE,
    });
    const pour = stages.find((stage) => stage.id === 'pour');
    const number = stages.find((stage) => stage.id === 'numberReveal');
    // The pour stage owns the fill and the full hold.
    expect(pour.endMs).toBe(FULL_HOLD_END_MS);
    expect(pour.endMs - pour.startMs).toBe(
      STORYBOARD_TIMING.fillMs + STORYBOARD_TIMING.fullHoldMs,
    );
    // The number window opens with the drain; the number is whole when the
    // drain ends, and the empty highlight closes the window.
    expect(number.startMs).toBe(FULL_HOLD_END_MS);
    expect(DRAIN_END_MS - number.startMs).toBe(STORYBOARD_TIMING.drainMs);
    expect(number.endMs).toBe(REVEAL_COMPLETE_MS);
    expect(REVEAL_COMPLETE_MS - DRAIN_END_MS).toBe(STORYBOARD_TIMING.highlightMs);
  });

  it('starts the celebration only after the message has been held and faded', () => {
    const start = getEventStartMs(TIER_MESSAGE);
    expect(start).toBeGreaterThan(REVEAL_COMPLETE_MS);
    expect(start).toBe(
      REVEAL_COMPLETE_MS +
        STORYBOARD_TIMING.messageDelayMs +
        getMessageTypingMs(TIER_MESSAGE) +
        STORYBOARD_TIMING.messageHoldMs +
        STORYBOARD_TIMING.messageFadeMs +
        STORYBOARD_TIMING.eventDelayMs,
    );
    expect(getCelebrationEndMs(TIER_MESSAGE, CELEBRATION_MS)).toBe(start + CELEBRATION_MS);
  });

  it('writes every Spark inside the approved 3.8–5.2 second window', () => {
    const lines = [
      SPARK_MESSAGE,
      'Short.',
      'A much longer saved line still has to finish inside the approved writing window no matter how many words it holds, and it may not drag past the upper bound either.',
    ];
    for (const spark of lines) {
      const duration = getSparkWritingMs(spark);
      expect(duration).toBeGreaterThanOrEqual(3_800);
      expect(duration).toBeLessThanOrEqual(5_200);
      const schedule = getSparkCharacterScheduleMs(spark);
      expect(schedule).toHaveLength(Array.from(spark).length);
      expect(schedule[schedule.length - 1]).toBe(duration);
      for (let index = 1; index < schedule.length; index += 1) {
        expect(schedule[index]).toBeGreaterThanOrEqual(schedule[index - 1]);
      }
    }
    expect(getSparkWritingMs('')).toBe(0);
    expect(getSparkWritingMs(null)).toBe(0);
  });
});

describe('percentage generation', () => {
  const DURATION = STORYBOARD_TIMING.generationMs;

  it('runs the approved five beats: 0 → 100 → fall → rise → erratic → settle', () => {
    const final = 73;
    // Beat 1 starts at the bottom of the scale and peaks at 100.
    expect(sampleGenerationPercentage(0, DURATION, final)).toBe(0);
    expect(sampleGenerationPercentage(DURATION * 0.3, DURATION, final)).toBe(100);

    // Beat 2 falls away from the peak.
    const trough = sampleGenerationPercentage(DURATION * 0.46, DURATION, final);
    expect(trough).toBeLessThan(30);

    // Beat 3 rises again.
    const rise = sampleGenerationPercentage(DURATION * 0.62, DURATION, final);
    expect(rise).toBeGreaterThan(trough + 40);

    // Beat 4 is genuinely erratic: it moves both up and down.
    const erratic = [];
    for (let progress = 0.63; progress < 0.86; progress += 0.01) {
      erratic.push(sampleGenerationPercentage(DURATION * progress, DURATION, final));
    }
    expect(erratic.some((value, index) => index > 0 && value > erratic[index - 1])).toBe(true);
    expect(erratic.some((value, index) => index > 0 && value < erratic[index - 1])).toBe(true);

    // Beat 5 settles only on the final frame.
    expect(sampleGenerationPercentage(DURATION, DURATION, final)).toBe(final);
    expect(sampleGenerationPercentage(DURATION * 2, DURATION, final)).toBe(final);
  });

  it('never reveals the stored result before the last frame', () => {
    for (const final of [5, 30, 31, 65, 66, 100]) {
      for (let elapsed = 0; elapsed < DURATION; elapsed += 16) {
        const value = sampleGenerationPercentage(elapsed, DURATION, final);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        expect(value).not.toBe(final);
      }
      expect(sampleGenerationPercentage(DURATION, DURATION, final)).toBe(final);
      expect(sampleGenerationPercentage(9999, DURATION, final)).toBe(final);
    }
  });

  it('settles on the stored 5–100 result without leaving the scale', () => {
    for (const final of [5, 100]) {
      expect(sampleGenerationPercentage(DURATION, DURATION, final)).toBe(final);
    }
    expect(sampleGenerationPercentage(0, DURATION, 5)).toBe(0);
    expect(sampleGenerationPercentage(0, DURATION, 100)).toBe(0);
  });

  it('uses a natural deceleration curve for the wheel', () => {
    expect(dialEase(0)).toBe(0);
    expect(dialEase(1)).toBe(1);
    expect(dialEase(0.5)).toBeGreaterThan(0.9);
  });
});

describe('colour wheel landing', () => {
  it('offers exactly twelve segments per palette', () => {
    expect(COLOUR_STEPS).toBe(12);
    expect(autumn).toHaveLength(12);
    expect(DEGREES_PER_COLOUR).toBe(30);
    expect(POINTER_ANGLE_DEGREES).toBe(180);
  });

  it('stops every seasonal colour under the fixed 6 o’clock pointer', () => {
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      const palette = getPaletteForSeasonKey(season);
      palette.forEach((colour, index) => {
        const rotation = colourPointerRotation(colour.id, palette);
        // The segment's centre lands at 180° (6 o'clock).
        expect(angularGap(index * DEGREES_PER_COLOUR + rotation, 180)).toBeLessThan(1e-9);
        expect(rotationToColourIndex(rotation, palette.length)).toBe(index);
      });
    }
  });

  it('spins three to four full turns from a random start and lands exactly', () => {
    const colour = autumn[7];
    for (const value of [0, 0.24, 0.5, 0.87, 0.999]) {
      const spin = buildColourSpin(colour.id, () => value, autumn);
      expect(spin.turns).toBeGreaterThanOrEqual(WHEEL_TURNS.min);
      expect(spin.turns).toBeLessThanOrEqual(WHEEL_TURNS.max);
      expect(spin.totalSweep).toBeGreaterThanOrEqual(WHEEL_TURNS.min * 360);
      const droppedTurns = normalizeAngle(spin.startRotation + spin.totalSweep);
      expect(angularGap(droppedTurns, spin.endRotation)).toBeLessThan(1e-9);
      expect(angularGap(spin.endRotation, colourPointerRotation(colour.id, autumn))).toBeLessThan(
        1e-9,
      );
    }
  });

  it('never shows the final colour before the landing frame', () => {
    const colour = autumn[4];
    const spin = buildColourSpin(colour.id, noJitter, autumn);
    const finalIndex = getColourIndex(colour.id, autumn);
    for (let elapsed = 0; elapsed < 4200; elapsed += 20) {
      const sample = sampleColourSpin(elapsed, spin, colour.id, 4200, autumn);
      expect(sample.colourId).not.toBe(colour.id);
      expect(sample.colourIndex).not.toBe(finalIndex);
    }
    const landed = sampleColourSpin(4200, spin, colour.id, 4200, autumn);
    expect(landed.colourId).toBe(colour.id);
    expect(landed.colourIndex).toBe(finalIndex);
    expect(angularGap(landed.rotation, spin.endRotation)).toBeLessThan(1e-9);
  });

  it('wraps the palette by index without inventing a colour', () => {
    expect(getColourIdAt(12, autumn)).toBe(autumn[0].id);
    expect(getColourIdAt(-1, autumn)).toBe(autumn[11].id);
    expect(getColourIdAt(3, autumn)).toBe(autumn[3].id);
  });

  it('cannot select: the wheel rotation is independent of the percentage', () => {
    const spin = buildColourSpin(autumn[2].id, noJitter, autumn);
    const sample = sampleColourSpin(2100, spin, autumn[2].id, 4200, autumn);
    // A quarter-turn offset changes the displayed segment only, never a result.
    expect(rotationToColourIndex(sample.rotation + 90, autumn.length)).not.toBe(
      rotationToColourIndex(sample.rotation, autumn.length),
    );
    expect(sample.colourId).not.toBe(null);
  });
});
