/**
 * Shared daily-reset date helpers.
 *
 * Every daily feature uses the visitor's local calendar date and the next
 * local midnight. Building the deadline with the local Date constructor keeps
 * daylight-saving days correct (23 or 25 hours) instead of assuming 24 hours.
 */

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextLocalMidnight(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
}

export function getDailyResetState(date = new Date()) {
  const deadline = getNextLocalMidnight(date);
  return {
    dateKey: getLocalDateKey(date),
    deadlineMs: deadline.getTime(),
    remainingMs: Math.max(0, deadline.getTime() - date.getTime()),
  };
}

export function formatDailyResetRemaining(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(Number(remainingMs) / 1000) || 0);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
