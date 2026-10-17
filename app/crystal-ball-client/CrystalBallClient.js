'use client';

import { useEffect, useState } from 'react';
import CrystalBall from '../../app/components/CrystalBall/CrystalBall';

export default function CrystalBallClient() {
  const [dailyQuota, setDailyQuota] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/oracle', { method: 'GET', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!cancelled && data?.quota) setDailyQuota(data.quota);
      })
      .catch((error) => {
        console.error('Could not load Crystal Ball daily allowance:', error);
      });

    return () => { cancelled = true; };
  }, []);

  const handleSeekFortune = async (question) => {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json().catch(() => ({ error: 'API Error' }));

    if (data?.quota) setDailyQuota(data.quota);
    if (!response.ok) throw new Error(data.error || 'API Error');
    return data.reading;
  };

  return <CrystalBall onSeekFortune={handleSeekFortune} dailyQuota={dailyQuota} />;
}
