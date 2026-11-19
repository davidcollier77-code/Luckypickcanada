/**
 * Sparks & Seasonal Colours — the Lucky Meter's one content configuration.
 *
 * This file is deliberately plain data plus pure date helpers:
 *
 *   - The thirty Little Sparks live here beside the four Canadian seasonal
 *     palettes, so the daily note and the colour choices have a single home.
 *   - Every season has exactly twelve named colours with an exact HEX value and
 *     a subtle painted finish. The finish supplies the grain and sheen that the
 *     wheel, the colour pour and the result card all read, so one colour looks
 *     identical everywhere it appears.
 *   - Season boundaries are local-calendar data. Winter owns December through
 *     February, spring March through May, summer June through August and autumn
 *     September through November. The winter end date is 29 February, which is
 *     inclusive in a leap year and unreachable in a common year, so a 29
 *     February always resolves to winter without a special case.
 *
 * Nothing here selects a value. `selection.js` draws uniformly from the active
 * season's twelve colours, and the wheel, pour and card only display the stored
 * record.
 */

/* ── Little Sparks ─────────────────────────────────────────────────────────
   Short, positive motivation. They are not fortunes, predictions or promises,
   and they never replace the Crystal Ball's fortune experience. */

export const LITTLE_SPARKS = [
  { id: 'spark-01', message: 'Even a small step forward can change the direction of your day.' },
  { id: 'spark-02', message: 'You do not have to rush to make real progress.' },
  { id: 'spark-03', message: 'A kind word costs little and can travel a long way.' },
  { id: 'spark-04', message: 'Rest is part of the work, not a break from it.' },
  { id: 'spark-05', message: 'The effort you made yesterday still counts today.' },
  { id: 'spark-06', message: 'Your pace is your own, and it is allowed to change.' },
  { id: 'spark-07', message: 'Begin before you feel ready; clarity often arrives while you move.' },
  { id: 'spark-08', message: 'You can be proud of a quiet, unglamorous kind of progress.' },
  { id: 'spark-09', message: 'One honest conversation can clear more space than a week of worrying.' },
  { id: 'spark-10', message: 'Keep the promise you made to yourself, even a small one.' },
  { id: 'spark-11', message: 'You are allowed to ask for help before you are exhausted.' },
  { id: 'spark-12', message: 'A difficult morning does not decide the whole day.' },
  { id: 'spark-13', message: 'Notice what is working, not only what is unfinished.' },
  { id: 'spark-14', message: 'You can choose a smaller goal and still finish strong.' },
  { id: 'spark-15', message: 'The person beside you may be carrying something invisible; go gently.' },
  { id: 'spark-16', message: 'Your attention is a gift; spend a little of it on something you love.' },
  { id: 'spark-17', message: 'Slow work still builds something real.' },
  { id: 'spark-18', message: 'You have handled hard days before, and you learned something each time.' },
  { id: 'spark-19', message: 'Leave a little room in your plan for something good.' },
  { id: 'spark-20', message: 'Doing your best today may look different from yesterday, and that is fine.' },
  { id: 'spark-21', message: 'A fresh start does not need a new year; it can start after lunch.' },
  { id: 'spark-22', message: 'Make the next choice simple, then make it.' },
  { id: 'spark-23', message: 'Say the appreciative thing out loud while the moment is here.' },
  { id: 'spark-24', message: 'You are more than the list of things you did not finish.' },
  { id: 'spark-25', message: 'Small, consistent care adds up to something you can stand on.' },
  { id: 'spark-26', message: 'Give yourself the same patience you offer a friend.' },
  { id: 'spark-27', message: 'If today feels heavy, carry only what today actually needs.' },
  { id: 'spark-28', message: 'Curiosity is a practical tool; let it lead you past the first obstacle.' },
  { id: 'spark-29', message: 'The work you do quietly still shapes the person you are becoming.' },
  { id: 'spark-30', message: 'End the day by naming one thing you are glad you tried.' },
];

