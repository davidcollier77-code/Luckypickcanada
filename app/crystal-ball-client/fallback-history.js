import { getLocalDateKey } from '../lib/daily-reset';

/**
 * Remember only the last curated fallback the browser received, so the same
 * reading is not served on two consecutive local calendar days. No question,
 * answer or reading text is stored here.
 */
export const FALLBACK_HISTORY_STORAGE_KEY =
  'luckyPickCanada:crystalBallFallbackFortune:v1';

const FALLBACK_ID_PATTERN = /^[a-z0-9-]{1,80}$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidId(value) {
  return typeof value === 'string' && FALLBACK_ID_PATTERN.test(value);
}

/**
 * The visitor's previous local calendar day. Building the date at local noon
 * keeps the daylight-saving boundary from changing which day is "yesterday".
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function getPreviousLocalDateKey(date = new Date()) {
  return getLocalDateKey(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 12, 0, 0, 0),
  );
}

/**
 * @param {Storage | null | undefined} storage
 * @returns {{ id: string, date: string } | null}
 */
export function readFallbackHistory(storage) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(FALLBACK_HISTORY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    if (!isValidId(parsed.id)) return null;
    if (typeof parsed.date !== 'string' || !DATE_KEY_PATTERN.test(parsed.date)) {
      return null;
    }

    return { id: parsed.id, date: parsed.date };
  } catch {
    return null;
  }
}

/**
 * Persist exactly two fields: the fallback ID and its local calendar date.
 *
 * @param {string} id
 * @param {Storage | null | undefined} storage
 * @param {Date} [date]
 * @returns {{ id: string, date: string } | null}
 */
export function writeFallbackHistory(id, storage, date = new Date()) {
  if (!storage || !isValidId(id)) return null;

  const record = { id, date: getLocalDateKey(date) };
  try {
    storage.setItem(FALLBACK_HISTORY_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage can be blocked; fallback variety is optional, the fortune is not.
  }

  return record;
}

/**
 * Only a fallback delivered yesterday is excluded from today's selection. Once
 * a day has passed, or when the record is from another day, the fortune returns
 * to the pool.
 *
 * @param {{ id: string, date: string } | null} history
 * @param {Date} [date]
 * @returns {string | null}
 */
export function getFallbackFortuneToAvoid(history, date = new Date()) {
  if (!history || !isValidId(history.id)) return null;
  return history.date === getPreviousLocalDateKey(date) ? history.id : null;
}
