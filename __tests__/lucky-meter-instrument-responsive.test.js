import { describe, expect, it } from 'vitest';
import { instrumentFraming } from '../app/lib/lucky-meter/instrument-prototype.js';
import { stageFraming } from '../app/lib/lucky-meter/meter-layout.js';

const PHONE_MAX_WIDTH = 500;
// One portrait composition now frames the whole instrument: the raised arch,
// the wheel, the twelve cups, the bowl, the plaque and the colour bar. Every
// screen size uses that extent and that look-at, so the camera distance only
// ever depends on 4.1.
const VERTICAL_EXTENT = 4.1;
const LOOK_Y = 0.14;

describe('Lucky Meter responsive framing', () => {
  it('keeps the tall reference composition on small and large phones', () => {
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [390, 844],
      [412, 915],
      [430, 932],
    ]) {
      const framing = instrumentFraming(width, height);
      expect(framing.phone, `${width}×${height}`).toBe(true);
      expect(framing.verticalExtent).toBe(VERTICAL_EXTENT);
      expect(framing.lookY).toBe(LOOK_Y);
      expect(framing.aspect).toBeCloseTo(width / height, 6);
      expect(Number.isFinite(framing.distance)).toBe(true);
    }
  });

  it('uses a safe tablet portrait framing and a wider desktop framing without changing perspective', () => {
    for (const [width, height] of [
      [768, 1024],
      [820, 1180],
    ]) {
      const framing = instrumentFraming(width, height);
      expect(framing.phone, `${width}×${height}`).toBe(false);
      expect(framing.tabletPortrait).toBe(true);
      expect(framing.verticalExtent).toBe(VERTICAL_EXTENT);
      expect(framing.lookY).toBe(LOOK_Y);
      expect(framing.distance).toBeCloseTo(
        VERTICAL_EXTENT / (2 * Math.tan((32 * Math.PI) / 180 / 2)),
        6,
      );
    }
    for (const [width, height] of [
      [1024, 768],
      [1366, 768],
      [1440, 900],
      [1920, 1080],
    ]) {
      const framing = instrumentFraming(width, height);
      expect(framing.phone, `${width}×${height}`).toBe(false);
      expect(framing.tabletPortrait).toBe(false);
      expect(framing.verticalExtent).toBe(VERTICAL_EXTENT);
      expect(framing.lookY).toBe(LOOK_Y);
      expect(framing.distance).toBeCloseTo(
        VERTICAL_EXTENT / (2 * Math.tan((32 * Math.PI) / 180 / 2)),
        6,
      );
    }
  });

  it('switches exactly at the phone width boundary and never stretches the camera', () => {
    expect(instrumentFraming(PHONE_MAX_WIDTH, 900).phone).toBe(true);
    expect(instrumentFraming(PHONE_MAX_WIDTH + 1, 900).phone).toBe(false);

    const phone = instrumentFraming(390, 844);
    const tablet = instrumentFraming(820, 1180);
    const desktop = instrumentFraming(1440, 900);
    // One composition means one camera distance at every size: the wider
    // frames crop nothing and never stretch the instrument.
    expect(tablet.distance).toBeCloseTo(phone.distance, 6);
    expect(desktop.distance).toBeCloseTo(phone.distance, 6);
    expect(phone.verticalExtent).toBe(VERTICAL_EXTENT);
  });

  it('fills the production square stage without changing the wheel geometry', () => {
    const phone = stageFraming(390, 390);
    expect(phone.phone).toBe(true);
    expect(phone.verticalExtent).toBe(VERTICAL_EXTENT);
    expect(phone.lookY).toBe(LOOK_Y);
    expect(phone.wheelTop).toBeCloseTo(0.5 - (0.62 - LOOK_Y) / VERTICAL_EXTENT, 6);

    const large = stageFraming(480, 480);
    expect(large.phone).toBe(true);
    expect(large.verticalExtent).toBe(VERTICAL_EXTENT);

    const tablet = stageFraming(520, 520);
    expect(tablet.phone).toBe(false);
    // A bigger stage crops the same composition instead of re-framing it.
    expect(tablet.verticalExtent).toBe(VERTICAL_EXTENT);
    expect(tablet.wheelTop).toBeCloseTo(phone.wheelTop, 6);
    expect(tablet.distance).toBeCloseTo(phone.distance, 6);
    expect(tablet.aspect).toBe(1);
  });

  it('keeps the production wheel centre inside a safe band at every stage size', () => {
    for (const size of [320, 360, 390, 412, 430, 480, 520, 540]) {
      const framing = stageFraming(size, size);
      expect(framing.wheelTop, `${size}px`).toBeGreaterThan(0.2);
      expect(framing.wheelTop, `${size}px`).toBeLessThan(0.4);
      expect(framing.distance).toBeGreaterThan(0);
      expect(framing.aspect).toBe(1);
    }
  });

  it('falls back safely for missing or invalid dimensions', () => {
    for (const [width, height] of [
      [0, 0],
      [undefined, undefined],
      [Number.NaN, Number.NaN],
    ]) {
      const framing = instrumentFraming(width, height);
      expect(framing.phone).toBe(true);
      expect(framing.verticalExtent).toBe(VERTICAL_EXTENT);
      expect(framing.aspect).toBeCloseTo(0.76, 6);
      expect(framing.distance).toBeGreaterThan(0);
    }
  });
});
