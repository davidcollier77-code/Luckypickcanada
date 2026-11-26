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
import { METER_STORAGE_KEY } from '../app/lib/lucky-meter/config';
import { createDailyResult } from '../app/lib/lucky-meter/selection';
import {
  appendResultToHistory,
  emptyMeterHistory,
  saveMeterState,
} from '../app/lib/lucky-meter/storage';
import {
  CELEBRATION_MS,
  PERCENTAGE_START_MS,
  REVEAL_COMPLETE_MS,
  getMessageTypingMs,
  getSparkWritingMs,
  STORYBOARD_TIMING,
} from '../app/lib/lucky-meter/storyboard';

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
    revealCompleted: completed,
    messageCompleted: completed,
    eventCompleted: completed,
    sparkCompleted,
    stageDurationMs: 10_000,
  });
  return result;
}

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function advanceToRevealed() {
  // The wheel, the independent percentage, the pour, the number pause and the
  // golden transfer have all completed; the sentence has been written and the
  // celebration has started.
  advance(REVEAL_COMPLETE_MS + 4000);
}

function advanceToCelebration(message) {
  advance(
    REVEAL_COMPLETE_MS +
      STORYBOARD_TIMING.messageDelayMs +
      getMessageTypingMs(message) +
      STORYBOARD_TIMING.messageHoldMs +
      STORYBOARD_TIMING.messageSettleMs +
      STORYBOARD_TIMING.eventDelayMs +
      120,
  );
}

