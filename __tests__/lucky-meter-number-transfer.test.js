import { describe, expect, it } from 'vitest';
import {
  CHAMBER_COUNT,
  METER_LAYOUT,
  NUMBER_PATH_CLEARANCE,
  chamberWorldPosition,
  measureNumberPathClearance,
  numberTransferPath,
  sampleNumberPath,
} from '../app/lib/lucky-meter/meter-layout.js';
import {
  NUMBER_PAUSE_END_MS,
  PERCENTAGE_END_MS,
  PERCENTAGE_START_MS,
  POUR_END_MS,
  REVEAL_COMPLETE_MS,
  WHEEL_END_MS,
  getChoreography,
  getRevealCueSchedule,
} from '../app/lib/lucky-meter/choreography.js';
import { getCueLayers } from '../app/lib/lucky-meter/event-audio.js';

/** The wheel angle that lands `index` under the fixed 7:30 spout. */
function landedAngle(index) {
  return (((225 - index * 30) % 360) + 360) % 360;
}

describe('Lucky Number transfer', () => {
  it('starts in the selected cup, which always lands under the 7:30 spout', () => {
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const angle = landedAngle(index);
      const cup = chamberWorldPosition(index, angle);
      expect(cup.angle).toBeCloseTo(225, 5);

      const path = numberTransferPath({ index, wheelAngle: angle });
      expect(path[0][0]).toBeCloseTo(cup.x, 6);
      expect(path[0][1]).toBeCloseTo(cup.y, 6);
      // The start is in front of the wheel face, not inside the plate.
      expect(path[0][2]).toBeGreaterThan(0.2);
    }
  });

  it('clears the bowl and the spout mouth for every selected chamber', () => {
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const clearance = measureNumberPathClearance(
        numberTransferPath({ index, wheelAngle: landedAngle(index) }),
      );
      expect(clearance.bowl).toBeGreaterThan(NUMBER_PATH_CLEARANCE.bowl);
      expect(clearance.spout).toBeGreaterThan(NUMBER_PATH_CLEARANCE.spout);
    }
  });

  it('ends inside the plaque recess beneath its header', () => {
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const end = sampleNumberPath(
        numberTransferPath({ index, wheelAngle: landedAngle(index) }),
        1,
      );
      expect(end.x).toBeCloseTo(METER_LAYOUT.plaque.x, 2);
      expect(end.y).toBeCloseTo(METER_LAYOUT.plaque.y - 0.09, 2);
    }
  });

  it('is a continuous path that never jumps', () => {
    const path = numberTransferPath({ index: 0, wheelAngle: landedAngle(0) });
    let previous = sampleNumberPath(path, 0);
    for (let step = 1; step <= 64; step += 1) {
      const point = sampleNumberPath(path, step / 64);
      expect(Math.hypot(point.x - previous.x, point.y - previous.y)).toBeLessThan(0.25);
      previous = point;
    }
  });
});

describe('Choreography', () => {
  it('never changes a storyboard anchor', () => {
    expect(PERCENTAGE_START_MS).toBe(1900);
    expect(WHEEL_END_MS).toBe(6300);
    expect(PERCENTAGE_END_MS).toBe(11300);
    expect(POUR_END_MS).toBe(13300);
    expect(NUMBER_PAUSE_END_MS).toBe(14800);
    expect(REVEAL_COMPLETE_MS).toBe(17700);
  });

  it('schedules every cue on its visual event and has a layer for each', () => {
    const schedule = getRevealCueSchedule();
    expect(schedule).toEqual([
      { cue: 'wheel-start', atMs: PERCENTAGE_START_MS },
      { cue: 'wheel-stop', atMs: WHEEL_END_MS },
      { cue: 'colour-pour', atMs: PERCENTAGE_END_MS },
      { cue: 'bowl-full', atMs: POUR_END_MS },
      { cue: 'number-depart', atMs: NUMBER_PAUSE_END_MS },
      { cue: 'number-reveal', atMs: REVEAL_COMPLETE_MS },
    ]);
    for (const { cue } of schedule) {
      expect(getCueLayers(cue, () => 0.5).length).toBeGreaterThan(0);
    }
  });

  it('holds focus through the pour and releases it after the arrival', () => {
    expect(getChoreography(0).focus).toBe(0);
    expect(getChoreography(POUR_END_MS).focus).toBeGreaterThan(0.9);
    expect(getChoreography(REVEAL_COMPLETE_MS).focus).toBeLessThan(0.5);
    expect(getChoreography((PERCENTAGE_END_MS + POUR_END_MS) / 2).pourGlow).toBeGreaterThan(0);
    expect(getChoreography(POUR_END_MS + 1).pourGlow).toBe(0);
    expect(getChoreography(REVEAL_COMPLETE_MS).settle).toBe(1);
  });

  it('lights the number trail only inside its transfer window', () => {
    expect(getChoreography(NUMBER_PAUSE_END_MS - 1).flight).toBeLessThan(0.001);
    expect(getChoreography((NUMBER_PAUSE_END_MS + REVEAL_COMPLETE_MS) / 2).flight).toBeGreaterThan(
      0.8,
    );
    expect(getChoreography(REVEAL_COMPLETE_MS + 1).flight).toBeLessThan(0.001);
  });
});
