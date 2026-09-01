'use client';

import CrystalBall from '../../app/components/CrystalBall/CrystalBall';

export default function CrystalBallClient() {
  const handleSeekFortune = async (question) => {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API Error');
      } catch (e) {
        throw new Error('API Error');
      }
    }
    const data = await response.json();
    return data.reading;
  };

  return <CrystalBall onSeekFortune={handleSeekFortune} />;
}
