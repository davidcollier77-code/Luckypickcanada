# Implementation Plan: Enhance Homepage Golden Arrow Interaction

## Technical Context
- **Framework**: Next.js App Router
- **Animation**: `framer-motion` (for other components), `canvas-confetti` (for burst effect).
- **Audio**: `howler.js` (for sound playback).

## Design & Approach
- Modify `ExploreLuckButton.js` to replace the manual DOM-based particles with `canvas-confetti` to create a magical golden burst.
- Modify `ExploreLuckButton.js` to change `COOLDOWN_MS` to 15,000.
- Modify `ExploreLuckButton.js` to invoke the audio chime from `app/lib/audio.js` only on successful trigger.
- Modify `app/lib/audio.js` to expose `playMagicalChime()` method loading `mixkit-magic-sparkles.mp3` or similar via Howler.
- Modify `tests/visual/homepage.spec.ts` to adjust the `EXPLORE_COOLDOWN_MS` to `15_000` and adjust particle verification if necessary.

## Tasks
See `tasks.md`
