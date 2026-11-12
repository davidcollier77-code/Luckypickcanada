import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  getLocalDateKey,
  getNextLocalMidnight,
} from '../app/lib/daily-reset';
import {
  getLocalMoment,
  getTimeOfDayFromLocalTime,
  getTimeOfDayGreeting,
  getTimePeriod,
  parseLocalTime,
} from '../app/lib/local-time';

describe('shared visitor-local time', () => {
  it.each([
    [0, 'late-night'],
    [4, 'late-night'],
    [5, 'morning'],
    [7, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [16, 'afternoon'],
    [17, 'evening'],
    [21, 'evening'],
    [22, 'late-night'],
    [23, 'late-night'],
    [24, 'late-night'],
  ])('maps local hour %i to %s', (hour, period) => {
    expect(getTimePeriod(hour)).toBe(period);
  });

  it('provides the four local greetings', () => {
    expect(getTimeOfDayGreeting('morning')).toBe('Good morning.');
    expect(getTimeOfDayGreeting('afternoon')).toBe('Good afternoon.');
    expect(getTimeOfDayGreeting('evening')).toBe('Good evening.');
    expect(getTimeOfDayGreeting('late-night')).toBe('Still up, eh?');
  });

  it.each(['00:00', '05:00', '12:00', '19:45', '23:59'])(
    'accepts the 24-hour local time %s',
    (value) => {
      expect(parseLocalTime(value)).not.toBeNull();
    },
  );

  it.each(['24:00', '7:05', 'quarter past seven', '07:5', '', null, 745])(
    'rejects the malformed local time %s',
    (value) => {
      expect(parseLocalTime(value)).toBeNull();
    },
  );

  it('resolves the greeting metadata from a validated local time', () => {
    expect(getTimeOfDayFromLocalTime('07:15')).toMatchObject({
      id: 'morning',
      label: 'morning',
      greeting: 'Good morning.',
      hours: 7,
      minutes: 15,
    });
    expect(getTimeOfDayFromLocalTime('19:45').id).toBe('evening');
    expect(getTimeOfDayFromLocalTime('23:30').id).toBe('late-night');
    expect(getTimeOfDayFromLocalTime('not a time')).toBeNull();
  });

  it('derives the date, weekday, wall clock and period from one local Date', () => {
    const moment = getLocalMoment(new Date(2026, 10, 12, 7, 5, 0, 0));

    expect(moment).toMatchObject({
      dateKey: '2026-11-12',
      year: 2026,
      month: 11,
      day: 12,
      weekdayIndex: 4,
      weekday: 'Thursday',
      hours: 7,
      minutes: 5,
      localTime: '07:05',
      period: 'morning',
      timeOfDayLabel: 'morning',
      greeting: 'Good morning.',
    });
    expect(moment.timeZone.length).toBeGreaterThan(0);
  });

  it('moves the local date key exactly at local midnight', () => {
    expect(getLocalDateKey(new Date(2026, 10, 12, 23, 59, 59, 999))).toBe('2026-11-12');
    expect(getLocalDateKey(new Date(2026, 10, 13, 0, 0, 0, 0))).toBe('2026-11-13');
    expect(getLocalMoment(new Date(2026, 10, 13, 0, 0, 0, 0)).period).toBe('late-night');
  });

  it('keeps local midnight correct across daylight-saving transitions', () => {
    // Run the shared helper in a time zone that observes daylight saving so the
    // 23-hour and 25-hour local days are both exercised for real.
    const moduleUrl = pathToFileURL(
      path.resolve(process.cwd(), 'app/lib/daily-reset.js'),
    ).href;
    const script = `
      const mod = await import(${JSON.stringify(moduleUrl)});
      const spring = new Date(2026, 2, 8, 0, 0, 0, 0);
      const fall = new Date(2026, 10, 1, 0, 0, 0, 0);
      const beforeSpringMidnight = new Date(2026, 2, 8, 23, 30, 0, 0);
      process.stdout.write(JSON.stringify({
        springHours: (mod.getNextLocalMidnight(spring) - spring) / 3600000,
        fallHours: (mod.getNextLocalMidnight(fall) - fall) / 3600000,
        springKey: mod.getLocalDateKey(mod.getNextLocalMidnight(spring)),
        fallKey: mod.getLocalDateKey(mod.getNextLocalMidnight(fall)),
        remainingMs: mod.getDailyResetState(beforeSpringMidnight).remainingMs,
      }));
    `;

    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { ...process.env, TZ: 'America/Toronto' },
      encoding: 'utf8',
    });
    const result = JSON.parse(output);

    expect(result.springHours).toBe(23);
    expect(result.fallHours).toBe(25);
    expect(result.springKey).toBe('2026-03-09');
    expect(result.fallKey).toBe('2026-11-02');
    expect(result.remainingMs).toBe(30 * 60 * 1000);
    expect(getNextLocalMidnight(new Date(2026, 2, 8, 12, 0, 0, 0)).getHours()).toBe(0);
  });
});
