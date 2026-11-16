# Tasks: Percentage-Owned Reveal and Natural Leaf Realism

**Feature**: `specs/174-lucky-meter-percentage-realism`

**Status**: All task groups complete.

## Task Group 1 — Percentage owns tier, event and numbers

- [X] T001 Move the tier bands to 5–30 / 31–65 / 66–100 and attach `eventId`
      to each tier in `app/lib/lucky-meter/config.js`.
- [X] T002 Remove the independent event draw and weights; derive event and
      numbers from the percentage in `app/lib/lucky-meter/selection.js`.
- [X] T003 Keep the three-day guard on percentage history, scoped to the
      blocked tier band, and lift it when it would empty the range.
- [X] T004 Preserve percentage, colour, Spark and date on read and normalize
      tier/event/numbers from the stored percentage (`validateDailyResult`).

## Task Group 2 — The dial lands on the value it shows

- [X] T005 Add `percentageToAngle` / `angleToPercentage` with the 0°/100 %
      wrap and list the 3.6°-per-percent contract in `reveal.js`.
- [X] T006 Build the multi-turn spin with a random start angle and quintic
      ease-out ending at the exact percentage angle.
- [X] T007 Read the displayed percentage from the dial angle while spinning so
      the final value is never shown early.
- [X] T008 Set the landing angle and displayed value from the same number in
      `DailyResonance`, and expose `data-dial-angle` on the ring.
- [X] T009 Draw the brass index over the milled rim, at every viewport, with
      reduced-motion and focus behaviour unchanged.

## Task Group 3 — Natural, wind-carried leaves

- [X] T010 Thin the leaf mesh to a 0.02 blade with a hairline bevel.
- [X] T011 Add the dome and cross-blade cup to the GPU geometry with a
      per-vertex tonal falloff.
- [X] T012 Lower the palette metal values to dry-pigment levels.
- [X] T013 Give each leaf flutter, pitch, roll, bank and turn amplitudes driven
      by the wind field; keep far crossing and near swaying.
- [X] T014 Keep the near layer out of the copy lane on desktop and mobile and
      keep the Milky Way untouched.

## Task Group 4 — Meter and button polish

- [X] T015 Refine the medallion fallback highlight and rim lighting without
      changing its size or labels.
- [X] T016 Tighten the gold button gradients, inner light and contact shadow
      while preserving dimensions, text and focus rings.

## Task Group 5 — Finale dominance and audio

- [X] T017 Amplify only the golden finale: larger gold/willow shells, longer
      trails, more embers, two shockwaves and warmer sky light.
- [X] T018 Keep the red/silver opening shells and all existing cues unchanged
      and synchronized to their tier.

## Task Group 6 — Verification and evidence

- [X] T019 Rewrite the selection and reveal unit suites for the new contract.
- [X] T020 Rewrite the Playwright spec for boundary mapping, landing angle,
      normalization, reveal order, reduced motion, fallback and cleanup.
- [X] T021 Capture before/after evidence at 1440×900, 390×844 and 412×915,
      including a mid-spin frame and the golden finale.
- [X] T022 Run the focused unit suites, the type check, the Playwright spec and
      the production build; confirm the build stays below 495 MiB.
