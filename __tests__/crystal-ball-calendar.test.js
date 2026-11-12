import { describe, expect, it } from 'vitest';
import {
  describeCalendar,
  easterSunday,
  getCalendarContext,
  getHolidayDates,
  getToneInstruction,
  parseCalendarDate,
  victoriaDay,
} from '../app/lib/crystal-ball-calendar';

function holidayKeys(year) {
  return Object.fromEntries(getHolidayDates(year).map((holiday) => [holiday.id, holiday.key]));
}

describe('Crystal Ball Canadian calendar', () => {
  it('recognises every required fixed and movable holiday', () => {
    expect(holidayKeys(2026)).toEqual({
      'new-years-day': '2026-01-01',
      'valentines-day': '2026-02-14',
      'good-friday': '2026-04-03',
      easter: '2026-04-05',
      'mothers-day': '2026-05-10',
      'victoria-day': '2026-05-18',
      'fathers-day': '2026-06-21',
      'canada-day': '2026-07-01',
      'labour-day': '2026-09-07',
      'truth-reconciliation': '2026-09-30',
      thanksgiving: '2026-10-12',
      halloween: '2026-10-31',
      'remembrance-day': '2026-11-11',
      'christmas-day': '2026-12-25',
      'boxing-day': '2026-12-26',
      'new-years-eve': '2026-12-31',
    });
  });

  it('calculates Easter and Victoria Day for several years', () => {
    expect(easterSunday(2024)).toEqual({ month: 3, day: 31 });
    expect(easterSunday(2025)).toEqual({ month: 4, day: 20 });
    expect(easterSunday(2026)).toEqual({ month: 4, day: 5 });
    expect(easterSunday(2027)).toEqual({ month: 3, day: 28 });

    expect(victoriaDay(2024)).toBe(20);
    expect(victoriaDay(2025)).toBe(19);
    expect(victoriaDay(2026)).toBe(18);
    expect(victoriaDay(2032)).toBe(24);
  });

  it('rejects impossible calendar dates', () => {
    expect(parseCalendarDate('2026-02-30')).toBeNull();
    expect(parseCalendarDate('2026-13-01')).toBeNull();
    expect(parseCalendarDate('11-12-2026')).toBeNull();
    expect(parseCalendarDate('2026-02-28')).toMatchObject({ year: 2026, month: 2, day: 28 });
  });

  it('builds Canadian excitement exactly from June 24 through Canada Day', () => {
    expect(getCalendarContext('2026-06-23').focus).toBeNull();

    const firstDay = getCalendarContext('2026-06-24');
    expect(firstDay.focus).toMatchObject({
      id: 'canada-day',
      poolKey: 'canada-day-build-up',
      phase: 'anticipation',
      windowDay: 1,
      windowLength: 7,
      daysUntil: 7,
      stage: 'warm-up',
    });
    expect(firstDay.focus.intensity).toBeCloseTo(1 / 7, 2);

    const lastDay = getCalendarContext('2026-06-30');
    expect(lastDay.focus).toMatchObject({
      poolKey: 'canada-day-build-up',
      windowDay: 7,
      daysUntil: 1,
      stage: 'almost-here',
    });
    expect(lastDay.focus.intensity).toBe(1);

    expect(getCalendarContext('2026-07-01').focus).toMatchObject({
      id: 'canada-day',
      poolKey: 'canada-day',
      phase: 'day',
      daysUntil: 0,
    });

    const after = getCalendarContext('2026-07-02');
    expect(after.focus).toBeNull();
    expect(after.season).toBe('summer');
  });

  it('grows Christmas magic from December 1 and keeps Christmas Day distinct', () => {
    expect(getCalendarContext('2026-11-30').focus).toBeNull();

    expect(getCalendarContext('2026-12-01').focus).toMatchObject({
      id: 'christmas-day',
      poolKey: 'christmas-early',
      stage: 'early',
      windowDay: 1,
      daysUntil: 24,
    });
    expect(getCalendarContext('2026-12-10').focus.poolKey).toBe('christmas-early');
    expect(getCalendarContext('2026-12-11').focus.poolKey).toBe('christmas-growing');
    expect(getCalendarContext('2026-12-20').focus.poolKey).toBe('christmas-growing');
    expect(getCalendarContext('2026-12-21').focus.poolKey).toBe('christmas-eve');
    expect(getCalendarContext('2026-12-24').focus).toMatchObject({
      poolKey: 'christmas-eve',
      daysUntil: 1,
    });
    expect(getCalendarContext('2026-12-25').focus).toMatchObject({
      id: 'christmas-day',
      poolKey: 'christmas-day',
      phase: 'day',
    });
  });

  it('moves from Boxing Day through New Year and back to winter', () => {
    const boxingDay = getCalendarContext('2026-12-26');
    expect(boxingDay.focus).toMatchObject({ id: 'boxing-day', poolKey: 'boxing-day' });
    expect(boxingDay.secondary).toMatchObject({ id: 'new-years-eve', daysUntil: 5 });

    expect(getCalendarContext('2026-12-27').focus).toMatchObject({
      poolKey: 'new-year-anticipation',
      windowDay: 1,
      daysUntil: 4,
      phase: 'anticipation',
    });
    expect(getCalendarContext('2026-12-30').focus).toMatchObject({
      windowDay: 4,
      daysUntil: 1,
    });
    expect(getCalendarContext('2026-12-31').focus).toMatchObject({
      id: 'new-years-eve',
      poolKey: 'new-years-eve',
      phase: 'day',
    });
    expect(getCalendarContext('2027-01-01').focus).toMatchObject({
      id: 'new-years-day',
      poolKey: 'new-years-day',
      phase: 'day',
    });

    const after = getCalendarContext('2027-01-02');
    expect(after.focus).toBeNull();
    expect(after.season).toBe('winter');
  });

  it('keeps Remembrance Day to November 11 with a respectful tone only', () => {
    const before = getCalendarContext('2026-11-10');
    expect(before.focus).toBeNull();
    expect(before.upcoming.some((holiday) => holiday.id === 'remembrance-day')).toBe(false);

    const day = getCalendarContext('2026-11-11');
    expect(day.holiday).toMatchObject({ id: 'remembrance-day', name: 'Remembrance Day' });
    expect(day.focus).toMatchObject({
      id: 'remembrance-day',
      phase: 'day',
      tone: 'respectful',
    });
    expect(getToneInstruction(day)).toContain('Do not use humour');
    expect(getToneInstruction(day)).toContain('do not build anticipation');

    const after = getCalendarContext('2026-11-12');
    expect(after.focus).toBeNull();
    expect(after.upcoming.some((holiday) => holiday.id === 'remembrance-day')).toBe(false);
  });

  it('treats the National Day for Truth and Reconciliation thoughtfully', () => {
    const before = getCalendarContext('2026-09-29');
    expect(before.focus).toBeNull();
    expect(before.upcoming.some((holiday) => holiday.id === 'truth-reconciliation')).toBe(false);

    const day = getCalendarContext('2026-09-30');
    expect(day.focus).toMatchObject({
      id: 'truth-reconciliation',
      tone: 'thoughtful',
      phase: 'day',
    });
    expect(getToneInstruction(day)).toContain('Do not use humour');

    expect(getCalendarContext('2026-10-01').focus).not.toMatchObject({
      id: 'truth-reconciliation',
    });
  });

  it('gently anticipates the remaining listed holidays', () => {
    const beforeMothersDay = getCalendarContext('2026-05-08');
    expect(beforeMothersDay.focus).toMatchObject({
      id: 'mothers-day',
      phase: 'anticipation',
      daysUntil: 2,
    });

    expect(getCalendarContext('2026-05-10').focus).toMatchObject({
      id: 'mothers-day',
      phase: 'day',
    });
    expect(getCalendarContext('2026-06-21').focus).toMatchObject({
      id: 'fathers-day',
      phase: 'day',
    });
    expect(getCalendarContext('2026-10-12').focus).toMatchObject({
      id: 'thanksgiving',
      phase: 'day',
    });
    expect(getCalendarContext('2026-11-12').focus).toBeNull();
  });

  it('describes the focus, weekday and local greeting in the calendar facts', () => {
    const christmas = describeCalendar(getCalendarContext('2026-12-05'), 'America/Toronto', '08:15');
    expect(christmas).toContain('Saturday, December 5, 2026');
    expect(christmas).toContain('Season: winter');
    expect(christmas).toContain('Stage: subtle');
    expect(christmas).toContain('Visitor local time: 08:15 (morning; greeting: “Good morning.”)');

    const canada = describeCalendar(getCalendarContext('2026-06-26'), null, null);
    expect(canada).toContain('Canada Day build-up');
    expect(canada).toContain('day 3 of 7');

    const canadaDay = getToneInstruction(getCalendarContext('2026-07-01'));
    expect(canadaDay).toContain('Canada, baby!');

    const ordinary = describeCalendar(getCalendarContext('2027-01-02'), null, null);
    expect(ordinary).toContain('none — an everyday day');
    expect(ordinary).toContain('Season: winter');
  });
});
