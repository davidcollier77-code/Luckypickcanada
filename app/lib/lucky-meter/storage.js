/**
 * Local Storage persistence for the Lucky Meter.
 *
 * The meter never contacts a server for its daily result. Storage is treated as
 * best-effort: private-browsing restrictions, disabled storage and quota errors
 * must never break the reveal, so every read and write is guarded.
 *
 * Migration is deliberately narrow. A result saved before the Lucky Number
 * existed keeps its percentage, colour and Spark unchanged; one independent
 * number is drawn and written back immediately, so a refresh cannot reroll it.
 */
import {
  COLOURS_BY_ID,
  HISTORY_LIMITS,
  LUCKY_NUMBER_MAX,
  LUCKY_NUMBER_MIN,
  METER_STORAGE_KEY,
  METER_STORAGE_VERSION,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
} from './config';
import { SPARKS_BY_ID } from './little-sparks';
import { hasValidLuckyNumber, validateDailyResult } from './selection';

export function emptyMeterHistory() {
  return { percentages: [], numbers: [], colours: [], sparks: [] };
}

export function emptyMeterState() {
  return {
    result: null,
    history: emptyMeterHistory(),
    // The event has not finished for this result. Older payloads without these
    // fields load as incomplete, which safely resumes the cinematic instead of
    // showing the Home control before it has actually completed.
    eventCompleted: false,
    // The three reveal motions have not settled. A refresh during the reveal
    // resumes them instead of jumping straight to the cinematic.
    revealCompleted: false,
    // The sky has not finished writing the Spark. A refresh after the
    // cinematic but before the quill finished resumes the writing instead of
    // skipping it or replaying the completed cinematic.
    sparkCompleted: false,
    stageDurationMs: 0,
  };
}

/** Only a real event window is accepted; anything else is treated as absent. */
function normalizeStageDuration(value) {
  const duration = Number(value);
  if (!Number.isFinite(duration)) return 0;
  if (duration < 1200 || duration > 60000) return 0;
  return Math.round(duration);
}

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidLuckyNumber(value) {
  return (
    Number.isInteger(value) && value >= LUCKY_NUMBER_MIN && value <= LUCKY_NUMBER_MAX
  );
}

function normalizeHistory(value) {
  const history = emptyMeterHistory();
  if (!value || typeof value !== 'object') return history;

  if (Array.isArray(value.percentages)) {
    history.percentages = value.percentages
      .map((entry) => (typeof entry === 'string' && entry.trim() !== '' ? Number(entry) : entry))
      // Only real meter percentages are useful for avoiding the previous value.
      // `null`, objects and out-of-range numbers must not become 0.
      .filter(
        (entry) =>
          Number.isInteger(entry) && entry >= PERCENTAGE_MIN && entry <= PERCENTAGE_MAX,
      )
      .slice(0, HISTORY_LIMITS.percentages);
  }
  if (Array.isArray(value.numbers)) {
    history.numbers = value.numbers
      .map((entry) => (typeof entry === 'string' && entry.trim() !== '' ? Number(entry) : entry))
      .filter(isValidLuckyNumber)
      .slice(0, HISTORY_LIMITS.numbers);
  }
  if (Array.isArray(value.colours)) {
    history.colours = value.colours
      .filter((entry) => typeof entry === 'string' && COLOURS_BY_ID.has(entry))
      .slice(0, HISTORY_LIMITS.colours);
  }
  if (Array.isArray(value.sparks)) {
    history.sparks = value.sparks
      .filter((entry) => typeof entry === 'string' && SPARKS_BY_ID.has(entry))
      .slice(0, HISTORY_LIMITS.sparks);
  }
  return history;
}

/**
 * Reads the persisted state. Any parse or validation problem yields empty state
 * and never throws.
 *
 * A missing Lucky Number is generated once and written back through the same
 * versioned key, so refresh, resume and later days all see the value that was
 * first revealed rather than a fresh draw.
 *
 * @param {Storage | null} [storage] Injectable storage for tests.
 * @param {{ random?: () => number }} [options]
 */
