'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getSparkCharacterScheduleMs } from '../app/lib/lucky-meter/storyboard';

export type SkyWritingState = 'waiting' | 'writing' | 'written';

/**
 * The same maple-leaf silhouette the meter's pointer uses, so the writing tip
 * is unmistakably a Canadian maple leaf rather than a dot or a generic spark.
 */
const MAPLE_LEAF_PATH =
  'M50 3 C52.5 10 55 14 59 16.5 C57.3 19.2 57.8 22.1 60.6 24.6 ' +
  'C62.6 20.8 66.1 18.4 70.6 18.2 C69.3 22.8 70.4 27.2 73.4 30.7 ' +
  'C69.4 32.5 66.6 35.6 64.7 39.5 C69.9 41.2 73.9 44.7 76.6 49.3 ' +
  'C71.4 51.8 67.4 55.9 64.9 60.9 C62.5 57.1 58.9 54.5 54.9 53.8 ' +
  'C54.6 61.3 56.6 68.6 60.6 75 L52.4 73.5 L50 88 L47.6 73.5 L39.4 75 ' +
  'C43.4 68.6 45.4 61.3 45.1 53.8 C41.1 54.5 37.5 57.1 35.1 60.9 ' +
  'C32.6 55.9 28.6 51.8 23.4 49.3 C26.1 44.7 30.1 41.2 35.3 39.5 ' +
  'C33.4 35.6 30.6 32.5 26.6 30.7 C29.6 27.2 30.7 22.8 29.4 18.2 ' +
  'C33.9 18.4 37.4 20.8 39.4 24.6 C42.2 22.1 42.7 19.2 41 16.5 ' +
  'C45 14 47.5 10 50 3 Z';

interface LuckyMeterSkyWritingProps {
  message: string;
  state: SkyWritingState;
  reducedMotion?: boolean;
  isCompact?: boolean;
  onComplete: () => void;
}

/**
 * The Little Spark, written in the sky.
 *
 * This replaces the raised letter-panel and the oversized travelling leaf. The
 * message is plain sky text with a warm glow, revealed one character at a time
 * by a small glowing golden maple leaf at the writing edge. It owns its own
 * character clock, so the rest of the page does not re-render per character —
 * which matters on a phone. The schedule comes from the storyboard, so every
 * Spark takes the approved 3,800–5,200 ms however long the saved line is. The
 * completed message stays exactly where it was written, and the whole line is
 * exposed to assistive technology only once the writing has finished.
 *
 * Reduced motion presents the complete message immediately and reports
 * completion once, with no cursor.
 */
export default function LuckyMeterSkyWriting({
  message,
  state,
  reducedMotion = false,
  isCompact = false,
  onComplete,
}: LuckyMeterSkyWritingProps) {
  const chars = useMemo(() => (message ? Array.from(message) : []), [message]);
  const schedule = useMemo(() => getSparkCharacterScheduleMs(message), [message]);
  const [visibleCount, setVisibleCount] = useState(state === 'written' ? chars.length : 0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (state === 'written') {
      setVisibleCount(chars.length);
      return undefined;
    }
    if (state !== 'writing') {
      setVisibleCount(0);
      return undefined;
    }
    if (reducedMotion || chars.length === 0) {
      setVisibleCount(chars.length);
      onCompleteRef.current();
      return undefined;
    }

    let index = 0;
    let cancelled = false;
    let timer = 0;
    setVisibleCount(0);

    // Every character is scheduled against one absolute start time instead of
    // the previous timer's completion. A frame that arrives late can therefore
    // only delay its own glyph: the remaining glyphs use their original
    // deadlines and catch up immediately, so a busy main thread cannot push the
    // line past the storyboard's 3,800–5,200 ms window. The final deadline is
    // exactly getSparkWritingMs(message), so parent and writer never drift.
    const startedAt = performance.now();
    const delayUntil = (at: number) => Math.max(0, startedAt + at - performance.now());

    const tick = () => {
      if (cancelled) return;
      index += 1;
      setVisibleCount(index);
      if (index >= chars.length) {
        onCompleteRef.current();
        return;
      }
      const at = schedule[index] ?? schedule[schedule.length - 1] ?? 0;
      timer = window.setTimeout(tick, delayUntil(at));
    };

    timer = window.setTimeout(tick, delayUntil(schedule[0] ?? 0));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state, reducedMotion, chars, schedule]);

  // Reduced motion shows the finished line at once, so it never shows a
  // writing cursor even while the state is being promoted.
  const isWriting = state === 'writing' && !reducedMotion;
  const isWritten = state === 'written';

  return (
    <section
      data-testid="lucky-spark-finale"
      data-state={state}
      className={`lucky-sky-writing relative w-full ${
        isCompact ? 'mb-2 mt-1' : 'mb-3 mt-1 max-w-2xl sm:mb-4'
      }`}
      aria-live="polite"
    >
      {isWritten && <span className="sr-only">{message}</span>}

      {state === 'waiting' ? (
        <p className="lucky-sky-writing__waiting" data-testid="lucky-spark-waiting" aria-hidden="true">
          <span className="lucky-sky-writing__ember" />
          The Spark is gathering
        </p>
      ) : (
        <p
          aria-hidden="true"
          data-testid="lucky-spark-message"
          className="lucky-sky-writing__text"
          style={isCompact ? { fontSize: '1.02rem' } : undefined}
        >
          <span data-testid="lucky-spark-visible">
            {/* Words are kept whole so a line never breaks mid-word, while each
                glyph still arrives on its own writing beat. */}
            {chars
              .slice(0, visibleCount)
              .join('')
              .split(/(\s+)/)
              .map((part, partIndex) =>
                /^\s+$/.test(part) ? (
                  <span key={`space-${partIndex}`} className="lucky-sky-writing__space">
                    {part}
                  </span>
                ) : (
                  <span key={`word-${partIndex}`} className="lucky-sky-writing__word">
                    {Array.from(part).map((character, index) => (
                      <span key={`${partIndex}-${index}`} className="lucky-sky-writing__char">
                        {character}
                      </span>
                    ))}
                  </span>
                ),
              )}
          </span>
          {isWriting && (
            <span
              aria-hidden="true"
              data-testid="lucky-spark-cursor"
              className="lucky-sky-writing__cursor"
            >
              <svg viewBox="0 0 100 100" className="lucky-sky-writing__cursor-leaf">
                <path d={MAPLE_LEAF_PATH} />
              </svg>
            </span>
          )}
        </p>
      )}

      <span aria-hidden="true" className="lucky-sky-writing__ribbon" />
    </section>
  );
}
