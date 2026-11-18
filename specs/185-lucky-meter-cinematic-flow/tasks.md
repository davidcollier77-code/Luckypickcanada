# Tasks: Lucky Meter Cinematic Flow — Arrival Leaves, One Continuous Reveal and Sky-Written Spark

**Input**: Design documents from `/specs/185-lucky-meter-cinematic-flow/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Constraints and baseline

- [x] T001 Re-read `AGENTS.md`, the four Memory Bank files, the Lucky Meter task groups and `.docs/manifest.json`.
- [x] T002 Inspect the existing reveal, cinematic, audio, ornament and Spark implementation and its tests.
- [x] T003 Confirm the frozen tiers, selection, storage key, event cue map and Milky Way block.
- [x] T004 Capture desktop and 390 px before evidence of the old Spark panel.

## Phase 2: Arrival leaves

- [x] T005 Add the pure arrival composition, wind sampling and motion in `app/lib/lucky-meter/arrival-leaves.js`.
- [x] T006 Add the single Canvas 2D arrival layer with procedural maple leaves, shadows, veins and stems.
- [x] T007 Rest for one second, then lift on the shared breeze and carry every leaf out of frame.
- [x] T008 Pause on hidden tabs, resume from the same moment, and release frames, timers and listeners.
- [x] T009 Draw once and stop under reduced motion; remove the layer on Start.
- [x] T010 Keep the phone composition below the headline in the side gutters.

## Phase 3: Coordinated reveal

- [x] T011 Add a 500 ms anticipation with no value exposed and a gathering gold point.
- [x] T012 Start all three motions together after the hold and settle at 3,200 / 5,400 / 7,400 ms.
- [x] T013 Derive `EVENT_START_MS` from the anticipation, the last settle and the 420 ms hand-off.
- [x] T014 Share the motion path between Start and a mid-reveal refresh without redrawing values.
- [x] T015 Keep the buildup through the anticipation and dial, fading at the percentage settle.

## Phase 4: Sky-written Spark

- [x] T016 Add `LuckyMeterSkyWriting` with waiting, writing and written states and a local character clock.
- [x] T017 Hold the sky for one second after the cinematic before writing begins.
- [x] T018 Replace the raised panel and GoldenLeaf with the tiny golden writing point and glowing message.
- [x] T019 Keep the completed message visible and announced once; remove the cursor.
- [x] T020 Present the complete Spark immediately under reduced motion.
- [x] T021 Remove the old panel and quill CSS and add the sky-writing styles.

## Phase 5: Verification

- [x] T022 Add arrival composition and motion unit tests.
- [x] T023 Add sky-writing DOM tests.
- [x] T024 Update the reveal timing, daily-experience and cinematic-lifecycle suites.
- [x] T025 Update the Playwright spec for arrival, measured reveal hand-off, sky-writing and reduced motion.
- [x] T026 Run the full Vitest suite and the TypeScript check.
- [x] T027 Run focused Playwright checks on desktop, mobile-390 and mobile-412.
- [x] T028 Run the production build, measure it against 495 MiB and run `./freebuff-verify.sh`.
- [x] T029 Capture and inspect before/after evidence.
