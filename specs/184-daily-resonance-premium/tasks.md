# Tasks: Premium Daily Resonance — Medallion, Independent Reveals and the Little Spark Finale

**Input**: Design documents from `/specs/184-daily-resonance-premium/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Constraints and frozen surface

- [x] T001 Re-read `AGENTS.md`, the Memory Bank, the Lucky Meter task groups and `.docs/manifest.json`.
- [x] T002 Confirm the frozen percentage range, weighting, tier boundaries and event mapping.
- [x] T003 Confirm the Milky Way block, the localStorage key and the audio/share/Home/disclaimer surfaces stay untouched.

## Phase 2: Independent selection

- [x] T004 Replace multi-value history with one previous value per choice.
- [x] T005 Add a uniform 1–50 Lucky Number draw excluding only the newest saved number.
- [x] T006 Add a uniform Lucky Colour draw over the twelve approved colours excluding only the newest saved colour.
- [x] T007 Keep the thirty unchanged Sparks and exclude only the newest saved Spark.
- [x] T008 Remove number triplets from tiers and labels; adopt singular "Lucky Number" in the interface and sharing.

## Phase 3: Persistence and migration

- [x] T009 Normalise the stored payload per choice and append to four history lists.
- [x] T010 Migrate a missing Lucky Number exactly once, persist it and insert it into the number history.
- [x] T011 Add `sparkCompleted` to the same version 1 payload, defaulting legacy completed payloads to Spark-complete.
- [x] T012 Never reroll a stored percentage, colour or Spark during load.

## Phase 4: Reveal and finale

- [x] T013 Drive percentage, number and colour spins from one requestAnimationFrame clock.
- [x] T014 Settle percentage at 620 ms, number at 940 ms and colour at 1240 ms; start the cinematic at 1540 ms.
- [x] T015 Return the exact final value from each sampler at landing.
- [x] T016 Move GoldenLeaf into the reserved Spark panel after the cinematic and type the message like a quill.
- [x] T017 Keep the completed message visible and mount the Home countdown only after the Spark finishes.
- [x] T018 Resume an interrupted Spark without replaying the cinematic, and never replay a completed stage.

## Phase 5: Medallion and layout

- [x] T019 Deepen `MEDALLION_PROFILE` and refine the milled rim.
- [x] T020 Retune the engine's key light, exposure and tilt; add a grounded contact shadow.
- [x] T021 Add the outer number bezel band with ticks, pointer and upright numeral badge.
- [x] T022 Add the thin segmented colour ring with a fixed top marker.
- [x] T023 Rebuild the layout: Spark panel near the top, medallion, three result cards, disclaimer, share.
- [x] T024 Reserve dock space and align the mobile layout so Home and the countdown never overlap content.

## Phase 6: Verification

- [x] T025 Update and extend the Vitest selection, storage, share and reveal suites.
- [x] T026 Update the daily-experience and cinematic-lifecycle DOM suites.
- [x] T027 Rewrite the Playwright Daily Resonance spec, including migration, settle order, Spark/countdown, reduced motion, WebGL fallback and cleanup.
- [x] T028 Update the Crystal Ball daily-limit seed to the new payload shape.
- [x] T029 Run `pnpm exec tsc --noEmit`, the full Vitest suite, the production build with size measurement and `./freebuff-verify.sh`.
- [x] T030 Capture and inspect desktop, 390 px and 412 px readings for overlap and clipping.

## Phase 7: Delivered-invariant audit

- [x] T031 Re-verify selection, exclusion, palette and Spark contracts against the delivered code and `main`.
- [x] T032 Measure the real reveal timeline in the browser instead of trusting eventual-state assertions.
- [x] T033 Prove the number pointer and colour ring land on their stored values and do not encode the percentage.
- [x] T034 Find the mid-reveal refresh defect: the motions were skipped on reload.
- [x] T035 Persist `revealCompleted`, infer it for legacy payloads and share `animateReveal` with the resume path.
- [x] T036 Add unit, DOM and browser tests for the resumed reveal and re-run every suite and the gate.
