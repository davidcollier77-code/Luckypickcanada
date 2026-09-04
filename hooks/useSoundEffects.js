'use client';

import { zzfx } from 'zzfx';

export function useSoundEffects() {
  const playTick = () => zzfx(...[,,129,.01,,.15,,,,,,,,5]);
  const playCardFlip = () => zzfx(...[1.5,.5,270,,.1,,1,1.5,,,,,,,,.1,.01]);
  const playWin = () => zzfx(...[,,537,.02,.02,.22,1,1.59,-6.98,4.97]);

  return { playTick, playCardFlip, playWin };
}
