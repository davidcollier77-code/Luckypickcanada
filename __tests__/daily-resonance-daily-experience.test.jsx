import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import React from 'react';

const countdown = vi.hoisted(() => ({
  state: {
    ready: true,
    dateKey: '2026-11-14',
    formatted: '07:30:00',
    now: 0,
    deadlineMs: 0,
    remainingMs: 0,
  },
}));

vi.mock('../components/daily-reset-countdown', () => ({
  useDailyResetCountdown: () => countdown.state,
}));

vi.mock('../app/lib/audio', () => ({
  playButtonClick: vi.fn(() => Promise.resolve()),
}));

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(function MockHowl() {
    this.play = vi.fn();
    this.volume = vi.fn();
    this.rate = vi.fn();
    this.fade = vi.fn();
    this.stop = vi.fn();
    this.unload = vi.fn();
    this.playing = vi.fn(() => false);
  }),
}));

vi.mock('../components/CosmicEventStage', () => ({
  default: ({ eventId, durationMs }) => (
    <div data-testid="cosmic-event-stage" data-event={eventId} data-duration={durationMs} />
  ),
}));

import DailyResonance from '../components/DailyResonance';
import { METER_STORAGE_KEY } from '../app/lib/lucky-meter/config';
import { REVEAL_TIMING } from '../app/lib/lucky-meter/reveal';

const TODAY = '2026-11-14';

function readStoredResult() {
  return JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY) || '{}');
}

describe('Daily Resonance daily experience', () => {
  let originalRaf;
  let originalCancelRaf;

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    countdown.state = {
      ready: true,
      dateKey: TODAY,
      formatted: '07:30:00',
      now: 0,
      deadlineMs: 0,
      remainingMs: 0,
    };
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ visits: 7 }) }));
    originalRaf = window.requestAnimationFrame;
    originalCancelRaf = window.cancelAnimationFrame;
    window.requestAnimationFrame = vi.fn(() => 1);
    window.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    cleanup();
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCancelRaf;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('persists one complete result before the reveal, then stages the reveal beats', () => {
    render(<DailyResonance />);
    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Reading today/i)).toBeInTheDocument();

    // Deterministic Math.random = 0.5 produces 53% Medium / Lightning / Cream / spark-16.
    const stored = readStoredResult();
    expect(stored.version).toBe(1);
    expect(stored.dateKey).toBe(TODAY);
    expect(stored.result.percentage).toBe(53);
    expect(stored.result.tier.label).toBe('Medium Resonance');
    expect(stored.result.event).toEqual({
      id: 'lightning',
      name: 'Cosmic Lightning',
      numbers: [11, 22, 33],
    });
    expect(stored.result.colour).toEqual({ id: 'cream', name: 'Cream', hex: '#F1E8D5' });
    expect(stored.result.spark.id).toBe('spark-16');
    expect(stored.history.percentages).toEqual([53]);
    expect(screen.queryByText('Your Lucky Numbers')).not.toBeInTheDocument();

    // Landing at 4.5s: the real percentage and tier appear.
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.scrambleMs - 1000);
    });
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Medium Resonance')).toBeInTheDocument();
    expect(screen.getByText('Your luck is in the mid-range today.')).toBeInTheDocument();
    expect(screen.queryByText('Your Lucky Numbers')).not.toBeInTheDocument();

    // +0.8s: colour, numbers, Little Spark and event.
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.detailsDelayMs);
    });
    expect(screen.getByText('Your Lucky Numbers')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('33')).toBeInTheDocument();
    expect(screen.getByText('Cream')).toBeInTheDocument();
    expect(screen.getByText('#F1E8D5')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Lightning')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(stored.result.spark.message.slice(0, 24)))).toBeInTheDocument();
    expect(screen.getByText(/not lottery predictions or promises of winning/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share My Resonance/i })).toBeInTheDocument();
    expect(screen.getByText('Next Resonance In')).toBeInTheDocument();
    expect(screen.getByText('07:30:00')).toBeInTheDocument();
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();

    // +0.6s: the cinematic event starts for the selected event's duration.
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.eventDelayMs);
    });
    const stage = screen.getByTestId('cosmic-event-stage');
    expect(stage).toHaveAttribute('data-event', 'lightning');
    expect(Number(stage.getAttribute('data-duration'))).toBeGreaterThanOrEqual(9500);
    expect(Number(stage.getAttribute('data-duration'))).toBeLessThanOrEqual(10500);
  });

  it('restores the persisted result after a refresh without replaying the reveal', () => {
    const first = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    act(() => {
      vi.advanceTimersByTime(
        REVEAL_TIMING.scrambleMs + REVEAL_TIMING.detailsDelayMs,
      );
    });
    expect(screen.getByText('53')).toBeInTheDocument();
    first.unmount();

    render(<DailyResonance />);
    expect(screen.queryByRole('button', { name: /Reveal My Resonance/i })).not.toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Your Lucky Numbers')).toBeInTheDocument();
    expect(screen.getByText('07:30:00')).toBeInTheDocument();
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
  });

  it('rolls over when the local date changes in an open tab', () => {
    const view = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    act(() => {
      vi.advanceTimersByTime(
        REVEAL_TIMING.scrambleMs + REVEAL_TIMING.detailsDelayMs,
      );
    });
    expect(screen.getByText('53')).toBeInTheDocument();

    countdown.state = { ...countdown.state, dateKey: '2026-11-15', formatted: '23:59:59' };
    act(() => {
      view.rerender(<DailyResonance />);
    });

    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();
    expect(screen.queryByText('Your Lucky Numbers')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share My Resonance/i })).not.toBeInTheDocument();
  });

  it('updates the countdown independently while the result stays visible', () => {
    const view = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    act(() => {
      vi.advanceTimersByTime(
        REVEAL_TIMING.scrambleMs + REVEAL_TIMING.detailsDelayMs,
      );
    });
    expect(screen.getByText('07:30:00')).toBeInTheDocument();

    countdown.state = { ...countdown.state, formatted: '06:59:59' };
    act(() => {
      view.rerender(<DailyResonance />);
    });

    expect(screen.getByText('06:59:59')).toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Your Lucky Numbers')).toBeInTheDocument();
  });

  it('presents the result calmly under reduced motion and skips the cinematic stage', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    try {
      render(<DailyResonance />);
      act(() => {});
      fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));

      // No scramble: the real result and every detail appear immediately.
      expect(screen.getByText('53')).toBeInTheDocument();
      expect(screen.getByText('Your Lucky Numbers')).toBeInTheDocument();
      expect(screen.queryByText(/Reading today/i)).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(REVEAL_TIMING.scrambleMs + 1000);
      });
      expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
      expect(screen.getByText('Your Lucky Numbers')).toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
