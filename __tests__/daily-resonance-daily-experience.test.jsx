import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
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

vi.mock('../app/lib/lucky-meter/selection', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createDailyResult: vi.fn(actual.createDailyResult),
  };
});

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
import { METER_STORAGE_KEY } from '../app/lib/lucky-meter/config';
import { createDailyResult } from '../app/lib/lucky-meter/selection';
import { REVEAL_TIMING, EVENT_START_MS } from '../app/lib/lucky-meter/reveal';

const TODAY = '2026-11-18';

function readStored() {
  return JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY) || '{}');
}

/** The deterministic result for Math.random() === 0.5 with an empty history. */
function expectedResult(overrides = {}) {
  return {
    dateKey: TODAY,
    percentage: 53,
    tier: {
      id: 'medium',
      label: 'Medium Resonance',
      message: 'Your luck is in the mid-range today.',
    },
    event: { id: 'lightning', name: 'Cosmic Lightning' },
    luckyNumber: 26,
    colour: { id: 'cream', name: 'Cream', hex: '#F1E8D5', light: true },
    spark: {
      id: 'spark-16',
      message: 'Your attention is a gift; spend a little of it on something you love.',
    },
    ...overrides,
  };
}

function seedToday(overrides = {}, extra = {}) {
  const result = { ...expectedResult(overrides), createdAt: Date.now() };
  window.localStorage.setItem(
    METER_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      dateKey: TODAY,
      result,
      history: {
        percentages: [result.percentage],
        numbers: [result.luckyNumber],
        colours: [result.colour.id],
        sparks: [result.spark.id],
      },
      eventCompleted: true,
      sparkCompleted: true,
      stageDurationMs: 10_000,
      ...extra,
    }),
  );
  return result;
}

async function finishQuill() {
  act(() => {
    vi.advanceTimersByTime(8000);
  });
}

