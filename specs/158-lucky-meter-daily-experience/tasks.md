# Tasks: Lucky Meter Daily Experience

**Input**: Design documents from `/specs/158-lucky-meter-daily-experience/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Scope guard**: Visuals and daily-result logic only. No new audio, no server or
database writes for the daily result, no route or artwork changes.

## Phase 1: Setup and Evidence

- [X] T001 Inspect the existing `DailyResonance`, Lucky Meter routes/widget, shared countdown and visual test (`research.md`)
- [X] T002 Confirm the storage keys, countdown engine and artwork that must be preserved (`research.md`)
- [X] T003 Record the approved tiers, event weights/numbers, colours, Spark requirements and event timing windows (`spec.md`)
- [X] T004 Define the versioned Local Storage schema and history limits (`data-model.md`)

## Phase 2: User Story 1 — One independent daily result (P1)

**Goal**: A complete, validated, persistent result per local day with rollover.

**Independent Test**: Reveal, inspect storage, refresh, compare fields; change
the date and confirm the meter resets.

- [X] T005 [US1] Create the event, tier, colour and duration configuration in `app/lib/lucky-meter/config.js`
- [X] T006 [P] [US1] Create the 30-message editable Little Sparks data file in `app/lib/lucky-meter/little-sparks.js`
- [X] T007 [US1] Implement independent percentage/event/colour/Spark selection, tier derivation and result validation in `app/lib/lucky-meter/selection.js`
- [X] T008 [US1] Implement guarded versioned Local Storage, history caps and stale-date handling in `app/lib/lucky-meter/storage.js`
- [X] T009 [US1] Rewrite `components/DailyResonance.tsx` to load today's result, persist on reveal, and reset on the shared countdown's local date key
- [X] T010 [P] [US1] Add selection tests for range, avoidance, weights, three-peat guard, fixed numbers, colours, Sparks and validation in `__tests__/lucky-meter-selection.test.js`
- [X] T011 [P] [US1] Add storage tests for round-trip, limits, corrupt state, stale dates and failures in `__tests__/lucky-meter-storage.test.js`

## Phase 3: User Story 2 — Unpredictable reveal (P2)

**Goal**: 4.5-second hidden scramble, landing flash and staged details.

**Independent Test**: Time the reveal beats and prove the real number is absent
until landing.

- [X] T012 [US2] Implement the climb/drop/jump keyframes, hidden-value guarantee and timing constants in `app/lib/lucky-meter/reveal.js`
- [X] T013 [US2] Implement the scramble rAF loop, landing flash, 0.8 s detail reveal and 0.6 s event start in `components/DailyResonance.tsx`
- [X] T014 [P] [US2] Add the landing flash and calm detail-rise animations to `app/globals.css`
- [X] T015 [P] [US2] Add reveal timing/range tests and component beat tests in `__tests__/lucky-meter-reveal.test.js` and `__tests__/daily-resonance-daily-experience.test.jsx`

## Phase 4: User Story 3 — Three weighted cinematic events (P3)

**Goal**: GPU meteor, lightning and fireworks set pieces with clean teardown.

**Independent Test**: Run each event, check counts, depth, finale and duration.

- [X] T016 [US3] Implement the WebGL point/haze shaders, particle pipeline and event choreography in `components/cosmic-event-engine.js`
- [X] T017 [US3] Implement the stage wrapper, reduced-motion view, WebGL fallback and safety completion in `components/CosmicEventStage.jsx`
- [X] T018 [US3] Mount and clean up the stage in `components/DailyResonance.tsx` using per-event durations
- [X] T019 [P] [US3] Add event duration-window tests in `__tests__/lucky-meter-reveal.test.js`

## Phase 5: User Story 4 — Share the finished reading (P4)

**Goal**: Native-first sharing with cancellation safety and clipboard fallback.

**Independent Test**: Mock native share resolve/cancel/reject and clipboard.

- [X] T020 [US4] Implement share text and native-first sharing in `app/lib/lucky-meter/share.js`
- [X] T021 [US4] Wire the Share My Resonance button and status feedback in `components/DailyResonance.tsx`
- [X] T022 [P] [US4] Add sharing tests for native, cancellation, failure, clipboard and total failure in `__tests__/lucky-meter-share.test.js`

## Phase 6: Cross-cutting, Verification and Delivery

- [X] T023 Replace the legacy storage seed in `tests/visual/crystal-ball-daily-limit.spec.ts`
- [X] T024 Update `__tests__/daily-resonance-lifecycle.test.jsx` for the new reveal/audio behaviour
- [X] T025 Run the focused unit/component suites and the type check
- [X] T026 Run `./freebuff-verify.sh`
- [X] T027 Measure the production build and confirm it is strictly below 495 MiB
- [X] T028 Record verification evidence in `evidence.md`
- [X] T029 Update the Memory Bank and open one regular, non-draft PR for review

## Dependencies

- T005–T008 block T009 and all later component work.
- T012 blocks T013; T016/T017 block T018.
- T010/T011/T015/T019/T022 are independent files.
- T025–T029 depend on all implementation tasks.

## Notes

- Percentage, event, colour and Spark are independent; the tier follows the
  percentage by definition.
- Three-peat prevention excludes the repeated event from a fresh weighted draw;
  it never rotates through a fixed order.
- The event engine is additive only, so the Milky Way remains intact.
- No audio is added; existing Howler cues are preserved with the same assets.