export const SPARKS_BY_ID = new Map(LITTLE_SPARKS.map((spark) => [spark.id, spark]));

/* ── Painted finishes ──────────────────────────────────────────────────────
   These are the subtle textures shared by every surface that paints a colour.
   `grain` is the strength of the fine pigment noise, `sheen` the soft satin
   highlight and `highlight` the small specular bloom on the raised bevel.
   Values are fractions, not colours. */

export const COLOUR_FINISHES = Object.freeze({
  matte: Object.freeze({ grain: 0.16, sheen: 0.12, highlight: 0.16 }),
  satin: Object.freeze({ grain: 0.1, sheen: 0.3, highlight: 0.26 }),
  gloss: Object.freeze({ grain: 0.06, sheen: 0.48, highlight: 0.4 }),
  frost: Object.freeze({ grain: 0.2, sheen: 0.4, highlight: 0.34 }),
  petal: Object.freeze({ grain: 0.12, sheen: 0.22, highlight: 0.3 }),
});

/**
 * Builds one palette entry. The texture record is copied from the finish so a
 * stored result carries everything needed to repaint it, even after a palette
 * change in a later season.
 */
function colour(id, name, hex, finish, { light = false } = {}) {
  const texture = COLOUR_FINISHES[finish];
  if (!texture) throw new Error(`Unknown Lucky Colour finish: ${finish}`);
  return Object.freeze({
    id,
    name,
    hex,
    light,
    texture: Object.freeze({ finish, ...texture }),
  });
}

/* ── The four Canadian palettes ────────────────────────────────────────────
   Twelve named colours each. The autumn values are the owner's exact list and
   must not be adjusted. */

const SPRING_COLOURS = Object.freeze([
  colour('spring-cherry-blossom', 'Cherry Blossom', '#E9A6B8', 'petal', { light: true }),
  colour('spring-blossom-blush', 'Blossom Blush', '#D4809A', 'petal'),
  colour('spring-tulip-rose', 'Tulip Rose', '#C25C79', 'satin'),
  colour('spring-lilac-haze', 'Lilac Haze', '#B7A4D6', 'petal', { light: true }),
  colour('spring-crocus-violet', 'Crocus Violet', '#8266A8', 'satin'),
  colour('spring-fresh-foliage', 'Fresh Foliage', '#86AE63', 'satin'),
  colour('spring-leaf', 'Spring Leaf', '#5C8C4A', 'matte'),
  colour('spring-thaw-birch', 'Thaw Birch', '#D8C9A6', 'matte', { light: true }),
  colour('spring-maple-sap', 'Maple Sap', '#C39352', 'gloss'),
  colour('spring-sky', 'Spring Sky', '#93BCE0', 'satin', { light: true }),
  colour('spring-april-rain', 'April Rain', '#7B8FA4', 'matte'),
  colour('spring-thawwater', 'Thawwater', '#6BA3B2', 'gloss'),
]);

const SUMMER_COLOURS = Object.freeze([
  colour('summer-lake-huron', 'Lake Huron', '#2E6F8E', 'gloss'),
  colour('summer-georgian-teal', 'Georgian Teal', '#2F8A8C', 'gloss'),
  colour('summer-wildflower-gold', 'Wildflower Gold', '#E0B23C', 'satin'),
  colour('summer-prairie-sunflower', 'Prairie Sunflower', '#D6A11F', 'gloss'),
  colour('summer-lupine-violet', 'Lupine Violet', '#6C58A4', 'satin'),
  colour('summer-fireweed-rose', 'Fireweed Rose', '#C2547E', 'petal'),
  colour('summer-boreal-pine', 'Boreal Pine', '#2D583C', 'matte'),
  colour('summer-cedar-grove', 'Cedar Grove', '#4A6A3A', 'matte'),
  colour('summer-okanagan-peach', 'Okanagan Peach', '#E29A6B', 'petal'),
  colour('summer-sunset-coral', 'Sunset Coral', '#D96B4E', 'gloss'),
  colour('summer-pacific-sand', 'Pacific Sand', '#C9B18A', 'matte', { light: true }),
  colour('summer-rocky-shore', 'Rocky Shore', '#6B7078', 'matte'),
]);

