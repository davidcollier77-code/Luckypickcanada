import { getTimeOfDayFromLocalTime, WEEKDAY_NAMES } from './local-time';

/**
 * Canadian calendar and occasion model for the Crystal Ball.
 *
 * All calendar facts are calculated from the visitor's validated local date
 * using UTC arithmetic so the result never depends on the server's time zone.
 * Movable dates (Easter, Good Friday, Victoria Day, Mother's Day, Father's Day,
 * Labour Day, Thanksgiving) are computed for the requested year.
 */

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const HOLIDAYS = {
  newYearsDay: { id: 'new-years-day', name: "New Year's Day", tone: 'celebratory' },
  valentinesDay: { id: 'valentines-day', name: "Valentine's Day", tone: 'celebratory' },
  goodFriday: { id: 'good-friday', name: 'Good Friday', tone: 'thoughtful' },
  easter: { id: 'easter', name: 'Easter Sunday', tone: 'celebratory' },
  mothersDay: { id: 'mothers-day', name: "Mother's Day", tone: 'celebratory' },
  victoriaDay: { id: 'victoria-day', name: 'Victoria Day', tone: 'celebratory' },
  fathersDay: { id: 'fathers-day', name: "Father's Day", tone: 'celebratory' },
  canadaDay: { id: 'canada-day', name: 'Canada Day', tone: 'celebratory' },
  labourDay: { id: 'labour-day', name: 'Labour Day', tone: 'celebratory' },
  truthReconciliation: {
    id: 'truth-reconciliation',
    name: 'National Day for Truth and Reconciliation',
    tone: 'thoughtful',
  },
  thanksgiving: { id: 'thanksgiving', name: 'Thanksgiving', tone: 'celebratory' },
  halloween: { id: 'halloween', name: 'Halloween', tone: 'celebratory' },
  remembranceDay: { id: 'remembrance-day', name: 'Remembrance Day', tone: 'respectful' },
  christmasDay: { id: 'christmas-day', name: 'Christmas Day', tone: 'festive' },
  boxingDay: { id: 'boxing-day', name: 'Boxing Day', tone: 'festive' },
  newYearsEve: { id: 'new-years-eve', name: "New Year's Eve", tone: 'festive' },
};

// These days are never treated as celebrations and are never used to build
// anticipation. They appear only on their own date, with a quiet tone.
const SENSITIVE_HOLIDAY_IDS = new Set(['remembrance-day', 'truth-reconciliation']);

// Holidays that may be gently anticipated in the week before. The seasonal
// windows (Canada Day, Christmas, New Year) are handled separately so their
// longer, escalating build-ups stay exact.
const ANTICIPATION_HOLIDAY_IDS = new Set([
  'valentines-day',
  'easter',
  'mothers-day',
  'victoria-day',
  'fathers-day',
  'labour-day',
  'thanksgiving',
]);

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDateKey(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Parse a `YYYY-MM-DD` key and reject impossible dates such as February 30.
 *
 * @param {unknown} value
 * @returns {{ year: number, month: number, day: number, key: string } | null}
 */
export function parseCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day, key: value };
}

