'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STORYBOARD_TIMING } from '../app/lib/lucky-meter/storyboard';

export type TierMessageState = 'hidden' | 'writing' | 'holding';

interface LuckyMeterMessageProps {
  message: string;
  state: TierMessageState;
  /** True once the 800 ms visible settle has run. The line never fades. */
  settled?: boolean;
  reducedMotion?: boolean;
  isCompact?: boolean;
  onTyped?: () => void;
}

/**
 * The tier message at the meter's base.
 *
 * It is written one character at a time by a small gold cursor, held long
 * enough to read, and then settles visibly. It never fades: the exact sentence
 * stays at full opacity through the celebration and the finished state, and it
 * never occupies the celebration's space.
 *
 * Under reduced motion the complete sentence appears at once, without a cursor.
 */
export default function LuckyMeterMessage({
  message,
  state,
  settled = false,
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
          ? STORYBOARD_TIMING.messagePunctuationPauseMs
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

  return (
    <section
      data-testid="lucky-tier-message"
      data-state={state}
      data-settled={settled ? 'true' : 'false'}
      aria-live="polite"
      className={`lucky-tier-message pointer-events-none relative flex w-full flex-col items-center text-center ${
        isCompact ? 'mb-2 min-h-[3.2rem] px-2' : 'mb-3 min-h-[5.5rem] px-4 sm:mb-4 sm:min-h-[6.5rem]'
      }`}
      style={{
        // The line is always visible once it exists. The settle is a small,
        // slow lift, never an opacity transition.
        transform: settled ? 'translateY(-2px)' : 'translateY(0)',
        transition: reducedMotion ? 'none' : `transform ${STORYBOARD_TIMING.messageSettleMs}ms ease-out`,
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
