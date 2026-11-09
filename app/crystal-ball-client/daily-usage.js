import { getLocalDateKey } from '../lib/daily-reset';

export { getLocalDateKey };

export const DAILY_STORAGE_KEY = 'luckyPickCanada:crystalBallDailyFortune:v1';
export const MAX_FORTUNE_LENGTH = 2000;
export const MAX_FOLLOW_UP_QUESTION_LENGTH = 120;

let inMemoryUsage = null;

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanFlag(value) {
  return value === true || value === 1;
}

export function createFreshUsage(date = new Date()) {
  return {
    date: getLocalDateKey(date),
    fortuneUsed: false,
    fortune: null,
    followUpUsed: false,
    followUpQuestion: null,
    followUpAnswer: null,
  };
}

function normalizeUsage(value, today) {
  if (!value || typeof value !== 'object' || value.date !== today) return null;

  const fortune = cleanText(value.fortune, MAX_FORTUNE_LENGTH);
  const followUpAnswer = cleanText(value.followUpAnswer, MAX_FORTUNE_LENGTH);
  const followUpQuestion = cleanText(
    value.followUpQuestion,
    MAX_FOLLOW_UP_QUESTION_LENGTH,
  );

  return {
    date: today,
    // A flag only counts when the matching usable reading is actually stored,
    // so an unusable response can never consume the visitor's allowance.
    fortuneUsed: cleanFlag(value.fortuneUsed) && Boolean(fortune),
    fortune,
    followUpUsed:
      cleanFlag(value.followUpUsed) && Boolean(fortune) && Boolean(followUpAnswer),
    followUpQuestion: followUpQuestion || null,
    followUpAnswer,
  };
}

/**
 * Read the visitor's local-day Crystal Ball state. The in-memory fallback
 * keeps the experience usable for this page lifetime when browser storage is
 * disabled or blocked.
 */
export function readDailyUsage(storage, date = new Date()) {
  const fresh = createFreshUsage(date);

  if (storage) {
    try {
      const raw = storage.getItem(DAILY_STORAGE_KEY);
      if (!raw) {
        inMemoryUsage = fresh;
        return { ...fresh };
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeUsage(parsed, fresh.date);
      if (normalized) {
        inMemoryUsage = normalized;
        return { ...normalized };
      }

      inMemoryUsage = fresh;
      return { ...fresh };
    } catch {
      // Storage exists but is blocked. Continue with the in-memory fallback.
    }
  }

  if (inMemoryUsage?.date === fresh.date) {
    return { ...inMemoryUsage };
  }

  inMemoryUsage = fresh;
  return { ...fresh };
}

export function writeDailyUsage(usage, storage) {
  const today = getLocalDateKey();
  const safeUsage =
    normalizeUsage({ ...usage, date: today }, today) || createFreshUsage();
  inMemoryUsage = safeUsage;

  try {
    storage?.setItem(DAILY_STORAGE_KEY, JSON.stringify(safeUsage));
  } catch {
    // Keep the update in memory for this page lifetime.
  }

  return { ...safeUsage };
}
