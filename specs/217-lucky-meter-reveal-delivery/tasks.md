---

description: "Task list for Lucky Meter reveal hand-off and mobile delivery"
---

# Tasks: Lucky Meter Reveal Hand-off and Mobile Delivery

**Input**: Design documents from `specs/217-lucky-meter-reveal-delivery/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `evidence/fade-benchmark.json`

**Tests**: Required by FR-012; test tasks are included.

**Organization**: Tasks are grouped by user story. Phase 2 is a hard gate: the fade investigation must finish and record a duration decision before any reveal code changes.

**Implementation gate**: Do not start these tasks until the owner approves implementation. No application code, build, commit or deployment is authorised before that approval.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependencies)
- **[Story]**: US1 reveal, US2 audio delivery, US3 preservation and evidence
- Every task names its exact file path

## Path Conventions

Single Next.js project at the repository root: `app/`, `components/`, `tests/`, `__tests__/`, plus this feature directory.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the investigation repeatable and record its inputs.

- [x] T001 [P] Write `specs/217-lucky-meter-reveal-delivery/evidence/README.md` naming the Phase 0 baseline, `canvas-state-mobile.json`, `fade-benchmark.json`, the host limitation (software compositing, no GPU/phone) and the exact measurement commands.
- [x] T002 [P] Add `specs/217-lucky-meter-reveal-delivery/evidence/fade-bench.cjs` — the deployed-page harness parameterised by URL, duration list and runs — so the local production benchmark is reproducible.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish what the existing fade costs on the real build and choose a duration by rule.

**⚠️ CRITICAL**: No reveal edit (T007–T012) may begin until T006 is complete.

- [x] T003 Build the current tree with `pnpm build` and record the `.next` size (must be below 495 MiB) as the measurement baseline.
- [x] T004 Run `evidence/fade-bench.cjs` against the local production server: 600, 450, 300, 225 and 150 ms plus a 0 ms diagnostic control, four cold mobile runs each, and write `specs/217-lucky-meter-reveal-delivery/evidence/fade-local-benchmark.json`.
- [x] T005 Capture the visual transition for 600 ms and each candidate into `specs/217-lucky-meter-reveal-delivery/evidence/fade-visual/`: opacity curve and two midpoint captures per duration, confirming the fade still reads as a fade and the easing is unchanged.
- [x] T006 Apply the binding rule in `research.md` R8 and record the chosen duration (600 retained or a shorter value, minimum 150 ms) in `research.md`; if no candidate removes at least one median transition frame without a blocking regression, the decision is **retain 600 ms**.

**Checkpoint**: A written, evidence-based duration decision exists. If it is "retain", T009 is a no-op.

---

## Phase 3: User Story 1 — Reveal hand-off (Priority: P1) 🎯 MVP

**Goal**: Reveal the 3D meter only after it has produced a frame, keeping the fade with the decided duration.

**Independent Test**: Load the page in the harness; the CSS meter is visible, the 3D meter appears through one fade of the decided duration, and a deliberately stalled renderer never reveals an unpainted canvas.

### Tests for User Story 1

- [x] T007 [P] [US1] Add failing tests in `__tests__/lucky-meter-dimensional-renderers.test.js`: no announcement before a frame; announcement only after the frame plus two animation frames; rejected when the context is lost first.
- [x] T008 [P] [US1] Add a failing test in `__tests__/lucky-meter-dimensional-renderers.test.js` for the no-frame watchdog: after 3,000 ms without a frame, the surface stops and `onUnavailable` is called; the callback is never treated as a ready hand-off.

### Implementation for User Story 1

- [x] T009 [US1] Implement the produced-frame gate and `READY_WATCHDOG_MS` in `app/lib/lucky-meter/meter-scene.js`, cancelling animation-frame handles in `dispose()` and on context loss.
- [x] T010 [US1] Apply the T006 decision in `app/globals.css`: set only the canvas host's `transition` duration, or leave the file unchanged when the decision is "retain". Keep `ease`, opacity endpoints and all other declarations.
- [x] T011 [US1] Add browser assertions in `tests/visual/lucky-meter-daily-resonance.spec.ts`: computed transition duration is greater than `0s` and equals the decided value; a single fade hand-off; no second reveal.
- [x] T012 [US1] Run the focused stage and renderer suites and record the result in `specs/217-lucky-meter-reveal-delivery/tasks.md`.

**Checkpoint**: US1 is independently testable; the fade is unchanged or shortened by evidence, never cut.

---

## Phase 4: User Story 2 — Activation-gated celebration audio (Priority: P1)

**Goal**: Do not fetch celebration audio before Start; keep every cue available when needed.

**Independent Test**: Cold load without Start requests only the opening cue files; after Start all twelve are requested and each is present before its scheduled moment.

### Tests for User Story 2

- [x] T013 [P] [US2] Add `__tests__/lucky-meter-audio-delivery.test.js` asserting twelve keys, the opening four eager, the eight celebration cues deferred, and an unchanged `LUCKY_METER_AUDIO_FILES` list.

### Implementation for User Story 2

- [x] T014 [US2] Add `CORE_SOUND_KEYS`/`LUCKY_METER_CORE_SOUND_KEYS` and per-cue `preload` in `app/lib/lucky-meter/audio.js`, leaving the set, API, volumes and error handling unchanged.
- [x] T015 [US2] Add browser network assertions in `tests/visual/lucky-meter-daily-resonance.spec.ts`: no celebration cue file before Start; the full set requested after Start (depends on T011 for the same file).
- [x] T016 [US2] Verify the first celebration cue's request and decode timing against its scheduled moment using the browser network log; if it is late, move that cue into the eager group in `app/lib/lucky-meter/audio.js` and record why in `specs/217-lucky-meter-reveal-delivery/evidence/README.md`.

**Checkpoint**: Pre-activation audio is ≤650 KiB and no cue is missing or late.

---

## Phase 5: User Story 3 — Preservation and evidence (Priority: P2)

**Goal**: Prove the meter, timings and mix are unchanged, and record honest measurements.

**Independent Test**: Existing suites and the Phase 0 probe show unchanged composition/timing and the expected transfer reduction, with the GPU-dependent criterion marked outstanding.

- [x] T017 [P] [US3] Run `artifacts/lucky-meter-performance-20261124/probe.cjs` three times cold-mobile against the local production build; store `specs/217-lucky-meter-reveal-delivery/evidence/reveal-transfer-local.json` and compare total transfer, audio transfer and hand-off marks with Phase 0.
- [x] T018 [P] [US3] Confirm preserved invariants in `tests/visual/lucky-meter-daily-resonance.spec.ts` and the Lucky Meter unit suites: composition, state attributes, fallback markup, storyboard durations, cue map and render tiers unchanged.
- [x] T019 [US3] Record limitations in `specs/217-lucky-meter-reveal-delivery/evidence/README.md`: no hardware GPU or physical device, SC-006 outstanding, fade cost separated from the first-composite stall.

**Checkpoint**: Evidence explains what improved, what did not, and what remains unverified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T020 Run `pnpm exec tsc --noEmit` and record the exit status.
- [x] T021 Measure the production build and record the size in `specs/217-lucky-meter-reveal-delivery/tasks.md`; it must be strictly below 495 MiB.
- [x] T022 Run `./freebuff-verify.sh` with the current Spec Kit base reference and record the result.
- [x] T023 Update `memory-bank/activeContext.md` (current feature state, chosen fade duration) and `memory-bank/progress.md` (durable milestone) after implementation.
- [x] T024 Prepare one regular, non-draft, unmerged PR following `PR_SUBMISSION.md` with the required declarations after owner approval of the implementation results; no deployment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; **blocks US1**. US2 does not depend on Phase 2 and may proceed in parallel once Setup is done.
- **US1 (Phase 3)**: depends on T006.
- **US2 (Phase 4)**: depends on Setup only; T015 shares a file with T011, so it follows T011.
- **US3 (Phase 5)**: depends on US1 and US2 being complete.
- **Polish (Phase 6)**: depends on all desired stories.

### User Story Dependencies

- **US1**: independent after the duration decision.
- **US2**: independent of US1, except the shared Playwright file.
- **US3**: measures the combined result.

### Within Each Story

- Failing tests first (T007/T008, T013).
- Implementation next (T009/T010, T014).
- Browser assertions and timing verification after implementation (T011/T016).
- Focused runs before moving on (T012).

### Parallel Opportunities

- T001 and T002 together.
- T007 and T008 together (same file, sequential edits; split only if edited as one change).
- US2's T013/T014 can run while Phase 2 benchmarking runs, provided the shared Playwright file is not touched until T011 is done.

---

## Parallel Example: Setup and Audio

```bash
# Setup evidence and harness
Task: "T001 evidence README"
Task: "T002 repeatable fade harness"

