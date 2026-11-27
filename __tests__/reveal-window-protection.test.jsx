import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

/**
 * Guards `specs/191-reveal-window-protection`.
 *
 * The hub used to be held only once `stageActive` flipped, which happens after
 * the ~8 s spin pre-roll. These tests drive the real component and the real hub
 * to prove the hold is taken at the press, survives the pre-roll, releases on
 * completion, on unmount and on the safety margin, and never blocks critical or
 * intent preparation.
 */

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
    return <div data-testid="cosmic-event-stage" data-event={eventId} data-duration={durationMs} />;
  },
}));

import DailyResonance from '../components/DailyResonance';
import {
  isExperienceActive,
  prepareExperience,
  registerExperienceResources,
  registerResourceAdapter,
  resetResourceReadiness,
} from '../app/lib/resource-readiness';
import { getEventStartMs } from '../app/lib/lucky-meter/storyboard';

// Math.random() === 0.5 selects the medium tier, whose line is written first.
const EVENT_START_MS = getEventStartMs('Your luck is in the mid-range today.') + 200;

function registerBackgroundProbe(id) {
  const adapter = vi.fn(async () => ({ ok: true }));
  registerResourceAdapter('probe', adapter);
  registerExperienceResources({
    id,
    version: 1,
    dependsOn: [],
    resources: [{ id: `${id}-background`, kind: 'probe', url: `/${id}`, background: true }],
  });
  return adapter;
}

function registerCriticalProbe(id) {
  const adapter = vi.fn(async () => ({ ok: true }));
  registerResourceAdapter('probe-critical', adapter);
  registerExperienceResources({
    id,
    version: 1,
    dependsOn: [],
    resources: [{ id: `${id}-critical`, kind: 'probe-critical', url: `/${id}`, background: false }],
  });
  return adapter;
}

describe('Reveal window protection', () => {
  let originalRaf;
  let originalCancelRaf;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T12:00:00'));
    window.localStorage.clear();
    countdown.state = {
      ready: true,
      dateKey: '2026-11-18',
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
    resetResourceReadiness();
  });

  afterEach(() => {
    cleanup();
    resetResourceReadiness();
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCancelRaf;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('holds the hub foreground from the press, through the pre-roll', () => {
    render(<DailyResonance />);
    expect(isExperienceActive()).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /Start My Lucky Meter/i }));

    // No timers have advanced: `stageActive` is still false, yet the foreground
    // is already held, which is the gap the audit measured.
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(isExperienceActive()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(isExperienceActive()).toBe(true);
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
  });

  it('releases when the cinematic completes', () => {
    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Start My Lucky Meter/i }));
    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
    expect(isExperienceActive()).toBe(true);

    act(() => {
      stageControl.onComplete?.();
    });

    expect(isExperienceActive()).toBe(false);
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
  });

  it('holds queued background preparation until the cinematic finishes', async () => {
    const adapter = registerBackgroundProbe('probe-bg');
    render(<DailyResonance />);

    const preparation = prepareExperience('probe-bg', { priority: 'background' });
    await act(async () => {});
    expect(adapter).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Start My Lucky Meter/i }));
    registerExperienceResources({
      id: 'probe-bg-late',
      version: 1,
      dependsOn: [],
      resources: [
        { id: 'probe-bg-late-background', kind: 'probe', url: '/probe-bg-late', background: true },
      ],
    });
    const held = prepareExperience('probe-bg-late', { priority: 'background' });
    await act(async () => {});
    expect(adapter).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    await act(async () => {});
    expect(adapter).toHaveBeenCalledTimes(1);

    act(() => {
      stageControl.onComplete?.();
    });
    await act(async () => {});
    await preparation;

    const resumed = await held;
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(resumed.state).toBe('ready');
  });

  it('defers background-marked warm-up even when it is requested as critical', async () => {
    const adapter = registerBackgroundProbe('probe-route');
    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Start My Lucky Meter/i }));
    expect(isExperienceActive()).toBe(true);

    // The current-route preparation is requested at critical priority, but the
    // resource itself is marked background: it must not compete with the reveal.
    const held = prepareExperience('probe-route', { priority: 'critical' });
    await act(async () => {});
    expect(adapter).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    await act(async () => {});
    expect(adapter).not.toHaveBeenCalled();

    act(() => {
      stageControl.onComplete?.();
    });
    await act(async () => {});

    const snapshot = await held;
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(snapshot.state).toBe('ready');
  });

  it('keeps critical preparation unblocked during the reveal', async () => {
    const adapter = registerCriticalProbe('probe-critical');
    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Start My Lucky Meter/i }));
    expect(isExperienceActive()).toBe(true);

    const snapshot = await prepareExperience('probe-critical', { priority: 'critical' });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(snapshot.state).toBe('ready');
  });

  it('releases the foreground when the component unmounts mid-reveal', () => {
    const view = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Start My Lucky Meter/i }));
    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    expect(isExperienceActive()).toBe(true);

    view.unmount();
    expect(isExperienceActive()).toBe(false);
  });

  it('releases on the safety margin if completion never arrives', () => {
    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Start My Lucky Meter/i }));
    act(() => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    expect(isExperienceActive()).toBe(true);

    // The cinematic never reports completion; the bounded fallback still frees
    // the queue, so background work can never starve. The approved sequence is
    // longer than the superseded one, so the wait covers the full dock window
    // and its safety slack.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(isExperienceActive()).toBe(false);
  });
});
