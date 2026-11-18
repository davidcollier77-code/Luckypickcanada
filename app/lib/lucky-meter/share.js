/**
 * Sharing for the Daily Resonance result.
 *
 * Native sharing is always preferred. A cancelled share sheet is a deliberate
 * user action, so it never falls through to the clipboard. The clipboard is
 * used only when native sharing is unavailable or actually fails.
 */
import {
  ENTERTAINMENT_DISCLAIMER,
  LUCKY_COLOUR_LABEL,
  LUCKY_NUMBER_LABEL,
  SHARE_TITLE,
  SHARE_URL,
} from './config';

export function buildShareText(result) {
  if (!result) return '';
  // The Lucky Number is independent of the percentage, so it always reads as
  // one number rather than a set.
  const number = Number.isInteger(result.luckyNumber) ? `${result.luckyNumber}` : '';
  const spark = result.spark?.message ? `“${result.spark.message}”` : '';
  const colour = result.colour?.name
    ? `${result.colour.name} (${result.colour.hex || ''})`
    : '';

  return [
    `My Daily Resonance is ${result.percentage}% — ${result.tier?.label || ''}.`,
    `Today's event: ${result.event?.name || ''}`,
    number ? `${LUCKY_NUMBER_LABEL}: ${number}` : '',
    colour ? `${LUCKY_COLOUR_LABEL}: ${colour}` : '',
    spark ? `Little Spark: ${spark}` : '',
    `Discover yours at ${SHARE_URL}`,
    ENTERTAINMENT_DISCLAIMER,
  ]
    .filter(Boolean)
    .join('\n');
}

export function isShareCancellation(error) {
  if (!error) return false;
  return error.name === 'AbortError';
}

/**
 * Attempts the native share sheet, then the clipboard when appropriate.
 *
 * @param {object} result Complete daily result.
 * @param {{ navigator?: Navigator, text?: string }} [options] Injectable browser objects for tests.
 * @returns {Promise<{ method: 'native' | 'clipboard' | 'none', status: 'shared' | 'cancelled' | 'copied' | 'failed' }>}
 */
export async function shareDailyResult(result, options = {}) {
  const text = options.text || buildShareText(result);
  const navigatorObject =
    options.navigator || (typeof navigator !== 'undefined' ? navigator : null);

  if (!text) return { method: 'none', status: 'failed' };

  if (navigatorObject && typeof navigatorObject.share === 'function') {
    try {
      await navigatorObject.share({ title: SHARE_TITLE, text, url: SHARE_URL });
      return { method: 'native', status: 'shared' };
    } catch (error) {
      if (isShareCancellation(error)) {
        // The visitor closed the share sheet. Copying here would be surprising.
        return { method: 'native', status: 'cancelled' };
      }
      // A real failure (for example a missing share target) falls back.
    }
  }

  const clipboard = navigatorObject?.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return { method: 'clipboard', status: 'copied' };
    } catch {
      return { method: 'clipboard', status: 'failed' };
    }
  }

  return { method: 'none', status: 'failed' };
}
