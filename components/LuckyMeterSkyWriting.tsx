'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { REVEAL_TIMING } from '../app/lib/lucky-meter/reveal';

export type SkyWritingState = 'waiting' | 'writing' | 'written';

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
 * by a tiny golden point of light at the writing edge. It owns its own
 * character clock, so the rest of the page does not re-render per character —
 * which matters on a phone. The completed message stays exactly where it was
 * written, and the whole line is exposed to assistive technology only once the
 * writing has finished.
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
  const [visibleCount, setVisibleCount] = useState(() =>
    state === 'written' ? chars.length : 0,
  );
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

    const tick = () => {
      if (cancelled) return;
      index += 1;
      setVisibleCount(index);
      if (index >= chars.length) {
        window.setTimeout(() => onCompleteRef.current(), 0);
        return;
      }
      const character = chars[index];
      timer = window.setTimeout(
        tick,
        /[.,!?:;]/.test(character)
          ? REVEAL_TIMING.sparkPunctuationPauseMs
          : REVEAL_TIMING.sparkMsPerCharacter,
      );
    };

    timer = window.setTimeout(tick, REVEAL_TIMING.sparkMsPerCharacter);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state, reducedMotion, chars]);

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
      <div className="lucky-sky-writing__header" aria-hidden="true">
        <span className="lucky-sky-writing__rule" />
        <span className="lucky-sky-writing__label">Little Spark</span>
        <span className="lucky-sky-writing__rule" />
      </div>

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
          className={`lucky-sky-writing__text ${isCompact ? 'text-[13px]' : 'text-[15px] sm:text-lg'}`}
        >
          <span className="lucky-sky-writing__quote">“</span>
          <span data-testid="lucky-spark-visible">{chars.slice(0, visibleCount).join('')}</span>
          {isWriting && (
            <span
              aria-hidden="true"
              data-testid="lucky-spark-cursor"
              className="lucky-sky-writing__cursor"
            />
          )}
          <span className="lucky-sky-writing__quote">”</span>
        </p>
      )}
    </section>
  );
}
