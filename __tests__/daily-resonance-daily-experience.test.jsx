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
import {
  getEventStartMs,
  getMessageTypingMs,
  STORYBOARD_TIMING,
} from '../app/lib/lucky-meter/storyboard';
import {
  getPaletteForSeasonKey,
  getSeasonForDateKey,
} from '../app/lib/lucky-meter/sparks-and-seasonal-colours';

const TODAY = '2026-11-18';

function readStored() {
  return JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY) || '{}');
}

/** The deterministic result for Math.random() === 0.5 with an empty history. */
function expectedResult() {
  return createDailyResult({ dateKey: TODAY, random: () => 0.5 });
}

function seedToday(extra = {}) {
  const result = { ...expectedResult(), createdAt: Date.now() };
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
      revealCompleted: true,
      messageCompleted: true,
      eventCompleted: true,
      sparkCompleted: true,
      stageDurationMs: 10_000,
      ...extra,
    }),
  );
  return result;
}

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Advances from the first frame to the moment the celebration mounts. */
function advanceToCelebration(message) {
  advance(STORYBOARD_TIMING.anticipationMs);
  advance(STORYBOARD_TIMING.generationMs + 30);
  advance(STORYBOARD_TIMING.settlePauseMs);
  advance(
    STORYBOARD_TIMING.segmentOpenMs +
      STORYBOARD_TIMING.fillMs +
      STORYBOARD_TIMING.fullHoldMs +
      STORYBOARD_TIMING.drainMs +
      STORYBOARD_TIMING.highlightMs +
      40,
  );
  advance(
    STORYBOARD_TIMING.messageDelayMs +
      getMessageTypingMs(message) +
      STORYBOARD_TIMING.messageHoldMs +
      STORYBOARD_TIMING.messageFadeMs +
      STORYBOARD_TIMING.eventDelayMs +
      80,
  );
  expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
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

  it('persists one seasonal result, then reveals it through every storyboard stage', () => {
    render(<DailyResonance />);
    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));

    // The complete reading is saved before any pixel moves.
    const stored = readStored();
    const result = stored.result;
    expect(stored.version).toBe(1);
    expect(stored.dateKey).toBe(TODAY);
    expect(result.season).toBe('autumn');
    expect(result.colour.hex).toBe(
      getPaletteForSeasonKey('autumn').find((colour) => colour.id === result.colour.id).hex,
    );
    expect(stored.history.percentages).toEqual([result.percentage]);
    expect(stored.history.numbers).toEqual([result.luckyNumber]);
    expect(stored.history.colours).toEqual([result.colour.id]);
    expect(stored.history.sparks).toEqual([result.spark.id]);
    expect(stored.revealCompleted).toBe(false);
    expect(stored.messageCompleted).toBe(false);
    expect(stored.eventCompleted).toBe(false);
    expect(stored.sparkCompleted).toBe(false);

    // Stage 3: the plaque is gone and the readout starts at the scale minimum.
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'spin');
    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute('data-value', '0');
    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute('data-plaque', 'hidden');
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();
    // The vessel surface mounts early so its renderer can warm up, but it is
    // hidden until its own stage opens.
    expect(screen.queryByTestId('lucky-colour-panel')).not.toBeVisible();

    advance(STORYBOARD_TIMING.anticipationMs);
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'spin');
    expect(screen.queryByText(String(result.percentage))).not.toBeInTheDocument();

    // The wheel and the percentage stop on the same frame.
    advance(STORYBOARD_TIMING.generationMs + 30);
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'landed');
    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(result.percentage),
    );
    expect(screen.getByText(result.tier.label)).toBeInTheDocument();

    // The segment opens and pours; the colour vessel fills first.
    advance(STORYBOARD_TIMING.settlePauseMs);
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'pouring');
    expect(screen.getByTestId('lucky-colour-panel')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-colour-panel')).toHaveAttribute('data-vessel-open', '0.00');
    expect(screen.getByText(result.colour.name)).toBeInTheDocument();
    expect(screen.getByText(result.colour.hex)).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();
    // The vessel is still closed, the fill is empty and the number stays hidden
    // for the whole drain.
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-number-reveal', '0.00');
    expect(screen.getByTestId('lucky-colour-panel')).toHaveAttribute('data-vessel-open', '0.00');
    expect(screen.getByTestId('lucky-colour-panel')).toHaveAttribute('data-vessel-fill', '0.000');
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();

    // The vessel fills to the top and is held full. The Lucky Number is still
    // hidden while the colour is arriving.
    advance(STORYBOARD_TIMING.segmentOpenMs + STORYBOARD_TIMING.fillMs + 30);
    const vessel = screen.getByTestId('lucky-colour-panel');
    expect(vessel).toHaveAttribute('data-vessel-phase', 'holding');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-number-reveal', '0.00');
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();

    // The drain begins. The number is not in its placard yet.
    advance(STORYBOARD_TIMING.fullHoldMs + STORYBOARD_TIMING.drainMs / 2);
    expect(vessel).toHaveAttribute('data-vessel-phase', 'draining');
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();

    // The drain completes: the vessel is empty and the number is whole. It
    // flashes, and the empty vessel is highlighted before the message.
    advance(STORYBOARD_TIMING.drainMs / 2 + 60);
    expect(vessel).toHaveAttribute('data-vessel-phase', 'empty');
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(result.luckyNumber),
    );
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute('data-flashing', 'true');
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();

    // The highlight finishes and the vessel beat hands off to the message.
    advance(STORYBOARD_TIMING.highlightMs + 60);
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'revealed');
    expect(vessel).toHaveAttribute('data-vessel-open', '1.00');
    expect(vessel).toHaveAttribute('data-vessel-fill', '0.000');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-number-reveal', '1.00');
    expect(screen.getByText(result.event.name)).toBeInTheDocument();

    // Frame 6: the exact tier message, written above the meter.
    advance(STORYBOARD_TIMING.messageDelayMs + STORYBOARD_TIMING.messageCharMs);
    expect(screen.getByTestId('lucky-tier-message')).toHaveAttribute('data-state', 'writing');

    advance(
      getMessageTypingMs(result.tier.message) -
        STORYBOARD_TIMING.messageCharMs +
        STORYBOARD_TIMING.messageHoldMs +
        STORYBOARD_TIMING.messageFadeMs +
        STORYBOARD_TIMING.eventDelayMs +
        80,
    );
    expect(screen.queryByTestId('lucky-tier-message')).not.toBeInTheDocument();
    const stage = screen.getByTestId('cosmic-event-stage');
    expect(stage).toHaveAttribute('data-event', result.event.id);
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();

    // The celebration ends, then the maple-leaf cursor writes the Spark.
    act(() => {
      stageControl.onComplete?.();
    });
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    // Nothing is written during the quiet beat.
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();

    advance(STORYBOARD_TIMING.sparkStartDelayMs + 40);
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'writing');
    expect(screen.getByTestId('lucky-spark-cursor')).toBeInTheDocument();

    advance(9000);
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'written');
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(
      result.spark.message.slice(0, 24),
    );

    // Frame 9: Home and the countdown arrive together, after the writing.
    const dock = screen.getByTestId('lucky-meter-home').parentElement;
    expect(dock).toContainElement(screen.getByTestId('lucky-meter-countdown'));
    expect(screen.getByText('07:30:00')).toBeInTheDocument();
    expect(readStored().revealCompleted).toBe(true);
    expect(readStored().messageCompleted).toBe(true);
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
    const result = readStored().result;
    advanceToCelebration(result.tier.message);
    first.unmount();

    render(<DailyResonance />);
    expect(screen.queryByRole('button', { name: /Reveal My Resonance/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(result.percentage),
    );
    expect(screen.getByText(result.colour.name)).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-event-stage')).toHaveAttribute('data-event', result.event.id);
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(readStored().result).toEqual(result);

    act(() => {
      stageControl.onComplete?.();
    });
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    advance(STORYBOARD_TIMING.sparkStartDelayMs + 40);
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'writing');
    advance(9000);
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(readStored().result).toEqual(result);
  });

  it('resumes the reveal after a refresh mid-pour instead of skipping to the reading', () => {
    const first = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    const before = readStored();
    advance(STORYBOARD_TIMING.anticipationMs + STORYBOARD_TIMING.generationMs + 600);
    expect(before.revealCompleted).toBe(false);
    first.unmount();

    render(<DailyResonance />);
    // The motions replay; the reading cannot have been redrawn.
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'spin');
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();
    advanceToCelebration(before.result.tier.message);
    expect(readStored().result).toEqual(before.result);

    act(() => {
      stageControl.onComplete?.();
    });
    advance(STORYBOARD_TIMING.sparkStartDelayMs + 40);
    advance(9000);
    expect(readStored().result).toEqual(before.result);
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
  });

  it('resumes the Spark writing after a refresh between the cinematic and the finale', () => {
    const result = seedToday({ eventCompleted: true, sparkCompleted: false });
    render(<DailyResonance />);

    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(result.percentage),
    );
    // The writing resumes at once: the sky is already still after the event.
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'writing');
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();

    advance(9000);
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'written');
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(readStored().sparkCompleted).toBe(true);
  });

  it('shows a completed result with its Spark and countdown without replaying anything', () => {
    const result = seedToday();
    render(<DailyResonance />);

    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(result.percentage),
    );
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(result.luckyNumber),
    );
    expect(screen.getByText(result.colour.name)).toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(
      result.spark.message.slice(0, 24),
    );
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-cursor')).not.toBeInTheDocument();
  });

  it('migrates a saved result without a Lucky Number exactly once', () => {
    const result = seedToday();
    const payload = JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY));
    delete payload.result.luckyNumber;
    delete payload.history.numbers;
    window.localStorage.setItem(METER_STORAGE_KEY, JSON.stringify(payload));

    const view = render(<DailyResonance />);
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(result.luckyNumber),
    );
    const migrated = readStored();
    expect(migrated.result.luckyNumber).toBe(result.luckyNumber);
    expect(migrated.result.colour.id).toBe(result.colour.id);
    expect(migrated.history.numbers).toEqual([result.luckyNumber]);

    // A refresh with a different random source keeps the migrated number.
    vi.spyOn(Math, 'random').mockReturnValue(0.91);
    view.unmount();
    render(<DailyResonance />);
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(result.luckyNumber),
    );
    expect(readStored().result.luckyNumber).toBe(result.luckyNumber);
  });

  it('rolls over to the welcome state when the local date changes in an open tab', () => {
    const view = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    advance(STORYBOARD_TIMING.anticipationMs + STORYBOARD_TIMING.generationMs + 6000);
    expect(screen.getByTestId('lucky-colour-panel')).toBeInTheDocument();

    countdown.state = { ...countdown.state, dateKey: '2026-11-19', formatted: '23:59:59' };
    act(() => {
      view.rerender(<DailyResonance />);
    });

    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-number-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
  });

  it('presents the whole reading calmly under reduced motion', () => {
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
      const result = readStored().result;
      expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute(
        'data-value',
        String(result.percentage),
      );
      expect(screen.getByTestId('lucky-number-value')).toHaveAttribute(
        'data-value',
        String(result.luckyNumber),
      );
      expect(screen.getByText(result.colour.name)).toBeInTheDocument();
      expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(
        result.spark.message.slice(0, 24),
      );
      expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
      expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
      expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
      expect(readStored().eventCompleted).toBe(true);
      expect(readStored().sparkCompleted).toBe(true);

      advance(60_000);
      expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
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
    expect(getSeasonForDateKey(TODAY)?.key).toBe('autumn');
  });

  it('sets the celebration start from the written tier message', () => {
    const result = expectedResult();
    expect(getEventStartMs(result.tier.message)).toBeGreaterThan(
      STORYBOARD_TIMING.anticipationMs + STORYBOARD_TIMING.generationMs,
    );
  });
});
