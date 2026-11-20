/**
 * The Lucky Meter's twelve-stage cinematic storyboard.
 *
 * Every stage length lives here so the component, the copy animator, the audio
 * cues and the tests all read one source. The values are deliberately generous:
 * the sequence is meant to breathe, and a complete run lands at roughly forty
 * seconds — the tier's own established celebration length is what makes the
 * last few seconds differ between tiers, and it is never shortened to force
 * every run into an identical clock.
 *
 * The sequence after Start:
 *
 *   1. anticipation      the sky listens, the reading sits at 5%
 *   2. generation        the wheel turns and the percentage counts up to 100
 *   3. landing           both stop on the same frame; the reading holds
 *   4. colourSelect      the seasonal colour selection settles under the pointer
 *   5. vesselOpen        the transparent vessel unfolds and opens
 *   6. pour              its colour drains down and fills the vessel
 *   7. numberReveal      only now is the Lucky Number exposed, flashed, settled
 *   8. message           the tier line is written above the meter, held, faded
 *   9. celebration       the tier's existing cinematic, at its full length
 *  10. spark             the maple-leaf cursor writes the Little Spark
 *  11. hold              the finished scene is held so it can be taken in
 *  12. dock              Home and the countdown arrive together
 *
 * Before Start, the resting pile holds, the breeze carries the leaves away and
 * only then does Start appear. Those pre-Start values are here too so the
 * arrival and the button share the same clock.
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
  /** Stage 2: percentage generation and wheel rotation, start to stop. */
  generationMs: 5200,

  /** Stage 3: the stopped wheel and the reading rest, plaque-free, in the well. */
  landingMs: 600,
  /** Stage 4: the landing beat plus the seasonal colour selection unfolding. */
  settlePauseMs: 1800,
  /** Stage 5: the transparent vessel unfolds from a flat plate into a cube. */
  segmentOpenMs: 1400,
  /** Stage 6: the colour drains from the segment and fills the vessel. */
  pourMs: 3000,

  /**
   * Stage 7: the post-drain beat. The number appears only when this window
   * opens, flashes twice and then settles into its placard.
   */
  resultSettleMs: 2600,
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
  messageHoldMs: 2800,
  /** Stage 8: and fades away before the celebration. */
  messageFadeMs: 800,

  /** Stage 9: a last breath between the message and the cinematic. */
  eventDelayMs: 900,

  /** Stage 10: the sky is still after the celebration. */
  sparkStartDelayMs: 1300,
  /** Stage 10: the maple-leaf cursor writes one character at a time. */
  sparkMsPerCharacter: 32,
  sparkPunctuationPauseMs: 240,

  /**
   * Stage 11 plus the dock settle: the completed scene is held first, and both
   * controls arrive together at the end of this window.
   */
  dockDelayMs: 3400,
  /** The part of the dock window that is pure hold, so the stage list can split it. */
  finalHoldMs: 2600,

  /** The landing flash on the percentage. */
  flashMs: 700,
  flashCount: 2,
});

/** Milliseconds from first paint until Start can appear without the arrival canvas. */
export const ARRIVAL_TOTAL_MS =
  STORYBOARD_TIMING.leafHoldMs +
  STORYBOARD_TIMING.leafBreezeMs +
  STORYBOARD_TIMING.startDelayMs;

/**
 * Milliseconds from Start until the percentage and the wheel stop. Both use the
 * same final frame, so they can never disagree.
 */
export const REVEAL_MOTION_MS =
  STORYBOARD_TIMING.anticipationMs + STORYBOARD_TIMING.generationMs;

/** Milliseconds from Start until the colour selection has finished unfolding. */
export const COLOUR_SELECT_END_MS = REVEAL_MOTION_MS + STORYBOARD_TIMING.settlePauseMs;

/** Milliseconds from Start until the vessel has finished opening. */
export const VESSEL_OPEN_END_MS = COLOUR_SELECT_END_MS + STORYBOARD_TIMING.segmentOpenMs;

/** Milliseconds from Start until the selected segment has completely emptied. */
export const POUR_END_MS = VESSEL_OPEN_END_MS + STORYBOARD_TIMING.pourMs;

/** Milliseconds from Start until the number has been revealed, flashed and settled. */
export const REVEAL_COMPLETE_MS = POUR_END_MS + STORYBOARD_TIMING.resultSettleMs;

/** Characters that earn a longer pause while writing. */
const PUNCTUATION = /[.,!?:;—–]/;

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
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
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
 * @param {string} message
 * @returns {number}
 */
export function getSparkWritingMs(message) {
  const characters = message ? Array.from(message) : [];
  if (characters.length === 0) return 0;
  let total = 0;
  for (const character of characters) {
    total += PUNCTUATION.test(character)
      ? STORYBOARD_TIMING.sparkPunctuationPauseMs
      : STORYBOARD_TIMING.sparkMsPerCharacter;
  }
  return total;
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
 * Builds the ordered stage list for one complete run. Used by the tests and as
 * documentation of the exact hand-off order; the component schedules the same
 * values so a stage can never start before the previous one has finished.
 *
 * @param {{ tierMessage: string, eventDurationMs: number, sparkMessage: string }} run
 * @returns {Array<{ id: string, startMs: number, endMs: number, durationMs: number }>}
 */
export function buildStoryboard({ tierMessage, eventDurationMs, sparkMessage }) {
  const eventStart = getEventStartMs(tierMessage);
  const eventDuration = Math.max(0, Number(eventDurationMs) || 0);
  const eventEnd = eventStart + eventDuration;
  const sparkStart = eventEnd + STORYBOARD_TIMING.sparkStartDelayMs;
  const sparkDuration = getSparkWritingMs(sparkMessage);
  const sparkEnd = sparkStart + sparkDuration;
  const dockStart = sparkEnd + STORYBOARD_TIMING.dockDelayMs;
  const holdEnd = sparkEnd + Math.min(STORYBOARD_TIMING.finalHoldMs, STORYBOARD_TIMING.dockDelayMs);
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
      startMs: REVEAL_MOTION_MS + STORYBOARD_TIMING.landingMs,
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
      endMs: POUR_END_MS,
    },
    {
      id: 'numberReveal',
      startMs: POUR_END_MS,
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
