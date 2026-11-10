import { getLocalDateKey } from '../lib/daily-reset';

export const GREETING_STORAGE_KEY = 'luckyPickCanada:crystalBallGreeting:v1';

/**
 * Four friendly, playful Canadian greetings. The first three are the approved
 * greetings that shipped with the daily Crystal Ball; the fourth keeps the
 * same voice.
 */
export const GREETINGS = [
  "Well, look who's feeling lucky today.",
  "Let's see what the universe has up its sleeve, eh?",
  "I've been waiting for you. Not that I'm keeping track or anything.",
  'Pull up a chair, friend — the mists kept the good seat warm for you.',
];

let inMemoryGreeting = null;

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidIndex(value) {
  return Number.isInteger(value) && value >= 0 && value < GREETINGS.length;
}

function readGreetingRecord(storage) {
  if (!storage) return inMemoryGreeting;

  try {
    const raw = storage.getItem(GREETING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.date !== 'string') return null;
    if (!isValidIndex(parsed.index)) return null;
    return { date: parsed.date, index: parsed.index };
  } catch {
    // Storage exists but is blocked; keep this page lifetime consistent.
    return inMemoryGreeting;
  }
}

function writeGreetingRecord(storage, record) {
  inMemoryGreeting = record;
  try {
    storage?.setItem(GREETING_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Keep the record in memory for this page lifetime.
  }
}

/**
 * Resolve the greeting for the visitor's local day.
 *
 * The same record is reused for the whole local day. On a new day the choice is
 * uniform among the greetings that differ from the most recently shown one, so
 * a greeting is never repeated on consecutive days and is always allowed again
 * after a different greeting has appeared.
 *
 * @param {Storage | null} [storage] Browser storage, or null to use the in-memory fallback.
 * @param {string} [dateKey] Local date key; defaults to the visitor's local day.
 * @param {() => number} [random] Random source in [0, 1); injectable for tests.
 * @returns {{ index: number, text: string, reused: boolean }}
 */
export function readDailyGreeting(
  storage = getBrowserStorage(),
  dateKey = getLocalDateKey(),
  random = Math.random,
) {
  const previous = readGreetingRecord(storage);

  if (previous && previous.date === dateKey) {
    return { index: previous.index, text: GREETINGS[previous.index], reused: true };
  }

  const candidates = [];
  for (let index = 0; index < GREETINGS.length; index += 1) {
    if (!previous || !isValidIndex(previous.index) || index !== previous.index) {
      candidates.push(index);
    }
  }
  // Defensive fallback: never fail to show a greeting.
  const pool = candidates.length > 0 ? candidates : GREETINGS.map((_, index) => index);
  const roll = Math.min(Math.max(random(), 0), 0.999999);
  const index = pool[Math.floor(roll * pool.length)];

  writeGreetingRecord(storage, { date: dateKey, index });

  return { index, text: GREETINGS[index], reused: false };
}
