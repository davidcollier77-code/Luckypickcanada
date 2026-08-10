'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LuckyRevealPopup from '../../lucky-reveal-popup';
import { createLuckyReveal } from '../../lucky-reveal';

// Create a deterministic reveal based on revealId
function createRevealFromId(revealId: string) {
  // Use the revealId as a seed for deterministic randomness
  let seed = 0;
  for (let i = 0; i < revealId.length; i++) {
    seed = ((seed << 5) - seed) + revealId.charCodeAt(i);
    seed = seed & seed; // Convert to 32bit integer
  }
  
  // Simple seeded random function
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  // Determine game type based on seed
  const isSevenPick = seededRandom() > 0.5;
  const count = isSevenPick ? 7 : 6;
  const max = isSevenPick ? 50 : 49;
  
  // Generate deterministic lucky numbers
  const numbers = Array.from({ length: max }, (_, index) => index + 1);
  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(seededRandom() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }
  const luckyNumbers = numbers.slice(0, count).sort((a, b) => a - b);
  
  // Pick lucky color and day deterministically
  const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
  const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const luckyColor = luckyColors[Math.floor(seededRandom() * luckyColors.length)];
  const luckyDay = luckyDays[Math.floor(seededRandom() * luckyDays.length)];
  
  return {
    game: {
      name: isSevenPick ? '7 Pick' : '6 Pick',
      numbers: luckyNumbers,
    },
    luckyColor,
    luckyDay,
  };
}

export default function RevealPage() {
  const params = useParams();
  const router = useRouter();
  const revealId = params?.revealId as string;
  const [reveal, setReveal] = useState<any>(null);
  
  useEffect(() => {
    if (revealId) {
      // Generate a deterministic reveal based on the revealId
      const generatedReveal = createRevealFromId(revealId);
      setReveal(generatedReveal);
    }
  }, [revealId]);
  
  const handleClose = () => {
    router.push('/');
  };
  
  if (!reveal) {
    return null;
  }
  
  return <LuckyRevealPopup reveal={reveal} onClose={handleClose} />;
}