const AUTUMN_COLOURS = Object.freeze([
  colour('maple-red', 'Maple Red', '#A83232', 'gloss'),
  colour('burnt-orange', 'Burnt Orange', '#C45A24', 'satin'),
  colour('pumpkin', 'Pumpkin', '#D87925', 'satin'),
  colour('goldenrod', 'Goldenrod', '#C99A24', 'gloss'),
  colour('mustard-gold', 'Mustard Gold', '#B58A32', 'satin'),
  colour('copper', 'Copper', '#A65E3B', 'gloss'),
  colour('burgundy', 'Burgundy', '#702D3D', 'satin'),
  colour('rust', 'Rust', '#A34B32', 'matte'),
  colour('forest-green', 'Forest Green', '#405B42', 'matte'),
  colour('deep-teal', 'Deep Teal', '#32666A', 'gloss'),
  colour('denim-blue', 'Denim Blue', '#426789', 'matte'),
  colour('warm-camel', 'Warm Camel', '#B58A65', 'satin'),
]);

const WINTER_COLOURS = Object.freeze([
  colour('winter-snowfall', 'Snowfall', '#F4F7FA', 'frost', { light: true }),
  colour('winter-glacier-white', 'Glacier White', '#E6EEF3', 'frost', { light: true }),
  colour('winter-frost-blue', 'Frost Blue', '#BFD8E8', 'frost', { light: true }),
  colour('winter-ice-blue', 'Ice Blue', '#8FBFD9', 'gloss'),
  colour('winter-northern-sky', 'Northern Sky', '#3B5C8A', 'satin'),
  colour('winter-aurora-green', 'Aurora Green', '#4E9E7E', 'gloss'),
  colour('winter-aurora-violet', 'Aurora Violet', '#6D5BA8', 'gloss'),
  colour('winter-evergreen', 'Evergreen', '#2C4A3B', 'matte'),
  colour('winter-pine-shadow', 'Pine Shadow', '#233A30', 'matte'),
  colour('winter-berry', 'Winter Berry', '#9E2F3D', 'gloss'),
  colour('winter-cranberry', 'Cranberry', '#7E2836', 'satin'),
  colour('winter-wool-red', 'Wool Red', '#B4463F', 'matte'),
]);

/** The four seasons, their local date spans and their complete palettes. */
export const SEASONS = Object.freeze([
  Object.freeze({
    key: 'winter',
    name: 'Winter',
    label: 'Dec 1 – Feb 28/29',
    accent: '#8FBFD9',
    startMonth: 12,
    startDay: 1,
    endMonth: 2,
    endDay: 29,
    colours: WINTER_COLOURS,
  }),
  Object.freeze({
    key: 'spring',
    name: 'Spring',
    label: 'Mar 1 – May 31',
    accent: '#86AE63',
    startMonth: 3,
    startDay: 1,
    endMonth: 5,
    endDay: 31,
    colours: SPRING_COLOURS,
  }),
  Object.freeze({
    key: 'summer',
    name: 'Summer',
    label: 'Jun 1 – Aug 31',
    accent: '#E0B23C',
    startMonth: 6,
    startDay: 1,
    endMonth: 8,
    endDay: 31,
    colours: SUMMER_COLOURS,
  }),
  Object.freeze({
    key: 'autumn',
    name: 'Autumn',
    label: 'Sep 1 – Nov 30',
    accent: '#C45A24',
    startMonth: 9,
    startDay: 1,
    endMonth: 11,
    endDay: 30,
    colours: AUTUMN_COLOURS,
  }),
]);

