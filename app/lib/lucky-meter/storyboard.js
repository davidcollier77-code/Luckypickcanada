/**
 * The Lucky Meter's approved cinematic storyboard.
 *
 * Every stage length lives here so the component, the WebGL meter, the message
 * animator, the audio cues and the tests all read one source. The sequence is:
 *
 *   1. anticipation      the sky listens, the central leaf waits
 *   2. leafExit          the central leaf rotates back and clears the well
 *   3. generation        the wheel turns for 4,400 ms and stops on the stored
 *                        colour while the percentage keeps generating for its
 *                        own independent 9,400 ms window
 *   4. pour              the selected chamber drains and the vessel fills
 *   5. numberPause       the full vessel rests
 *   6. transfer          the golden beam carries the number to its display
 *   7. message           the exact tier line is written, held and settles
 *   8. celebration       one 12,000 ms cinematic for every tier
 *   9. spark             the maple-leaf cursor writes the Little Spark
 *  10. hold              the finished scene is held so it can be taken in
 *  11. dock              Home and the countdown arrive together
 *
 * The wheel and the percentage are deliberately separate clocks. The wheel
 * stops first, on the already-selected colour; the percentage continues its
 * approved five-beat movement and only reaches the stored result at the end of
 * its own window. Nothing here selects a value.
 *
 * The overall run is emergent: it is the sum of these beats. No later stage is
 * shortened or stretched to force an identical total.
 */

export const STORYBOARD_TIMING = Object.freeze({
  /** Stages 1–2: the resting pile holds long enough to register as an object. */
  leafHoldMs: 2400,
  /** Stage 2: the gust lifts the pile and carries every leaf out of frame. */
  leafBreezeMs: 2100,
  /** A short quiet beat after the last leaf before Start appears. */
  startDelayMs: 800,

  /** Stage 1: a held breath after Start, before anything moves. */
  anticipationMs: 1000,
  /** Stage 2: the central decorative leaf rotates back and retracts. */
  leafExitMs: 900,
  /**
   * Stage 3: the wheel turns exactly five revolutions and stops on the
   * pre-selected colour. It is shorter than the percentage window on purpose.
   */
  wheelMs: 4400,
  /**
   * Stage 3: the independent percentage generation. The five approved beats
   * (0 → 100 → fall → rise → erratic → settle) run here and the stored result
   * appears only on the last frame.
   */
  percentageMs: 9400,
  /** Stage 4: the selected chamber drains and the receiving vessel fills. */
  pourMs: 2000,
  /** Stage 5: the full vessel rests before the number moves. */
  numberPauseMs: 1500,
  /** Stage 6: the golden beam carries the number to its display. */
  transferMs: 2200,
  /** Stage 6: the arrived number settles in its own display. */
  transferSettleMs: 700,

  /** Stage 7: lead-in before the tier message starts writing. */
  messageDelayMs: 800,
  /** Stage 7: one character at a time. */
  messageCharMs: 34,
  /** Stage 7: the longer beat after punctuation in the faster tier line. */
  messagePunctuationPauseMs: 240,
  /** Stage 7: the finished sentence stays readable. */
  messageHoldMs: 3000,
  /**
   * Stage 7: the finished sentence settles visibly. It never fades: the line
   * stays at full opacity through the celebration and the finished state.
   */
  messageSettleMs: 800,

  /** Stage 8: a last breath between the message and the cinematic. */
  eventDelayMs: 900,
  /**
   * Stage 8: every tier celebrates for the same 12,000 ms. A celebration
   * restarted after a page refresh uses this full length again; an older stored
   * duration never re-times it.
   */
  celebrationMs: 12000,

  /** Stage 9: the sky is still after the celebration. */
  sparkStartDelayMs: 1300,
  /** Stage 9: the maple-leaf cursor writes one character at a time. */
  sparkMsPerCharacter: 32,
  sparkPunctuationPauseMs: 240,
  /** Stage 9: every Spark takes 3,800–5,200 ms to write. */
  sparkMinMs: 3800,
  sparkMaxMs: 5200,

  /**
   * Stage 10 plus the dock settle: the completed scene is held first, and both
   * controls arrive together at the end of this window. The gap between
   * `finalHoldMs` and this value is the dock's own approach.
   */
  dockDelayMs: 3600,
  /** The part of the dock window that is pure hold: `hold` ends here. */
  finalHoldMs: 2800,

  /** The landing flash on the percentage. */
  flashMs: 700,
  flashCount: 2,
  /** One flash of the revealed Lucky Number. */
  numberFlashMs: 420,
  numberFlashCount: 2,
});

/** Milliseconds from first paint until Start can appear without the arrival canvas. */
export const ARRIVAL_TOTAL_MS =
  STORYBOARD_TIMING.leafHoldMs +
  STORYBOARD_TIMING.leafBreezeMs +
  STORYBOARD_TIMING.startDelayMs;

