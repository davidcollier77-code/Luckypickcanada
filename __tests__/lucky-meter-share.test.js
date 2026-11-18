import { describe, expect, it, vi } from 'vitest';
import {
  ENTERTAINMENT_DISCLAIMER,
  LUCKY_COLOUR_LABEL,
  LUCKY_NUMBER_LABEL,
  SHARE_URL,
} from '../app/lib/lucky-meter/config';
import {
  buildShareText,
  isShareCancellation,
  shareDailyResult,
} from '../app/lib/lucky-meter/share';

const result = {
  dateKey: '2026-11-18',
  percentage: 78,
  tier: {
    id: 'high',
    label: 'High Resonance',
    message: 'Your luck is running high today!',
  },
  event: { id: 'fireworks', name: 'Fireworks' },
  luckyNumber: 27,
  colour: { id: 'maple-red', name: 'Maple Red', hex: '#B52B32' },
  spark: { id: 'spark-01', message: 'Even a small step forward can change the direction of your day.' },
};

describe('share text', () => {
  it('includes one Lucky Number, the colour with its HEX, Spark, URL and disclaimer', () => {
    const text = buildShareText(result);
    expect(text).toContain('78%');
    expect(text).toContain('High Resonance');
    expect(text).toContain("Today's event: Fireworks");
    // The Lucky Number is independent of the tier and reads as a single number.
    expect(text).toContain(`${LUCKY_NUMBER_LABEL}: 27`);
    expect(text).not.toMatch(/Lucky Numbers/i);
    expect(text).toContain(`${LUCKY_COLOUR_LABEL}: Maple Red (#B52B32)`);
    expect(text).toContain(result.spark.message);
    expect(text).toContain(SHARE_URL);
    expect(text).toContain(ENTERTAINMENT_DISCLAIMER);
    expect(buildShareText(null)).toBe('');
  });

  it('never prints a fixed triplet', () => {
    const text = buildShareText(result);
    expect(text).not.toContain('11, 22, 33');
    expect(text).not.toContain('3, 9, 21');
  });
});

describe('native sharing and clipboard fallback', () => {
  it('uses the native share sheet when available and never copies', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    const outcome = await shareDailyResult(result, {
      navigator: { share, clipboard: { writeText } },
    });

    expect(share).toHaveBeenCalledWith({
      title: 'My Daily Resonance',
      text: buildShareText(result),
      url: SHARE_URL,
    });
    expect(writeText).not.toHaveBeenCalled();
    expect(outcome).toEqual({ method: 'native', status: 'shared' });
  });

  it('does not copy when the visitor cancels the native share sheet', async () => {
    const cancelled = Object.assign(new Error('Share canceled'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValue(cancelled);
    const writeText = vi.fn();
    const outcome = await shareDailyResult(result, {
      navigator: { share, clipboard: { writeText } },
    });

    expect(writeText).not.toHaveBeenCalled();
    expect(outcome).toEqual({ method: 'native', status: 'cancelled' });
    expect(isShareCancellation(cancelled)).toBe(true);
  });

  it('falls back to the clipboard when native sharing actually fails', async () => {
    const share = vi.fn().mockRejectedValue(new Error('No share target'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareDailyResult(result, {
      navigator: { share, clipboard: { writeText } },
    });

    expect(writeText).toHaveBeenCalledWith(buildShareText(result));
    expect(outcome).toEqual({ method: 'clipboard', status: 'copied' });
  });

  it('uses the clipboard when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareDailyResult(result, { navigator: { clipboard: { writeText } } });

    expect(writeText).toHaveBeenCalledWith(buildShareText(result));
    expect(outcome.status).toBe('copied');
  });

  it('reports failure without throwing when neither path works', async () => {
    await expect(shareDailyResult(result, { navigator: {} })).resolves.toEqual({
      method: 'none',
      status: 'failed',
    });

    const writeText = vi.fn().mockRejectedValue(new Error('Denied'));
    await expect(
      shareDailyResult(result, { navigator: { clipboard: { writeText } } }),
    ).resolves.toEqual({ method: 'clipboard', status: 'failed' });
  });

  it('treats only a genuine cancellation as cancellation', () => {
    expect(isShareCancellation({ name: 'AbortError' })).toBe(true);
    expect(isShareCancellation({ code: 20 })).toBe(false);
    expect(isShareCancellation({ name: 'NotAllowedError' })).toBe(false);
    expect(isShareCancellation(null)).toBe(false);
  });
});
