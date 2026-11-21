/**
 * The Lucky Meter's approved twelve-stage cinematic storyboard.
 *
 * Every stage length lives here so the component, the copy animator, the audio
 * cues and the tests all read one source. The approved sequence is:
 *
 *   1. anticipation      the sky listens, the readout waits at 0
 *   2. generation        five beats: 0 → 100 → fall → rise → erratic → result
 *   3. landing           the wheel and the readout stop on the same frame
 *   4. colourSelect      the seasonal colour selection settles under the pointer
 *   5. vesselOpen        the cylindrical vessel opens with visible depth
 *   6. pour              the colour fills the vessel, then holds full
 *   7. numberReveal      the drain reveals the Lucky Number from the top down,
 *                        then the empty vessel is highlighted
 *   8. message           the tier line is written above the meter
 *   9. celebration       one 12,000 ms cinematic for every tier
 *  10. spark             the maple-leaf cursor writes the Little Spark
 *  11. hold              the finished scene is held so it can be taken in
 *  12. dock              Home and the countdown arrive together
 *
 * Before Start, the resting pile holds, the breeze carries the leaves away and
 * only then does Start appear. Those pre-Start values are here too so the
 * arrival and the button share the same clock.
 *
 * The overall run is emergent: it is the sum of these beats (roughly 54–57
 * seconds from first paint to the dock). No stage is shortened or stretched to
 * force an identical clock.
 */

export const STORYBOARD_TIMING = Object.freeze({
  /** Stages 1–2: the pile of leaves rests long enough to register as an object. */
  leafHoldMs: 2400,
  /** Stage 2: the gust lifts the pile and carries every leaf out of frame. */
  leafBreezeMs: 2100,
  /** A short quiet beat after the last leaf before Start appears. */
  startDelayMs: 800,

  /** Stage 1: a held breath after Start, before anything moves. */
  anticipationMs: 1200,
  /**
   * Stage 2: the five-beat percentage generation. 0 → 100 → fall → rise →
   * erratic → settle on the stored 5–100 reading. The wheel turns on the same
   * clock and stops on the same frame.
   */
  generationMs: 5600,

  /** Stage 3: the stopped wheel and the reading rest, plaque-free, in the well. */
  landingMs: 600,
  /** Stage 4: the landing beat plus the seasonal colour selection unfolding. */
  settlePauseMs: 1800,
  /** Stage 5: the cylindrical vessel opens from a shallow plate. */
  segmentOpenMs: 1400,
  /** Stage 6: the colour drains from the segment and fills the vessel. */
  fillMs: 5000,
  /** Stage 6: the full vessel is held before the drain begins. */
  fullHoldMs: 700,
  /**
   * Stage 7: the vessel drains through this window while the Lucky Number is
   * revealed progressively from the top down. The number is fully visible on
   * the first frame of the empty vessel.
   */
  drainMs: 4000,
  /** Stage 7: the empty vessel is highlighted and the number flashes. */
  highlightMs: 1600,
  /** One flash of the revealed Lucky Number. */
  numberFlashMs: 420,
  numberFlashCount: 2,

  /** Stage 8: lead-in before the tier message starts writing. */
  messageDelayMs: 800,
  /** Stage 8: one character at a time. */
  messageCharMs: 34,
  /** Stage 8: the longer beat after punctuation in the faster tier line. */
  messagePunctuationPauseMs: 240,
  /** Stage 8: the finished sentence stays readable. */
  messageHoldMs: 3000,
  /** Stage 8: and fades away before the celebration. */
  messageFadeMs: 800,

  /** Stage 9: a last breath between the message and the cinematic. */
  eventDelayMs: 900,
  /**
   * Stage 9: every tier celebrates for the same 12,000 ms. A celebration
   * restarted after a page refresh uses this full length again; an older stored
   * duration never re-times it.
   */
  celebrationMs: 12000,

  /** Stage 10: the sky is still after the celebration. */
  sparkStartDelayMs: 1300,
  /** Stage 10: the maple-leaf cursor writes one character at a time. */
  sparkMsPerCharacter: 32,
  sparkPunctuationPauseMs: 240,
  /** Stage 10: every Spark takes 3,800–5,200 ms to write. */
  sparkMinMs: 3800,
  sparkMaxMs: 5200,

  /**
   * Stage 11 plus the dock settle: the completed scene is held first, and both
   * controls arrive together at the end of this window. The gap between
   * `finalHoldMs` and this value is the dock's own approach, so the stage list
   * leaves it unrepresented on purpose instead of stretching the hold over it.
   */
  dockDelayMs: 3600,
  /** The part of the dock window that is pure hold: `hold` ends here. */
  finalHoldMs: 2800,

  /** The landing flash on the percentage. */
  flashMs: 700,
  flashCount: 2,
});