/** The one celebration length used by every tier, including a refresh restart. */
export const CELEBRATION_MS = STORYBOARD_TIMING.celebrationMs;

/** Milliseconds from Start until the percentage begins generating. */
export const PERCENTAGE_START_MS =
  STORYBOARD_TIMING.anticipationMs + STORYBOARD_TIMING.leafExitMs;

/** Milliseconds from Start until the wheel stops on the stored colour. */
export const WHEEL_END_MS = PERCENTAGE_START_MS + STORYBOARD_TIMING.wheelMs;

/** Milliseconds from Start until the percentage reaches the stored result. */
export const PERCENTAGE_END_MS = PERCENTAGE_START_MS + STORYBOARD_TIMING.percentageMs;

/**
 * Milliseconds from Start until both the wheel and the percentage have stopped.
 *
 * The wheel stops at `WHEEL_END_MS`; this value is the end of the percentage
 * window, when the reading is whole. The component keeps the wheel locked at
 * its landing angle for the remainder.
 */
export const REVEAL_MOTION_MS = PERCENTAGE_END_MS;

/** Milliseconds from Start until the pour finishes and the vessel is full. */
export const POUR_END_MS = PERCENTAGE_END_MS + STORYBOARD_TIMING.pourMs;

/** Milliseconds from Start until the full vessel has rested. */
export const NUMBER_PAUSE_END_MS = POUR_END_MS + STORYBOARD_TIMING.numberPauseMs;

/** Milliseconds from Start until the beam has transferred and settled the number. */
export const REVEAL_COMPLETE_MS =
  NUMBER_PAUSE_END_MS + STORYBOARD_TIMING.transferMs + STORYBOARD_TIMING.transferSettleMs;

/** Characters that earn a longer pause while writing. */
const PUNCTUATION = /[.,!?:;—–]/;

/** A punctuation mark weighs this much more than a normal character. */
const PUNCTUATION_WEIGHT = 1.6;

function characterWeights(message) {
  const characters = message ? Array.from(message) : [];
  return characters.map((character) => (PUNCTUATION.test(character) ? PUNCTUATION_WEIGHT : 1));
}

/**
 * The time the message needs to be typed, excluding its lead-in, hold and
 * settle.
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
 * The full time the message owns, including its lead-in, writing, hold and
 * visible settle. The message never fades; the settle is its last beat.
 *
 * @param {string} message
 * @returns {number}
 */
export function getMessageTotalMs(message) {
  return (
    STORYBOARD_TIMING.messageDelayMs +
    getMessageTypingMs(message) +
    STORYBOARD_TIMING.messageHoldMs +
    STORYBOARD_TIMING.messageSettleMs
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
 * The message starts on the lock frame, while the pour and transfer run, and
 * is removed before this time. The celebration never begins before both the
 * transfer and the message have finished, plus the approved quiet beat.
 *
 * @param {string} message The tier message that is written first.
 * @returns {number}
 */
export function getEventStartMs(message) {
  const messageEnd = REVEAL_MOTION_MS + getMessageTotalMs(message);
  return Math.max(REVEAL_COMPLETE_MS, messageEnd) + STORYBOARD_TIMING.eventDelayMs;
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
 * @returns {Array<{ id: string, startMs: number, endMs: number, durationMs: number, wheelEndMs?: number }>}
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
  // The sentence appears on the lock frame, while the colour pours and the
  // number travels, and is gone before the celebration's first frame.
  const messageStart = REVEAL_MOTION_MS;

  return [
    { id: 'anticipation', startMs: 0, endMs: STORYBOARD_TIMING.anticipationMs },
    {
      id: 'leafExit',
      startMs: STORYBOARD_TIMING.anticipationMs,
      endMs: PERCENTAGE_START_MS,
    },
    {
      id: 'generation',
      startMs: PERCENTAGE_START_MS,
      endMs: PERCENTAGE_END_MS,
      wheelEndMs: WHEEL_END_MS,
    },
    {
      id: 'pour',
      startMs: PERCENTAGE_END_MS,
      endMs: POUR_END_MS,
    },
    {
      id: 'numberPause',
      startMs: POUR_END_MS,
      endMs: NUMBER_PAUSE_END_MS,
    },
    {
      id: 'transfer',
      startMs: NUMBER_PAUSE_END_MS,
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
      // The dock's approach: the last part of the dock window, from the end of
      // the final hold to the moment Home and the countdown arrive. Keeping it
      // as an interval makes the stage list contiguous and its final end the
      // exact getDockMs() terminal time.
      id: 'dock',
      startMs: holdEnd,
      endMs: dockStart,
    },
  ].map((stage) => ({
    ...stage,
    durationMs: stage.endMs - stage.startMs,
  }));
}
