# Tasks: Lucky Meter Cinematic Redesign

**Input**: Design documents from `/specs/164-lucky-meter-cinematic-redesign/`

**Prerequisites**: spec.md, research.md, plan.md

**Scope guard**: Presentation, retained GPU pipeline, lifecycle persistence and
recorded audio only. No changes to result generation, reveal timings, event
durations, artwork, routes, server writes or dependencies.

## Phase 1: Setup and Evidence

- [X] T001 Inspect `DailyResonance`, the WebGL stage/engine, capability layer, reveal/storage/share modules and existing audio (`research.md`)
- [X] T002 Confirm the Milky Way markup, overlay, `object-position` and layer order that must be preserved (`research.md`)
- [X] T003 Record free audio candidates, measured suitability and licence terms (`research.md`)
- [X] T004 Define the extended storage payload fields and backward-compatibility rule (`plan.md`)

## Phase 2: User Story 1 — Preserved background and cinematic composition (P1)

**Goal**: Bottom-anchored scene with a persistent circular meter and untouched artwork.

**Independent Test**: Inspect background markup equality and the welcome layout at four viewport classes.

- [X] T005 [US1] Add the persistent `LuckyMeterRing` shell and its gold/maple-leaf design in `components/LuckyMeterRing.jsx`
- [X] T006 [P] [US1] Add the ring's slow additive GPU trail engine in `components/lucky-meter-ring-engine.js`
- [X] T007 [US1] Rebuild `DailyResonance` presentation around the bottom-anchored scene while copying the Milky Way `<picture>` and overlay unchanged
- [X] T008 [P] [US1] Add ring, Home and cinematic layout styles to `app/globals.css`
- [X] T009 [US1] Verify no result value is rendered in the welcome state

## Phase 3: User Story 2 — Lifecycle-accurate Home control (P1)

**Goal**: Home follows the reveal and survives refresh correctly.

**Independent Test**: Record Home visibility at each beat, refresh mid-event, roll the local date.

- [X] T010 [US2] Extend `saveMeterState`/`loadMeterState` with `eventCompleted` and `stageDurationMs` without changing the storage version
- [X] T011 [US2] Persist completion at stage finish and resume an unfinished stored event on refresh
- [X] T012 [US2] Render the top-right Home control with the lifecycle visibility rule and reduced-motion completion
- [X] T013 [P] [US2] Add storage lifecycle tests in `__tests__/lucky-meter-storage.test.js`
- [X] T014 [P] [US2] Add component lifecycle tests for Home visibility, refresh resume, completion persistence and midnight reset in `__tests__/lucky-meter-cinematic-lifecycle.test.jsx`

## Phase 4: User Story 3 — Cinematic meteors, lightning and fireworks (P2)

**Goal**: Film-like layered effects with the required finale and foreground sparks.

**Independent Test**: Run each event, inspect near/far compositing and finale dissipation.

- [X] T015 [P] [US3] Extract shared shader/program/point-batch primitives into `app/lib/gpu-particles.js` and adopt them in the existing engine
- [X] T016 [US3] Add dual far/near surfaces and depth tagging to `cosmic-event-engine.js` and `CosmicEventStage.jsx`
- [X] T017 [US3] Rework meteor trails, lightning branching and illumination for depth and atmosphere
- [X] T018 [US3] Implement distinct red peony and white/silver crackle firework identities
- [X] T019 [US3] Implement the golden chrysanthemum, willow trails and foreground falling sparks with a natural fade inside the event duration
- [X] T020 [P] [US3] Add the near-layer canvas above the interface without intercepting pointer events

## Phase 5: User Story 4 — Adaptive GPU quality and stability (P3)

**Goal**: Use real capability and live performance, with graceful fallback.

**Independent Test**: Hardware WebGL, no WebGL, lost context, hidden tab, reduced motion, multiple viewports.

- [X] T021 [US4] Add pure `resolveRenderQuality` and quality caps to `app/lib/graphics-capabilities.js`
- [X] T022 [US4] Apply quality-driven budgets, DPR, haze and foreground availability in both engines
- [X] T023 [US4] Add the frame-rate governor and low-quality stepping in the event engine
- [X] T024 [US4] Preserve pause/resume, resize, orientation, context-loss cleanup and resource release for both surfaces
- [X] T025 [P] [US4] Add `resolveRenderQuality` tests in `__tests__/graphics-capabilities.test.js`

## Phase 6: User Story 5 — Authentic recorded audio (P4)

**Goal**: Licensed recorded firework and thunder cues beside preserved sounds.

**Independent Test**: Verify provenance, licences and cue syncing; confirm no generated audio.

- [X] T026 [US5] Create the finale boom and thunder WAV derivatives from the downloaded masters
- [X] T027 [US5] Record provider, item, URL, licence, acquisition date and derivative details in `public/sounds/lucky-meter-cinematic-audio-sources.md`
- [X] T028 [US5] Load and cue the new sounds in `DailyResonance.tsx` with volume, rate variation and thunder throttling
- [X] T029 [US5] Keep the existing buildup, meteor, lightning, whistle and break cues intact

## Phase 7: Cross-cutting, Verification and Delivery

- [X] T030 Update the existing daily-experience test only where resumed-event behaviour intentionally changed
- [X] T031 Run focused Vitest suites and `pnpm exec tsc --noEmit`
- [X] T032 Run the full Vitest suite and `./freebuff-verify.sh`
- [X] T033 Measure the production build and confirm it is strictly below 495 MiB
- [X] T034 Production-build Chromium QA for the full sequence, refresh, reduced motion, WebGL fallback, mobile and controls
- [X] T035 Record evidence, update the Memory Bank and prepare the PR report

## Dependencies

- T005/T006 block T007 and the ring layout.
- T010/T011 block T012 and the lifecycle tests.
- T015 blocks T016–T019.
- T021/T022 block T023 and the quality tests.
- T026/T027 block T028.
- T031–T034 depend on all implementation tasks.

## Notes

- The reveal timings, event durations, selection rules and share path are
  frozen; only their presentation changes.
- The Milky Way `<picture>` block must remain textually identical.
- The near canvas is optional and never receives pointer events.
- Audio is only requested after the visitor's Start gesture.