export function getServerDateKey() {
  const now = new Date();
  return toDateKey(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
}

function addDays(year, month, day, delta) {
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export function nthWeekdayOfMonth(year, month, weekday, nth) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  return 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
}

// Victoria Day is the Monday preceding May 25. When May 25 is itself a Monday,
// the preceding Monday is May 18.
export function victoriaDay(year) {
  const may25 = new Date(Date.UTC(year, 4, 25));
  const daysSinceMonday = (may25.getUTCDay() + 6) % 7;
  const offset = daysSinceMonday === 0 ? 7 : daysSinceMonday;
  return 25 - offset;
}

/**
 * Every recognised occasion for a calendar year, with fixed and movable dates.
 *
 * @param {number} year
 * @returns {Array<{ id: string, name: string, tone: string, key: string }>}
 */
export function getHolidayDates(year) {
  const easter = easterSunday(year);
  const goodFriday = addDays(year, easter.month, easter.day, -2);

  return [
    { ...HOLIDAYS.newYearsDay, key: toDateKey(year, 1, 1) },
    { ...HOLIDAYS.valentinesDay, key: toDateKey(year, 2, 14) },
    { ...HOLIDAYS.goodFriday, key: toDateKey(goodFriday.year, goodFriday.month, goodFriday.day) },
    { ...HOLIDAYS.easter, key: toDateKey(year, easter.month, easter.day) },
    { ...HOLIDAYS.mothersDay, key: toDateKey(year, 5, nthWeekdayOfMonth(year, 5, 0, 2)) },
    { ...HOLIDAYS.victoriaDay, key: toDateKey(year, 5, victoriaDay(year)) },
    { ...HOLIDAYS.fathersDay, key: toDateKey(year, 6, nthWeekdayOfMonth(year, 6, 0, 3)) },
    { ...HOLIDAYS.canadaDay, key: toDateKey(year, 7, 1) },
    { ...HOLIDAYS.labourDay, key: toDateKey(year, 9, nthWeekdayOfMonth(year, 9, 1, 1)) },
    { ...HOLIDAYS.truthReconciliation, key: toDateKey(year, 9, 30) },
    { ...HOLIDAYS.thanksgiving, key: toDateKey(year, 10, nthWeekdayOfMonth(year, 10, 1, 2)) },
    { ...HOLIDAYS.halloween, key: toDateKey(year, 10, 31) },
    { ...HOLIDAYS.remembranceDay, key: toDateKey(year, 11, 11) },
    { ...HOLIDAYS.christmasDay, key: toDateKey(year, 12, 25) },
    { ...HOLIDAYS.boxingDay, key: toDateKey(year, 12, 26) },
    { ...HOLIDAYS.newYearsEve, key: toDateKey(year, 12, 31) },
  ];
}

/**
 * Meteorological seasons, which match how the Crystal Ball talks about
 * Canadian weather: spring from March 20, summer from June 21, autumn from
 * September 22, and winter from December 21.
 */
export function getSeason(month, day) {
  if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day <= 20)) {
    return 'spring';
  }
  if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day <= 21)) {
    return 'summer';
  }
  if ((month === 9 && day >= 22) || month === 10 || month === 11 || (month === 12 && day <= 20)) {
    return 'autumn';
  }
  return 'winter';
}

function daysBetween(fromKey, toKey) {
  const from = parseCalendarDate(fromKey);
  const to = parseCalendarDate(toKey);
  if (!from || !to) return null;
  const fromMs = Date.UTC(from.year, from.month - 1, from.day);
  const toMs = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toMs - fromMs) / 86400000);
}

function christmasFocus(day) {
  const daysUntil = 25 - day;
  if (day <= 10) {
    return {
      ...HOLIDAYS.christmasDay,
      phase: 'anticipation',
      poolKey: 'christmas-early',
      stage: 'early',
      windowDay: day,
      windowLength: 24,
      daysUntil,
      intensity: Math.round((day / 24) * 100) / 100,
    };
  }
  if (day <= 20) {
    return {
      ...HOLIDAYS.christmasDay,
      phase: 'anticipation',
      poolKey: 'christmas-growing',
      stage: 'growing',
      windowDay: day,
      windowLength: 24,
      daysUntil,
      intensity: Math.round((day / 24) * 100) / 100,
    };
  }
  return {
    ...HOLIDAYS.christmasDay,
    phase: 'anticipation',
    poolKey: 'christmas-eve',
    stage: 'eve',
    windowDay: day,
    windowLength: 24,
    daysUntil,
    intensity: Math.round((day / 24) * 100) / 100,
  };
}

function canadaDayFocus(day) {
  const windowDay = day - 23;
  return {
    ...HOLIDAYS.canadaDay,
    phase: 'anticipation',
    poolKey: 'canada-day-build-up',
    stage: windowDay <= 2 ? 'warm-up' : windowDay <= 5 ? 'building' : 'almost-here',
    windowDay,
    windowLength: 7,
    daysUntil: 8 - windowDay,
    intensity: Math.round((windowDay / 7) * 100) / 100,
  };
}

function newYearFocus(day) {
  const windowDay = day - 26;
  return {
    ...HOLIDAYS.newYearsEve,
    phase: 'anticipation',
    poolKey: 'new-year-anticipation',
    stage: 'building',
    windowDay,
    windowLength: 5,
    daysUntil: 31 - day,
    intensity: Math.round((windowDay / 5) * 100) / 100,
  };
}

function dayFocus(holiday, overrides = {}) {
  return {
    ...holiday,
    phase: 'day',
    poolKey: holiday.id,
    stage: 'day',
    daysUntil: 0,
    intensity: 1,
    ...overrides,
  };
}

function generalAnticipationFocus(holiday, daysUntil) {
  return {
    ...holiday,
    phase: 'anticipation',
    poolKey: holiday.id,
    stage: 'before',
    windowDay: 8 - daysUntil,
    windowLength: 7,
    daysUntil,
    intensity: Math.round(((8 - daysUntil) / 7) * 100) / 100,
  };
}

