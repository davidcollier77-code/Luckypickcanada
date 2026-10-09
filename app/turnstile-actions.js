'use server';

import { getTurnstileSiteKey } from './turnstile-config';

export async function fetchTurnstileSiteKey() {
  return getTurnstileSiteKey();
}
