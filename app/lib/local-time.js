import { getLocalDateKey } from './daily-reset';

/**
 * One visitor-local time system for the Crystal Ball.
 *
 * The browser's own clock and time zone drive the daily date, weekday,
 * wall-clock time, time-of-day greeting and the next-midnight reset. Nothing
 * here reads the server's time zone, so a visitor in Vancouver and a visitor
 * in Halifax each get their own local day. The same helpers run on the client
 * (greeting and API context) and on the server (validating the supplied local
 * time), which keeps the whole experience on one definition of morning,
 * afternoon, evening and late night.
 */

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const PERIOD_DETAILS = {
  morning: { label: 'morning', greeting: 'Good morning.' },
  afternoon: { label: 'afternoon', greeting: 'Good afternoon.' },
  evening: { label: 'evening', greeting: 'Good evening.' },
  'late-night': { label: 'late night', greeting: 'Still up, eh?' },
};

export const TIME_PERIODS = Object.keys(PERIOD_DETAILS);

/**
 * Map a 24-hour clock hour to the shared greeting period.
 * 05:00–11:59 morning, 12:00–16:59 afternoon, 17:00–21:59 evening,
 * 22:00–04:59 late night (including local midnight).
 *
 * @param {number} hours
 * @returns {'morning' | 'afternoon' | 'evening' | 'late-night'}
 */
export function getTimePeriod(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value)) return 'late-night';
  const hour = ((Math.floor(value) % 24) + 24) % 24;

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late-night';
}

export function getTimeOfDayLabel(period) {
  return PERIOD_DETAILS[period]?.label || PERIOD_DETAILS['late-night'].label;
}

export function getTimeOfDayGreeting(period) {
  return PERIOD_DETAILS[period]?.greeting || PERIOD_DETAILS['late-night'].greeting;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

/**
 * Parse a 24-hour wall-clock time. Returns null for malformed input so the
 * server can treat the time as unknown without trusting arbitrary text.
 *
 * @param {unknown} value
 * @returns {{ hours: number, minutes: number } | null}
 */
export function parseLocalTime(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

/**
 * Resolve the shared time-of-day metadata for a validated local time string.
 *
 * @param {unknown} value
 * @returns {{ id: string, label: string, greeting: string, hours: number, minutes: number } | null}
 */
export function getTimeOfDayFromLocalTime(value) {
  const parsed = parseLocalTime(value);
  if (!parsed) return null;
  const id = getTimePeriod(parsed.hours);
  return {
    id,
    label: getTimeOfDayLabel(id),
    greeting: getTimeOfDayGreeting(id),
    hours: parsed.hours,
    minutes: parsed.minutes,
  };
}

function resolveTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Read the visitor's local moment in one call. Everything is derived from the
 * supplied `Date` using local getters, which keeps daylight-saving transitions
 * correct (the day can be 23 or 25 hours long).
 *
 * @param {Date} [date]
 * @returns {{
 *   dateKey: string,
 *   year: number,
 *   month: number,
 *   day: number,
 *   weekdayIndex: number,
 *   weekday: string,
 *   hours: number,
 *   minutes: number,
 *   localTime: string,
 *   timeZone: string,
 *   period: string,
 *   timeOfDayLabel: string,
 *   greeting: string,
 * }}
 */
export function getLocalMoment(date = new Date()) {
  const moment = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const hours = moment.getHours();
  const minutes = moment.getMinutes();
  const weekdayIndex = moment.getDay();
  const period = getTimePeriod(hours);

  return {
    dateKey: getLocalDateKey(moment),
    year: moment.getFullYear(),
    month: moment.getMonth() + 1,
    day: moment.getDate(),
    weekdayIndex,
    weekday: WEEKDAY_NAMES[weekdayIndex],
    hours,
    minutes,
    localTime: `${pad2(hours)}:${pad2(minutes)}`,
    timeZone: resolveTimeZone(),
    period,
    timeOfDayLabel: getTimeOfDayLabel(period),
    greeting: getTimeOfDayGreeting(period),
  };
}
