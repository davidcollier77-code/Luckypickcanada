'use client';

import { useEffect, useState } from 'react';
import CrystalBall from '../components/CrystalBall/CrystalBall';
import CrystalBallPreviewControls from './CrystalBallPreviewControls';
import {
  buildPreviewUrl,
  createPreviewUsage,
  getPreviewFromLocation,
} from '../lib/crystal-ball-preview';
import { getLocalMoment } from '../lib/local-time';

function normalizeReading(value) {
  return typeof value === 'string' ? value.trim().replace(/[*_]{1,2}/g, '') : '';
}

async function requestPreviewReading(body) {
  const response = await fetch('/api/oracle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'The Crystal Ball could not reach the mists. Please try again.');
  }

  const reading = normalizeReading(data.reading);
  if (!reading) {
    throw new Error(data.error || 'The Crystal Ball could not find a reading. Please try again.');
  }

  return reading;
}

/**
 * Development-only Crystal Ball preview. Readings stay in page state so the
 * visitor's real daily allowance is never read, written or consumed.
 */
export default function CrystalBallPreviewClient() {
  const [preview, setPreview] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    const next = getPreviewFromLocation();
    if (!next.active) {
      const today = getLocalMoment();
      window.location.replace(buildPreviewUrl(today.dateKey, today.localTime));
      return;
    }

    setPreview(next);
    setUsage(createPreviewUsage(next.localDate));
  }, []);

  if (!preview || !usage) {
    return (
      <div style={{ minHeight: '100vh', padding: '4rem 1.5rem', color: '#f8fafc' }}>
        <p>Preparing the Crystal Ball date preview…</p>
      </div>
    );
  }

  const handleGenerateFortune = async () => {
    const reading = await requestPreviewReading({
      mode: 'fortune',
      ...preview.context,
    });

    setUsage((current) =>
      current
        ? { ...current, fortuneUsed: true, fortune: reading }
        : current,
    );

    return reading;
  };

  const handleAskFollowUp = async (question) => {
    if (!usage.fortune) {
      throw new Error('Generate the preview fortune before asking a follow-up question.');
    }

    const answer = await requestPreviewReading({
      mode: 'follow-up',
      question,
      fortune: usage.fortune,
      ...preview.context,
    });

    setUsage((current) =>
      current ? { ...current, followUpUsed: true } : current,
    );

    return answer;
  };

  return (
    <>
      <CrystalBallPreviewControls preview={preview} />
      <CrystalBall
        key={`${preview.localDate}:${preview.localTime}`}
        initialFortune={usage.fortune || null}
        fortuneUsed={Boolean(usage.fortuneUsed)}
        followUpUsed={Boolean(usage.followUpUsed)}
        onGenerateFortune={handleGenerateFortune}
        onAskFollowUp={handleAskFollowUp}
        previewActive
        previewDateKey={preview.localDate}
        previewNow={preview.moment}
      />
    </>
  );
}