export function loadMeterState(storage = getBrowserStorage(), options = {}) {
  if (!storage) return emptyMeterState();

  try {
    const raw = storage.getItem(METER_STORAGE_KEY);
    if (!raw) return emptyMeterState();

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== METER_STORAGE_VERSION) {
      return emptyMeterState();
    }

    const dateKey = typeof parsed.dateKey === 'string' ? parsed.dateKey : null;
    // Validate against the stored date, then let the caller compare it with
    // today's local date. That keeps a stale result readable for history while
    // still preventing it from being shown as today's.
    const result = dateKey
      ? validateDailyResult(parsed.result, dateKey, options.random || Math.random)
      : null;
    let history = normalizeHistory(parsed.history);
    // A result saved before the Lucky Number existed gets one independent draw.
    // The number also joins the one-value history so tomorrow's draw excludes
    // it, exactly as it would have on the day it was first revealed.
    const needsNumberMigration = Boolean(result) && !hasValidLuckyNumber(parsed.result);
    if (needsNumberMigration && result) {
      history = {
        ...history,
        numbers: [result.luckyNumber, ...history.numbers].slice(0, HISTORY_LIMITS.numbers),
      };
    }
    const eventCompleted = Boolean(result) && parsed.eventCompleted === true;
    // A payload written before this flag existed can only be inferred from the
    // cinematic: a finished cinematic necessarily finished the reveal, while an
    // unfinished one is resumed from the motions rather than skipped.
    const revealCompleted =
      Boolean(result) &&
      (parsed.revealCompleted === true ||
        (parsed.revealCompleted === undefined && eventCompleted));
    // Payloads from before the Spark-writing stage stored no field. A completed
    // legacy result keeps its finished message on screen; a new result always
    // writes the field at Start, so an unfinished quill resumes correctly.
    const sparkCompleted =
      Boolean(result) &&
      (parsed.sparkCompleted === true ||
        (parsed.sparkCompleted === undefined && eventCompleted));
    const stageDurationMs = result ? normalizeStageDuration(parsed.stageDurationMs) : 0;


    // Persist the one migration draw so it can never happen twice.
    if (result && needsNumberMigration) {
      try {
        storage.setItem(
          METER_STORAGE_KEY,
          JSON.stringify({
            version: METER_STORAGE_VERSION,
            dateKey: result.dateKey,
            result,
            history,
            eventCompleted,
            revealCompleted,
            sparkCompleted,
            stageDurationMs,
          }),
        );
      } catch {
        // Best effort: the in-memory result still carries the number for the
        // rest of this visit.
      }
    }

    return {
      result,
      history,
      eventCompleted,
      revealCompleted,
      sparkCompleted,
      stageDurationMs,
    };
  } catch {
    return emptyMeterState();
  }
}

/**
 * Persists the complete result plus recent history.
 *
 * @returns {boolean} True when the write succeeded.
 */
export function saveMeterState(state, storage = getBrowserStorage()) {
  if (!storage || !state || typeof state !== 'object') return false;

  const payload = {
    version: METER_STORAGE_VERSION,
    dateKey: state.result?.dateKey || null,
    result: state.result || null,
    history: normalizeHistory(state.history),
    eventCompleted: state.eventCompleted === true,
    revealCompleted: state.revealCompleted === true,
    sparkCompleted: state.sparkCompleted === true,
    stageDurationMs: normalizeStageDuration(state.stageDurationMs),
  };

  try {
    storage.setItem(METER_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    // Quota exceeded, storage disabled or serialization failure: the reveal
    // still proceeds for this visit.
    return false;
  }
}

/**
 * Prepends a result's values to the recent history and trims each list to its
 * documented limit. Each choice keeps exactly one previous value.
 */
export function appendResultToHistory(history, result) {
  const base = normalizeHistory(history);
  const luckyNumber = Number(result?.luckyNumber);
  const next = {
    percentages: [result?.percentage, ...base.percentages]
      .filter((entry) => Number.isInteger(entry))
      .slice(0, HISTORY_LIMITS.percentages),
    numbers: [luckyNumber, ...base.numbers]
      .filter(isValidLuckyNumber)
      .slice(0, HISTORY_LIMITS.numbers),
    colours: [result?.colour?.id, ...base.colours]
      .filter((entry) => typeof entry === 'string' && COLOURS_BY_ID.has(entry))
      .slice(0, HISTORY_LIMITS.colours),
    sparks: [result?.spark?.id, ...base.sparks]
      .filter((entry) => typeof entry === 'string' && SPARKS_BY_ID.has(entry))
      .slice(0, HISTORY_LIMITS.sparks),
  };
  return next;
}

/** True when a result belongs to the supplied local date key. */
export function isResultForDate(result, dateKey) {
  return Boolean(result && dateKey && result.dateKey === dateKey);
}
