'use client';

import CrystalBall from '../../app/components/CrystalBall/CrystalBall';

export default function CrystalBallClient() {
  const handleSeekFortune = async (question) => {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }
    return data.reading;
  };

  return <CrystalBall onSeekFortune={handleSeekFortune} />;
}
