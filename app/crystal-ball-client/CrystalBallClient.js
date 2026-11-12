'use client';

import { useEffect, useRef, useState } from 'react';
import CrystalBall from '../components/CrystalBall/CrystalBall';
import { useDailyResetCountdown } from '../../components/daily-reset-countdown';
import { getLocalDateKey } from '../lib/daily-reset';
import { getLocalMoment } from '../lib/local-time';
import {
  DAILY_STORAGE_KEY,
  createFreshUsage,
  readDailyUsage,
  writeDailyUsage,
  withDailyUsageLock,
} from './daily-usage';

function getBrowserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// One shared local-time system: the date, wall clock and time zone sent to the
// oracle come from the same helper that powers the greeting and daily reset.
function getLocalCalendarContext() {
  const moment = getLocalMoment();
  return {
    localDate: moment.dateKey,
    localTime: moment.localTime,
    timeZone: moment.timeZone,
  };
}

function normalizeReading(value) {
  return typeof value === 'string' ? value.trim().replace(/[*_]{1,2}/g, '') : '';
}

export default function CrystalBallClient() {
  const { dateKey } = useDailyResetCountdown();
  const [usage, setUsage] = useState(null);
  const usageRef = useRef(null);

  const applyUsage = (next) => {
    usageRef.current = next;
    setUsage(next);
  };

  useEffect(() => {
    const storage = getBrowserStorage();
    const initial = writeDailyUsage(readDailyUsage(storage), storage);
    applyUsage(initial);

    const handleStorage = (event) => {
      if (event.key !== null && event.key !== DAILY_STORAGE_KEY) return;
      applyUsage(readDailyUsage(getBrowserStorage()));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // A fresh local date starts a fresh fortune and follow-up allowance. The
  // underlying shared clock is also what renders every countdown on the page.
  useEffect(() => {
    if (!dateKey || !usageRef.current) return;
    if (usageRef.current.date === dateKey) return;

    const storage = getBrowserStorage();
    applyUsage(writeDailyUsage(createFreshUsage(), storage));
  }, [dateKey]);

  const handleGenerateFortune = async () => {
    const storage = getBrowserStorage();
    const lockDate = getLocalDateKey();

    return withDailyUsageLock(lockDate, async () => {
      const current = readDailyUsage(storage);
      applyUsage(current);

      if (current.date !== lockDate) {
        throw new Error('The clock has turned. A fresh fortune is ready for today.');
      }
      if (current.fortuneUsed) {
        throw new Error('You’ve already received today’s fortune. Come back after your next local midnight.');
      }

      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'fortune', ...getLocalCalendarContext() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'The Crystal Ball could not reach the mists. Please try again.');
      }

      const reading = normalizeReading(data.reading);
      if (!reading) {
        throw new Error(data.error || 'The Crystal Ball could not find a fortune. Please try again.');
      }

      const latest = readDailyUsage(storage);
      if (latest.date !== current.date) {
        throw new Error('The clock has turned. A fresh fortune is ready for today.');
      }
      if (latest.fortuneUsed) {
        // The other tab's reading is already authoritative. Apply it before
        // reporting the duplicate so this tab cannot remain in a stale
        // no-fortune state when its storage event was missed or delayed.
        applyUsage(latest);
        throw new Error('You’ve already received today’s fortune. Refresh to see the saved reading.');
      }

      applyUsage(
        writeDailyUsage(
          {
            ...latest,
            fortuneUsed: true,
            fortune: reading,
          },
          storage,
        ),
      );

      return reading;
    });
  };

  const handleAskFollowUp = async (question) => {
    const storage = getBrowserStorage();
    const lockDate = getLocalDateKey();

    return withDailyUsageLock(lockDate, async () => {
      const current = readDailyUsage(storage);
      applyUsage(current);

      if (current.date !== lockDate) {
        throw new Error('The clock has turned. Refresh for today’s Crystal Ball experience.');
      }
      if (!current.fortuneUsed || !current.fortune) {
        throw new Error('Generate today’s fortune before asking a follow-up question.');
      }
      if (current.followUpUsed) {
        throw new Error('You’ve already used today’s follow-up question. Come back after your next local midnight.');
      }

      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'follow-up',
          question,
          fortune: current.fortune,
          ...getLocalCalendarContext(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'The Crystal Ball could not answer that follow-up. Please try again.');
      }

      const answer = normalizeReading(data.reading);
      if (!answer) {
        throw new Error(data.error || 'The Crystal Ball could not find a follow-up answer. Please try again.');
      }

      const latest = readDailyUsage(storage);
      if (latest.date !== current.date) {
        throw new Error('The clock has turned. A fresh fortune is ready for today.');
      }
      if (latest.followUpUsed) {
        throw new Error('You’ve already used today’s follow-up question. Refresh to see the saved answer.');
      }

      applyUsage(
        writeDailyUsage(
          {
            ...latest,
            followUpUsed: true,
            followUpQuestion: question,
            followUpAnswer: answer,
          },
          storage,
        ),
      );

      return answer;
    });
  };

  const savedFollowUp =
    usage?.followUpUsed && usage?.followUpAnswer
      ? {
          question: usage.followUpQuestion || '',
          answer: usage.followUpAnswer,
        }
      : null;

  return (
    <CrystalBall
      key={usage?.date || 'pending'}
      initialFortune={usage?.fortune || null}
      initialFollowUp={savedFollowUp}
      fortuneUsed={Boolean(usage?.fortuneUsed)}
      followUpUsed={Boolean(usage?.followUpUsed)}
      onGenerateFortune={handleGenerateFortune}
      onAskFollowUp={handleAskFollowUp}
    />
  );
}
