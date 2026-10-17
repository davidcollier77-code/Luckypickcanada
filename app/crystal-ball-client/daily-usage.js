export const DAILY_QUESTION_LIMIT = 3;
export const DAILY_STORAGE_KEY = 'luckyPickCanada:crystalBallDailyQuestions:v1';

let inMemoryUsage = null;

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function getNextLocalMidnight(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
}

export function createFreshUsage(date = new Date()) {
  return { date: getLocalDateKey(date), used: 0 };
}

function isValidUsage(value, today) {
  return value?.date === today &&
    Number.isInteger(value?.used) &&
    value.used >= 0 &&
    value.used <= DAILY_QUESTION_LIMIT;
}

/**
 * Read the visitor's local-day counter. The in-memory fallback keeps the cap
 * usable for this page lifetime when browser storage is disabled or blocked.
 */
export function readDailyUsage(storage, date = new Date()) {
  const fresh = createFreshUsage(date);

  try {
    const raw = storage?.getItem(DAILY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidUsage(parsed, fresh.date)) {
        inMemoryUsage = { date: fresh.date, used: parsed.used };
        return { ...inMemoryUsage };
      }
    }
  } catch {
    // Continue with the in-memory fallback below.
  }

  if (inMemoryUsage?.date === fresh.date && isValidUsage(inMemoryUsage, fresh.date)) {
    return { ...inMemoryUsage };
  }

  inMemoryUsage = fresh;
  return { ...fresh };
}

export function writeDailyUsage(usage, storage) {
  const safeUsage = {
    date: String(usage?.date || getLocalDateKey()),
    used: Math.max(0, Math.min(DAILY_QUESTION_LIMIT, Math.floor(Number(usage?.used) || 0))),
  };
  inMemoryUsage = safeUsage;

  try {
    storage?.setItem(DAILY_STORAGE_KEY, JSON.stringify(safeUsage));
  } catch {
    // Keep the update in memory for this page lifetime.
  }

  return { ...safeUsage };
}
