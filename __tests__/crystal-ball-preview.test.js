import { describe, expect, it } from 'vitest';
import { getHolidayDates, parseCalendarDate } from '../app/lib/crystal-ball-calendar';
import {
  PREVIEW_STORAGE,
  buildPreviewUrl,
  createPreviewMoment,
  createPreviewUsage,
  getPreviewFromLocation,
  getPreviewPresets,
  isPreviewEnabled,
  shiftPreviewDateKey,
} from '../app/lib/crystal-ball-preview';

const location = (search) => ({ search });

describe('Crystal Ball development date preview', () => {
  it('is enabled everywhere except production', () => {
    expect(isPreviewEnabled('production')).toBe(false);
    expect(isPreviewEnabled('development')).toBe(true);
    expect(isPreviewEnabled('test')).toBe(true);
  });

  it('parses a preview date and time into one local moment', () => {
    const preview = getPreviewFromLocation(
      location('?previewDate=2026-12-24&previewTime=20:30'),
      new Date(2026, 10, 12, 9, 0),
    );

    expect(preview.active).toBe(true);
    expect(preview.localDate).toBe('2026-12-24');
    expect(preview.localTime).toBe('20:30');
    expect(preview.weekday).toBe('Thursday');
    expect(preview.context).toEqual({
      localDate: '2026-12-24',
      localTime: '20:30',
      timeZone: preview.timeZone,
    });
    expect(preview.timeZone.length).toBeGreaterThan(0);
  });

  it('defaults the time to the current local clock', () => {
    const preview = getPreviewFromLocation(
      location('?previewDate=2026-07-01'),
      new Date(2026, 10, 12, 9, 15),
    );

    expect(preview.active).toBe(true);
    expect(preview.localDate).toBe('2026-07-01');
    expect(preview.localTime).toBe('09:15');
  });

  it('falls back to the current clock for a malformed time', () => {
    const preview = getPreviewFromLocation(
      location('?previewDate=2026-07-01&previewTime=25:99'),
      new Date(2026, 10, 12, 6, 5),
    );

    expect(preview.active).toBe(true);
    expect(preview.localTime).toBe('06:05');
    expect(preview.time).toBe('06:05');
  });

  it('ignores missing, malformed and impossible dates', () => {
    expect(getPreviewFromLocation(location('')).active).toBe(false);
    expect(getPreviewFromLocation(location('?previewDate=2026-7-1')).active).toBe(false);
    expect(getPreviewFromLocation(location('?previewDate=2026-02-30')).active).toBe(false);
    expect(getPreviewFromLocation(location('?previewDate=not-a-date')).active).toBe(false);
    expect(getPreviewFromLocation(null).active).toBe(false);
  });

  it('builds a safe preview URL', () => {
    const url = new URL(
      buildPreviewUrl('2026-12-24', '20:30'),
      'https://luckypickcanada.test',
    );

    expect(url.pathname).toBe('/crystal-ball/preview');
    expect(url.searchParams.get('previewDate')).toBe('2026-12-24');
    expect(url.searchParams.get('previewTime')).toBe('20:30');
    expect(buildPreviewUrl('2026-12-24', 'nope')).not.toContain('previewTime');
  });

  it('creates a local Date without changing the real clock', () => {
    const moment = createPreviewMoment('2026-07-01', '12:45');
    expect(moment).toBeInstanceOf(Date);
    expect(moment.getFullYear()).toBe(2026);
    expect(moment.getMonth()).toBe(6);
    expect(moment.getDate()).toBe(1);
    expect(moment.getHours()).toBe(12);
    expect(moment.getMinutes()).toBe(45);
    expect(createPreviewMoment('2026-02-30', '12:45')).toBeNull();
  });

  it('shifts dates across months, years and leap days', () => {
    expect(shiftPreviewDateKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftPreviewDateKey('2027-01-01', -1)).toBe('2026-12-31');
    expect(shiftPreviewDateKey('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftPreviewDateKey('2024-02-29', 1)).toBe('2024-03-01');
    expect(shiftPreviewDateKey('2026-06-30', 1)).toBe('2026-07-01');
    expect(shiftPreviewDateKey('nope', 1)).toBeNull();
  });

  it('keeps preview readings in page-state-only usage', () => {
    expect(createPreviewUsage('2026-12-24')).toEqual({
      date: '2026-12-24',
      fortuneUsed: false,
      fortune: null,
      followUpUsed: false,
    });
  });

  it('provides inert preview storage', () => {
    expect(PREVIEW_STORAGE.getItem('anything')).toBeNull();
    expect(() => PREVIEW_STORAGE.setItem('anything', 'value')).not.toThrow();
    expect(PREVIEW_STORAGE.length).toBe(0);
  });

  it('offers presets for every holiday and seasonal window', () => {
    const year = 2026;
    const presets = getPreviewPresets(year);
    const dates = presets.map((preset) => preset.dateKey);

    for (const holiday of getHolidayDates(year)) {
      expect(dates).toContain(holiday.key);
    }

    expect(dates).toEqual(
      expect.arrayContaining([
        '2026-01-01',
        '2026-01-02',
        '2026-06-24',
        '2026-06-27',
        '2026-06-30',
        '2026-07-01',
        '2026-07-02',
        '2026-11-11',
        '2026-12-01',
        '2026-12-11',
        '2026-12-21',
        '2026-12-24',
        '2026-12-25',
        '2026-12-26',
        '2026-12-27',
        '2026-12-30',
        '2026-12-31',
        '2027-01-01',
        '2027-01-02',
      ]),
    );

    expect(presets.every((preset) => parseCalendarDate(preset.dateKey))).toBe(true);
    expect(presets.every((preset) => preset.label && preset.group)).toBe(true);
  });
});
