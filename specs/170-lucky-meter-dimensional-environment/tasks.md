# Tasks: Lucky Meter Dimensional Environment

**Input**: Design documents from `/specs/170-lucky-meter-dimensional-environment/`

**Prerequisites**: spec.md, checklists/requirements.md, research.md, plan.md

**Scope guard**: Rendering quality and presentation only. No change to result
generation, selection, reveal timings, event durations, storage, sharing,
navigation, audio or the Milky Way artwork.

## Phase 1: Evidence and setup

- [X] T001 Capture the delivered baseline at 1440 × 900, seed each event, and record frame timing (`artifacts/lucky-meter-cinematic-v2-qa/`)
- [X] T002 Record the specific artificial qualities found in the captures (`research.md` §1)
- [X] T003 Confirm the measured gold palette and the WebGL 1 constraint before authoring materials
- [X] T004 Confirm no new dependency, route, server write or checker change is required

## Phase 2: Foundational rendering primitives (blocking)

- [X] T005 [P] Add `app/lib/gpu-math.js` with mat4/mat3, perspective and projection helpers
- [X] T006 [P] Add `app/lib/gpu-geometry.js` with ear clipping, lathe rings, maple-leaf extrusion and the medallion profile
- [X] T007 [P] Add `app/lib/gpu-scene-light.js` shared screen-space light bus with fixed capacity
- [X] T008 Add `app/lib/gpu-lighting.js` with the lit-metal and sky-light shader programs
- [X] T009 Extend `resolveRenderQuality` with ornament and medallion budgets without changing existing fields
- [X] T010 Add focused tests for math, geometry and the light bus

## Phase 3: User Story 1 — Physical gold medallion (P1)

- [X] T011 [US1] Add `components/lucky-meter-medallion-engine.js` rendering the lit bevelled medallion
- [X] T012 [US1] Rework `components/LuckyMeterRing.jsx`: 3D canvas, static CSS fallback, remove the flat conic layers and static leaf images
- [X] T013 [P] [US1] Add the fallback medallion and tier-plate styles in `app/globals.css`
- [X] T014 [US1] Verify percentage, tier and message stay legible and unclipped at every supported width

## Phase 4: User Story 2 — Golden maple leaf ornaments (P1)

- [X] T015 [US2] Add `components/lucky-meter-ornament-engine.js` for far and near leaf layers
- [X] T016 [US2] Mount the ornament layers in `DailyResonance` with pointer-transparent, aria-hidden canvases
- [X] T017 [US2] Verify the silhouette, bevel visibility, depth ordering and reduced-motion behaviour

## Phase 5: User Story 3 — Meteors (P2)

- [X] T018 [US3] Introduce the shared perspective camera in `cosmic-event-engine.js`
- [X] T019 [US3] Rebuild meteor trails with a colour ramp, smoke wake and shed fragments
- [X] T020 [US3] Mix foreground, middle-distance and background meteors

## Phase 6: User Story 4 — Lightning (P2)

- [X] T021 [US4] Build branching strikes in three dimensions with depth-scaled width
- [X] T022 [US4] Add the white core, cool sheath, flicker and afterglow
- [X] T023 [US4] Guarantee distant, mid-distance and close strikes; publish strike light to the shared bus

## Phase 7: User Story 5 — Fireworks and golden finale (P1)

- [X] T024 [US5] Distribute burst particles on a three-dimensional sphere and project them
- [X] T025 [US5] Add the additive sky-light pass so bursts visibly brighten the sky
- [X] T026 [US5] Add smoke that takes colour from the active burst light
- [X] T027 [US5] Rebuild the golden finale as a larger multi-shell climax with the strongest light and a longer linger
- [X] T028 [US5] Confirm the existing finale boom cue still fires and is unchanged

## Phase 8: User Story 6 — Premium presentation (P3)

- [X] T029 [US6] Add the framed tier plate with metallic type and correct hierarchy
- [X] T030 [US6] Unify the Little Spark panel, supporting panels, Share, countdown and Home treatment
- [X] T031 [US6] Verify no Lucky Meter label renders below 12 px and no copy changed

## Phase 9: User Story 7 — Performance and lifecycle (P1)

- [X] T032 [US7] Budget every new renderer from the quality profile; omit near layers when constrained
- [X] T033 [US7] Extend the frame governor to reduce ornament and mesh cost before dropping layers
- [X] T034 [US7] Preserve pause/resume, resize, orientation, context-loss recovery and full resource release
- [X] T035 [US7] Confirm reduced-motion, WebGL fallback and the compact widget

## Phase 10: Verification and delivery

- [X] T036 Run the focused and full Vitest suites plus `tsc --noEmit`
- [X] T037 Run the production build and confirm it is strictly below 495 MiB
- [X] T038 Run `./freebuff-verify.sh`
- [X] T039 Capture after-state screenshots and frame timing for all three events at desktop, mobile-390 and mobile-412
- [X] T040 Run structural and behavioural browser checks, including WebGL-disabled and reduced-motion paths
- [X] T041 Measure before/after sky luminance and finale scale to evidence the illumination claims
- [X] T042 Record evidence, update the Memory Bank, and prepare and open the PR per `PR_SUBMISSION.md`

## Dependencies

- T005–T010 block every renderer.
- T011 blocks T012 and T014.
- T015 blocks T016 and T017.
- T018 blocks T019–T027.
- T024/T025 block T026 and T027.
- T036–T041 depend on all implementation tasks.

## Notes

- The reveal timings, event durations, selection rules, storage payload and share
  path are frozen.
- The Milky Way `<picture>` block must remain textually identical.
- Every new canvas is `aria-hidden` and `pointer-events-none`.
- Audio is untouched; the finale boom cue keeps its existing assignment.
