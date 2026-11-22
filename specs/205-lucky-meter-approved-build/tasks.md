# Tasks: Lucky Meter Approved Build

**Feature**: `specs/205-lucky-meter-approved-build`

> Verification states are recorded only after the command actually ran. Unchecked tasks were
> not performed and are not claimed as passed.

## Phase 1 — Storyboard and five-beat generation

- [x] T001 Rewrite `app/lib/lucky-meter/storyboard.js` to the approved lengths: 5,600 ms
  generation, 1,400 ms opening, 5,000 ms fill, 700 ms full hold, 4,000 ms drain, 1,600 ms
  highlight, 12,000 ms celebration and a 3,800–5,200 ms Spark window.
- [x] T002 Derive `FILL_END_MS`, `FULL_HOLD_END_MS`, `DRAIN_END_MS` and `REVEAL_COMPLETE_MS`
  so the twelve stage windows meet without gaps or overlaps.
- [x] T003 Add `CELEBRATION_MS` and `getExperienceTotalMs`; keep the emergent total in the
  approved 54–57 s band without forcing any stage.
- [x] T004 Replace the monotonic percentage sampler with the five-beat
  0 → 100 → fall → rise → erratic → settle sequence and keep the stored result hidden until the
  final frame.
- [x] T005 Remove the superseded per-tier random duration helper from `reveal.js`.

## Phase 2 — Cylindrical vessel, drain and progressive number

- [x] T010 Replace the single fill clock with `startVesselSequence`: open, fill, full hold,
  drain and empty highlight on one `requestAnimationFrame` clock.
- [x] T011 Split the wheel's own drain from the vessel fill so the wheel stays empty while the
  vessel drains, and pass an explicit stream value so the pour ends when the vessel is full.
- [x] T012 Reveal the Lucky Number progressively from the top down on the drain clock and mount
  its placard only when the drain completes.
- [x] T013 Expose `data-vessel-phase` (`idle | opening | filling | holding | draining | empty`)
  and a renderer-independent empty highlight layer.
- [x] T014 Forward `onContextLost`/`onContextRestored` from the vessel scene to the shared
  creative stage; the CSS vessel takes over on loss and the scene returns after restore.

## Phase 3 — D12, Home and the Spark

- [x] T020 Use `CELEBRATION_MS` for a fresh run and for every resumed celebration. Ignore a
  stored legacy duration so a refresh restarts the same celebration for the full 12,000 ms.
- [x] T021 Move Home out of the fixed top-right dock into the last row of the results panel,
  with the countdown appearing there only after the Spark and the final hold.
- [x] T022 Keep the compact widget free of Home and preserve its own countdown behaviour.
- [x] T023 Drive the Spark writer from a cumulative character schedule whose last value is
  exactly the clamped 3,800–5,200 ms window.
- [x] T024 Give the CSS vessel a cylindrical silhouette (curved body, walls, glass, elliptical
  rim and lid) and retain the first-paint, no-WebGL and context-loss behaviour.

## Phase 4 — Unit and component tests

- [x] T030 Update the storyboard and five-beat generation tests, including the 54–57 s total
  and the fixed 12,000 ms celebration.
- [x] T031 Update the Daily Resonance lifecycle expectations for the new vessel beats, the
  progressive reveal and the last-row dock.
- [x] T032 Add the D12 restart test with a legacy stored duration.
- [x] T033 Add focused CSS-fallback tests for the opening, filling, draining, empty and
  highlight states.
- [x] T034 Update the Spark writer test for the bounded schedule.
- [x] T035 Add the browser coverage for the five-beat start, drain reveal, D12, WebGL-disabled
  fallback and reduced motion.

## Phase 5 — Verification

- [x] T040 Run the full `pnpm exec vitest run` suite — 107 files, 1,142 tests passed.
- [x] T041 Run `pnpm exec tsc --noEmit` — exit 0.
- [x] T042 Run the `lucky-meter-daily-resonance` Playwright spec on desktop, mobile-390 and
  mobile-412 — 16 passed per project, 1 opt-in evidence test skipped each.
- [x] T043 Run the production build and measure it against the 495 MiB cap — clean build
  417,921,229 bytes (398.56 MiB).
- [x] T044 Run `SPEC_KIT_BASE_REF=8741c655 ./freebuff-verify.sh` — exit 0, 51 updater tests
  passed.
- [x] T045 Capture desktop and mobile evidence at arrival, fill, drain and dock —
  `artifacts/lucky-meter-approved-build-20261121/`.

## Phase 6 — Documentation and handoff

- [x] T050 Record the Spec Kit feature (spec, plan, tasks).
- [x] T051 Update the Memory Bank for the implemented Build.
- [ ] T052 Open the pull request with the complete description per `PR_SUBMISSION.md`.
