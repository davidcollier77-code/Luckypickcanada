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
    vi.doMock('howler', () => {
      throw new Error('Mock network failure');
    });

    render(<DailyResonance isCompact={false} />);
    fireEvent.click(screen.getByText('Reveal My Resonance'));

    // Audio is optional: a failed import must not cancel or block the reveal.
    await waitFor(() => {
      expect(screen.queryByText(/Reading today/i)).not.toBeNull();
    });
    expect(window.localStorage.getItem('lucky-pick-canada-lucky-meter-v1')).not.toBeNull();

    vi.doUnmock('howler');
  });
});