/** Milliseconds from first paint until Start can appear without the arrival canvas. */
export const ARRIVAL_TOTAL_MS =
  STORYBOARD_TIMING.leafHoldMs +
  STORYBOARD_TIMING.leafBreezeMs +
  STORYBOARD_TIMING.startDelayMs;

/** The one celebration length used by every tier, including a refresh restart. */
export const CELEBRATION_MS = STORYBOARD_TIMING.celebrationMs;

/**
 * Milliseconds from Start until the percentage and the wheel stop. Both use the
 * same final frame, so they can never disagree.
 */
export const REVEAL_MOTION_MS =
  STORYBOARD_TIMING.anticipationMs + STORYBOARD_TIMING.generationMs;

/**
 * Milliseconds from Start until the colour selection has finished unfolding.
 *
 * `settlePauseMs` is split: `landingMs` completes the wheel's arrival and the
 * remainder is the colour selection itself. Anyone deriving that beat must
 * subtract `COLOUR_SELECT_START_MS`, not `REVEAL_MOTION_MS`, from this value.
 */
export const COLOUR_SELECT_END_MS = REVEAL_MOTION_MS + STORYBOARD_TIMING.settlePauseMs;

/** Milliseconds from Start until the colour selection begins after the landing. */
export const COLOUR_SELECT_START_MS = REVEAL_MOTION_MS + STORYBOARD_TIMING.landingMs;

/** Milliseconds from Start until the vessel has finished opening. */
export const VESSEL_OPEN_END_MS = COLOUR_SELECT_END_MS + STORYBOARD_TIMING.segmentOpenMs;

/** Milliseconds from Start until the vessel is full. */
export const FILL_END_MS = VESSEL_OPEN_END_MS + STORYBOARD_TIMING.fillMs;

/** Milliseconds from Start until the full vessel has been held. */
export const FULL_HOLD_END_MS = FILL_END_MS + STORYBOARD_TIMING.fullHoldMs;

/** Milliseconds from Start until the vessel is empty and the number is whole. */
export const DRAIN_END_MS = FULL_HOLD_END_MS + STORYBOARD_TIMING.drainMs;

/** Milliseconds from Start until the empty highlight ends and the message starts. */
export const REVEAL_COMPLETE_MS = DRAIN_END_MS + STORYBOARD_TIMING.highlightMs;

/** Characters that earn a longer pause while writing. */
const PUNCTUATION = /[.,!?:;—–]/;

/** A punctuation mark weighs this much more than a normal character. */
const PUNCTUATION_WEIGHT = 1.6;

function characterWeights(message) {
  const characters = message ? Array.from(message) : [];
  return characters.map((character) => (PUNCTUATION.test(character) ? PUNCTUATION_WEIGHT : 1));
}

/**
 * The time the message needs to be typed, excluding its lead-in, hold and fade.
 *
 * @param {string} message
 * @returns {number} Milliseconds.
 */
