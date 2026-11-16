import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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

const howls = vi.hoisted(() => []);

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(function MockHowl(options) {
    this.src = options?.src?.[0] ?? '';
    this.play = vi.fn(() => 1);
    this.volume = vi.fn();
    this.rate = vi.fn();
    this.fade = vi.fn();
    this.stop = vi.fn();
    this.unload = vi.fn();
    this.playing = vi.fn(() => false);
    howls.push(this);
  }),
}));

const stageControl = vi.hoisted(() => ({ onCue: null, onComplete: null }));

vi.mock('../components/CosmicEventStage', () => ({
  default: ({ eventId, durationMs, onCue, onComplete }) => {
    stageControl.onCue = onCue;
    stageControl.onComplete = onComplete;
    return (
      <div data-testid="cosmic-event-stage" data-event={eventId} data-duration={durationMs} />
    );
  },
}));

import DailyResonance from '../components/DailyResonance';
import { EVENT_START_MS } from '../app/lib/lucky-meter/reveal';

const soundFor = (file) => howls.find((sound) => sound.src.endsWith(file));
// The buildup charge is a reveal cue fired on Start, not an event action.
const eventSounds = () =>
  howls.filter((sound) => !sound.src.endsWith('starship-rail-gun-charge-35904.mp3'));

describe('Lucky Meter event cue playback', () => {
  let originalRaf;
  let originalCancelRaf;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T12:00:00'));
    window.localStorage.clear();
    howls.length = 0;
    stageControl.onCue = null;
    stageControl.onComplete = null;
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ visits: 3 }) }),
    );
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

  async function startEvent() {
    render(<DailyResonance />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal My Resonance/i }));
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(EVENT_START_MS);
    });
    expect(stageControl.onCue).toBeTypeOf('function');
  }

  it('plays no event cue before the cinematic starts', async () => {
    await startEvent();
    // The stage is mounted, but the engine has not emitted anything yet. Only
    // the buildup cue has run, and that belongs to the reveal, not the event.
    for (const sound of eventSounds()) {
      expect(sound.play).not.toHaveBeenCalled();
    }
  });

  it('plays one crisp pop per regular burst and a deeper layered finale', async () => {
    await startEvent();
    const burst = soundFor('freesound_community-fireworks-1-94483.mp3');
    const finale = soundFor('lucky-meter-finale-boom.wav');

    act(() => stageControl.onCue('firework-burst'));
    expect(burst.play).toHaveBeenCalledTimes(1);
    expect(burst.volume).toHaveBeenCalledWith(0.55, 1);
    expect(burst.rate).toHaveBeenCalledWith(1.08, 1);

    act(() => stageControl.onCue('finale-boom'));
    // The finale adds the recorded boom and a second, slower body layer.
    expect(finale.play).toHaveBeenCalledTimes(1);
    expect(burst.play).toHaveBeenCalledTimes(2);
    expect(burst.rate).toHaveBeenLastCalledWith(0.72, 1);
  });

  it('never plays thunder on top of the strike and throttles the rumble', async () => {
    await startEvent();
    const strike = soundFor('mixkit-cinematic-impact.mp3');
    const thunder = soundFor('lucky-meter-thunder-rumble.wav');

    act(() => stageControl.onCue('lightning'));
    expect(strike.play).toHaveBeenCalledTimes(1);
    expect(thunder.play).not.toHaveBeenCalled();

    // The engine queues thunder for a later frame; the first one is allowed.
    act(() => stageControl.onCue('thunder-far'));
    expect(thunder.play).toHaveBeenCalledTimes(1);
    expect(thunder.volume).toHaveBeenCalledWith(0.2, 1);

    // An immediate second rumble is dropped instead of stacking.
    act(() => stageControl.onCue('thunder-near'));
    expect(thunder.play).toHaveBeenCalledTimes(1);

    // ...and a later one is allowed again once the spacing has passed.
    await act(async () => {
      vi.advanceTimersByTime(2400);
    });
    act(() => stageControl.onCue('thunder-near'));
    expect(thunder.play).toHaveBeenCalledTimes(2);
  });

  it('ignores cues that are not part of the event vocabulary', async () => {
    await startEvent();
    act(() => stageControl.onCue('not-a-cue'));
    for (const sound of eventSounds()) {
      expect(sound.play).not.toHaveBeenCalled();
    }
  });

  it('fades and stops sustained cues when the animation finishes', async () => {
    await startEvent();
    const thunder = soundFor('lucky-meter-thunder-rumble.wav');
    act(() => stageControl.onCue('thunder-near'));
    expect(thunder.play).toHaveBeenCalledTimes(1);

    act(() => stageControl.onComplete());
    expect(thunder.fade).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(thunder.stop).toHaveBeenCalledTimes(1);
    expect(stageControl.onCue).toBeTruthy();
  });

  it('releases every sound on unmount', async () => {
    await startEvent();
    const view = render(<DailyResonance />);
    view.unmount();
    cleanup();
    for (const sound of howls) {
      expect(sound.unload).toHaveBeenCalled();
    }
  });
});
