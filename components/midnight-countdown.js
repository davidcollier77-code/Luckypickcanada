'use client';

import { useDailyResetCountdown } from './daily-reset-countdown';

/**
 * Card Reveal's countdown display. It keeps its existing wording and fallback
 * while reading the shared next-local-midnight clock used by every daily
 * feature.
 */
export default function MidnightCountdown({ fallback = '00h 00m 00s', render }) {
  const { ready, formatted } = useDailyResetCountdown();
  const displayTime = ready ? formatted : fallback;

  if (render) {
    return render(displayTime);
  }

  return <>{displayTime}</>;
}
