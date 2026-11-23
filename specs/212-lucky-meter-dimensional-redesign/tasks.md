# Tasks: Lucky Meter Dimensional Redesign

**Feature**: `specs/212-lucky-meter-dimensional-redesign` | **Plan**: `specs/212-lucky-meter-dimensional-redesign/plan.md` | **Spec**: `specs/212-lucky-meter-dimensional-redesign/spec.md`

One complete implementation and one regular, unmerged PR. There is no deferred pointer-only stage.

## Phase 1 — Timing authority

- [x] T001 Rewrite `app/lib/lucky-meter/storyboard.js`: 4,400 ms wheel, 9,400 ms percentage, 2,000 ms pour, 1,500 ms pause, 1,500 ms transfer, 800 ms visible settle, preserved later stages; derived 1,900 / 6,300 / 11,300 / 13,300 / 14,800 / 16,300 ms.
- [x] T002 Rewrite `app/lib/lucky-meter/reveal.js`: `POINTER_ANGLE_DEGREES = 225`, exactly five turns, wheel duration defaults to `wheelMs`, `chamberIndexForColour()`.
- [x] T003 Add `app/lib/lucky-meter/meter-layout.js`: 12 chambers, pointer socket, arm/vessel/beam anchors, `chamberFillFactor`, `chamberGradient`, selected-chamber mapping.

## Phase 2 — Physical meter

- [x] T004 Add `app/lib/lucky-meter/meter-scene.js`: struck medallion, 12 extruded chambers with radial drain, central/pointer maple leaves, curved arm and spout, glass vessel, stream, beam, dust, environment, idle stop and context handling.
- [x] T005 Add `components/LuckyMeterStage.jsx`: one canvas, DOM readout, colour caption, pointer hook, full CSS fallback and renderer attributes.
- [x] T006 Rewrite `components/LuckyMeterMessage.tsx` for permanent holding and the 800 ms visible settle.
- [x] T007 Rewire `components/DailyResonance.tsx` to one master clock, the corrected sequence, timer-owned percentage/vessel hand-offs, restore paths, reduced motion and the permanent message.
- [x] T008 Retire `components/LuckyMeterRing.jsx`, `components/LuckyMeterVessel.tsx`, `components/lucky-meter-medallion-engine.js` and `app/lib/lucky-meter/vessel-scene.js`.
- [x] T009 Update `app/lib/graphics/experiences.js`: `lucky-meter` is `three`/`3d` with the `three` chunk; remove `lucky-meter-vessel`.
- [x] T010 Replace the SVG-era CSS with the stage layout and complete no-SVG fallback; keep `.lucky-vessel-scene`, `.lucky-vessel-canvas-host` and `.lucky-results-dock` in compiled CSS.

## Phase 3 — Tests

- [x] T011 Rewrite `__tests__/lucky-meter-reveal.test.js` for the corrected boundaries, five beats, 225° landing and five turns.
- [x] T012 Add `__tests__/lucky-meter-layout.test.js` for twelve chambers, selected-only drain and the CSS gradient.
- [x] T013 Add `__tests__/lucky-meter-stage.test.jsx` for fallback first paint, WebGL handover, context loss/restore, no SVG and the full vessel.
- [x] T014 Update `__tests__/lucky-meter-cinematic-lifecycle.test.jsx` for the permanent message through the celebration and FINISHED.
- [x] T015 Update `__tests__/daily-resonance-daily-experience.test.jsx` for the corrected full sequence and full-vessel ending.
- [x] T016 Update `graphics-capabilities`, `visual-qa-chromium-cache`, `lucky-meter-context-restore` and the Playwright spec; remove the retired vessel suites.
- [x] T017 Update Spec 212 artifacts, `.specify/feature.json`, Memory Bank, graphics README and architecture notes.

## Phase 4 — Verification

- [x] T018 `pnpm exec tsc --noEmit` exit 0. Focused Vitest 19 files / 238 tests pass; full repository suite 110 files / 1,204 tests pass.
- [x] T019 Clean production build exit 0. Clean `.next + public` = 417,476,761 bytes (398.14 MiB); the verify gate measured 431.15 MiB after its incremental build. Both are strictly below the 495 MiB cap.
- [x] T020 Playwright `lucky-meter-daily-resonance` 16/16 desktop and 32/32 mobile (390 and 412) pass, including WebGL-denied, reduced-motion, seasonal and restore paths. Four opt-in evidence captures pass. The mobile-accessibility 12px audit passes at both phone widths after the readout labels were fixed at 12px with balanced wrapping. SwiftShader remains the local WebGL proxy; no hardware-GPU device was available.
- [x] T021 `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` exit 0: frozen install, Spec Kit gate, Python checkers, TypeScript, full Vitest suite, Next build and size cap.
- [x] T022 Commit, push and open one regular, non-draft PR with the `PR_SUBMISSION.md` body; leave unmerged.

## Dependencies

- T001–T003 before T004–T007.
- T004–T010 before T011–T017.
- T018–T021 before T022.

## Implementation strategy

One complete change: the scene, stage, timing, fallback, tests, Spec Kit artifacts and verification land together. No later stage is shortened or padded to hit a target total; the shorter total is emergent from the corrected reveal.
