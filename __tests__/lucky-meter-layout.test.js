import { describe, expect, it } from 'vitest';
import {
  CHAMBER_COUNT,
  CHAMBER_DEGREES,
  METER_LAYOUT,
  POINTER_ANGLE_DEGREES,
  chamberCentre,
  chamberFillFactor,
  chamberGradient,
  normalizeDegrees,
  pointerSocketPosition,
  polarPosition,
  selectedChamberIndex,
} from '../app/lib/lucky-meter/meter-layout';

const PALETTE = Array.from({ length: 12 }, (_, index) => ({
  id: `c${index}`,
  hex: `#${(0x102030 + index).toString(16).slice(0, 6)}`,
}));

describe('Lucky Meter physical layout', () => {
  it('places twelve chambers clockwise from 12 o’clock', () => {
    expect(CHAMBER_COUNT).toBe(12);
    expect(CHAMBER_DEGREES).toBe(30);
    expect(chamberCentre(0).angle).toBe(0);
    expect(chamberCentre(3).angle).toBe(90);
    expect(chamberCentre(6).angle).toBe(180);
    expect(chamberCentre(9).angle).toBe(270);
    // The radial centre sits between the inner and outer chamber radii.
    const expectedRadius =
      (METER_LAYOUT.wheel.chamberInnerRadius + METER_LAYOUT.wheel.chamberOuterRadius) / 2;
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const centre = chamberCentre(index);
      expect(Math.hypot(centre.x - METER_LAYOUT.wheel.x, centre.y - METER_LAYOUT.wheel.y)).toBeCloseTo(
        expectedRadius,
        6,
      );
    }
  });

  it('fixes the pointer at 7:30 (225°) on the lower-left of the wheel', () => {
    expect(POINTER_ANGLE_DEGREES).toBe(225);
    expect(METER_LAYOUT.pointer.angleDegrees).toBe(225);
    const socket = pointerSocketPosition();
    expect(socket.x).toBeLessThan(METER_LAYOUT.wheel.x);
    expect(socket.y).toBeLessThan(METER_LAYOUT.wheel.y);
    expect(
      Math.hypot(socket.x - METER_LAYOUT.wheel.x, socket.y - METER_LAYOUT.wheel.y),
    ).toBeCloseTo(METER_LAYOUT.pointer.radius, 6);
  });

  it('keeps the arm and spout on the same lower-left side as the pointer', () => {
    for (const point of [
      METER_LAYOUT.arm.base,
      METER_LAYOUT.arm.shoulder,
      METER_LAYOUT.arm.socket,
      METER_LAYOUT.arm.spout,
      METER_LAYOUT.spout.mouth,
      [METER_LAYOUT.vessel.x, METER_LAYOUT.vessel.y],
    ]) {
      expect(point[0]).toBeLessThan(0);
    }
    expect(METER_LAYOUT.arm.spout[1]).toBeLessThan(METER_LAYOUT.arm.socket[1]);
  });

  it('keeps the bowl’s liquid band inside the crystal shell', () => {
    const vessel = METER_LAYOUT.vessel;
    // The liquid is the bowl's inner shell, not a cylinder through the flare:
    // it starts above the glass floor, stays inside the wall, and stops short
    // of the rim so cut crystal always shows above the surface.
    expect(vessel.liquidFloor).toBeGreaterThan(0);
    expect(vessel.liquidInset).toBeGreaterThan(0.9);
    expect(vessel.liquidInset).toBeLessThan(1);
    expect(vessel.liquidTop).toBeLessThan(vessel.height);
    expect(vessel.height - vessel.liquidTop).toBeGreaterThan(0.05);
    expect(vessel.liquidTop - vessel.liquidFloor).toBeGreaterThan(vessel.height * 0.6);
  });

  it('drains only the selected chamber, and leaves the other eleven full', () => {
    for (const drain of [0, 0.25, 0.5, 1]) {
      for (let index = 0; index < CHAMBER_COUNT; index += 1) {
        const expected = index === 6 ? 1 - drain : 1;
        expect(chamberFillFactor(index, 6, drain)).toBeCloseTo(expected, 6);
      }
    }
    // A negative selection (no colour yet) never drains anything.
    expect(chamberFillFactor(0, -1, 1)).toBe(1);
    // Out-of-range progress is clamped, never over-drained.
    expect(chamberFillFactor(6, 6, -1)).toBe(1);
    expect(chamberFillFactor(6, 6, 9)).toBe(0);
  });

  it('maps the stored colour to its chamber without selecting anything', () => {
    expect(selectedChamberIndex(PALETTE, 'c7')).toBe(7);
    expect(selectedChamberIndex(PALETTE, 'missing')).toBe(-1);
    expect(selectedChamberIndex([], 'c7')).toBe(-1);
    expect(selectedChamberIndex(PALETTE, null)).toBe(-1);
  });

  it('builds a twelve-stop conic gradient for the CSS fallback', () => {
    const gradient = chamberGradient(PALETTE);
    expect(gradient).toContain('conic-gradient(from 0deg');
    for (const colour of PALETTE) {
      expect(gradient).toContain(colour.hex);
    }
    expect(gradient.match(/deg /g)).toHaveLength(12);
    expect(chamberGradient([])).toContain('conic-gradient');
  });

  it('normalises angles and polar positions consistently', () => {
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(-30)).toBe(330);
    expect(polarPosition(0, 1)).toEqual({ x: 0, y: 1 });
    expect(polarPosition(90, 1).x).toBeCloseTo(1, 6);
    expect(polarPosition(180, 1).y).toBeCloseTo(-1, 6);
  });
});
