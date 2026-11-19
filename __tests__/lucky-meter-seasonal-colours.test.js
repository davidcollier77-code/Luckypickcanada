import { describe, expect, it } from 'vitest';
import {
  ALL_COLOURS,
  COLOURS_BY_ID,
  LEGACY_COLOUR_IDS,
  SEASONS,
  SEASON_DATE_RANGES,
  dateFromLocalKey,
  getPaletteForDate,
  getPaletteForSeasonKey,
  getSeasonForDate,
  getSeasonForDateKey,
  getSeasonKeyForDate,
  isKnownColourId,
} from '../app/lib/lucky-meter/sparks-and-seasonal-colours';

const localDate = (year, month, day) => new Date(year, month - 1, day, 12, 0, 0, 0);

describe('Sparks & Seasonal Colours configuration', () => {
  it('holds four complete Canadian palettes of twelve colours each', () => {
    expect(SEASONS).toHaveLength(4);
    expect(ALL_COLOURS).toHaveLength(48);
    for (const season of SEASONS) {
      expect(season.colours).toHaveLength(12);
      expect(season.name).toMatch(/Spring|Summer|Autumn|Winter/);
      expect(season.label).toMatch(/–/);
    }
    const ids = new Set(ALL_COLOURS.map((colour) => colour.id));
    const names = new Set(ALL_COLOURS.map((colour) => colour.name));
    expect(ids.size).toBe(48);
    expect(names.size).toBe(48);
  });

  it('keeps the owner’s exact autumn values and names', () => {
    expect(getPaletteForSeasonKey('autumn').map((colour) => [colour.name, colour.hex])).toEqual([
      ['Maple Red', '#A83232'],
      ['Burnt Orange', '#C45A24'],
      ['Pumpkin', '#D87925'],
      ['Goldenrod', '#C99A24'],
      ['Mustard Gold', '#B58A32'],
      ['Copper', '#A65E3B'],
      ['Burgundy', '#702D3D'],
      ['Rust', '#A34B32'],
      ['Forest Green', '#405B42'],
      ['Deep Teal', '#32666A'],
      ['Denim Blue', '#426789'],
      ['Warm Camel', '#B58A65'],
    ]);
  });

  it('gives every colour an exact HEX value and a subtle painted finish', () => {
    for (const colour of ALL_COLOURS) {
      expect(colour.hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(colour.name.length).toBeGreaterThan(2);
      expect(colour.texture).toBeTruthy();
      expect(['matte', 'satin', 'gloss', 'frost', 'petal']).toContain(colour.texture.finish);
      expect(colour.texture.grain).toBeGreaterThanOrEqual(0);
      expect(colour.texture.grain).toBeLessThanOrEqual(0.25);
      expect(colour.texture.sheen).toBeGreaterThan(0);
      expect(colour.texture.sheen).toBeLessThanOrEqual(0.6);
    }
    // The autumn list is shared by the wheel, the pour and the card.
    expect(COLOURS_BY_ID.get('maple-red')).toMatchObject({
      name: 'Maple Red',
      hex: '#A83232',
      light: false,
    });
    expect(COLOURS_BY_ID.get('winter-snowfall')?.light).toBe(true);
  });
});

describe('seasonal date boundaries', () => {
  const cases = [
    [2026, 1, 1, 'winter'],
    [2026, 2, 28, 'winter'],
    [2028, 2, 29, 'winter'],
    [2026, 3, 1, 'spring'],
    [2026, 5, 31, 'spring'],
    [2026, 6, 1, 'summer'],
    [2026, 8, 31, 'summer'],
    [2026, 9, 1, 'autumn'],
    [2026, 11, 30, 'autumn'],
    [2026, 12, 1, 'winter'],
    [2026, 12, 31, 'winter'],
  ];

  it('switches on the configured local dates, including 29 February', () => {
    for (const [year, month, day, season] of cases) {
      expect(getSeasonKeyForDate(localDate(year, month, day))).toBe(season);
    }
  });

  it('handles leap and common years without a special case', () => {
    // 2028 is a leap year: 29 February exists and belongs to winter.
    expect(getSeasonKeyForDate(localDate(2028, 2, 29))).toBe('winter');
    // 2027 is common: the last real February day is still winter.
    expect(getSeasonKeyForDate(localDate(2027, 2, 28))).toBe('winter');
    // 2100 is not a leap year; 28 February is the end of winter.
    expect(getSeasonKeyForDate(localDate(2100, 2, 28))).toBe('winter');
    expect(getSeasonKeyForDate(localDate(2100, 3, 1))).toBe('spring');
  });

  it('changes exactly at local midnight, not at UTC midnight', () => {
    const before = new Date(2026, 10, 30, 23, 59, 59, 999); // 30 Nov, local
    const after = new Date(2026, 11, 1, 0, 0, 0, 1); // 1 Dec, local
    expect(getSeasonKeyForDate(before)).toBe('autumn');
    expect(getSeasonKeyForDate(after)).toBe('winter');
    expect(getPaletteForDate(before)[0].id).not.toBe(getPaletteForDate(after)[0].id);
  });

  it('keeps one palette stable for every day of a season', () => {
    const spring = getPaletteForSeasonKey('spring');
    for (const date of [localDate(2026, 3, 1), localDate(2026, 4, 17), localDate(2026, 5, 31)]) {
      expect(getPaletteForDate(date)).toBe(spring);
      expect(getSeasonForDate(date)?.key).toBe('spring');
    }
  });

  it('supports configurable date ranges without changing the palettes', () => {
    // Move the winter/spring hand-over two weeks earlier. Both sides of the
    // boundary must move together, because the ranges are contiguous.
    const ranges = {
      ...SEASON_DATE_RANGES,
      winter: { ...SEASON_DATE_RANGES.winter, endMonth: 2, endDay: 14 },
      spring: { ...SEASON_DATE_RANGES.spring, startMonth: 2, startDay: 15 },
    };
    expect(getSeasonKeyForDate(localDate(2026, 2, 14), ranges)).toBe('winter');
    expect(getSeasonKeyForDate(localDate(2026, 2, 15), ranges)).toBe('spring');
    expect(getSeasonForDate(localDate(2026, 2, 15), ranges)?.colours).toHaveLength(12);
  });

  it('resolves a local date key without drifting across DST', () => {
    // 14 March 2027 is a North American DST transition in many zones.
    const date = dateFromLocalKey('2027-03-14');
    expect(date?.getFullYear()).toBe(2027);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(14);
    expect(getSeasonForDateKey('2027-03-14')?.key).toBe('spring');
    expect(getSeasonForDateKey('not-a-date')).toBeNull();
    expect(getSeasonForDateKey('2026-02-30')).toBeNull();
  });

  it('recognises seasonal and preserved legacy colour ids', () => {
    expect(isKnownColourId('maple-red')).toBe(true);
    expect(isKnownColourId('winter-frost-blue')).toBe(true);
    expect(LEGACY_COLOUR_IDS.every((id) => isKnownColourId(id))).toBe(true);
    expect(isKnownColourId('not-a-colour')).toBe(false);
    expect(getPaletteForSeasonKey('monsoon')).toEqual([]);
  });
});
