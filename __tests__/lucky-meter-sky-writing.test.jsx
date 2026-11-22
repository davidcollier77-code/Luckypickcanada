import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import LuckyMeterSkyWriting from '../components/LuckyMeterSkyWriting';
import {
  getSparkCharacterScheduleMs,
  getSparkWritingMs,
} from '../app/lib/lucky-meter/storyboard';

const MESSAGE = 'A small light is enough.';
const SCHEDULE = getSparkCharacterScheduleMs(MESSAGE);

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
      vi.advanceTimersByTime(SCHEDULE[0]);
    });
    expect(screen.getByTestId('lucky-spark-visible')).toHaveTextContent(/^A$/);

    act(() => {
      vi.advanceTimersByTime(SCHEDULE[5] - SCHEDULE[0]);
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

  it('writes the whole Spark inside the approved 3.8–5.2 second window', () => {
    const onComplete = vi.fn();
    render(
      <LuckyMeterSkyWriting
        message={MESSAGE}
        state="writing"
        onComplete={onComplete}
      />,
    );

    const duration = getSparkWritingMs(MESSAGE);
    expect(duration).toBeGreaterThanOrEqual(3_800);
    expect(duration).toBeLessThanOrEqual(5_200);

    act(() => {
      vi.advanceTimersByTime(duration - 1);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
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
