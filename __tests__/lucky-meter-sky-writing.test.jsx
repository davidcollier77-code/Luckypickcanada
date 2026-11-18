import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import LuckyMeterSkyWriting from '../components/LuckyMeterSkyWriting';
import { REVEAL_TIMING } from '../app/lib/lucky-meter/reveal';

const MESSAGE = 'A small light is enough.';

describe('Lucky Meter sky-writing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('gathers without exposing the message while waiting', () => {
    render(
      <LuckyMeterSkyWriting
        message={MESSAGE}
        state="waiting"
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByTestId('lucky-spark-finale')).toHaveAttribute('data-state', 'waiting');
    expect(screen.getByTestId('lucky-spark-waiting')).toHaveTextContent(/gathering/i);
    expect(screen.queryByTestId('lucky-spark-message')).not.toBeInTheDocument();
  });

  it('writes one character at a time with a golden cursor and completes once', () => {
    const onComplete = vi.fn();
    const view = render(
      <LuckyMeterSkyWriting
        message={MESSAGE}
        state="writing"
        onComplete={onComplete}
      />,
    );

    expect(screen.getByTestId('lucky-spark-message')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-cursor')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-visible')).toHaveTextContent('');

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.sparkMsPerCharacter);
    });
    expect(screen.getByTestId('lucky-spark-visible')).toHaveTextContent(/^A$/);

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMING.sparkMsPerCharacter * 5);
    });
    expect(screen.getByTestId('lucky-spark-visible').textContent?.length).toBeGreaterThan(1);
    expect(screen.getByTestId('lucky-spark-visible').textContent?.length).toBeLessThan(
      MESSAGE.length,
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    // The parent promotes the finished writing; the cursor and quotes remain,
    // the completed message is exposed and it stays in place.
    view.rerender(
      <LuckyMeterSkyWriting
        message={MESSAGE}
        state="written"
        onComplete={onComplete}
      />,
    );
    expect(screen.queryByTestId('lucky-spark-cursor')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(MESSAGE);
    expect(screen.getAllByText(MESSAGE).length).toBeGreaterThan(0);
  });

  it('shows a restored completed Spark immediately without replaying it', () => {
    render(
      <LuckyMeterSkyWriting message={MESSAGE} state="written" onComplete={vi.fn()} />,
    );

    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(MESSAGE);
    expect(screen.queryByTestId('lucky-spark-cursor')).not.toBeInTheDocument();
  });

  it('presents the whole message at once under reduced motion', () => {
    const onComplete = vi.fn();
    render(
      <LuckyMeterSkyWriting
        message={MESSAGE}
        state="writing"
        reducedMotion
        onComplete={onComplete}
      />,
    );

    expect(screen.getByTestId('lucky-spark-message')).toHaveTextContent(MESSAGE);
    expect(screen.queryByTestId('lucky-spark-cursor')).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
