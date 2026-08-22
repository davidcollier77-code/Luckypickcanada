import { useEffect, useState } from 'react';

export function useRollingScore(targetScore: number, durationMs: number = 1200): number {
  const [displayScore, setDisplayScore] = useState(targetScore);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const startValue = displayScore;
    const diff = targetScore - startValue;

    if (diff === 0) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(startValue + diff * easeOut));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetScore, durationMs, displayScore]);

  return displayScore;
}