function getOccasionFocus(parsed, holidayToday, upcoming) {
  // Remembrance Day and the National Day for Truth and Reconciliation are
  // recognised on the day only. They never build anticipation and never have
  // an afterglow.
  if (holidayToday) {
    if (holidayToday.id === 'christmas-day') {
      return dayFocus(holidayToday, { poolKey: 'christmas-day', stage: 'day' });
    }
    if (holidayToday.id === 'boxing-day') {
      return dayFocus(holidayToday, { poolKey: 'boxing-day' });
    }
    if (holidayToday.id === 'new-years-eve') {
      return dayFocus(holidayToday, { poolKey: 'new-years-eve' });
    }
    if (holidayToday.id === 'new-years-day') {
      return dayFocus(holidayToday, { poolKey: 'new-years-day' });
    }
    if (holidayToday.id === 'canada-day') {
      return dayFocus(holidayToday, { poolKey: 'canada-day' });
    }
    return dayFocus(holidayToday);
  }

  // Canada Day build-up runs exactly June 24–30.
  if (parsed.month === 6 && parsed.day >= 24 && parsed.day <= 30) {
    return canadaDayFocus(parsed.day);
  }

  // Christmas magic begins softly on December 1 and grows through the 24th.
  if (parsed.month === 12 && parsed.day >= 1 && parsed.day <= 24) {
    return christmasFocus(parsed.day);
  }

  // New Year's anticipation begins the day after Christmas and grows through
  // December 30. December 31 is handled as its own holiday above.
  if (parsed.month === 12 && parsed.day >= 26 && parsed.day <= 30) {
    return newYearFocus(parsed.day);
  }

  // A gentle seven-day build-up for the remaining listed holidays.
  const nextGeneral = upcoming
    .filter(
      (candidate) =>
        ANTICIPATION_HOLIDAY_IDS.has(candidate.id) &&
        candidate.daysUntil > 0 &&
        candidate.daysUntil <= 7,
    )
    .sort((left, right) => left.daysUntil - right.daysUntil)[0];

  if (nextGeneral) {
    return generalAnticipationFocus(nextGeneral, nextGeneral.daysUntil);
  }

  return null;
}

/**
 * Build the complete calendar context for one validated local date.
 *
 * @param {string} localDateKey
 * @returns {object}
 */
export function getCalendarContext(localDateKey) {
  const parsed = parseCalendarDate(localDateKey) || parseCalendarDate(getServerDateKey());
  const weekdayIndex = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day),
  ).getUTCDay();

  const withDaysUntil = (holiday) => ({
    ...holiday,
    daysUntil: daysBetween(parsed.key, holiday.key),
  });

  const thisYear = getHolidayDates(parsed.year).map(withDaysUntil);
  const nextYear = getHolidayDates(parsed.year + 1).map(withDaysUntil);
  const candidates = [...thisYear, ...nextYear];

  const holiday = thisYear.find((entry) => entry.daysUntil === 0) || null;
  const upcoming = candidates
    .filter(
      (entry) =>
        entry.daysUntil > 0 &&
        entry.daysUntil <= 45 &&
        !SENSITIVE_HOLIDAY_IDS.has(entry.id),
    )
    .sort((left, right) => left.daysUntil - right.daysUntil);

  const focus = getOccasionFocus(parsed, holiday, candidates);

  // Boxing Day begins the New Year's countdown even though it is its own day.
  const secondary =
    holiday?.id === 'boxing-day'
      ? { id: 'new-years-eve', name: HOLIDAYS.newYearsEve.name, daysUntil: 5 }
      : null;

  // The Christmas season reads as winter even before the solstice, which is
  // how Canadians talk about December. The underlying getSeason helper keeps
  // its own astronomical boundaries for every other date.
  const baseSeason = getSeason(parsed.month, parsed.day);
  const season = focus?.poolKey?.startsWith('christmas') ? 'winter' : baseSeason;

  return {
    localDate: parsed.key,
    day: parsed.day,
    monthName: MONTH_NAMES[parsed.month - 1],
    year: parsed.year,
    weekday: WEEKDAY_NAMES[weekdayIndex],
    season,
    holiday: holiday ? { id: holiday.id, name: holiday.name, tone: holiday.tone } : null,
    upcoming: upcoming.map((entry) => ({
      id: entry.id,
      name: entry.name,
      key: entry.key,
      daysUntil: entry.daysUntil,
    })),
    focus,
    secondary,
    tone: focus?.tone || 'ordinary',
  };
}

function formatHolidayDate(key) {
  const parsed = parseCalendarDate(key);
  if (!parsed) return key;
  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
}

