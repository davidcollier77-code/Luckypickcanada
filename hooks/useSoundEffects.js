'use client';

import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

export function useSoundEffects() {
  const sounds = useRef({});

  useEffect(() => {
    sounds.current = {
      tick: new Howl({ src: ['/freesound_community-shaking-coins-105774.mp3'], volume: 0.2 }),
      cardFlip: new Howl({ src: ['/dragon-studio-whoosh-cinematic-376875.mp3'], volume: 0.5 }),
      win: new Howl({ src: ['/freesound_community-starship-rail-gun-charge-35904.mp3'], volume: 0.6 })
    };
  }, []);

  const playTick = () => sounds.current.tick?.play();
  const playCardFlip = () => sounds.current.cardFlip?.play();
  const playWin = () => sounds.current.win?.play();

  return { playTick, playCardFlip, playWin };
}
