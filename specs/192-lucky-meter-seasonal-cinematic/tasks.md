# Tasks: Lucky Meter Seasonal Cinematic Experience

**Feature**: `specs/192-lucky-meter-seasonal-cinematic`

## Phase 1: Setup and research

- [X] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the Memory Bank and the applicable `.docs/` sources.
- [X] T002 Inspect the current `DailyResonance`, ring, selection, storage, audio, resource hub, tests and CSS.
- [X] T003 Read the nine reference frames and record the required order, materials, space and dock contract.
- [X] T004 Audit the existing recordings and confirm every new cue can reuse a same-origin file.

## Phase 2: Configuration and pure logic

- [X] T005 Create `sparks-and-seasonal-colours.js` with 30 Sparks, four 12-colour palettes, finishes, exact
      HEX values, season names, date ranges and pure helpers.
- [X] T006 Create `storyboard.js` with every stage length and the derived run schedule.
- [X] T007 Rewrite `reveal.js` for seasonal wheel geometry, fixed 6 o'clock pointer, spin sampler, percentage
      sampler and event duration.
- [X] T008 Update `selection.js` to draw from the date's season and preserve stored/legacy colours.
- [X] T009 Update `storage.js` with additive `messageCompleted`, seasonal season and legacy colour ids.

## Phase 3: Experience

- [X] T010 Rewrite `LuckyMeterRing.jsx` as a 12-segment painted wheel with gold rims, grain, fixed leaf
      pointer, drain, number reveal and static medallion fallback.
- [X] T011 Add `LuckyMeterMessage.tsx` for the exact tier message, hold and fade.
- [X] T012 Rebuild the `DailyResonance` controller around the nine stages, resume points, seasonal palette,
      reduced motion, timer latches and the Home/countdown dock.
- [X] T013 Slow the arrival leaves, report when the breeze has cleared, add the start beat and a static
      fallback so Start can never be stranded.
- [X] T014 Add the stage cue map and the shared Howl set; register the Lucky Meter v2 audio resource with the
      Resource Readiness Hub.
- [X] T015 Style the tier message and colour vessel; reserve generous space above the meter.

## Phase 4: Verification

- [X] T016 Add/rewrite unit suites: seasonal colours, storyboard/reveal, selection, storage, cinematic
      lifecycle, daily experience, reveal protection, event audio and arrival leaves.
- [X] T017 Replace the stale Playwright spec with arrival, wheel/percentage, pour, message/celebration/Spark,
      four seasonal palettes, legacy colour, resume points, reduced motion, WebGL fallback and evidence.
- [X] T018 Run the full Vitest suite and `pnpm exec tsc --noEmit`.
- [X] T019 Run the Lucky Meter Playwright spec on desktop, mobile-390 and mobile-412.
- [X] T020 Capture desktop and mobile before/after evidence and inspect the seasonal results.
- [X] T021 Run `./freebuff-verify.sh` and the production build; measure `.next` + `public` below 495 MiB.
- [X] T022 Record the Spec Kit, Memory Bank and PR handoff.

## Phase 5: Delivery

- [ ] T023 Commit, push and open one non-draft PR against `main` with the complete handoff.