export function getMessageTypingMs(message) {
  const characters = message ? Array.from(message) : [];
  if (characters.length === 0) return 0;
  let total = 0;
  for (const character of characters) {
    total += PUNCTUATION.test(character)
      ? STORYBOARD_TIMING.messagePunctuationPauseMs
      : STORYBOARD_TIMING.messageCharMs;
  }
  return total;
}

/**
 * The full time the message owns, including its lead-in, writing, hold and fade.
 *
 * @param {string} message
 * @returns {number}
 */
export function getMessageTotalMs(message) {
  return (
    STORYBOARD_TIMING.messageDelayMs +
    getMessageTypingMs(message) +
    STORYBOARD_TIMING.messageHoldMs +
    STORYBOARD_TIMING.messageFadeMs
  );
}

/**
 * The time the Little Spark needs to be written by the maple-leaf cursor.
 *
 * Every Spark is written inside the approved 3,800–5,200 ms window. The raw
 * character clock is the starting point, and a short or long message is scaled
 * into that window rather than being allowed to rush or drag.
 *
 * @param {string} message
 * @returns {number}
 */
export function getSparkWritingMs(message) {
  const weights = characterWeights(message);
  if (weights.length === 0) return 0;
  const raw = weights.reduce((total, weight) => total + weight, 0) * STORYBOARD_TIMING.sparkMsPerCharacter;
  return Math.round(
    Math.max(STORYBOARD_TIMING.sparkMinMs, Math.min(STORYBOARD_TIMING.sparkMaxMs, raw)),
  );
}

/**
 * The cumulative time at which each character of the Spark has been written.
 *
 * The last value is always `getSparkWritingMs(message)`, so the writer, the
 * storyboard and the tests share one schedule. Punctuation keeps its slightly
 * heavier beat by weighting the distribution instead of adding unbounded time.
 *
 * @param {string} message
 * @returns {number[]} One cumulative millisecond value per character.
 */
export function getSparkCharacterScheduleMs(message) {
  const weights = characterWeights(message);
  if (weights.length === 0) return [];
  const duration = getSparkWritingMs(message);
  const weightSum = weights.reduce((total, weight) => total + weight, 0);
  // Degenerate weights must never collapse the schedule. An empty schedule
  // makes the writer fall back to its 16 ms floor for every character, which
  // would break the approved 3,800–5,200 ms window, so pace the Spark
  // uniformly while still returning one timestamp per character.
  const useUniform = !Number.isFinite(weightSum) || weightSum <= 0;
  const totalWeight = useUniform ? weights.length : weightSum;
  let cumulative = 0;
  return weights.map((weight) => {
    cumulative += useUniform ? 1 : weight;
    return Math.round((cumulative / totalWeight) * duration);
  });
}

/**
 * Milliseconds from Start until the tier celebration begins.
 *
 * @param {string} message The tier message that is written first.
 * @returns {number}
 */
export function getEventStartMs(message) {
  return REVEAL_COMPLETE_MS + getMessageTotalMs(message) + STORYBOARD_TIMING.eventDelayMs;
}

/**
 * Milliseconds from Start until the celebration's final frame.
 *
 * @param {string} message
 * @param {number} eventDurationMs
 * @returns {number}
 */
export function getCelebrationEndMs(message, eventDurationMs) {
  return getEventStartMs(message) + Math.max(0, Number(eventDurationMs) || 0);
}

/**
 * Milliseconds from Start until the Little Spark has finished writing.
 *
 * @param {string} tierMessage
 * @param {number} eventDurationMs
 * @param {string} sparkMessage
 * @returns {number}
 */
export function getSparkEndMs(tierMessage, eventDurationMs, sparkMessage) {
  return (
    getCelebrationEndMs(tierMessage, eventDurationMs) +
    STORYBOARD_TIMING.sparkStartDelayMs +
    getSparkWritingMs(sparkMessage)
  );
}

/**
 * Milliseconds from Start until Home and the countdown arrive together.
 *
 * The window includes the final hold, so the finished scene is never cut short
 * by a control appearing.
 */
