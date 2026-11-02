# Tasks: Lucky Reveal Confetti Lifecycle (Phase 1)

**Feature**: `specs/080-lucky-reveal-confetti-phase1`

## Phase 1 — Setup

- [x] T001 Confirm the shipped reveal, its celebration component, the particle path, the settled-leaf layer, and the audio assets actually used.
- [x] T002 Measure the baseline: 112 particles fired in one tick, `ticks: 160`, canvas appended to `document.body` at `z-index: 100`, finish pile never removed, no sound on reveal open, finishing pop 0.90 s.

## Phase 2 — User Story 1 (leaves stay in the reveal and disappear)

- [x] T003 [US1] Render the particle canvas inside the reveal overlay in its own layer above the panel, clipped to the reveal's animation area.
- [x] T004 [US1] Cap active particles at 96 and clamp every wave against the remaining budget.
- [x] T005 [US1] Give every particle a bounded lifetime and schedule the waves so the confetti runs about 3.5 s.
- [x] T006 [US1] End the celebration after the window: clear timers, reset the instance, fade the layer and unmount it so nothing is left behind the reveal container.
- [x] T007 [US1] Clear every timer and release the instance and canvas on unmount.

## Phase 3 — User Story 2 (reveal unchanged)

- [x] T008 [US2] Preserve the number timing, row layout, swatch, shimmer, sparkle, gold glow, flash, settled-leaf artwork, panel styling and copy.
- [x] T009 [US2] Keep the reduced-motion path identical to the shipped behaviour (static finish, no particles, no sound).

## Phase 4 — User Story 3 (both sounds)

- [x] T010 [US3] Confirm the finishing pop still plays once after the final number.
- [x] T011 [US3] Add a brief same-origin opening sparkle and play it once when the reveal opens.
- [x] T012 [US3] Skip the opening sparkle for reduced-motion visitors, matching the existing sound policy.

## Phase 5 — User Story 4 (both number modes)

- [x] T013 [US4] Confirm the celebration delay is derived from the number count so Six Pick and Seven Pick both celebrate after their final number.
- [x] T014 [US4] Confirm `app/lucky-reveal.js` number generation is unmodified.

## Phase 6 — Tests and verification

- [x] T015 Update the existing celebration guards for the confined canvas and the new window; add `__tests__/lucky-reveal-confetti-phase1.test.js`.
- [x] T016 Run the focused suites, full Vitest, `tsc --noEmit`, `./freebuff-verify.sh`, and measure the production build.
- [x] T017 Browser-verify the reveal at desktop and mobile sizes, including both sounds and both number modes, where an engine is available. (Chromium via `scripts/setup-chromium-libs.sh`; evidence in `artifacts/reveal-confetti-phase1/`.)
- [x] T018 Audit the final diff and record the results in the single PR summary.

## Verification record

- `pnpm exec vitest run` — 33 files / 332 tests PASS.
- `pnpm exec tsc --noEmit` — exit 0.
- `./freebuff-verify.sh` — exit 0 (Spec Kit gate, typecheck, production build, refresh-docs 19/19).
- Production build `.next` — 299,133,609 bytes / 285.3 MiB (< 495 MB).
- Browser probe (1440x900 and 390x844, 6 Pick and 7 Pick): particle canvas inside the reveal, `body > canvas` count 0, painted leaf pixels in the reveal area, celebration after the final number, layer and canvas gone afterwards, both sound files requested, no page errors, reduced motion unchanged.
- Not verified: audible playback (this environment has no audio output device).