function describeUpcoming(upcoming) {
  if (!upcoming.length) return 'none in the next 45 days';
  return upcoming
    .map(
      (holiday) =>
        `${holiday.name} on ${formatHolidayDate(holiday.key)} (${holiday.daysUntil} ${
          holiday.daysUntil === 1 ? 'day' : 'days'
        } away)`,
    )
    .join('; ');
}

function describeFocus(focus, secondary) {
  if (!focus) {
    return 'none — an everyday day. Do not force a holiday or occasion reference.';
  }

  if (focus.id === 'remembrance-day') {
    return 'Remembrance Day — a solemn day of remembrance. Tone: respectful, reflective and quiet. No humour, no celebration, no festive imagery. Recognise this day only; do not build anticipation or extend it beyond today.';
  }

  if (focus.id === 'truth-reconciliation') {
    return 'National Day for Truth and Reconciliation — a day for reflection. Tone: thoughtful and respectful. No humour and no political commentary; encourage listening, learning and sincere reflection.';
  }

  if (focus.id === 'christmas-day' && focus.phase === 'day') {
    return 'Christmas Day — the heart of the season. Tone: warm, magical and celebratory, with gentle inclusive humour and cosy details.';
  }

  if (focus.id === 'boxing-day') {
    const next = secondary ? ` New Year’s anticipation begins today (${secondary.daysUntil} days until New Year’s Eve); let it stay light.` : '';
    return `Boxing Day — a relaxed, warm holiday. Tone: cosy, playful and grateful for leftovers and rest.${next}`;
  }

  if (focus.poolKey === 'christmas-early') {
    return `Christmas build-up — day ${focus.windowDay} of 24 (Christmas Day is ${focus.daysUntil} days away). Stage: subtle. Let a little Christmas magic appear gently; do not turn the reading into a full celebration yet.`;
  }
  if (focus.poolKey === 'christmas-growing') {
    return `Christmas build-up — day ${focus.windowDay} of 24 (Christmas Day is ${focus.daysUntil} days away). Stage: growing. Warm festive details and gentle anticipation can increase, but keep it understated.`;
  }
  if (focus.poolKey === 'christmas-eve') {
    return `Christmas Eve build-up — day ${focus.windowDay} of 24 (Christmas Day is ${focus.daysUntil} ${focus.daysUntil === 1 ? 'day' : 'days'} away). Stage: the magic is at its height. Be festive, warm and excited for tomorrow.`;
  }
  if (focus.poolKey === 'new-year-anticipation') {
    return `New Year’s anticipation — day ${focus.windowDay} of 5 (New Year’s Eve is ${focus.daysUntil} ${focus.daysUntil === 1 ? 'day' : 'days'} away). Stage: looking back with gratitude and forward with hope. Keep the Christmas references fading naturally.`;
  }
  if (focus.id === 'new-years-eve') {
    return 'New Year’s Eve — a distinct end-of-year celebration. Tone: playful countdown energy, gratitude for the year and hopeful anticipation. No guarantees about the year ahead.';
  }
  if (focus.id === 'new-years-day') {
    return 'New Year’s Day — a distinct fresh-start day. Tone: warm, hopeful and gently funny. Encourage one small, kind intention; do not promise a perfect year.';
  }
  if (focus.poolKey === 'canada-day-build-up') {
    return `Canada Day build-up — day ${focus.windowDay} of 7 (Canada Day is ${focus.daysUntil} ${focus.daysUntil === 1 ? 'day' : 'days'} away). Stage: ${focus.stage}. Build Canadian excitement gradually, with playful humour and festive references that grow each day.`;
  }
  if (focus.id === 'canada-day') {
    return 'Canada Day — a full Canadian celebration. Tone: proud, enthusiastic, playful, inclusive and unmistakably Canadian. The spirit is “Canada, baby!” Celebrate warmly without political commentary.';
  }
  if (focus.phase === 'anticipation') {
    return `${focus.name} is ${focus.daysUntil} ${focus.daysUntil === 1 ? 'day' : 'days'} away. Tone: warm anticipation that fits the occasion. Do not force gift talk, sales or promises; keep it natural and inclusive.`;
  }
  return `${focus.name} today. Tone: warm, appropriate to the occasion, inclusive and never mean-spirited.`;
}

/**
 * Human-readable calendar facts given to the model. The model must treat these
 * as the only source of date, weekday, season and occasion truth.
 *
 * @param {object} context
 * @param {string | null} timeZone
 * @param {string | null} localTime
 */