export function getDockMs(tierMessage, eventDurationMs, sparkMessage) {
  return getSparkEndMs(tierMessage, eventDurationMs, sparkMessage) + STORYBOARD_TIMING.dockDelayMs;
}

/**
 * Full experience length from first paint to the dock, including the arrival.
 * This is the emergent total; it is not used to time any stage.
 *
 * @param {string} tierMessage
 * @param {number} eventDurationMs
 * @param {string} sparkMessage
 * @returns {number}
 */
export function getExperienceTotalMs(tierMessage, eventDurationMs, sparkMessage) {
  return ARRIVAL_TOTAL_MS + getDockMs(tierMessage, eventDurationMs, sparkMessage);
}

/**
 * Builds the ordered stage list for one complete run. Used by the tests and as
 * documentation of the exact hand-off order; the component schedules the same
 * values so a stage can never start before the previous one has finished.
 *
 * @param {{ tierMessage: string, eventDurationMs: number, sparkMessage: string }} run
 * @returns {Array<{ id: string, startMs: number, endMs: number, durationMs: number, streamEndMs?: number }>}
 */
export function buildStoryboard({ tierMessage, eventDurationMs, sparkMessage }) {
  const eventStart = getEventStartMs(tierMessage);
  const eventDuration = Math.max(0, Number(eventDurationMs) || 0);
  const eventEnd = eventStart + eventDuration;
  const sparkStart = eventEnd + STORYBOARD_TIMING.sparkStartDelayMs;
  const sparkDuration = getSparkWritingMs(sparkMessage);
  const sparkEnd = sparkStart + sparkDuration;
  const dockStart = sparkEnd + STORYBOARD_TIMING.dockDelayMs;
  const holdEnd = sparkEnd + STORYBOARD_TIMING.finalHoldMs;
  const messageStart = REVEAL_COMPLETE_MS;

  return [
    { id: 'anticipation', startMs: 0, endMs: STORYBOARD_TIMING.anticipationMs },
    {
      id: 'generation',
      startMs: STORYBOARD_TIMING.anticipationMs,
      endMs: REVEAL_MOTION_MS,
    },
    {
      id: 'landing',
      startMs: REVEAL_MOTION_MS,
      endMs: REVEAL_MOTION_MS + STORYBOARD_TIMING.landingMs,
    },
    {
      id: 'colourSelect',
      startMs: COLOUR_SELECT_START_MS,
      endMs: COLOUR_SELECT_END_MS,
    },
    {
      id: 'vesselOpen',
      startMs: COLOUR_SELECT_END_MS,
      endMs: VESSEL_OPEN_END_MS,
    },
    {
      id: 'pour',
      startMs: VESSEL_OPEN_END_MS,
      // The stage owns the fill and the held-full beat, so its end is the full
      // hold. The stream itself stops at FILL_END_MS; `streamEndMs` makes that
      // distinction explicit for any consumer that needs the pour to end
      // rather than the stage to close 700 ms later.
      endMs: FULL_HOLD_END_MS,
      streamEndMs: FILL_END_MS,
    },
    {
      id: 'numberReveal',
      startMs: FULL_HOLD_END_MS,
      endMs: REVEAL_COMPLETE_MS,
    },
    {
      id: 'message',
      startMs: messageStart,
      endMs: messageStart + getMessageTotalMs(tierMessage),
    },
    {
      id: 'celebration',
      startMs: eventStart,
      endMs: eventEnd,
    },
    {
      id: 'spark',
      startMs: sparkStart,
      endMs: sparkEnd,
    },
    {
      id: 'hold',
      startMs: sparkEnd,
      endMs: holdEnd,
    },
    {
      id: 'dock',
      startMs: dockStart,
      endMs: dockStart,
    },
  ].map((stage) => ({
    ...stage,
    durationMs: stage.endMs - stage.startMs,
  }));
}
