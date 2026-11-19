'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STORYBOARD_TIMING } from '../app/lib/lucky-meter/storyboard';

export type TierMessageState = 'hidden' | 'writing' | 'holding' | 'fading';

interface LuckyMeterMessageProps {
  message: string;
  state: TierMessageState;
  reducedMotion?: boolean;
  isCompact?: boolean;
  onTyped?: () => void;
}

/**
 * The tier message above the meter.
 *
 * It is written one character at a time by a small gold cursor, held long
 * enough to read and then faded out before the celebration. It has no panel:
 * the type sits directly in the sky, above the reserved celebration space.
 *
 * Under reduced motion the complete sentence appears at once, without a cursor.
 */
export default function LuckyMeterMessage({
  message,
  state,
  reducedMotion = false,
  isCompact = false,
  onTyped,
}: LuckyMeterMessageProps) {
  const characters = useMemo(() => (message ? Array.from(message) : []), [message]);
  const [visibleCount, setVisibleCount] = useState(0);
  const onTypedRef = useRef(onTyped);
  onTypedRef.current = onTyped;

  useEffect(() => {
    if (state === 'hidden') {
      setVisibleCount(0);
      return undefined;
    }
    if (state !== 'writing') {
      setVisibleCount(characters.length);
      return undefined;
    }
    if (reducedMotion || characters.length === 0) {
      setVisibleCount(characters.length);
      onTypedRef.current?.();
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
      if (index >= characters.length) {
        onTypedRef.current?.();
        return;
      }
      const previous = characters[index - 1];
      timer = window.setTimeout(
        tick,
        /[.,!?:;—–]/.test(previous)
          ? STORYBOARD_TIMING.sparkPunctuationPauseMs
          : STORYBOARD_TIMING.messageCharMs,
      );
    };

    timer = window.setTimeout(tick, STORYBOARD_TIMING.messageCharMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state, reducedMotion, characters]);

  if (state === 'hidden') return null;

  const isWriting = state === 'writing' && !reducedMotion;
  const isFading = state === 'fading';

  return (
    <section
      data-testid="lucky-tier-message"
      data-state={state}
      aria-live="polite"
      className={`lucky-tier-message pointer-events-none relative flex w-full flex-col items-center text-center ${
        isCompact ? 'mb-2 min-h-[3.2rem] px-2' : 'mb-3 min-h-[5.5rem] px-4 sm:mb-4 sm:min-h-[6.5rem]'
      }`}
      style={{
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'translateY(-6px)' : 'translateY(0)',
        transition: reducedMotion
          ? 'none'
          : `opacity ${STORYBOARD_TIMING.messageFadeMs}ms ease-in-out, transform ${STORYBOARD_TIMING.messageFadeMs}ms ease-in-out`,
      }}
    >
      <div className="lucky-tier-message__rule" aria-hidden="true" />
      <p
        aria-hidden={isWriting ? 'true' : 'false'}
        className={`lucky-tier-message__text ${
          isCompact ? 'text-[14px] leading-snug' : 'text-[clamp(15px,2.2vh,22px)] leading-snug'
        }`}
      >
        <span data-testid="lucky-tier-message-visible">
          {state === 'writing' && !reducedMotion
            ? characters.slice(0, visibleCount).join('')
            : characters.join('')}
        </span>
        {isWriting && <span aria-hidden="true" className="lucky-tier-message__cursor" />}
      </p>
      <div className="lucky-tier-message__rule lucky-tier-message__rule--bottom" aria-hidden="true" />
    </section>
  );
}
