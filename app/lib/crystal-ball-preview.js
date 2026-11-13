import { getHolidayDates, parseCalendarDate } from './crystal-ball-calendar';
import { getLocalMoment, parseLocalTime } from './local-time';

/**
 * Development-only date preview for the Crystal Ball.
 *
 * The preview never changes the system clock. It validates a local calendar
 * date and wall-clock time from the URL, builds one local `Date`, and exposes
 * the same local-time context the live page sends to the oracle. Production
 * builds ignore every preview parameter and do not render the preview route.
 */

export const PREVIEW_DATE_PARAM = 'previewDate';
export const PREVIEW_TIME_PARAM = 'previewTime';
export const PREVIEW_DEFAULT_PATH = '/crystal-ball/preview';

// A complete, inert Storage implementation. The greeting helper only reads and
// writes one key, but matching the full interface keeps the preview safe to pass
// anywhere a Storage is accepted.
export const PREVIEW_STORAGE = {
  length: 0,
  clear() {},
  getItem() {
    return null;
  },
  key() {
    return null;
  },
  removeItem() {},
  setItem() {},
};

/**
 * @param {string} [env]
 * @returns {boolean}
 */
export function isPreviewEnabled(env = process.env.NODE_ENV) {
  return env !== 'production';
}

function defaultLocation() {
  if (typeof window === 'undefined') return null;
  return window.location;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

/**
 * Build a local Date for a validated calendar day and optional wall-clock time.
 * A missing or malformed time falls back to the current local clock. The Date is
 * created with local constructor arguments, so the browser's own time zone and
 * daylight-saving rules apply exactly as they would on the real day.
 *
 * @param {unknown} dateKey
 * @param {unknown} time
 * @param {Date} [now]
 * @returns {Date | null}
 */
export function createPreviewMoment(dateKey, time, now = new Date()) {
  const date = parseCalendarDate(dateKey);
  if (!date) return null;

  const parsedTime = parseLocalTime(time) || {
    hours: now.getHours(),
    minutes: now.getMinutes(),
  };

  const moment = new Date(
    date.year,
    date.month - 1,
    date.day,
    parsedTime.hours,
    parsedTime.minutes,
    0,
    0,
  );

  // Reject dates that the runtime could not represent. A time that does not
  // exist because of a spring-forward transition rolls forward within the same
  // calendar day, which is the behaviour a reviewer expects.
  if (
    moment.getFullYear() !== date.year ||
    moment.getMonth() !== date.month - 1 ||
    moment.getDate() !== date.day
  ) {
    return null;
  }

  return moment;
}

/**
 * Read a preview selection from a location-like object.
 *
 * @param {{ search?: string } | null} [location]
 * @param {Date} [now]
 * @returns {{
 *   active: boolean,
 *   dateKey?: string,
 *   localDate?: string,
 *   localTime?: string,
 *   timeZone?: string,
 *   weekday?: string,
 *   moment?: Date,
 *   time?: string,
 *   context?: { localDate: string, localTime: string, timeZone: string },
 * }}
 */
export function getPreviewFromLocation(location = defaultLocation(), now = new Date()) {
  if (!isPreviewEnabled() || !location) return { active: false };

  const params = new URLSearchParams(location.search || '');
  const dateKey = params.get(PREVIEW_DATE_PARAM);
  if (!parseCalendarDate(dateKey)) return { active: false };

  const requestedTime = params.get(PREVIEW_TIME_PARAM);
  const moment = createPreviewMoment(dateKey, requestedTime, now);
  if (!moment) return { active: false };

  const local = getLocalMoment(moment);
  const time = parseLocalTime(requestedTime) ? requestedTime : local.localTime;

  return {
    active: true,
    dateKey: local.dateKey,
    localDate: local.dateKey,
    localTime: local.localTime,
    timeZone: local.timeZone,
    weekday: local.weekday,
    moment,
    time,
    context: {
      localDate: local.dateKey,
      localTime: local.localTime,
      timeZone: local.timeZone,
    },
  };
}

/**
 * @param {string} dateKey
 * @param {string} time
 * @param {string} [basePath]
 * @returns {string}
 */
export function buildPreviewUrl(dateKey, time, basePath = PREVIEW_DEFAULT_PATH) {
  const params = new URLSearchParams();
  params.set(PREVIEW_DATE_PARAM, dateKey);
  if (parseLocalTime(time)) params.set(PREVIEW_TIME_PARAM, time);
  return `${basePath}?${params.toString()}`;
}

/**
 * Shift a calendar key by whole days using UTC arithmetic so month, year and
 * leap-day boundaries never depend on the browser's time zone.
 *
 * @param {string} dateKey
 * @param {number} deltaDays
 * @returns {string | null}
 */
export function shiftPreviewDateKey(dateKey, deltaDays) {
  const parsed = parseCalendarDate(dateKey);
  if (!parsed || !Number.isFinite(deltaDays)) return null;

  const shifted = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day + Math.trunc(deltaDays)),
  );
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(
    shifted.getUTCDate(),
  )}`;
}

/**
 * A fresh preview allowance. It deliberately lives only in page state, so
 * previewing a date never reads or writes the visitor's real daily usage.
 *
 * @param {string} dateKey
 */
export function createPreviewUsage(dateKey) {
  return {
    date: dateKey,
    fortuneUsed: false,
    fortune: null,
    followUpUsed: false,
  };
}

/**
 * Shortcuts for every seasonal window a reviewer needs. Movable dates come from
 * the same Canadian calendar the live experience uses.
 *
 * @param {number} year
 * @returns {Array<{ id: string, group: string, label: string, dateKey: string }>}
 */
export function getPreviewPresets(year) {
  const numericYear = Number.isFinite(Number(year)) ? Math.trunc(Number(year)) : new Date().getFullYear();
  const holidays = getHolidayDates(numericYear);
  const byId = Object.fromEntries(holidays.map((holiday) => [holiday.id, holiday.key]));
  const dateKey = (month, day) => `${numericYear}-${pad2(month)}-${pad2(day)}`;

  return [
    {
      id: 'new-years-day',
      group: 'New Year',
      label: "New Year's Day",
      dateKey: dateKey(1, 1),
    },
    {
      id: 'after-new-year',
      group: 'New Year',
      label: "After New Year's Day",
      dateKey: dateKey(1, 2),
    },
    {
      id: 'valentines-day',
      group: 'Everyday occasions',
      label: "Valentine's Day",
      dateKey: byId['valentines-day'],
    },
    {
      id: 'good-friday',
      group: 'Everyday occasions',
      label: 'Good Friday',
      dateKey: byId['good-friday'],
    },
    {
      id: 'easter',
      group: 'Everyday occasions',
      label: 'Easter Sunday',
      dateKey: byId.easter,
    },
    {
      id: 'mothers-day',
      group: 'Everyday occasions',
      label: "Mother's Day",
      dateKey: byId['mothers-day'],
    },
    {
      id: 'victoria-day',
      group: 'Everyday occasions',
      label: 'Victoria Day',
      dateKey: byId['victoria-day'],
    },
    {
      id: 'fathers-day',
      group: 'Everyday occasions',
      label: "Father's Day",
      dateKey: byId['fathers-day'],
    },
    {
      id: 'canada-build-up-start',
      group: 'Canada Day window',
      label: 'Build-up starts (June 24)',
      dateKey: dateKey(6, 24),
    },
    {
      id: 'canada-build-up-middle',
      group: 'Canada Day window',
      label: 'Build-up grows (June 27)',
      dateKey: dateKey(6, 27),
    },
    {
      id: 'canada-build-up-eve',
      group: 'Canada Day window',
      label: 'Almost here (June 30)',
      dateKey: dateKey(6, 30),
    },
    {
      id: 'canada-day',
      group: 'Canada Day window',
      label: 'Canada Day (July 1)',
      dateKey: dateKey(7, 1),
    },
    {
      id: 'after-canada-day',
      group: 'Canada Day window',
      label: 'After Canada Day (July 2)',
      dateKey: dateKey(7, 2),
    },
    {
      id: 'labour-day',
      group: 'Everyday occasions',
      label: 'Labour Day',
      dateKey: byId['labour-day'],
    },
    {
      id: 'truth-reconciliation',
      group: 'Everyday occasions',
      label: 'National Day for Truth and Reconciliation',
      dateKey: byId['truth-reconciliation'],
    },
    {
      id: 'thanksgiving',
      group: 'Everyday occasions',
      label: 'Thanksgiving',
      dateKey: byId.thanksgiving,
    },
    {
      id: 'halloween',
      group: 'Everyday occasions',
      label: 'Halloween',
      dateKey: byId.halloween,
    },
    {
      id: 'remembrance-day',
      group: 'Remembrance',
      label: 'Remembrance Day',
      dateKey: byId['remembrance-day'],
    },
    {
      id: 'christmas-start',
      group: 'Christmas & New Year',
      label: 'Christmas build-up starts (December 1)',
      dateKey: dateKey(12, 1),
    },
    {
      id: 'christmas-growing',
      group: 'Christmas & New Year',
      label: 'Christmas build-up grows (December 11)',
      dateKey: dateKey(12, 11),
    },
    {
      id: 'christmas-eve-build-up',
      group: 'Christmas & New Year',
      label: 'Christmas Eve build-up (December 21)',
      dateKey: dateKey(12, 21),
    },
    {
      id: 'christmas-eve',
      group: 'Christmas & New Year',
      label: 'Christmas Eve (December 24)',
      dateKey: dateKey(12, 24),
    },
    {
      id: 'christmas-day',
      group: 'Christmas & New Year',
      label: 'Christmas Day (December 25)',
      dateKey: dateKey(12, 25),
    },
    {
      id: 'boxing-day',
      group: 'Christmas & New Year',
      label: 'Boxing Day (December 26)',
      dateKey: dateKey(12, 26),
    },
    {
      id: 'new-year-build-up-start',
      group: 'Christmas & New Year',
      label: 'New Year build-up starts (December 27)',
      dateKey: dateKey(12, 27),
    },
    {
      id: 'new-year-build-up-late',
      group: 'Christmas & New Year',
      label: 'New Year build-up grows (December 30)',
      dateKey: dateKey(12, 30),
    },
    {
      id: 'new-years-eve',
      group: 'Christmas & New Year',
      label: "New Year's Eve (December 31)",
      dateKey: dateKey(12, 31),
    },
    {
      id: 'next-new-years-day',
      group: 'Christmas & New Year',
      label: "Next year's New Year's Day",
      dateKey: `${numericYear + 1}-01-01`,
    },
    {
      id: 'next-after-new-year',
      group: 'Christmas & New Year',
      label: "Next year's January 2",
      dateKey: `${numericYear + 1}-01-02`,
    },
  ];
}
