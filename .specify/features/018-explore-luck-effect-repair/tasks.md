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
- [x] T007 Preload and cache the short Mixkit `Fairy magic sparkle` asset in `app/lib/audio.js`; prevent delayed playback after activation.
- [x] T008 Strengthen `tests/visual/homepage.spec.ts` to verify actual rendered pixels and pre-activation sound preload.
- [x] T009 Add only `https://assets.mixkit.co` to `media-src` in `next.config.mjs` for the selected sound; leave other CSP directives untouched.

## Phase 4 — Verify and report
- [ ] T010 Run focused Playwright tests and `./jules-verify.sh` in a capable checkout.
- [ ] T011 Inspect CI results, final diff, measured build output and mobile behavior before reporting the task as complete.
- [x] T012 Address review findings by reporting confetti-shape fallback failures, reporting Howler playback errors, and sharing the chime URL/CSP origin from one module.
- [x] T013 Keep the visual interaction test deterministic by fulfilling the production audio URL with a valid local WAV fixture instead of relying on external CDN availability.
- [x] T014 Inspect the fresh Visual QA failure artifact and replace the suspected hand-calculated maple-leaf matrix with automatic path normalization.
- [ ] T015 Confirm visible particles in the new Visual QA run, confirm latest OpenNext result/build-size evidence, re-check review comments and final diff.
