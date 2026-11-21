# Tasks: Lucky Meter Three-Dimensional Vessel and Pour

**Feature**: `specs/200-lucky-meter-dimensional-vessel`

> **Historical record and verification status.** T035–T037 are genuine recorded
> passes. T038–T041 and T052 remain unchecked and must not be reported as
> passed. T022 records the earlier glyph-by-glyph implementation; its checked
> state is preserved, but the approved current treatment is the single-stroke
> path-traced Spark.

## Phase 1 — Capture and assess

- [x] T001 Capture the current sequence (arrival, pour, dock) before changes:
  `artifacts/lucky-meter-dimensional-20261120/before/`.
- [x] T002 Confirm the current failures: Home absent at arrival, 7px CSS pour
  streak, flat CSS vessel, wheel covering the medallion face.

## Phase 2 — Three.js vessel and pour

- [x] T010 Add `app/lib/lucky-meter/vessel-scene.js` on
  `createCreativeSurface`, with the material library, light rig, particle field
  and PMREM environment.
- [x] T011 Lathe a thick-walled glass tumbler, gold rim and foot, and a lid that
  tips back as the vessel opens.
- [x] T012 Add the liquid body, animated free surface and meniscus following the
  fill.
- [x] T013 Add the curved stream (three revealed layers), leading droplet,
  splash ring and beads on the pour clock.
- [x] T014 Add the imperative `setState({ colour, fill, open, instant })`
  controller and dispose every created resource.
- [x] T015 Add `components/LuckyMeterVessel.tsx` with an imperative canvas,
  CSS fallback and unchanged caption/data attributes.
- [x] T016 Register `lucky-meter-vessel` in the shared experience registry.
- [x] T017 Mount the panel as soon as a reading exists and keep it hidden until
  the vessel stage.
- [x] T018 Remove the flat SVG pour streak from `LuckyMeterRing.jsx`.

## Phase 3 — Medallion, sky writing and Home

- [x] T020 Pull the wheel band to 38.6/28.8 and add seat/bevel shading so the
  struck face is visible.
- [x] T021 Raise the contrast of the medallion rim, bezel, groove and well
  albedos.
- [x] T022 Replace the Spark paragraph with gold display script, per-glyph
  arrival, whole-word wrapping, comet trail and a drawn flourish.
- [x] T023 Derive Home from `dockReady || !result` and the countdown from
  `dockReady && !stageActive`.

## Phase 4 — Tests and verification

- [x] T030 Update the unit Home expectations for arrival, rollover and the
  hidden warm-up panel.
- [x] T031 Update the Playwright arrival and warm-up assertions.
- [x] T035 Run `pnpm exec tsc --noEmit` — pass.
- [x] T036 Run the focused Lucky Meter suites — 23 pass.
- [x] T037 Run the full `pnpm test` — 105 files, 1133 tests pass.
- [ ] T038 Run the `lucky-meter-daily-resonance` Playwright spec.
- [ ] T039 Run the production build and measure it against 495 MiB.
- [ ] T040 Run `./freebuff-verify.sh`.
- [ ] T041 Capture final desktop and mobile evidence and review the complete
  diff before submission.

## Phase 5 — Documentation and handoff

- [x] T050 Update the graphics README and rendering architecture document.
- [x] T051 Add this Spec Kit feature (spec, plan, tasks).
- [ ] T052 Open the pull request with the complete description per
  `PR_SUBMISSION.md`.
