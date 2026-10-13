# Implementation Tasks: Enhance Homepage Golden Arrow Interaction

## Pre-requisites
- [ ] Verify `canvas-confetti` is available.
- [ ] Verify `mixkit-magic-sparkles.mp3` or similar is available in `public/sounds`.

## Phase 1: Audio Enhancement
- [ ] Implement `playMagicalChime` in `app/lib/audio.js` using `howler` and the chosen sound asset.

## Phase 2: Visual & Logic Enhancement (`app/homepage/ExploreLuckButton.js`)
- [ ] Update `COOLDOWN_MS` to 15,000.
- [ ] Import and use `canvas-confetti` instead of generating DOM elements for the particle burst.
- [ ] Ensure confetti generates a rich, magical golden burst (use gold/yellow hex colors, varied particle sizes, gravity, etc.).
- [ ] Trigger `playMagicalChime()` upon successful activation.
- [ ] Ensure proper cleanup (canvas-confetti handles its own cleanup generally, but ensure we don't leak state).

## Phase 3: Testing & Verification
- [ ] Update `EXPLORE_COOLDOWN_MS` to `15_000` in `tests/visual/homepage.spec.ts`.
- [ ] Update `homepage.spec.ts` to reflect that we might not be looking for `.animate-magic-burst` DOM nodes anymore, but rather verifying the canvas confetti or simply the scroll behavior and lack of errors. (Actually, we should adapt the test to verify the effect still works).
- [ ] Run `pnpm exec playwright test tests/visual/homepage.spec.ts`.
- [ ] Run `pnpm run build` and verify build size is < 495MB.
- [ ] Run `./jules-verify.sh`.
