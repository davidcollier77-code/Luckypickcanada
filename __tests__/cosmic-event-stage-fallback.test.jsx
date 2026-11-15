import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

const engine = vi.hoisted(() => ({ createCosmicEventEngine: vi.fn() }));

vi.mock('../components/cosmic-event-engine', () => ({
  createCosmicEventEngine: engine.createCosmicEventEngine,
}));

import CosmicEventStage from '../components/CosmicEventStage';

function getFallbackGlow(stage) {
  return stage.querySelector('div');
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  engine.createCosmicEventEngine.mockReset();
});

describe('CosmicEventStage graphics fallbacks', () => {
  it('shows the static glow when WebGL cannot start', () => {
    engine.createCosmicEventEngine.mockReturnValue(null);

    render(<CosmicEventStage eventId="meteor" durationMs={9000} />);

    const stage = screen.getByTestId('cosmic-event-stage');
    expect(stage).toHaveAttribute('data-event', 'meteor');
    expect(getFallbackGlow(stage)?.getAttribute('style')).toContain('radial-gradient');
  });

  it('shows the static glow when the running context is lost', () => {
    let options;
    engine.createCosmicEventEngine.mockImplementation((value) => {
      options = value;
      return { destroy: vi.fn() };
    });

    render(<CosmicEventStage eventId="lightning" durationMs={9000} />);

    const stage = screen.getByTestId('cosmic-event-stage');
    expect(getFallbackGlow(stage)).toBeNull();

    act(() => options.onContextLost());

    expect(getFallbackGlow(stage)?.getAttribute('style')).toContain('radial-gradient');
  });

  it('still completes after the documented duration plus the safety margin', () => {
    vi.useFakeTimers();
    engine.createCosmicEventEngine.mockReturnValue({ destroy: vi.fn() });
    const onComplete = vi.fn();

    render(<CosmicEventStage eventId="fireworks" durationMs={9000} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
