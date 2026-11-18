import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

const countdown = vi.hoisted(() => ({
  state: {
    ready: true,
    dateKey: '2026-11-18',
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
    this.play = vi.fn(() => 1);
    this.volume = vi.fn();
    this.rate = vi.fn();
    this.fade = vi.fn();
    this.stop = vi.fn();
    this.unload = vi.fn();
    this.playing = vi.fn(() => false);
  }),
}));

const stageControl = vi.hoisted(() => ({ onComplete: null }));

vi.mock('../components/CosmicEventStage', () => ({
  default: ({ eventId, durationMs, onComplete }) => {
    stageControl.onComplete = onComplete;
    return (
      <div data-testid="cosmic-event-stage" data-event={eventId} data-duration={durationMs} />
    );
  },
}));

import DailyResonance from '../components/DailyResonance';
import { EVENTS_BY_ID, METER_STORAGE_KEY } from '../app/lib/lucky-meter/config';
import { createDailyResult } from '../app/lib/lucky-meter/selection';
import { appendResultToHistory, emptyMeterHistory, saveMeterState } from '../app/lib/lucky-meter/storage';
import { EVENT_START_MS, REVEAL_TIMING } from '../app/lib/lucky-meter/reveal';

const TODAY = '2026-11-18';

function readStoredResult() {
  return JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY) || '{}');
}

function seedToday({ completed = true, sparkCompleted = true } = {}) {
  const result = createDailyResult({ dateKey: TODAY, random: () => 0.5 });
  const history = appendResultToHistory(emptyMeterHistory(), result);
  saveMeterState({
    result,
    history,
    eventCompleted: completed,
    sparkCompleted,
    stageDurationMs: 10_000,
  });
  return result;
}

