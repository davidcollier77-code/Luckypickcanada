import { describe, expect, it } from 'vitest';
import { EVENTS } from '../app/lib/lucky-meter/config';
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
  getEventDurationMs,
  normalizeAngle,
  rotationToColourIndex,
  sampleColourSpin,
  sampleGenerationPercentage,
} from '../app/lib/lucky-meter/reveal';
import {
  POUR_END_MS,
  REVEAL_COMPLETE_MS,
  REVEAL_MOTION_MS,
  STORYBOARD_TIMING,
  buildStoryboard,
  getCelebrationEndMs,
  getDockMs,
  getEventStartMs,
  getMessageTypingMs,
  getSparkWritingMs,
} from '../app/lib/lucky-meter/storyboard';
import { getPaletteForSeasonKey } from '../app/lib/lucky-meter/sparks-and-seasonal-colours';

const autumn = getPaletteForSeasonKey('autumn');
const noJitter = () => 0.5;

const angularGap = (left, right) => {
  const difference = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return Math.min(difference, 360 - difference);
};

describe('nine-step storyboard timing', () => {
  it('gives every stage an unhurried, ordered window', () => {
    expect(REVEAL_TIMING.anticipationMs).toBe(900);
    expect(REVEAL_TIMING.generationMs).toBe(4200);
    expect(REVEAL_TIMING.settlePauseMs).toBeGreaterThanOrEqual(400);
    expect(REVEAL_TIMING.segmentOpenMs).toBeGreaterThanOrEqual(700);
    expect(REVEAL_TIMING.pourMs).toBeGreaterThanOrEqual(1700);
    expect(REVEAL_TIMING.resultSettleMs).toBeGreaterThanOrEqual(600);
    expect(REVEAL_TIMING.messageHoldMs).toBeGreaterThanOrEqual(2200);
    expect(REVEAL_TIMING.messageFadeMs).toBeGreaterThanOrEqual(600);
    expect(REVEAL_TIMING.sparkStartDelayMs).toBeGreaterThanOrEqual(900);
    expect(REVEAL_TIMING.dockDelayMs).toBeGreaterThanOrEqual(500);
  });

  it('stops the percentage and the wheel on the same frame', () => {
    expect(REVEAL_MOTION_MS).toBe(REVEAL_TIMING.anticipationMs + REVEAL_TIMING.generationMs);
    expect(POUR_END_MS).toBeGreaterThan(REVEAL_MOTION_MS);
    expect(REVEAL_COMPLETE_MS).toBe(POUR_END_MS + REVEAL_TIMING.resultSettleMs);
  });

  it('builds nine ordered stages whose ends meet cleanly', () => {
    const stages = buildStoryboard({
      tierMessage: 'Your luck is in the mid-range today.',
      eventDurationMs: 9800,
      sparkMessage: 'Even a small step forward can change the direction of your day.',
    });
    expect(stages.map((stage) => stage.id)).toEqual([
      'anticipation',
      'generation',
      'landing',
      'segmentOpen',
      'pour',
      'resultSettle',
      'message',
      'celebration',
      'spark',
      'dock',
    ]);
    for (let index = 0; index < stages.length - 1; index += 1) {
      expect(stages[index].endMs).toBeLessThanOrEqual(stages[index + 1].startMs);
      expect(stages[index].durationMs).toBeGreaterThanOrEqual(0);
    }
    expect(stages.at(-1).id).toBe('dock');
    expect(stages.at(-1).startMs).toBe(
      getDockMs(
        'Your luck is in the mid-range today.',
        9800,
        'Even a small step forward can change the direction of your day.',
      ),
    );
  });

  it('takes roughly 25–32 seconds for a complete, unhurried run', () => {
    const total = getDockMs(
      'Your luck is in the mid-range today.',
      9800,
      'Even a small step forward can change the direction of your day.',
    );
    expect(total).toBeGreaterThanOrEqual(25_000);
    expect(total).toBeLessThanOrEqual(32_000);
  });

  it('starts the celebration only after the message has been held and faded', () => {
    const message = 'Your luck is running high today!';
    const start = getEventStartMs(message);
    expect(start).toBeGreaterThan(REVEAL_COMPLETE_MS);
    expect(start).toBe(
      REVEAL_COMPLETE_MS +
        STORYBOARD_TIMING.messageDelayMs +
        getMessageTypingMs(message) +
        STORYBOARD_TIMING.messageHoldMs +
        STORYBOARD_TIMING.messageFadeMs +
        STORYBOARD_TIMING.eventDelayMs,
    );
    expect(getCelebrationEndMs(message, 11000)).toBe(start + 11000);
  });

  it('scales writing time with the message and never returns a negative value', () => {
    expect(getMessageTypingMs('')).toBe(0);
    expect(getMessageTypingMs('Hi.')).toBeGreaterThan(0);
    expect(getSparkWritingMs('A longer sentence takes longer to write.')).toBeGreaterThan(
      getSparkWritingMs('Short.'),
    );
    expect(getSparkWritingMs(null)).toBe(0);
  });
});