# While the fade benchmark runs, the audio module can be prepared
Task: "T013 failing audio delivery test"
Task: "T014 per-cue preload in app/lib/lucky-meter/audio.js"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 setup.
2. Phase 2 benchmark and written duration decision (hard gate).
3. Phase 3 reveal gate and fade duration.
4. Stop and validate US1 independently, including the stalled-renderer case.
5. Do not claim a mobile frame-rate improvement from the software host.

### Incremental Delivery

1. Decision recorded → US1 → validate.
2. US2 → validate pre/post Start requests.
3. US3 → compare with Phase 0 and record limits.
4. Polish, then PR after approval.

---

## Execution record — measurement gate and audio (2026-11-24)

- **T001–T002 complete.** `evidence/README.md` and `evidence/fade-bench.cjs` exist. The harness records the opacity curve, transition events, fallback/canvas visibility and a runtime-only retained-fallback simulation.
- **T003 complete.** `pnpm build` exit 0; `.next` measured **386,582,391 bytes (368.67 MiB)**, below 495 MiB.
- **T004–T006 complete.** 24 cold mobile runs (4 per duration) succeeded. Median transition frames: 600 → 4, 450 → 3, 300 → 2, 225 → 1, 150 → 1, 0 → 0. Reveal blocking 0 ms in every run. **Decision: 300 ms adopted**, recorded in `research.md` R3/R8. Midpoint captures are in `evidence/fade-visual/`, including slow-motion partial-opacity frames and the mid-stall retained-fallback capture.
- **Missing-meter investigation complete; change not applied.** 1,976–2,304 ms with neither meter. Deferring React's fallback removal until the first visible canvas frame reduced the empty stage to 0 ms in 6 simulation runs. Findings and the proposed `components/LuckyMeterStage.jsx` change are in `evidence/fallback-handover-investigation.md`; **owner approval is required before implementing it**.
- **T013–T014 complete.** `__tests__/lucky-meter-audio-delivery.test.js` (4 tests) covers the 12 keys, 4 eager / 8 deferred policy, unchanged file list and activation loading. `audio.js` gained `LUCKY_METER_CORE_SOUND_KEYS`, per-cue `preload` and a `loadEventCues` option. Focused suites (audio delivery, event audio playback, cinematic lifecycle) pass 25/25.
- **Deviations from the plan, required for FR-006.** Howler's `play()` queues an unloaded cue but does not start its load, so `preload: false` alone would leave celebration cues silent. The activation path (`components/DailyResonance.tsx`) now calls `prepareLuckyMeterAudio({ loadEventCues: true })`, which loads the eight deferred files without a second set or API. The development Workbench passes the same option so its cue auditioning still works. Both files were listed as unchanged in `plan.md`; this is a necessary correction, not scope expansion.
- **T016 complete.** `evidence/audio-delivery-local.json`: pre-Start only the four opening files (604,579 transfer bytes); all eight celebration files requested within 233 ms of Start and complete by 8,773 ms; the celebration stage appeared at 33,246 ms (24,473 ms of runway). No page errors.
- **T017 complete.** `evidence/reveal-transfer-local.json`: 1,472 KiB total / 590 KiB audio, down from the Phase 0 local 3,771 / 2,889 KiB. SC-002 passes. Longest task 2,102–2,218 ms and TBT 3,234–3,312 ms are unchanged.
- **T019 complete.** Limitations are recorded in `evidence/README.md` and `fallback-handover-investigation.md`: software compositing only, no physical phone, SC-006 outstanding, fade cost separated from the first-composite task.
- **Build after the audio change.** 386,616,435 bytes (368.70 MiB), below 495 MiB.
- **Still outstanding.** T007–T012 and T015 (the reveal gate, the CSS duration and the shared Playwright assertions) await the owner's review of this measurement gate; T018, T020–T024 follow them.

