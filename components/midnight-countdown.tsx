'use client';

import React, { useState, useEffect, ReactNode } from 'react';

interface MidnightCountdownProps {
  fallback?: string;
  render?: (displayTime: string) => ReactNode;
}

export default function MidnightCountdown({ fallback = '00h 00m 00s', render }: MidnightCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayTime = timeLeft || fallback;

  if (render) {
    return render(displayTime);
  }

  return <>{displayTime}</>;
}