describe('Daily Resonance daily experience', () => {
  let originalRaf;
  let originalCancelRaf;

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
    window.requestAnimationFrame = vi.fn(() => 1);
    window.cancelAnimationFrame = vi.fn();
    stageControl.onComplete = null;
  });

  afterEach(() => {
    cleanup();
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCancelRaf;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('persists one result, settles the three motions, runs the cinematic, then writes the Spark', () => {
    render(<DailyResonance />);
    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));

    // The result is complete and saved before any animation runs.
    const stored = readStored();
    expect(stored.version).toBe(1);
    expect(stored.dateKey).toBe(TODAY);
    expect(stored.result.percentage).toBe(53);
    expect(stored.result.tier).toEqual(expectedResult().tier);
    expect(stored.result.event).toEqual({ id: 'lightning', name: 'Cosmic Lightning' });
    expect(stored.result.luckyNumber).toBe(26);
    expect(stored.result.colour).toEqual(expectedResult().colour);
    expect(stored.result.spark.id).toBe('spark-16');
    expect(stored.eventCompleted).toBe(false);
    expect(stored.sparkCompleted).toBe(false);
    expect(stored.history.percentages).toEqual([53]);
    expect(stored.history.numbers).toEqual([26]);
    expect(stored.history.colours).toEqual(['cream']);
    expect(stored.history.sparks).toEqual(['spark-16']);

    expect(screen.getByText(/Reading today/i)).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();
    // Nothing beyond the first settle has appeared yet.
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.percentageSettleMs);
    });
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByText('Medium Resonance')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-colour-panel')).not.toBeInTheDocument();

    // The independent Lucky Number settles next.
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.numberSettleMs - REVEAL_TIMING.percentageSettleMs);
    });
    expect(screen.getByTestId('lucky-number-panel')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '26');
    expect(screen.getByText('Lucky Number')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-colour-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();

    // The colour ring settles last and the remaining panels follow.
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.colourSettleMs - REVEAL_TIMING.numberSettleMs);
    });
    expect(screen.getByTestId('lucky-colour-panel')).toBeInTheDocument();
    expect(screen.getByText('Cream')).toBeInTheDocument();
    expect(screen.getByText('#F1E8D5')).toBeInTheDocument();
    expect(screen.getByText('Lucky Colour')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Lightning')).toBeInTheDocument();
    expect(screen.getByText(/not lottery predictions or promises of winning/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share My Resonance/i })).toBeInTheDocument();
    // The Spark area is reserved but the quill has not started.
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'waiting');
    expect(screen.queryByTestId('lucky-spark-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    // The countdown never appears before the Spark is finished.
    expect(screen.queryByText('Next Resonance In')).not.toBeInTheDocument();

    // Only after every settle does the percentage-selected cinematic start.
    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS - REVEAL_TIMING.colourSettleMs);
    });
    const stage = screen.getByTestId('cosmic-event-stage');
    expect(stage).toHaveAttribute('data-event', 'lightning');
    const duration = Number(stage.getAttribute('data-duration'));
    expect(duration).toBeGreaterThanOrEqual(9500);
    expect(duration).toBeLessThanOrEqual(10500);

    // The cinematic is still running: no quill, no countdown.
    expect(screen.queryByTestId('lucky-spark-quill')).not.toBeInTheDocument();

    act(() => {
      stageControl.onComplete?.();
    });
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    // Home returns with the cinematic, but the countdown waits for the quill.
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'writing');

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.sparkStartDelayMs + REVEAL_TIMING.sparkMsPerCharacter * 6);
    });
    expect(screen.getByTestId('lucky-spark-quill')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'written');
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(/Your attention is a gift/i);
    expect(screen.queryByTestId('lucky-spark-quill')).not.toBeInTheDocument();
    // Now — and only now — the countdown appears beneath Home.
    const dock = screen.getByTestId('lucky-meter-home').parentElement;
    expect(dock).toContainElement(screen.getByTestId('lucky-meter-countdown'));
    expect(screen.getByText('07:30:00')).toBeInTheDocument();
    expect(readStored().eventCompleted).toBe(true);
    expect(readStored().sparkCompleted).toBe(true);
  });

  it('keeps the page usable when a daily result cannot be created', () => {
    vi.mocked(createDailyResult).mockImplementationOnce(() => {
      throw new Error('Corrupt local date');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));

    expect(screen.getByRole('button', { name: /Reveal My Resonance/i })).toBeInTheDocument();
    expect(screen.queryByText(/Reading today/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(METER_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(/could not be prepared/i);
  });

  it('resumes an unfinished cinematic after refresh without rerolling the selections', () => {
    const first = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.colourSettleMs);
    });
    expect(screen.getByText('53')).toBeInTheDocument();
    first.unmount();

    // The cinematic never finished: the same result returns and the event
    // resumes. Home stays hidden and the countdown is still absent.
    render(<DailyResonance />);
    expect(screen.queryByRole('button', { name: /Reveal My Resonance/i })).not.toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '26');
    expect(screen.getByText('Cream')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    expect(readStored().result.luckyNumber).toBe(26);

    act(() => {
      stageControl.onComplete?.();
    });
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'writing');
    expect(readStored().sparkCompleted).toBe(false);

    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'written');
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(readStored().sparkCompleted).toBe(true);
  });

  it('resumes the quill after a refresh between the cinematic and the Spark writing', () => {
    seedToday({}, { eventCompleted: true, sparkCompleted: false });
    render(<DailyResonance />);

    // No cinematic replay: the event already finished.
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'writing');
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(/Your attention is a gift/i);
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(readStored().sparkCompleted).toBe(true);
  });

  it('shows a completed result with its Spark and countdown without replaying anything', () => {
    seedToday();
    render(<DailyResonance />);

    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '26');
    expect(screen.getByText('Cream')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(/Your attention is a gift/i);
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-quill')).not.toBeInTheDocument();
  });

  it('migrates a saved result without a Lucky Number exactly once', () => {
    const result = seedToday();
    const payload = JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY));
    delete payload.result.luckyNumber;
    delete payload.history.numbers;
    window.localStorage.setItem(METER_STORAGE_KEY, JSON.stringify(payload));

    const view = render(<DailyResonance />);
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '26');
    const migrated = readStored();
    expect(migrated.result.luckyNumber).toBe(26);
    expect(migrated.result.percentage).toBe(result.percentage);
    expect(migrated.result.colour.id).toBe(result.colour.id);
    expect(migrated.result.spark.id).toBe(result.spark.id);
    expect(migrated.history.numbers).toEqual([26]);

    // A refresh with a different random source keeps the migrated number.
    vi.spyOn(Math, 'random').mockReturnValue(0.91);
    view.unmount();
    render(<DailyResonance />);
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '26');
    expect(readStored().result.luckyNumber).toBe(26);
  });

  it('rolls over when the local date changes in an open tab', () => {
    const view = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.colourSettleMs);
    });
    expect(screen.getByText('53')).toBeInTheDocument();

    countdown.state = { ...countdown.state, dateKey: '2026-11-19', formatted: '23:59:59' };
    act(() => {
      view.rerender(<DailyResonance />);
    });

    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
  });

  it('presents the result calmly under reduced motion and shows the countdown at once', () => {
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

      // No spins and no cinematic: every value is final immediately.
      expect(screen.getByText('53')).toBeInTheDocument();
      expect(screen.getByTestId('lucky-number-value')).toHaveAttribute('data-value', '26');
      expect(screen.getByText('Cream')).toBeInTheDocument();
      expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(/Your attention is a gift/i);
      expect(screen.queryByText(/Reading today/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
      expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
      expect(readStored().eventCompleted).toBe(true);
      expect(readStored().sparkCompleted).toBe(true);

      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
      expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(/Your attention is a gift/i);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('keeps the countdown updating independently once it is visible', () => {
    seedToday();
    const view = render(<DailyResonance />);
    expect(screen.getByText('07:30:00')).toBeInTheDocument();

    countdown.state = { ...countdown.state, formatted: '06:59:59' };
    act(() => {
      view.rerender(<DailyResonance />);
    });

    expect(screen.getByText('06:59:59')).toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
  });
});
