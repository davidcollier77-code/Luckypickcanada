/**
 * The Lucky Meter's nine-step cinematic storyboard.
 *
 * Every stage length lives here so the component, the copy animator, the audio
 * cues and the tests all read one source. The values are deliberately generous:
 * the image's timings are estimates, and the experience is meant to breathe
 * rather than rush.
 *
 * The sequence after Start:
 *
 *   1. anticipation      the sky listens, the reading is 0%
 *   2. generation        the wheel turns and the percentage counts up together
 *   3. landing           both stop on the same frame
 *   4. segmentOpen       the selected segment lifts and opens
 *   5. pour              its colour drains down while the number is exposed
 *   6. message           the tier line is written above the meter, held, faded
 *   7. celebration       the tier's existing cinematic
 *   8. spark             the maple-leaf cursor writes the Little Spark
 *   9. dock              Home and the countdown arrive together
 *
 * Before Start, the resting scene holds, the breeze carries the leaves away and
 * only then does Start appear. Those pre-Start values are here too so the
 * arrival and the button share the same clock.
 */

export const STORYBOARD_TIMING = Object.freeze({
  /** Frame 1: the gold pointer, leaves and dial are still. */
  leafHoldMs: 1750,
  /** Frame 2: the breeze lifts and carries every leaf out of frame. */
  leafBreezeMs: 1300,
  /** Frame 3: a short quiet beat before Start appears. */
  startDelayMs: 700,

  /** Frame 4: a held breath after Start, before anything moves. */
  anticipationMs: 900,
  /** Frame 4: percentage generation and wheel rotation, start to stop. */
  generationMs: 4200,

  /** Frame 5: the stopped wheel rests for a moment. */
  settlePauseMs: 450,
  /** Frame 5: the selected segment physically opens. */
  segmentOpenMs: 800,
  /** Frame 5: the colour pours down and the Lucky Number is exposed. */
  pourMs: 1900,
  /** Frame 5: number and colour settle into their result areas. */
  resultSettleMs: 800,

  /** Frame 6: lead-in before the tier message starts writing. */
  messageDelayMs: 700,
  /** Frame 6: one character at a time. */
  messageCharMs: 34,
  /** Frame 6: the longer beat after punctuation in the faster tier line. */
  messagePunctuationPauseMs: 220,
  /** Frame 6: the finished sentence stays readable. */
  messageHoldMs: 2500,
  /** Frame 6: and fades away before the celebration. */
  messageFadeMs: 700,

  /** Frame 7: a last breath between the message and the cinematic. */
  eventDelayMs: 800,

  /** Frame 8: the sky is still after the celebration. */
  sparkStartDelayMs: 1200,
  /** Frame 8: the maple-leaf cursor writes one character at a time. */
  sparkMsPerCharacter: 28,
  sparkPunctuationPauseMs: 220,

  /** Frame 9: Home and the countdown settle into the dock together. */
  dockDelayMs: 800,

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

/** Milliseconds from Start until the selected segment has completely emptied. */
export const POUR_END_MS =
  REVEAL_MOTION_MS +
  STORYBOARD_TIMING.settlePauseMs +
  STORYBOARD_TIMING.segmentOpenMs +
  STORYBOARD_TIMING.pourMs;

/** Milliseconds from Start until the number and colour have settled. */
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

/** Milliseconds from Start until Home and the countdown arrive together. */
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
  const sparkStart = eventStart + eventDuration + STORYBOARD_TIMING.sparkStartDelayMs;
  const sparkDuration = getSparkWritingMs(sparkMessage);
  const dockStart = sparkStart + sparkDuration + STORYBOARD_TIMING.dockDelayMs;
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
      endMs: REVEAL_MOTION_MS + STORYBOARD_TIMING.settlePauseMs,
    },
    {
      id: 'segmentOpen',
      startMs: REVEAL_MOTION_MS + STORYBOARD_TIMING.settlePauseMs,
      endMs: REVEAL_MOTION_MS + STORYBOARD_TIMING.settlePauseMs + STORYBOARD_TIMING.segmentOpenMs,
    },
    {
      id: 'pour',
      startMs:
        REVEAL_MOTION_MS + STORYBOARD_TIMING.settlePauseMs + STORYBOARD_TIMING.segmentOpenMs,
      endMs: POUR_END_MS,
    },
    {
      id: 'resultSettle',
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
      endMs: eventStart + eventDuration,
    },
    {
      id: 'spark',
      startMs: sparkStart,
      endMs: sparkStart + sparkDuration,
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
