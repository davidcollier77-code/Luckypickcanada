/**
 * Shared constants for the Daily Resonance (Lucky Meter) experience.
 *
 * Everything here is data, not presentation: selection, storage validation and
 * the cinematic stage all read the same definitions so a stored result can be
 * re-rendered exactly as it was first revealed.
 */

/** Versioned Local Storage key. No result is ever sent to a server. */
export const METER_STORAGE_KEY = 'lucky-pick-canada-lucky-meter-v1';
export const METER_STORAGE_VERSION = 1;

/** A daily result must never be 0%, and the tier definitions begin at 5. */
export const PERCENTAGE_MIN = 5;
export const PERCENTAGE_MAX = 100;

/** How many previous values are remembered and avoided. */
export const HISTORY_LIMITS = {
  percentages: 3,
  events: 6,
  sparks: 8,
};

/**
 * Tier definitions. The percentage alone decides the tier, and the tier alone
 * decides the reveal event and its number set. Nothing else chooses a tier or
 * an event, so the dial's stopping position, the displayed percentage, the
 * event and the numbers can never disagree.
 *
 * The boundaries are exact: 5–30 Low (Meteor Shower), 31–65 Medium (Cosmic
 * Lightning) and 66–100 High (Fireworks).
 *
 * Lucky Numbers belong to the tier, never to the visual event. The three
 * approved triplets are preserved exactly as first specified (3/9/21,
 * 11/22/33, 7/8/77). They are keyed to Low, Medium and High in the order the
 * specification recorded them, and are never randomised, never 13 and never
 * duplicated.
 */
export const TIERS = [
  {
    id: 'low',
    label: 'Low Resonance',
    min: PERCENTAGE_MIN,
    max: 30,
    message: "You're riding a little low today, but you're still okay!",
    eventId: 'meteor',
    numbers: [3, 9, 21],
  },
  {
    id: 'medium',
    label: 'Medium Resonance',
    min: 31,
    max: 65,
    message: 'Your luck is in the mid-range today.',
    eventId: 'lightning',
    numbers: [11, 22, 33],
  },
  {
    id: 'high',
    label: 'High Resonance',
    min: 66,
    max: PERCENTAGE_MAX,
    message: "Your luck is running high today!",
    eventId: 'fireworks',
    numbers: [7, 8, 77],
  },
];

export const TIERS_BY_ID = new Map(TIERS.map((tier) => [tier.id, tier]));

/**
 * Event presentation and timing. Events carry no selection weight and no
 * numbers: the percentage-derived tier owns both the event and the numbers.
 */
export const EVENTS = [
  {
    id: 'meteor',
    name: 'Meteor Shower',
    minDurationMs: 8500,
    maxDurationMs: 9500,
    accent: '#a8dcff',
  },
  {
    id: 'lightning',
    name: 'Cosmic Lightning',
    minDurationMs: 9500,
    maxDurationMs: 10500,
    accent: '#c9d8ff',
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    minDurationMs: 11000,
    maxDurationMs: 12000,
    accent: '#ffcf7a',
  },
];

export const EVENTS_BY_ID = new Map(EVENTS.map((event) => [event.id, event]));

/** Colours are chosen with equal probability; each has an exact display name and swatch. */
export const COLOURS = [
  { id: 'maple-red', name: 'Maple Red', hex: '#B52B32' },
  { id: 'forest-green', name: 'Forest Green', hex: '#28543C' },
  { id: 'navy-blue', name: 'Navy Blue', hex: '#23395B' },
  { id: 'burgundy', name: 'Burgundy', hex: '#722F3E' },
  { id: 'royal-blue', name: 'Royal Blue', hex: '#2855A6' },
  { id: 'charcoal', name: 'Charcoal', hex: '#45484D' },
  { id: 'cream', name: 'Cream', hex: '#F1E8D5', light: true },
  { id: 'mustard-gold', name: 'Mustard Gold', hex: '#C49A35' },
  { id: 'winter-white', name: 'Winter White', hex: '#F7F5EF', light: true },
  { id: 'deep-teal', name: 'Deep Teal', hex: '#28666B' },
  { id: 'pumpkin-orange', name: 'Pumpkin Orange', hex: '#C96A25' },
  { id: 'warm-camel', name: 'Warm Camel', hex: '#B68A5A' },
];

export const COLOURS_BY_ID = new Map(COLOURS.map((colour) => [colour.id, colour]));

/** The tier's fixed numbers, copied so a consumer can never mutate the definition. */
export function getTierNumbers(tierId) {
  const tier = TIERS_BY_ID.get(tierId);
  return tier ? [...tier.numbers] : [];
}

/** Shown wherever Lucky Numbers appear. */
export const LUCKY_NUMBERS_LABEL = 'Your Lucky Numbers';
export const ENTERTAINMENT_DISCLAIMER =
  'For entertainment only — not lottery predictions or promises of winning.';

export const SHARE_URL = 'https://luckypickcanada.ca/lucky-meter';
export const SHARE_TITLE = 'My Daily Resonance';
