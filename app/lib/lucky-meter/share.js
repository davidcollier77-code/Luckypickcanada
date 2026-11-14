/**
 * Sharing for the Daily Resonance result.
 *
 * Native sharing is always preferred. A cancelled share sheet is a deliberate
 * user action, so it never falls through to the clipboard. The clipboard is
 * used only when native sharing is unavailable or actually fails.
 */
import { ENTERTAINMENT_DISCLAIMER, SHARE_TITLE, SHARE_URL } from './config';

export function buildShareText(result) {
  if (!result) return '';
  const numbers = result.event?.numbers?.join(', ') || '';
  const spark = result.spark?.message ? `“${result.spark.message}”` : '';

  return [
    `My Daily Resonance is ${result.percentage}% — ${result.tier?.label || ''}.`,
    `Today's event: ${result.event?.name || ''}`,
    `Your Lucky Numbers: ${numbers}`,
    `Colour: ${result.colour?.name || ''} (${result.colour?.hex || ''})`,
    spark ? `Little Spark: ${spark}` : '',
    `Discover yours at ${SHARE_URL}`,
    ENTERTAINMENT_DISCLAIMER,
  ]
    .filter(Boolean)
    .join('\n');
}

export function isShareCancellation(error) {
  if (!error) return false;
  return error.name === 'AbortError' || error.code === 20;
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
      // A real failure (for example a missing share target) may fall back.
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
