# Tasks: Explore Your Luck Effect Repair

## Phase 1 — Specify
- [x] T001 Define the interaction requirements and protected homepage behavior in `spec.md`.

## Phase 2 — Plan and research
- [x] T002 Record verified particle-shape/audio timing findings and the chosen approach in `research.md`.
- [x] T003 Document implementation phases, constraints and verification in `plan.md`.
- [x] T004 Record the in-memory interaction model and interaction contract.

## Phase 3 — Implement the repair
- [x] T005 Replace click-time bitmap loading with a normalized path-based golden maple-leaf shape in `app/homepage/ExploreLuckButton.js`.
- [x] T006 Increase the particle count and modestly enlarge particles without changing scroll behavior.
- [x] T007 Preload and cache the existing local `public/sounds/sparkling.wav` asset through `app/lib/audio.js`; prevent delayed playback after activation.
- [x] T008 Strengthen `tests/visual/homepage.spec.ts` to verify actual rendered pixels and pre-activation sound preload.
- [x] T009 Centralize the audio URL and derive the `media-src` origin in `app/lib/magicalChimeSource.mjs`; leave other CSP directives untouched.

## Phase 4 — Verify and report
- [ ] T010 Run `./jules-verify.sh` in a capable local checkout; this connector environment has no local checkout/pnpm executable.
- [ ] T011 Measure the full required build-output limit and verify audible local chime playback/timing on an actual mobile device before marking all work complete.
- [x] T012 Address review findings by reporting confetti-shape fallback failures, reporting Howler playback errors, and sharing the chime URL/CSP origin from one module.
- [x] T013 Keep the visual interaction test deterministic by fulfilling the local `/sounds/sparkling.wav` request with a valid WAV fixture.
- [x] T014 Diagnose the CSP-blocked Blob-worker path and switch to a dedicated `canvas-confetti` canvas with `useWorker: false`; retain an explicit transform for the existing negative-coordinate SVG path without relaxing CSP.
- [x] T015 Verify prior confetti implementation with Visual QA run #388 (12 passed, 3 skipped, 0 failed), OpenNext run #997 (passed), review-thread triage and source-diff checks.
- [x] T016 Switch the canonical chime source to `/sounds/sparkling.wav` and remove the external origin from CSP construction.
- [x] T017 Update the homepage Playwright test to intercept and assert the local WAV preload request.
- [ ] T018 Run current-task Playwright, `./jules-verify.sh`, and build-size verification; report actual outcomes.
