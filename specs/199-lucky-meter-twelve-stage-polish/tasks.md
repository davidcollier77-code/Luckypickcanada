---
description: "Task list for the Lucky Meter twelve-stage cinematic polish"
---

# Tasks: Lucky Meter Twelve-Stage Cinematic Polish

**Input**: Design documents from `/specs/199-lucky-meter-twelve-stage-polish/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story. Every task below was
completed in this task's diff.

> **Historical record.** The checkboxes preserve what was completed in this
> task. T001, T004, T009, T017 and T018 contain timing, number or generation
> assertions superseded by the approved 21 November 2026 outline. Their checked
> state is preserved, but they are not current acceptance criteria. Current
> authority is the approved outline and Spec 200.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Could run in parallel (different files, no dependencies)
- **[Story]**: Which user story the task belongs to

## Phase 1: Shared storyboard (US1–US5)

- [X] **T001** [US5] Retime `app/lib/lucky-meter/storyboard.js`: hold, breeze,
  anticipation, generation, landing, colour settle, vessel open, pour, number
  reveal, message, celebration hand-off, Spark and the final hold, for a
  complete run of roughly forty seconds.
- [X] **T002** [US1] Add `landingMs`, `numberFlashMs`, `numberFlashCount` and
  `finalHoldMs`, and split `dockDelayMs` into a real hold plus the dock settle.
- [X] **T003** [US1] Expose `COLOUR_SELECT_END_MS` and `VESSEL_OPEN_END_MS`, and
  rebuild `buildStoryboard()` as twelve ordered stage descriptors.
- [X] **T004** [US4] Keep the celebration inside its established per-tier window
  and add a test proving the fireworks run stays longer than the meteor run.

## Phase 2: Arrival pile (US1)

- [X] **T005** [P] [US1] Rewrite the composition in
  `app/lib/lucky-meter/arrival-leaves.js` as four overlapping mound layers plus
  two side drifts, linearly weighted across the leaf count.
- [X] **T006** [US1] Add per-leaf `driftSign` so the gust opens out from the
  centre, and sort the composition back to front by depth.
- [X] **T007** [P] [US1] Render the pile in `components/LuckyMeterArrivalLeaves.jsx`
  with 34 depth-ordered leaves and raise the layer above the meter so the pile
  reads as foreground.
- [X] **T008** [US1] Assert the composition stays below the headline and the
  Start control on desktop and on a phone.

## Phase 3: Generation and colour selection (US2)

- [X] **T009** [US2] Change `sampleGenerationPercentage` in
  `app/lib/lucky-meter/reveal.js` to sweep the real 5–100 scale, never equal the
  final value before the last frame, and never show 100 while still moving.
- [X] **T010** [US2] Start the readout on `PERCENTAGE_MIN` in
  `components/DailyResonance.tsx`.
- [X] **T011** [US2] Remove the plaque, eyebrow and caption during generation so
  the percentage occupies the exact centre of the meter.
- [X] **T012** [P] [US2] Add the seasonal colour-selection settle to
  `app/globals.css`, scoped to the landed phase and disabled under reduced
  motion.

## Phase 4: Vessel and pour (US2)

- [X] **T013** [US2] Add `vesselOpen` to the reveal motion and drive it from the
  vessel-open window, independent of the pour.
- [X] **T014** [US2] Split `startPour` so the vessel opens first and the colour
  only begins to flow when it is fully open.
- [X] **T015** [P] [US2] Replace the flat colour card with a three-dimensional
  transparent vessel (`components/DailyResonance.tsx`) and its CSS in
  `app/globals.css`: recessed back wall, side walls, glass front, gold rim,
  tilting lid, contact shadow, liquid surface and specular reflection.
- [X] **T016** [US2] Keep the caption flat and readable, and preserve every
  existing `data-testid` and colour string.

## Phase 5: Lucky Number (US3)

- [X] **T017** [US3] Hold `numberReveal` at `0` for the whole drain and pass the
  number to the ring only after it settles.
- [X] **T018** [US3] Reveal the number when the pour completes, flash it exactly
  twice and then settle it into the placard.
- [X] **T019** [US3] Assert the pour phase exposes no number and no placard, and
  that the reveal follows the drain.

## Phase 6: Spark, hold and dock (US4)

- [X] **T020** [US4] Replace the sky-writing dot with the shared maple-leaf
  silhouette in `components/LuckyMeterSkyWriting.tsx`.
- [X] **T021** [P] [US4] Style the glowing golden leaf cursor and its halo in
  `app/globals.css`, with a reduced-motion fallback.
- [X] **T022** [US4] Lengthen the final hold so the finished scene is appreciated
  before Home and the countdown arrive together.

## Phase 7: Audio (US4)

- [X] **T023** [US4] Time the pour cue to the first drop rather than the start
  of the vessel stage.
- [X] **T024** [US4] Add the `number-reveal` cue, reusing the existing metal
  recording, and keep the deeper layered finale boom unchanged.
- [X] **T025** [US4] Preserve the sustained-cue fade/stop cleanup on stage end,
  unmount and midnight rollover.

## Phase 8: Removals and preservation (US5)

- [X] **T026** [US5] Remove the continuous drifting-leaf ornament layer from the
  Lucky Meter route so the opening arrival is the only leaf moment.
- [X] **T027** [US5] Leave the Milky Way picture, overlay, stars, forest, lake,
  lightning, medallion, palettes, tiers, messages and selection logic untouched.
- [X] **T028** [US5] Add no dependency, renderer, preloader or WebGPU path.

## Phase 9: Verification (US5)

- [X] **T029** Focused Vitest suites: storyboard/reveal, arrival, sky writing,
  event audio, audio playback, cinematic lifecycle and daily experience.
- [X] **T030** Full Vitest suite and `tsc --noEmit`.
- [X] **T031** `./freebuff-verify.sh` and the measured production build size.
- [X] **T032** Playwright `lucky-meter-daily-resonance` spec on desktop,
  mobile-390 and mobile-412, plus a recorded sequence and reduced-motion walk.
