# Tasks: Lucky Meter Visitor Experience — Cinematic Instrument

**Input**: Design documents from `/specs/227-lucky-meter-visitor-experience/`

**Prerequisites**: plan.md, spec.md, research.md

## Phase 1: Setup

- [x] T001 Confirm next spec number and repoint `.specify/feature.json`
- [x] T002 Write spec, plan, research, checklist and tasks for Spec 227

## Phase 2: Foundational

- [x] T003 Extend `app/lib/lucky-meter/meter-layout.js` with plaque, colour bar, banner, spout and portrait framing
- [x] T004 Add `chamberWorldPosition`, `numberTransferPath` and `measurePathClearance` (pure, testable)
- [x] T005 Add `app/lib/lucky-meter/choreography.js` envelopes
- [x] T006 Add `bowl-full` and `number-depart` cues to `event-audio.js`

## Phase 3: US1 — READY composition (P1)

- [x] T007 Rebuild chamber geometry as glass cups in a punched gold plate
- [x] T008 Replace the leaf pointer with the open angle-cut spout and inner channel
- [x] T009 Add the red-and-gold banner with engraved lettering and leaves
- [x] T010 Add the faceted bowl profile and fluted gold foot
- [x] T011 Add the ornate plaque and colour bar geometry
- [x] T012 Portrait stage framing and CSS aspect
- [x] T013 Remove intro block, visits pill, event card and results grid; Start below the instrument

## Phase 4: US2 — FINISHED composition (P2)

- [x] T014 Colour bar inlay carries `data-vessel-*` and the selected colour name
- [x] T015 Plaque inlay mounts at arrival with `lucky-number-panel` / `lucky-number-value`
- [x] T016 Compact "Next Reveal In" dock chip; visits counter stays on the homepage

## Phase 5: US3 — Drain (P3)

- [x] T017 Selected-cup-only drain with a rising bowl fill
- [x] T018 Stream starts at the spout mouth and the arm channel lights during the pour

## Phase 6: US4 — Number transfer (P4)

- [x] T019 Dimensional number token built from cached geometry and textures
- [x] T020 Detach at `NUMBER_PAUSE_END_MS`, flight across the existing window, seat at `REVEAL_COMPLETE_MS`
- [x] T021 Clearance assertions for the sampled path

## Phase 7: US5 — Sound and choreography (P5)

- [x] T022 Focus/rim/dust envelopes wired into the scene
- [x] T023 Cues at pour start, bowl full, detach, arrival, dock
- [x] T024 Spark restyle: gold script, drawn ribbon, leaf; no label or quote chrome

## Phase 8: US6 — Colours and QA (P6)

- [x] T025 Twelve palette verification across seasons
- [x] T026 Rewrite responsive assertions to the new composition at equal strictness
- [x] T027 Update copy matchers (Start label, Next Reveal In) across unit and visual specs
- [x] T028 Run `./freebuff-verify.sh`, unit suites and the Lucky Meter visual spec
- [x] T029 Measure the production build and confirm strictly below 495 MiB
- [x] T030 Capture READY, FINISHED and intermediate reveal evidence
- [x] T031 Update Memory Bank and open one regular, unmerged PR