export function describeCalendar(context, timeZone, localTime) {
  const dateLabel = `${context.weekday}, ${context.monthName} ${context.day}, ${context.year}`;
  const timeOfDay = getTimeOfDayFromLocalTime(localTime);

  return [
    'Calendar facts for the visitor’s local day (use these exactly; do not recalculate them):',
    `today is ${dateLabel}.`,
    `Season: ${context.season}.`,
    `Canadian holiday today: ${context.holiday ? context.holiday.name : 'none'}.`,
    `Occasion focus: ${describeFocus(context.focus, context.secondary)}`,
    `Upcoming Canadian occasions: ${describeUpcoming(context.upcoming)}.`,
    timeZone ? `Visitor time zone: ${timeZone}.` : '',
    timeOfDay
      ? `Visitor local time: ${localTime} (${timeOfDay.label}; greeting: “${timeOfDay.greeting}”).`
      : localTime
        ? `Visitor local time: ${localTime}.`
        : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Tone instruction for the system prompt. Respectful and thoughtful days
 * deliberately omit all humour guidance.
 *
 * @param {object | null} context
 */
export function getToneInstruction(context) {
  const focus = context?.focus;

  if (!focus) {
    return 'This is an ordinary day. Do not force a holiday or occasion reference. Make the reading feel fresh, specific to the Canadian season and to everyday life.';
  }

  if (focus.tone === 'respectful') {
    return 'Today is a solemn commemorative occasion. Write with quiet respect, restraint and reflection. Do not use humour, jokes, wordplay, exclamation marks, celebration, fireworks, parties or shopping. Do not treat it as a holiday celebration and do not build anticipation beyond today. Keep the reading sincere, warm and brief.';
  }

  if (focus.tone === 'thoughtful') {
    return 'Today is a thoughtful commemorative occasion. Write with care and respect. Do not use humour or light jokes, and do not make political statements. Encourage reflection, listening and small sincere gestures. Keep it grounded and sincere.';
  }

  if (focus.id === 'christmas-day' && focus.phase === 'day') {
    return 'Today is Christmas Day. Write with full, warm Christmas magic: cosy details, gentle inclusive humour and a sense of belonging. Do not promise gifts or guaranteed good fortune.';
  }

  if (focus.poolKey === 'christmas-early') {
    return 'Christmas is quietly approaching. Use only subtle festive magic today: a small warm detail, a gentle hint of the season. Do not write a full Christmas celebration yet.';
  }

  if (focus.poolKey === 'christmas-growing') {
    return 'Christmas is getting closer. Warm festive details and gentle anticipation can grow, but keep the reading understated and inclusive.';
  }

  if (focus.poolKey === 'christmas-eve') {
    return 'Christmas is almost here. Let the festive magic be at its height: warm, excited and cosy, with gentle humour and no promises of gifts.';
  }

  if (focus.poolKey === 'new-year-anticipation') {
    return 'The year is ending. Look back with gratitude and forward with hope. Keep Christmas references fading naturally and do not promise that the next year will be perfect.';
  }

  if (focus.id === 'new-years-eve') {
    return 'Today is New Year’s Eve. Write with playful countdown energy, gratitude for the year and hopeful anticipation. No guarantees, no pressure and no political commentary.';
  }

  if (focus.id === 'new-years-day') {
    return 'Today is New Year’s Day. Write with fresh-start warmth and gentle optimism. Encourage one small, kind intention. Do not promise a perfect year or guaranteed success.';
  }

  if (focus.poolKey === 'canada-day-build-up') {
    return `Canada Day is ${focus.daysUntil} ${focus.daysUntil === 1 ? 'day' : 'days'} away (build-up day ${focus.windowDay} of 7). Build Canadian excitement gradually and playfully, matching the stated stage. Keep the humour warm and inclusive; do not force the full celebration before July 1.`;
  }

  if (focus.id === 'canada-day') {
    return 'Today is Canada Day. Bring full Canadian celebration: proud, playful, inclusive and unmistakably Canadian. The spirit is “Canada, baby!” Use gentle Canadian humour and festive references without political commentary.';
  }

  if (focus.phase === 'anticipation') {
    return `${focus.name} is ${focus.daysUntil} ${focus.daysUntil === 1 ? 'day' : 'days'} away. Build warm, natural anticipation appropriate to the occasion. Do not force gift talk, sales or promises, and keep the reading inclusive of people who do not celebrate.`;
  }

  return `Today is ${focus.name}. Match the occasion with warmth, inclusive humour and no mean-spirited jokes.`;
}

/**
 * Which curated fallback pool fits this context. Used when the AI provider is
 * unavailable so the fallback still respects the occasion and tone.
 *
 * @param {object | null} context
 */
export function getOccasionPoolKey(context) {
  return context?.focus?.poolKey || null;
}
