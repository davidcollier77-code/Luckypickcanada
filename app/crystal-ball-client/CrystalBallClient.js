'use client';

import { useEffect, useRef, useState } from 'react';
import CrystalBall from '../../app/components/CrystalBall/CrystalBall';

const DAILY_QUESTION_LIMIT = 3;
const DAILY_STORAGE_KEY = 'luckyPickCanada:crystalBallDailyQuestions:v1';

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function createFreshUsage() {
  return { date: getLocalDateKey(), used: 0 };
}

function readDailyUsage() {
  const fresh = createFreshUsage();
  try {
    const raw = window.localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) return fresh;

    const stored = JSON.parse(raw);
    if (
      stored?.date !== fresh.date ||
      !Number.isInteger(stored?.used) ||
      stored.used < 0 ||
      stored.used > DAILY_QUESTION_LIMIT
    ) {
      return fresh;
    }

    return { date: fresh.date, used: stored.used };
  } catch {
    // Keep this visitor's allowance functional for this page view if storage is disabled.
    return fresh;
  }
}

function writeDailyUsage(usage) {
  try {
    window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // The in-memory state still limits questions until the page is closed or reloaded.
  }
}

function getNextLocalMidnightIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).toISOString();
}

export default function CrystalBallClient() {
  const [usage, setUsage] = useState(null);
  const usageRef = useRef(null);

  useEffect(() => {
    const initial = readDailyUsage();
    usageRef.current = initial;
    setUsage(initial);
    writeDailyUsage(initial);

    const refreshForLocalDate = () => {
      const today = getLocalDateKey();
      if (usageRef.current?.date !== today) {
        const next = { date: today, used: 0 };
        usageRef.current = next;
        setUsage(next);
        writeDailyUsage(next);
      }
    };

    const handleStorage = (event) => {
      if (event.key !== DAILY_STORAGE_KEY) return;
      const next = readDailyUsage();
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
        resetAt: getNextLocalMidnightIso(),
      }
    : null;

  const handleSeekFortune = async (question) => {
    // Read storage at submission time so other tabs and midnight rollovers are respected.
    const current = readDailyUsage();
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

    // Only successful AI answers count, preserving the prior fallback behavior.
    if (data.source === 'ai') {
      const latest = readDailyUsage();
      const next = {
        date: latest.date,
        used: Math.min(DAILY_QUESTION_LIMIT, latest.used + 1),
      };
      usageRef.current = next;
      setUsage(next);
      writeDailyUsage(next);
    }

    return data.reading;
  };

  return <CrystalBall onSeekFortune={handleSeekFortune} dailyQuota={dailyQuota} />;
}
