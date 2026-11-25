import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import DailyResonance from '../components/DailyResonance';
import * as audioLib from '../app/lib/audio';

vi.mock('../app/lib/audio', () => ({
  playButtonClick: vi.fn(() => Promise.resolve()),
}));

let globalUnloadCalled = false;

vi.mock('howler', () => {
  return {
    Howler: {
      unload: vi.fn(() => {
        globalUnloadCalled = true;
      }),
    },
    Howl: vi.fn().mockImplementation(function MockHowl() {
      this.play = vi.fn();
      this.volume = vi.fn();
      this.rate = vi.fn();
      this.fade = vi.fn();
      this.stop = vi.fn();
      this.unload = vi.fn();
      this.playing = vi.fn(() => false);
    }),
  };
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('../components/daily-reset-countdown', () => ({
  useDailyResetCountdown: () => ({
    ready: true,
    dateKey: '2026-11-14',
    formatted: '05:00:00',
    now: 0,
    deadlineMs: 0,
    remainingMs: 0,
  }),
}));

describe('DailyResonance Lifecycle & Audio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalUnloadCalled = false;
    localStorage.clear();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ visits: 42 }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('unmounts cleanly without calling Howler.unload() if no reveal occurred', () => {
    const { unmount } = render(<DailyResonance isCompact={false} />);
    unmount();
    expect(globalUnloadCalled).toBe(false);
    expect(audioLib.playButtonClick).not.toHaveBeenCalled();
  });

  it('unmounts and unloads only owned Howl instances, avoiding global Howler.unload()', async () => {
    const { unmount } = render(<DailyResonance isCompact={false} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Reveal My Resonance'));
      await Promise.resolve();
      await Promise.resolve();
    });

    unmount();

    expect(globalUnloadCalled).toBe(false);
  });

  it('continues the reveal when the audio library cannot load', async () => {
    const audioWarning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.doMock('howler', () => {
      throw new Error('Mock network failure');
    });

    const { unmount } = render(<DailyResonance isCompact={false} />);
    fireEvent.click(screen.getByText('Reveal My Resonance'));

    // Audio is optional: a failed import must not cancel or block the reveal.
    // Wait for the asynchronous import rejection as well as the visible reading.
    await waitFor(
      () => {
        // The medallion is opening and the reveal has started; a failed audio
        // import must not cancel or block it.
        expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'spin');
        expect(audioWarning).toHaveBeenCalledWith(
          'Lucky Meter audio unavailable; continuing without sound.',
          expect.any(Error),
        );
      },
      { interval: 1 },
    );
    expect(window.localStorage.getItem('lucky-pick-canada-lucky-meter-v1')).not.toBeNull();

    // Let the import continuation and visit-counter promise chain settle inside
    // React act before unmounting, so the test leaves no pending React work.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    unmount();
    vi.doUnmock('howler');
  });
});