## Execution record — US1 implementation and final verification (2026-11-24)

- **T007/T008 complete, against the real scene.** `__tests__/lucky-meter-dimensional-renderers.test.js` now imports `createLuckyMeterScene`; only `createCreativeSurface` is stubbed. Four tests drive the scene's own `onFrame`: no announcement at 90 ms or before a frame, announcement only after frame + two animation frames, the 3,000 ms watchdog stops the surface and calls `onUnavailable` (a late frame cannot become ready), context loss cancels a pending announcement, and `dispose()` cancels it. 24/24 in the two focused files on the first run.
- **T009 complete.** `READY_WATCHDOG_MS = 3000`; the first `onFrame` schedules two animation frames before `announceReady`; watchdog, context loss and disposal clear both handles and the timer; `onUnavailable` is never followed by a ready hand-off.
- **T010 complete.** The canvas host's `transition` is now `opacity 300ms ease`; endpoints, `ease` and every other declaration are unchanged.
- **Retained fallback (owner-approved).** `LuckyMeterStage` keeps the CSS meter beneath the canvas until computed opacity leaves 0 or `transitionend` fires. The 6 s guard only stops polling; it never removes a fallback while the canvas is transparent. Playwright recorded `is-ready` + fallback mounted + opacity 0, and removal only at opacity > 0, on all three projects.
- **T011/T015 complete.** New Playwright coverage in `tests/visual/lucky-meter-daily-resonance.spec.ts` asserts the computed `0.3s` duration, one opacity transition, the retained-fallback interval, removal at positive opacity, no second reveal, no celebration audio before Start and all eight celebration files after Start. Six runs (two tests × desktop, mobile-390, mobile-412) passed.
- **T012 complete.** Focused Vitest: **219/219** across 20 files, including the new gate, stage-retention and audio-delivery tests. `tsc --noEmit` exit 0.
- **T018 complete.** The full `lucky-meter-daily-resonance` spec passed **54 tests** with **6 opt-in capture tests skipped** (desktop, mobile-390, mobile-412; 4.8 min). Composition, state attributes, fallback markup, storyboard timings, cue map and render tiers are unchanged.
- **T020 complete.** `pnpm exec tsc --noEmit` exit 0 (run before and during the final verification).
- **T021 complete.** Final combined `.next + public` measured **456,519,680 bytes (435.37 MiB)** by `freebuff-verify.sh`; a clean build before that measured 437,858,304 bytes (417.57 MiB). Both are strictly below 495 MiB.
- **T022 complete.** `SPEC_KIT_BASE_REF=a05be05540f794be1598fa66a96a37e1a5193ed8 ./freebuff-verify.sh` exit 0: 490 Python checker tests, **1,255 Vitest tests across 112 files**, TypeScript, Next.js build and the size cap, plus 51 documentation tests. The earlier attempt with `origin/main` was correctly rejected because it spans Specs 213–217; the task base is `a05be055`.
- **T017 refreshed for the final build.** `evidence/reveal-transfer-final-local.json`: 1,473 KiB total / 590 KiB audio (unchanged), ready 791–948 ms, longest task 2,410–2,458 ms, TBT 3,449–3,540 ms. The first-composite task remains the dominant cost and is reported separately.
- **T019 remains complete.** Limitations updated: software compositing only, no phone, SC-006 outstanding, fade blocking 0 ms separate from the first-composite stall.
- **T024 complete.** One regular, non-draft PR (#2033) was opened from `spec-217-lucky-meter-reveal-delivery` against `main` with the complete QA declaration.

## Execution record — Post-submission review repairs (2026-11-25)

- **Pullfrog P2 repaired.** The produced-frame gate now distinguishes a watchdog stop from an explicit stop. When a context is restored after the watchdog stopped the surface, the scene calls `surface.start()` before re-arming the gate; an explicit `stop()` still suppresses the restart. New tests cover watchdog → restore (surface restarted, ready only after a produced frame) and explicit stop → restore (no restart).
- **Pullfrog P3 repaired.** Deferred celebration loading is now idempotent. `prepareLuckyMeterAudio({ loadEventCues: true })` sets a module flag after the first load; repeat activation on the same shared set cannot call Howler `load()` again. `reset()`/`releaseLuckyMeterAudio()` clear the flag so a newly created set loads normally. New tests cover double activation and release-then-reactivate.
- **Visual QA shard 1 timeout repaired.** `holds Start until the breeze has cleared, then starts the reading at 0` can spend 15 s waiting for Start and another 20 s waiting for the first value, exceeding Playwright's 30 s default. It now calls `test.slow()`; assertions are unchanged.
- **Protected-file declaration.** The PR description now carries the exact `Human Authorization: APPROVED` line required for the owner-authorized `app/globals.css` fade.
- **Verification after repair.** Focused unit files 24/24; repo gate `SPEC_KIT_BASE_REF=a05be05540f794be1598fa66a96a37e1a5193ed8 ./freebuff-verify.sh` exit 0 with **1,259 Vitest tests across 112 files**, 490 Python checker tests, 51 docs tests, and a clean production build of **437,895,168 bytes (417.61 MiB)**. Affected Playwright cases passed **9/9** across desktop, mobile-390 and mobile-412.
- **Merge outcome.** PR #2033 merged into `main` at `2026-11-25T00:38:11Z` (2026-11-24 20:38:11 Atlantic), merge commit `ae844b4902a387cde508a4d1a312c9a535ad29ff`. The current `main` ref was verified at the same SHA. SC-006 physical-device GPU verification remains outstanding.

## Notes

- The fade is retained by default; 600 ms is kept unless the rule is satisfied.
- The 2.2–2.6 s first-composite stall is measured separately and is not attributed to the fade.
- No new dependency, service, route, preloader or audio system.
- No manual deployment command, force-push or protected-configuration change was performed. A push to `main` invokes the existing Cloudflare deployment workflow; its run result is separate from this task record.
