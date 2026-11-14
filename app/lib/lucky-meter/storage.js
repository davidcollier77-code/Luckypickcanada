/**
 * Local Storage persistence for the Lucky Meter.
 *
 * The meter never contacts a server for its daily result. Storage is treated as
 * best-effort: private-browsing restrictions, disabled storage and quota errors
 * must never break the reveal, so every read and write is guarded.
 */
import {
  HISTORY_LIMITS,
  METER_STORAGE_KEY,
  METER_STORAGE_VERSION,
  PERCENTAGE_MAX,
  PERCENTAGE_MIN,
} from './config';
import { validateDailyResult } from './selection';

export function emptyMeterHistory() {
  return { percentages: [], events: [], sparks: [] };
}

export function emptyMeterState() {
  return { result: null, history: emptyMeterHistory() };
}

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeHistory(value) {
  const history = emptyMeterHistory();
  if (!value || typeof value !== 'object') return history;

  if (Array.isArray(value.percentages)) {
    history.percentages = value.percentages
      .map((entry) => (typeof entry === 'string' && entry.trim() !== '' ? Number(entry) : entry))
      // Only real meter percentages are useful for avoiding recent values.
      // `null`, objects and out-of-range numbers must not become 0.
      .filter(
        (entry) =>
          Number.isInteger(entry) && entry >= PERCENTAGE_MIN && entry <= PERCENTAGE_MAX,
      )
      .slice(0, HISTORY_LIMITS.percentages);
  }
  if (Array.isArray(value.events)) {
    history.events = value.events
      .filter((entry) => typeof entry === 'string')
      .slice(0, HISTORY_LIMITS.events);
  }
  if (Array.isArray(value.sparks)) {
    history.sparks = value.sparks
      .filter((entry) => typeof entry === 'string')
      .slice(0, HISTORY_LIMITS.sparks);
  }
  return history;
}

/**
 * Reads the persisted state. Any parse or validation problem yields empty state
 * and never throws.
 */
export function loadMeterState(storage = getBrowserStorage()) {
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
    const result = dateKey ? validateDailyResult(parsed.result, dateKey) : null;

    return {
      result,
      history: normalizeHistory(parsed.history),
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
 * documented limit (last three percentages, recent events and Sparks).
 */
export function appendResultToHistory(history, result) {
  const base = normalizeHistory(history);
  const next = {
    percentages: [result.percentage, ...base.percentages]
      .filter((entry) => Number.isInteger(entry))
      .slice(0, HISTORY_LIMITS.percentages),
    events: [result.event.id, ...base.events].slice(0, HISTORY_LIMITS.events),
    sparks: [result.spark.id, ...base.sparks].slice(0, HISTORY_LIMITS.sparks),
  };
  return next;
}

/** True when a result belongs to the supplied local date key. */
export function isResultForDate(result, dateKey) {
  return Boolean(result && dateKey && result.dateKey === dateKey);
}
