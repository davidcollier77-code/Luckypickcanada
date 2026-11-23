import { describe, expect, it } from 'vitest';
import {
  COLOUR_STEPS,
  DEGREES_PER_COLOUR,
  POINTER_ANGLE_DEGREES,
  REVEAL_TIMING,
  WHEEL_TURNS,
  buildColourSpin,
  chamberIndexForColour,
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
  NUMBER_PAUSE_END_MS,
  PERCENTAGE_END_MS,
  PERCENTAGE_START_MS,
  POUR_END_MS,
  REVEAL_COMPLETE_MS,
  REVEAL_MOTION_MS,
  STORYBOARD_TIMING,
  WHEEL_END_MS,
  buildStoryboard,
  getCelebrationEndMs,
  getDockMs,
  getEventStartMs,
  getExperienceTotalMs,
  getMessageTotalMs,
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

describe('corrected Spec 212 storyboard timing', () => {
  it('uses the approved stage lengths exactly', () => {
    // The wheel is its own 4,400 ms window inside the longer percentage clock.
    expect(REVEAL_TIMING.anticipationMs).toBe(1000);
    expect(REVEAL_TIMING.leafExitMs).toBe(900);
    expect(REVEAL_TIMING.wheelMs).toBe(4400);
    expect(REVEAL_TIMING.percentageMs).toBe(9400);
    expect(REVEAL_TIMING.pourMs).toBe(2000);
    expect(REVEAL_TIMING.numberPauseMs).toBe(1500);
    expect(REVEAL_TIMING.transferMs).toBe(1500);

    // The preserved later stages.
    expect(REVEAL_TIMING.messageDelayMs).toBe(800);
    expect(REVEAL_TIMING.messageHoldMs).toBe(3000);
    expect(REVEAL_TIMING.messageSettleMs).toBe(800);
    expect(REVEAL_TIMING.eventDelayMs).toBe(900);
    expect(REVEAL_TIMING.celebrationMs).toBe(12_000);
    expect(REVEAL_TIMING.sparkStartDelayMs).toBe(1300);
    expect(REVEAL_TIMING.sparkMinMs).toBe(3800);
    expect(REVEAL_TIMING.sparkMaxMs).toBe(5200);
    expect(REVEAL_TIMING.finalHoldMs).toBe(2800);
    expect(REVEAL_TIMING.dockDelayMs).toBe(3600);
    // The message settles visibly; it has no fade at all.
    expect(REVEAL_TIMING.messageFadeMs).toBeUndefined();
  });

  it('derives every boundary from those lengths', () => {
    expect(PERCENTAGE_START_MS).toBe(1900);
    expect(WHEEL_END_MS).toBe(6300);
    expect(PERCENTAGE_END_MS).toBe(11_300);
    expect(REVEAL_MOTION_MS).toBe(11_300);
    expect(POUR_END_MS).toBe(13_300);
    expect(NUMBER_PAUSE_END_MS).toBe(14_800);
    expect(REVEAL_COMPLETE_MS).toBe(16_300);

    expect(WHEEL_END_MS - PERCENTAGE_START_MS).toBe(4400);
    expect(PERCENTAGE_END_MS - PERCENTAGE_START_MS).toBe(9400);
    expect(REVEAL_MOTION_MS).toBeGreaterThan(WHEEL_END_MS);
    expect(POUR_END_MS - PERCENTAGE_END_MS).toBe(2000);
    expect(NUMBER_PAUSE_END_MS - POUR_END_MS).toBe(1500);
    expect(REVEAL_COMPLETE_MS - NUMBER_PAUSE_END_MS).toBe(1500);
  });

  it('lists the eleven ordered stages with the wheel ending inside generation', () => {
    const stages = buildStoryboard({
      tierMessage: TIER_MESSAGE,
      eventDurationMs: CELEBRATION_MS,
      sparkMessage: SPARK_MESSAGE,
    });
    expect(stages.map((stage) => stage.id)).toEqual([
      'anticipation',
      'leafExit',
      'generation',
      'pour',
      'numberPause',
      'transfer',
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
    const generation = stages.find((stage) => stage.id === 'generation');
    expect(generation.startMs).toBe(PERCENTAGE_START_MS);
    expect(generation.endMs).toBe(PERCENTAGE_END_MS);
    expect(generation.wheelEndMs).toBe(WHEEL_END_MS);
    expect(generation.endMs - generation.wheelEndMs).toBe(5000);
    expect(stages.at(-1).id).toBe('dock');
    expect(stages.at(-1).startMs).toBe(getDockMs(TIER_MESSAGE, CELEBRATION_MS, SPARK_MESSAGE));
  });

  it('keeps the emergent total inside the acceptable shorter window', () => {
    const total = getExperienceTotalMs(TIER_MESSAGE, CELEBRATION_MS, SPARK_MESSAGE);
    // The reveal is shorter by design; no later stage is shortened to force a
    // particular total and nothing pads the runtime.
    expect(total).toBeGreaterThanOrEqual(48_000);
    expect(total).toBeLessThanOrEqual(52_500);
    expect(REVEAL_COMPLETE_MS).toBeLessThan(17_000);
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

  it('pours for 2,000 ms, pauses 1,500 ms and transfers for 1,500 ms', () => {
    const stages = buildStoryboard({
      tierMessage: TIER_MESSAGE,
      eventDurationMs: CELEBRATION_MS,
      sparkMessage: SPARK_MESSAGE,
    });
    const pour = stages.find((stage) => stage.id === 'pour');
    const pause = stages.find((stage) => stage.id === 'numberPause');
    const transfer = stages.find((stage) => stage.id === 'transfer');

    expect(pour.startMs).toBe(PERCENTAGE_END_MS);
    expect(pour.endMs - pour.startMs).toBe(2000);
    expect(pause.endMs - pause.startMs).toBe(1500);
    expect(transfer.endMs - transfer.startMs).toBe(1500);
    expect(transfer.endMs).toBe(REVEAL_COMPLETE_MS);

    // The message starts on the same frame the transfer completes, so the
    // number and its sentence hand off without a gap.
    const message = stages.find((stage) => stage.id === 'message');
    expect(message.startMs).toBe(REVEAL_COMPLETE_MS);
  });

  it('keeps the message at full visibility while the celebration runs', () => {
    const typing = getMessageTypingMs(TIER_MESSAGE);
    expect(getMessageTotalMs(TIER_MESSAGE)).toBe(800 + typing + 3000 + 800);
    const start = getEventStartMs(TIER_MESSAGE);
    expect(start).toBe(
      REVEAL_COMPLETE_MS +
        STORYBOARD_TIMING.messageDelayMs +
        typing +
        STORYBOARD_TIMING.messageHoldMs +
        STORYBOARD_TIMING.messageSettleMs +
        STORYBOARD_TIMING.eventDelayMs,
    );
    expect(start).toBeGreaterThan(REVEAL_COMPLETE_MS + 800 + typing + 3000);
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

describe('independent percentage generation', () => {
  const DURATION = STORYBOARD_TIMING.percentageMs;

  it('runs the preserved five beats: 0 → 100 → fall → rise → erratic → settle', () => {
    const final = 73;
    expect(sampleGenerationPercentage(0, DURATION, final)).toBe(0);
    expect(sampleGenerationPercentage(DURATION * 0.3, DURATION, final)).toBe(100);

    const trough = sampleGenerationPercentage(DURATION * 0.46, DURATION, final);
    expect(trough).toBeLessThan(30);

    const rise = sampleGenerationPercentage(DURATION * 0.62, DURATION, final);
    expect(rise).toBeGreaterThan(trough + 40);

    const erratic = [];
    for (let progress = 0.63; progress < 0.86; progress += 0.01) {
      erratic.push(sampleGenerationPercentage(DURATION * progress, DURATION, final));
    }
    expect(erratic.some((value, index) => index > 0 && value > erratic[index - 1])).toBe(true);
    expect(erratic.some((value, index) => index > 0 && value < erratic[index - 1])).toBe(true);

    expect(sampleGenerationPercentage(DURATION, DURATION, final)).toBe(final);
    expect(sampleGenerationPercentage(DURATION * 2, DURATION, final)).toBe(final);
  });

  it('never reveals the stored result before the 9,400 ms window closes', () => {
    for (const final of [5, 30, 31, 65, 66, 100]) {
      for (let elapsed = 0; elapsed < DURATION; elapsed += 16) {
        const value = sampleGenerationPercentage(elapsed, DURATION, final);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        expect(value).not.toBe(final);
      }
      // The wheel has already stopped at 4,400 ms; the percentage has not.
      expect(sampleGenerationPercentage(4400, DURATION, final)).not.toBe(final);
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

describe('fixed 7:30 colour wheel', () => {
  it('offers exactly twelve chambers per palette', () => {
    expect(COLOUR_STEPS).toBe(12);
    expect(autumn).toHaveLength(12);
    expect(DEGREES_PER_COLOUR).toBe(30);
    expect(POINTER_ANGLE_DEGREES).toBe(225);
  });

  it('stops every seasonal colour under the fixed 7:30 pointer', () => {
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      const palette = getPaletteForSeasonKey(season);
      palette.forEach((colour, index) => {
        const rotation = colourPointerRotation(colour.id, palette);
        // The segment's centre lands at 225° (7:30 in screen coordinates).
        expect(angularGap(index * DEGREES_PER_COLOUR + rotation, 225)).toBeLessThan(1e-9);
        expect(rotationToColourIndex(rotation, palette.length)).toBe(index);
        expect(chamberIndexForColour(colour.id, palette)).toBe(index);
      });
    }
  });

  it('spins exactly five full turns from a random start and lands exactly', () => {
    expect(WHEEL_TURNS).toBe(5);
    const colour = autumn[7];
    for (const value of [0, 0.24, 0.5, 0.87, 0.999]) {
      const spin = buildColourSpin(colour.id, () => value, autumn);
      expect(spin.turns).toBe(5);
      expect(spin.totalSweep).toBeGreaterThanOrEqual(5 * 360);
      expect(spin.totalSweep).toBeLessThan(6 * 360);
      const droppedTurns = normalizeAngle(spin.startRotation + spin.totalSweep);
      expect(angularGap(droppedTurns, spin.endRotation)).toBeLessThan(1e-9);
      expect(angularGap(spin.endRotation, colourPointerRotation(colour.id, autumn))).toBeLessThan(
        1e-9,
      );
    }
  });

  it('never shows the final colour before the wheel landing frame', () => {
    const colour = autumn[4];
    const spin = buildColourSpin(colour.id, noJitter, autumn);
    const finalIndex = getColourIndex(colour.id, autumn);
    for (let elapsed = 0; elapsed < 4400; elapsed += 20) {
      const sample = sampleColourSpin(elapsed, spin, colour.id, 4400, autumn);
      expect(sample.colourId).not.toBe(colour.id);
      expect(sample.colourIndex).not.toBe(finalIndex);
    }
    const landed = sampleColourSpin(4400, spin, colour.id, 4400, autumn);
    expect(landed.colourId).toBe(colour.id);
    expect(landed.colourIndex).toBe(finalIndex);
    expect(angularGap(landed.rotation, spin.endRotation)).toBeLessThan(1e-9);
  });

  it('defaults to the 4,400 ms wheel window, not the percentage window', () => {
    const colour = autumn[2];
    const spin = buildColourSpin(colour.id, noJitter, autumn);
    expect(sampleColourSpin(4399, spin, colour.id, undefined, autumn).colourId).not.toBe(colour.id);
    expect(sampleColourSpin(4400, spin, colour.id, undefined, autumn).colourId).toBe(colour.id);
    expect(REVEAL_TIMING.wheelMs).toBe(4400);
  });

  it('wraps the palette by index without inventing a colour', () => {
    expect(getColourIdAt(12, autumn)).toBe(autumn[0].id);
    expect(getColourIdAt(-1, autumn)).toBe(autumn[11].id);
    expect(getColourIdAt(3, autumn)).toBe(autumn[3].id);
  });

  it('cannot select: the wheel rotation is independent of the percentage', () => {
    const spin = buildColourSpin(autumn[2].id, noJitter, autumn);
    const sample = sampleColourSpin(2100, spin, autumn[2].id, 4400, autumn);
    expect(rotationToColourIndex(sample.rotation + 90, autumn.length)).not.toBe(
      rotationToColourIndex(sample.rotation, autumn.length),
    );
    expect(sample.colourId).not.toBe(null);
  });
});
