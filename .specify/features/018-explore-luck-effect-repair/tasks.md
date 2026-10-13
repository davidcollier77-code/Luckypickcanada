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
- [x] T007 Preload and cache the existing chime in `app/lib/audio.js`; prevent delayed playback after activation.
- [x] T008 Strengthen `tests/visual/homepage.spec.ts` to verify actual rendered pixels and pre-activation sound preload.

## Phase 4 — Verify and report
- [ ] T009 Run focused Playwright tests and `./jules-verify.sh` in a capable checkout.
- [ ] T010 Inspect CI results, final diff, measured build output and mobile behavior before reporting the task as complete.