describe('Lucky Meter cinematic lifecycle', () => {
  let originalRaf;
  let originalCancelRaf;
  let originalMatchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T12:00:00'));
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
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ visits: 7 }) }),
    );
    originalRaf = window.requestAnimationFrame;
    originalCancelRaf = window.cancelAnimationFrame;
    originalMatchMedia = window.matchMedia;
    window.requestAnimationFrame = vi.fn(() => 1);
    window.cancelAnimationFrame = vi.fn();
    stageControl.onComplete = null;
  });

  afterEach(() => {
    cleanup();
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCancelRaf;
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the circular meter and Home in the welcome state without exposing the result', () => {
    render(<DailyResonance />);

    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reveal My Resonance/i })).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'idle');

    const home = screen.getByTestId('lucky-meter-home');
    expect(home).toHaveAttribute('aria-label', 'Return to Home');
    expect(home.parentElement?.className).toMatch(/right-3/);
    expect(home.parentElement?.className).toMatch(/top-3/);

    // Nothing that could reveal or suggest today's reading.
    expect(screen.queryByText('53')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium Resonance')).not.toBeInTheDocument();
    expect(screen.queryByText(/Lucky Number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();
  });

  it('hides Home from Start until the cinematic finishes, then persists completion', () => {
    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));

    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'scrambling');
    expect(readStoredResult().eventCompleted).toBe(false);

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.percentageSettleMs);
    });
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Medium Resonance')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'landed');
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.numberSettleMs - REVEAL_TIMING.percentageSettleMs);
    });
    expect(screen.getByText('Lucky Number')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'landed');
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.colourSettleMs - REVEAL_TIMING.numberSettleMs);
    });
    expect(screen.getByText('Cream')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS - REVEAL_TIMING.colourSettleMs);
    });
    expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();

    act(() => {
      stageControl.onComplete?.();
    });

    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    // The countdown still waits for the GoldenLeaf to finish writing.
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    expect(readStoredResult().eventCompleted).toBe(true);
    expect(readStoredResult().sparkCompleted).toBe(false);
  });

  it('keeps Home hidden and resumes the stored event after a refresh mid-cinematic', () => {
    const first = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    const originalDuration = screen
      .getByTestId('cosmic-event-stage')
      .getAttribute('data-duration');
    expect(originalDuration).toBeTruthy();
    first.unmount();

    render(<DailyResonance />);

    expect(screen.queryByRole('button', { name: /Reveal My Resonance/i })).not.toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Lucky Number')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.getByTestId('cosmic-event-stage')).toHaveAttribute(
      'data-duration',
      originalDuration,
    );

    act(() => {
      stageControl.onComplete?.();
    });
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(readStoredResult().eventCompleted).toBe(true);
  });

  it('shows Home and the countdown immediately for a fully completed restored result', () => {
    seedToday({ completed: true, sparkCompleted: true });
    render(<DailyResonance />);

    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Lucky Number')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'written');
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
  });

  it('replaces an out-of-window stored duration so the finale is never truncated', () => {
    const result = createDailyResult({ dateKey: TODAY, random: () => 0.5 });
    const history = appendResultToHistory(emptyMeterHistory(), result);
    saveMeterState({
      result,
      history,
      eventCompleted: false,
      sparkCompleted: false,
      stageDurationMs: 2000,
    });

    render(<DailyResonance />);

    const duration = Number(
      screen.getByTestId('cosmic-event-stage').getAttribute('data-duration'),
    );
    const eventWindow = EVENTS_BY_ID.get(result.event.id);
    expect(duration).not.toBe(2000);
    expect(duration).toBeGreaterThanOrEqual(eventWindow.minDurationMs);
    expect(duration).toBeLessThanOrEqual(eventWindow.maxDurationMs);
  });

  it('treats an old payload without lifecycle fields as unfinished and resumes safely', () => {
    const result = seedToday({ completed: true, sparkCompleted: true });
    const payload = JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY));
    delete payload.eventCompleted;
    delete payload.sparkCompleted;
    delete payload.stageDurationMs;
    window.localStorage.setItem(METER_STORAGE_KEY, JSON.stringify(payload));

    render(<DailyResonance />);

    expect(screen.getByText(String(result.percentage))).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
  });

  it('completes calmly under reduced motion without mounting the stage', () => {
    window.matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));

    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Lucky Number')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(/Your attention is a gift/i);
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(readStoredResult().eventCompleted).toBe(true);
    expect(readStoredResult().sparkCompleted).toBe(true);
  });

  it('returns to the welcome state with Home available after local midnight', () => {
    const view = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    act(() => {
      stageControl.onComplete?.();
    });
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();

    countdown.state = {
      ...countdown.state,
      dateKey: '2026-11-19',
      formatted: '23:59:59',
    };
    act(() => {
      view.rerender(<DailyResonance />);
    });

    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'idle');
    expect(screen.queryByText('Lucky Number')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
  });

  it('never renders Home in the compact widget', () => {
    render(<DailyResonance isCompact />);
    expect(screen.getByTestId('lucky-meter-ring')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
  });

  it('leaves the Milky Way picture, position and overlay unchanged', () => {
    const source = readFileSync(join(process.cwd(), 'components/DailyResonance.tsx'), 'utf8');

    expect(source).toContain('/images/lucky-meter-night-sky-640w.avif 640w');
    expect(source).toContain('/images/lucky-meter-night-sky-1024w.avif 1024w');
    expect(source).toContain('/images/lucky-meter-night-sky.avif 1400w');
    expect(source).toContain('/images/lucky-meter-night-sky-640w.webp 640w');
    expect(source).toContain('/images/lucky-meter-night-sky-1024w.webp 1024w');
    expect(source).toContain('/images/lucky-meter-night-sky.webp 1400w');
    expect(source).toContain('sizes="100vw"');
    expect(source).toContain('style={{ objectPosition: "center 40%" }}');
    expect(source).toContain('object-cover -z-20 pointer-events-none');
    expect(source).toContain('bg-slate-950/40');
    // No filter, blend or transform is applied to the artwork wrapper.
    const pictureBlock = source.slice(source.indexOf('<picture'), source.indexOf('</picture>'));
    expect(pictureBlock).not.toMatch(/filter:|mix-blend|opacity-|brightness|saturate|contrast/);
    // No new artwork or engine was introduced for the medallion.
    expect(source).not.toMatch(/webgpu|WebGPU/);
  });
});
