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

/**
 * Each independent choice remembers exactly one previous value: the value in
 * the most recent saved result. Anything older is eligible again the next day.
 */
export const HISTORY_LIMITS = {
  percentages: 1,
  numbers: 1,
  colours: 1,
  sparks: 1,
};

/** The Lucky Number is drawn uniformly from this inclusive range. */
export const LUCKY_NUMBER_MIN = 1;
export const LUCKY_NUMBER_MAX = 50;

/**
 * Tier definitions. The percentage alone decides the tier, and the tier alone
 * decides the reveal event. Nothing else chooses a tier or an event, so the
 * dial's stopping position, the displayed percentage and the event can never
 * disagree.
 *
 * The boundaries are exact: 5–30 Low (Meteor Shower), 31–65 Medium (Cosmic
 * Lightning) and 66–100 High (Fireworks). Different percentages inside the same
 * tier are valid, so the same event may run on consecutive days.
 *
 * Tiers carry no numbers: the Lucky Number is an independent 1–50 draw and is
 * never derived from the percentage or the tier.
 */
export const TIERS = [
  {
    id: 'low',
    label: 'Low Resonance',
    min: PERCENTAGE_MIN,
    max: 30,
    message: "You're riding a little low today, but you're still okay!",
    eventId: 'meteor',
  },
  {
    id: 'medium',
    label: 'Medium Resonance',
    min: 31,
    max: 65,
    message: 'Your luck is in the mid-range today.',
    eventId: 'lightning',
  },
  {
    id: 'high',
    label: 'High Resonance',
    min: 66,
    max: PERCENTAGE_MAX,
    message: "Your luck is running high today!",
    eventId: 'fireworks',
  },
];

export const TIERS_BY_ID = new Map(TIERS.map((tier) => [tier.id, tier]));

/**
 * Event presentation and timing. Events carry no selection weight and no
 * numbers: the percentage-derived tier owns the event.
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

/**
 * Colour data lives beside the Little Sparks and the season dates in the one
 * "Sparks & Seasonal Colours" configuration. Selection, the wheel, the colour
 * pour and the result card all read the same stored record.
 */
export { ALL_COLOURS, COLOURS_BY_ID, isKnownColourId } from './sparks-and-seasonal-colours';

/** The fixed pointer position at the bottom of the wheel. */
export const COLOUR_WHEEL_SEGMENTS = 12;

/** Shown wherever the single daily Lucky Number appears. */
export const LUCKY_NUMBER_LABEL = 'Lucky Number';
/** Shown wherever the independently selected Lucky Colour appears. */
export const LUCKY_COLOUR_LABEL = 'Lucky Colour';
export const ENTERTAINMENT_DISCLAIMER =
  'For entertainment only — not lottery predictions or promises of winning.';

export const SHARE_URL = 'https://luckypickcanada.ca/lucky-meter';
export const SHARE_TITLE = 'My Daily Resonance';