describe('percentage generation', () => {
  it('begins at 0% and never reveals the result early', () => {
    const finals = [5, 30, 31, 65, 66, 100];
    for (const final of finals) {
      expect(sampleGenerationPercentage(0, 4200, final)).toBe(0);
      for (let elapsed = 0; elapsed < 4200; elapsed += 16) {
        const value = sampleGenerationPercentage(elapsed, 4200, final);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(99);
        expect(value).not.toBe(final);
      }
      expect(sampleGenerationPercentage(4200, 4200, final)).toBe(final);
      expect(sampleGenerationPercentage(9999, 4200, final)).toBe(final);
    }
  });

  it('follows the wheel’s weighted deceleration rather than stepping linearly', () => {
    const quarter = sampleGenerationPercentage(4200 * 0.25, 4200, 78);
    const half = sampleGenerationPercentage(4200 * 0.5, 4200, 78);
    const threeQuarters = sampleGenerationPercentage(4200 * 0.75, 4200, 78);
    // The wheel leaves quickly and creeps into its last degrees, so the count
    // mirrors its real speed instead of counting on a separate clock.
    expect(quarter).toBeGreaterThan(50);
    expect(half).toBeGreaterThan(quarter);
    expect(threeQuarters).toBeGreaterThan(half);
    // The easing reaches the last frames slowly rather than snapping.
    expect(sampleGenerationPercentage(4200 * 0.5, 4200, 78)).toBeGreaterThan(80);
    expect(sampleGenerationPercentage(4200 * 0.5, 4200, 78)).toBeLessThan(99);
    // The generated readout tops out at 99 and only the landing shows 100.
    expect(sampleGenerationPercentage(4200 * 0.999, 4200, 100)).toBeLessThanOrEqual(99);
  });

  it('keeps the result inside the existing 5–100 range', () => {
    for (const final of [5, 100]) {
      expect(sampleGenerationPercentage(4200, 4200, final)).toBe(final);
      expect(sampleGenerationPercentage(0, 4200, final)).toBe(0);
    }
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

describe('event duration', () => {
  it('stays inside each event’s documented window', () => {
    for (const event of EVENTS) {
      for (const value of [0, 0.25, 0.5, 0.75, 0.999]) {
        const duration = getEventDurationMs(event.id, () => value);
        expect(duration).toBeGreaterThanOrEqual(event.minDurationMs);
        expect(duration).toBeLessThanOrEqual(event.maxDurationMs);
      }
    }
    expect(getEventDurationMs('unknown', noJitter)).toBe(0);
  });

  it('uses a natural deceleration curve for the wheel', () => {
    expect(dialEase(0)).toBe(0);
    expect(dialEase(1)).toBe(1);
    expect(dialEase(0.5)).toBeGreaterThan(0.9);
  });
});
