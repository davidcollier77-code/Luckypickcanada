import { useEffect, useState } from "react";

export function useRollingScore(targetScore: number, isAnalyzing: boolean, durationMs = 10000) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setDisplayScore(targetScore);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);

      // Smooth easeOutCubic curve
      const ease = 1 - Math.pow(1 - progress, 3.5);
      setDisplayScore(Math.floor(ease * targetScore));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetScore, isAnalyzing, durationMs]);

  return displayScore;
}