export const SEASONS_BY_KEY = new Map(SEASONS.map((season) => [season.key, season]));

/** Configurable browser-local dates, keyed by season. */
export const SEASON_DATE_RANGES = Object.freeze(
  Object.fromEntries(
    SEASONS.map((season) => [
      season.key,
      Object.freeze({
        startMonth: season.startMonth,
        startDay: season.startDay,
        endMonth: season.endMonth,
        endDay: season.endDay,
        label: season.label,
      }),
    ]),
  ),
);

/** Every colour from every season, in season order. */
export const ALL_COLOURS = Object.freeze(SEASONS.flatMap((season) => season.colours));

export const COLOURS_BY_ID = new Map(ALL_COLOURS.map((entry) => [entry.id, entry]));

/**
 * Colour ids that may still exist in a visitor's saved result from the fixed
 * pre-seasonal palette. They are preserved, never re-drawn, so a saved reading
 * survives the palette change.
 */
export const LEGACY_COLOUR_IDS = Object.freeze([
  'navy-blue',
  'royal-blue',
  'charcoal',
  'cream',
  'winter-white',
  'pumpkin-orange',
]);

const LEGACY_COLOUR_ID_SET = new Set(LEGACY_COLOUR_IDS);

/** True for any seasonal or preserved legacy colour id. */
export function isKnownColourId(id) {
  return typeof id === 'string' && (COLOURS_BY_ID.has(id) || LEGACY_COLOUR_ID_SET.has(id));
}

function ordinal(month, day) {
  return month * 100 + day;
}

function withinRange(month, day, range) {
  const value = ordinal(month, day);
  const start = ordinal(range.startMonth, range.startDay);
  const end = ordinal(range.endMonth, range.endDay);
  // A range such as December–February wraps across the year boundary.
  return start <= end ? value >= start && value <= end : value >= start || value <= end;
}

/**
 * Resolves the season key for a local calendar date.
 *
 * The date is read with its local getters, never UTC, so the palette changes at
 * the visitor's own midnight. A 29 February is inside winter because winter's
 * configured end is 29 February.
 *
 * @param {Date} date
 * @param {Record<string, {startMonth:number,startDay:number,endMonth:number,endDay:number}>} [ranges]
 * @returns {string | null}
 */
export function getSeasonKeyForDate(date, ranges = SEASON_DATE_RANGES) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  for (const season of SEASONS) {
    const range = ranges?.[season.key];
    if (!range) continue;
    if (withinRange(month, day, range)) return season.key;
  }
  return null;
}

/**
 * Resolves the complete season record for a local date.
 *
 * @param {Date} date
 * @param {Record<string, object>} [ranges]
 * @returns {object | null}
 */
export function getSeasonForDate(date, ranges = SEASON_DATE_RANGES) {
  const key = getSeasonKeyForDate(date, ranges);
  return key ? SEASONS_BY_KEY.get(key) || null : null;
}

/** The twelve colours for a season key; empty for an unknown key. */
export function getPaletteForSeasonKey(key) {
  const season = SEASONS_BY_KEY.get(key);
  return season ? season.colours : [];
}

/** The twelve colours active on a local date. */
export function getPaletteForDate(date = new Date()) {
  const season = getSeasonForDate(date);
  return season ? season.colours : [];
}

/**
 * Parses a local `YYYY-MM-DD` date key at midday, which keeps a DST change from
 * moving the resolved calendar day. Returns null for malformed input.
 *
 * @param {string} dateKey
 * @returns {Date | null}
 */
export function dateFromLocalKey(dateKey) {
  if (typeof dateKey !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** The season record for a local date key, or null when the key is invalid. */
export function getSeasonForDateKey(dateKey) {
  const date = dateFromLocalKey(dateKey);
  return date ? getSeasonForDate(date) : null;
}
