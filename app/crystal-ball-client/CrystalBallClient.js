'use client';

import { useEffect, useRef, useState } from 'react';
import CrystalBall from '../../app/components/CrystalBall/CrystalBall';
import {
  DAILY_QUESTION_LIMIT,
  createFreshUsage,
  getLocalDateKey,
  getNextLocalMidnight,
  readDailyUsage,
  writeDailyUsage,
} from './daily-usage';

function getBrowserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function CrystalBallClient() {
  const [usage, setUsage] = useState(null);
  const usageRef = useRef(null);

  useEffect(() => {
    const storage = getBrowserStorage();
    const initial = readDailyUsage(storage);
    usageRef.current = initial;
    setUsage(initial);
    writeDailyUsage(initial, storage);

    const refreshForLocalDate = () => {
      const today = getLocalDateKey();
      if (usageRef.current?.date !== today) {
        const next = createFreshUsage();
        usageRef.current = next;
        setUsage(next);
        writeDailyUsage(next, getBrowserStorage());
      }
    };

    const handleStorage = (event) => {
      if (event.key !== null && event.key !== 'luckyPickCanada:crystalBallDailyQuestions:v1') return;
      const next = readDailyUsage(getBrowserStorage());
      usageRef.current = next;
      setUsage(next);
    };

    const intervalId = window.setInterval(refreshForLocalDate, 1000);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const dailyQuota = usage
    ? {
        limit: DAILY_QUESTION_LIMIT,
        remaining: Math.max(0, DAILY_QUESTION_LIMIT - usage.used),
        resetAt: getNextLocalMidnight().toISOString(),
      }
    : null;

  const handleSeekFortune = async (question) => {
    const storage = getBrowserStorage();
    const current = readDailyUsage(storage);
    usageRef.current = current;
    setUsage(current);

    if (current.used >= DAILY_QUESTION_LIMIT) {
      throw new Error('You’ve used all 3 questions for today. Come back after the daily reset.');
    }

    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json().catch(() => ({ error: 'API Error' }));

    if (!response.ok) throw new Error(data.error || 'API Error');
    if (typeof data?.reading !== 'string' || data.reading.trim() === '') {
      throw new Error(data?.error || 'The Crystal Ball could not find an answer. Please try again.');
    }

    // Preserve the prior behavior: only a successful AI-backed answer uses a slot.
    // Fallback fortunes are still available during provider outages without a charge.
    if (data.source === 'ai') {
      const latest = readDailyUsage(getBrowserStorage());
      const next = {
        date: latest.date,
        used: Math.min(DAILY_QUESTION_LIMIT, latest.used + 1),
      };
      const saved = writeDailyUsage(next, getBrowserStorage());
      usageRef.current = saved;
      setUsage(saved);
    }

    return data.reading;
  };

  return <CrystalBall onSeekFortune={handleSeekFortune} dailyQuota={dailyQuota} />;
}