function finishSpark(sparkMessage) {
  // The writing mounts after the sky's pause, so let that render settle before
  // advancing its character clock.
  advance(STORYBOARD_TIMING.sparkStartDelayMs + 40);
  advance(getSparkWritingMs(sparkMessage) + 100);
  advance(STORYBOARD_TIMING.dockDelayMs + 60);
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

  it('shows the meter, Home and Start in the welcome state without a reading', () => {
    render(<DailyResonance />);

    expect(screen.getByRole('heading', { name: /AWAKEN TODAY/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reveal My Resonance/i })).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'idle');
    expect(screen.getByTestId('lucky-meter-start')).toHaveAttribute('data-ready', 'false');

    // Home is present from the first frame; the countdown belongs to the end
    // of the reading and must not be shown yet.
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();

    // Nothing that could reveal or suggest today's reading.
    expect(screen.queryByTestId('lucky-meter-value')).not.toBeInTheDocument();
    expect(screen.queryByText(/Lucky Number/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();
  });

  it('shows Start only after the arrival breeze has cleared the leaves', () => {
    render(<DailyResonance />);
    const start = screen.getByTestId('lucky-meter-start');
    expect(start).toHaveAttribute('data-ready', 'false');
    expect(screen.getByRole('button', { name: /Reveal My Resonance/i })).toHaveAttribute(
      'tabindex',
      '-1',
    );

    advance(6000);
    expect(start).toHaveAttribute('data-ready', 'true');
    expect(screen.getByRole('button', { name: /Reveal My Resonance/i })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  it('keeps Home and the countdown away until the Spark has finished, then docks both', () => {
    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    const result = readStoredResult().result;

    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'spin');
    expect(readStoredResult().revealCompleted).toBe(false);

    advanceToRevealed();
    expect(screen.getByTestId('lucky-number-panel')).toBeInTheDocument();
    expect(screen.getByText(result.colour.name)).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    // The sentence finished and was removed before the cinematic.
    expect(readStoredResult().messageCompleted).toBe(true);

    advanceToCelebration(result.tier.message);
    expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    // The temporary tier line is gone before the celebration's first frame.
    expect(screen.queryByTestId('lucky-tier-message')).not.toBeInTheDocument();

    act(() => {
      stageControl.onComplete?.();
    });
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    // The sky holds before the Spark; Home still waits.
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();
    expect(readStoredResult().eventCompleted).toBe(true);
    expect(readStoredResult().sparkCompleted).toBe(false);

    advance(STORYBOARD_TIMING.sparkStartDelayMs + 40);
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'writing');

    advance(getSparkWritingMs(result.spark.message) + 100);
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'written');
    // The dock still waits for its own settle beat.
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();

    advance(STORYBOARD_TIMING.dockDelayMs + 60);
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(readStoredResult().sparkCompleted).toBe(true);
    // FINISHED does not bring the temporary sentence back; the Spark and the
    // results own the sky.
    expect(screen.queryByTestId('lucky-tier-message')).not.toBeInTheDocument();
  });

  it('resumes the stored cinematic after a refresh mid-cinematic', () => {
    const first = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    const result = readStoredResult().result;
    advanceToCelebration(result.tier.message);
    const originalDuration = screen
      .getByTestId('cosmic-event-stage')
      .getAttribute('data-duration');
    expect(originalDuration).toBeTruthy();
    first.unmount();

    render(<DailyResonance />);

    expect(screen.queryByRole('button', { name: /Reveal My Resonance/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(result.percentage),
    );
    expect(screen.getByTestId('lucky-number-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
    expect(screen.getByTestId('cosmic-event-stage')).toHaveAttribute(
      'data-duration',
      originalDuration,
    );

    act(() => {
      stageControl.onComplete?.();
    });
    finishSpark(result.spark.message);
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(readStoredResult().eventCompleted).toBe(true);
    expect(readStoredResult().sparkCompleted).toBe(true);
  });

  it('replays the reveal motions after a refresh mid-reveal instead of skipping them', () => {
    const first = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    advance(PERCENTAGE_START_MS + 500);
    const before = readStoredResult();
    expect(before.revealCompleted).toBe(false);
    first.unmount();

    render(<DailyResonance />);

    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'spin');
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reveal My Resonance/i })).not.toBeInTheDocument();

    advanceToCelebration(before.result.tier.message);
    expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
    expect(readStoredResult().result).toEqual(before.result);
    expect(readStoredResult().history).toEqual(before.history);
  });

  it('keeps Home in the upper-right corner controls, not in the results row', () => {
    render(<DailyResonance />);

    const dock = screen.getByTestId('lucky-meter-dock');
    expect(dock).toHaveClass('lucky-finish-controls');
    expect(dock).toContainElement(screen.getByTestId('lucky-meter-home'));
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    // The corner overlay is independent of the results column.
    expect(dock).not.toContainElement(screen.getByTestId('lucky-meter-ring'));
  });

  it('shows Home and the countdown immediately for a fully completed restored result', () => {
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
    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'written');
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-tier-message')).not.toBeInTheDocument();
  });

  it('restarts a refresh celebration for the full 12,000 ms regardless of a stored duration (D12)', () => {
    const result = createDailyResult({ dateKey: TODAY, random: () => 0.5 });
    const history = appendResultToHistory(emptyMeterHistory(), result);
    saveMeterState({
      result,
      history,
      revealCompleted: true,
      messageCompleted: true,
      eventCompleted: false,
      sparkCompleted: false,
      // A legacy in-window duration from the superseded per-tier clock.
      stageDurationMs: 9500,
    });

    render(<DailyResonance />);

    const stage = screen.getByTestId('cosmic-event-stage');
    expect(Number(stage.getAttribute('data-duration'))).toBe(12_000);
    expect(CELEBRATION_MS).toBe(12_000);
    // The celebration is mounted from its first frame, not resumed mid-run.
    expect(stage).toHaveAttribute('data-event', result.event.id);
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();
  });

  it('treats an old payload without lifecycle fields as unfinished and resumes safely', () => {
    const result = seedToday();
    const payload = JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY));
    delete payload.eventCompleted;
    delete payload.sparkCompleted;
    delete payload.stageDurationMs;
    delete payload.revealCompleted;
    delete payload.messageCompleted;
    window.localStorage.setItem(METER_STORAGE_KEY, JSON.stringify(payload));

    render(<DailyResonance />);

    // Without the newer fields the reveal is treated as unfinished, so the
    // motions play on the stored values before the stored cinematic resumes.
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'spin');
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-home')).not.toBeInTheDocument();

    advanceToCelebration(result.tier.message);
    expect(screen.getByTestId('cosmic-event-stage')).toBeInTheDocument();
    expect(readStoredResult().revealCompleted).toBe(true);
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

    const result = readStoredResult().result;
    expect(screen.getByTestId('lucky-meter-value')).toHaveAttribute(
      'data-value',
      String(result.percentage),
    );
    expect(screen.getByTestId('lucky-number-value')).toHaveAttribute(
      'data-value',
      String(result.luckyNumber),
    );
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(
      result.spark.message.slice(0, 24),
    );
    expect(screen.queryByTestId('cosmic-event-stage')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-countdown')).toBeInTheDocument();
    expect(readStoredResult().eventCompleted).toBe(true);
    expect(readStoredResult().sparkCompleted).toBe(true);
  });

  it('replays a refresh during the tier message from its first character', () => {
    const result = createDailyResult({ dateKey: TODAY, random: () => 0.5 });
    const history = appendResultToHistory(emptyMeterHistory(), result);
    saveMeterState({
      result,
      history,
      revealCompleted: true,
      messageCompleted: false,
      eventCompleted: false,
      sparkCompleted: false,
      stageDurationMs: 10_000,
    });

    render(<DailyResonance />);

    // The interrupted sentence must not appear complete before it is retyped.
    expect(screen.queryByTestId('lucky-tier-message')).not.toBeInTheDocument();

    advance(STORYBOARD_TIMING.messageDelayMs + 100);
    // The message mounts at the end of that timer batch; its first character
    // tick is scheduled by the mount effect, so advance one more character.
    advance(STORYBOARD_TIMING.messageCharMs + 10);

    const message = screen.getByTestId('lucky-tier-message');
    expect(message).toHaveAttribute('data-state', 'writing');
    expect(message).toHaveAttribute('data-settled', 'false');
    const visible = screen.getByTestId('lucky-tier-message-visible').textContent ?? '';
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(Array.from(result.tier.message).length);
    expect(result.tier.message.startsWith(visible)).toBe(true);
  });

  it('shows the tier line for a legacy reading restored under reduced motion', () => {
    const result = seedToday();
    const payload = JSON.parse(window.localStorage.getItem(METER_STORAGE_KEY));
    delete payload.eventCompleted;
    delete payload.revealCompleted;
    delete payload.messageCompleted;
    delete payload.sparkCompleted;
    delete payload.stageDurationMs;
    window.localStorage.setItem(METER_STORAGE_KEY, JSON.stringify(payload));

    window.matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    render(<DailyResonance />);

    const message = screen.getByTestId('lucky-tier-message');
    expect(message).toHaveAttribute('data-state', 'holding');
    expect(message).toHaveAttribute('data-settled', 'true');
    expect(screen.getByTestId('lucky-tier-message-visible')).toHaveTextContent(result.tier.message);
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
  });

  it('returns to the welcome state after local midnight', () => {
    const view = render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    const result = readStoredResult().result;
    advanceToCelebration(result.tier.message);
    act(() => {
      stageControl.onComplete?.();
    });
    finishSpark(result.spark.message);
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
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-phase', 'idle');
    // A new day returns to the welcome state: Home is still available, but the
    // previous reading's countdown is gone with the reading itself.
    expect(screen.getByTestId('lucky-meter-home')).toBeInTheDocument();
    expect(screen.queryByTestId('lucky-meter-countdown')).not.toBeInTheDocument();
    expect(screen.queryByText(/Lucky Number/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('lucky-spark-finale')).not.toBeInTheDocument();
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
    const pictureBlock = source.slice(source.indexOf('<picture'), source.indexOf('</picture>'));
    expect(pictureBlock).not.toMatch(/filter:|mix-blend|opacity-|brightness|saturate|contrast/);
    expect(source).not.toMatch(/webgpu|WebGPU/);
  });
});
