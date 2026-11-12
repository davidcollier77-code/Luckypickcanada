import { getLocalDateKey } from '../lib/daily-reset';
import { getLocalMoment, getTimeOfDayGreeting } from '../lib/local-time';
import { getCalendarContext } from '../lib/crystal-ball-calendar';

export const GREETING_STORAGE_KEY = 'luckyPickCanada:crystalBallGreeting:v1';

/**
 * Warm, playful Canadian personalities. The first four are the approved
 * greetings that shipped with the daily Crystal Ball; the rest add variety
 * without changing the storage key, so an existing record keeps its index.
 */
export const GREETINGS = [
  "Well, look who's feeling lucky today.",
  "Let's see what the universe has up its sleeve, eh?",
  "I've been waiting for you. Not that I'm keeping track or anything.",
  'Pull up a chair, friend — the mists kept the good seat warm for you.',
  "The glass has been polishing its best Canadian wisdom. Spoiler: it involves layers.",
  "Come in, come in — there's a fortune in here with your name on it, and a spare toque in case.",
  'I consulted the maple leaf, the moon and a very opinionated goose. The reading should be interesting.',
  "Fair warning: I'm fluent in sarcasm, maple syrup and unsolicited weather advice.",
  "The mists are 80% mystery, 20% coffee. Let's see what today's batch brewed up.",
  "Sit down, eh? The universe has notes, and most of them are actually good.",
];

// Client-only: do not import this module in server components. The module-level
// `inMemoryGreeting` variable is shared across the process lifetime; importing
// on the server would leak one visitor's greeting to the next request.
let inMemoryGreeting = null;

// The quiet-day lookup is keyed only by calendar date, so caching it cannot
// leak anything visitor-specific between page renders.
let cachedDateKey = null;
let cachedQuietGreeting;

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
 * Remembrance Day and the National Day for Truth and Reconciliation get a
 * quiet, respectful greeting instead of the playful daily personality. Good
 * Friday keeps the same restrained tone. No humour is shown on these days.
 *
 * @param {string} dateKey
 * @returns {string | null}
 */
export function getQuietGreeting(dateKey = getLocalDateKey()) {
  if (cachedDateKey === dateKey) return cachedQuietGreeting;

  const context = getCalendarContext(dateKey);
  let greeting = null;
  if (context.focus?.id === 'remembrance-day') {
    greeting = 'Today the glass is quiet. Take a moment to remember.';
  } else if (context.focus?.id === 'truth-reconciliation') {
    greeting = 'Today the mists are listening. Take a moment to reflect.';
  } else if (context.focus?.id === 'good-friday') {
    greeting = 'The glass is quiet today. Take the day gently.';
  }

  cachedDateKey = dateKey;
  cachedQuietGreeting = greeting;
  return greeting;
}

/**
 * Compose the visible greeting from the visitor's local salutation and the
 * daily personality line. The salutation updates when the local period
 * changes; on a quiet commemorative day it is replaced entirely.
 *
 * @param {string} personality
 * @param {ReturnType<typeof getLocalMoment>} [moment]
 */
export function composeGreeting(personality, moment = getLocalMoment()) {
  if (!personality) return '';

  const quiet = getQuietGreeting(moment.dateKey);
  if (quiet) return quiet;

  return `${getTimeOfDayGreeting(moment.period)} ${personality}`;
}

/**
 * Resolve the personality line for the visitor's local day.
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
