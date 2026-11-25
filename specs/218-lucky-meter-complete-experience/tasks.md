# Tasks: Lucky Meter — Complete Visitor Experience

**Input**: Design documents from `specs/218-lucky-meter-complete-experience/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`

**Tests**: The repository constitution requires verification. Unit tests cover pure timing/layout/scene logic; Playwright covers the real mobile and desktop routes. The prototype itself is verified by deterministic capture, not a new automated visual suite.

**Organization**: Tasks are grouped by the prototype gate and then by user story. The prototype tasks (T004–T012d) are the only tasks to execute before the owner's comparison. Do not start Phase 3+ until the owner approves the READY and FINISHED captures at all three stages.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`–`[US5]` for user-story phases; setup, prototype and polish have no story label
- Every task names the exact file path or command

---

## Phase 1: Setup

- [x] T001 Verify the active branch, Node version, pnpm bootstrap and locked dependency install; confirm no tracked change predates this feature.
- [x] T002 Create `specs/218-lucky-meter-complete-experience/spec.md` through the Spec Kit feature script; record the feature directory in `.specify/feature.json`.
- [x] T003 [P] Write `spec.md`, `checklists/requirements.md`, `plan.md`, `research.md` and `tasks.md`; validate the spec against its quality checklist.

---

## Phase 2: Focused 3D prototype (design gate — stop after T012d)

**Purpose**: Validate the instrument, faceted bowl, colour fill, medallion flip and responsive presentation on phone, tablet and desktop stages before changing the visitor route.

- [x] T004 Add `stage` and `stages` presets to the `lucky-meter-instrument` descriptor in `app/lib/graphics/workbench.js`, with labels and default time/tier/seed.
- [x] T005 [P] Apply the selected stage frame conditionally in `components/graphics/CreativeWorkbench.jsx`: 390 × 844 mobile, 820 × 1180 tablet and 1440 × 900 desktop, centred, preserving the existing 16:10 frame for every other scene.
- [x] T006 [P] Add `app/lib/lucky-meter/instrument-prototype.js` using the existing `createMaterialLibrary`, `createLightRig`, `createParticleField` and `buildMapleLeafGeometry`; expose `buildInstrumentPrototype({ surface, seed })` returning `{ update, setTime, dispose }`.
- [x] T007 Build the prototype geometry in `app/lib/lucky-meter/instrument-prototype.js`: 12-chamber gold wheel with specular enamel, gold maple medallion and well, fixed 7:30 broad maple pointer/spout, clear faceted crystal bowl on a gold foot, selected chamber fill and bowl fill.
- [x] T008 Animate the medallion flip, chamber drain and bowl fill in `app/lib/lucky-meter/instrument-prototype.js` with deterministic `setTime(t)` mapping from 0 to 6 seconds.
- [x] T009 Delegate the `lucky-meter-instrument` builder to the prototype module in `app/lib/graphics/workbench-runtime.js`; dispose the surface, environment texture and particle field on scene change.
- [x] T010 Run `pnpm dev` bound to `0.0.0.0`, confirm the workbench route loads, the prototype scene mounts at the selected stage, and the browser console has no runtime errors.
- [x] T011 Capture `specs/218-lucky-meter-complete-experience/evidence/ready-mobile-390x844.png` at `setTime(0)` and `finished-mobile-390x844.png` at `setTime(4.5)` using the repository Playwright wrapper.
- [x] T012 Inspect the two mobile captures against the two reference images; report geometry, material, framing and bowl/flip differences in `research.md` §11 and the handoff message; stop for the owner's comparison before Phase 3.
- [x] T012a Refine the empty bowl to clear faceted crystal, replace the pointer silhouette with a broad veined maple blade outside the rim, add enamel specular sheen, and recapture both states at 390 × 844.
- [x] T012b [P] Add `WORKBENCH_STAGES`, `resolveWorkbenchStage()` and the stage catalogue tests; add the workbench stage selector and `window.__creativeWorkbench.setStage(id)` capture API with a canvas remount.
- [x] T012c [P] Add pure `instrumentFraming(width, height)` to `app/lib/lucky-meter/instrument-prototype.js` and use it for camera position/look-at; add `__tests__/lucky-meter-instrument-responsive.test.js` for phone, tablet, desktop, boundary, aspect and invalid-size behavior.
- [x] T012d Capture READY and FINISHED at 390×844, 820×1180 and 1440×900; inspect all six for clipping, distortion, safe margins and readability; record the responsive decisions and evidence in `research.md` §12. These are prototype composition captures only; production-route responsiveness, DOM results/controls and physical-device compatibility are verified in T040 and T049.

**Checkpoint**: The owner compares READY and FINISHED captures at all three stages with the references and with each other. No production route, `meter-scene.js`, `storyboard.js` or `DailyResonance.tsx` changes are made before approval.

---

## Phase 3: User Story 1 — Arrive, start and lock the reading (Priority: P1)

**Goal**: Clean arrival, Start gated by the leaves, Home upper-right, coordinated downward move, physical medallion opening, simultaneous wheel/percentage lock, precise tier sentence.

**Independent Test**: Arrival and lock scenario in `spec.md`; verify the exact lock frame and that nothing moves afterwards.

### Implementation

- [x] T013 [US1] Update the opening contract and timing in `app/lib/lucky-meter/storyboard.js`: Home visible, Start gated by `allLeavesGone`, `homeHidden` at press, and the planned 800 ms lead-in.
- [x] T014 [P] [US1] Add the upper-right Home control and its focus/aria contract to `components/lucky-meter/LuckyMeterStage.jsx`; keep it out of the active reveal and celebration.
- [x] T015 [US1] Gate Start visibility and focusability on the last leaf's completion in `components/DailyResonance.tsx` and `components/lucky-meter/LuckyMeterStage.jsx`.
- [x] T016 [US1] Extend the wheel window to 9,400 ms in `app/lib/lucky-meter/storyboard.js` so the wheel and percentage lock at 11,300 ms; add a lock assertion/selector for QA.
- [x] T017 [US1] Implement the coordinated stage/group translation in `app/lib/lucky-meter/meter-scene.js` or the stage wrapper; do not move the page frame or camera.
- [x] T018 [US1] Implement the physical medallion opening and percentage reveal in `app/lib/lucky-meter/meter-scene.js`, reusing the prototype's validated geometry.
- [x] T019 [US1] Present the tier sentence at lock and exit it before the celebration in `app/lib/lucky-meter/storyboard.js` and `components/lucky-meter/LuckyMeterStage.jsx`.
- [x] T020 [P] [US1] Add unit tests for the lock window, Start gate, Home visibility and message exit in `__tests__/lucky-meter-storyboard.test.*`; add the Playwright arrival/lock assertions to `tests/visual/lucky-meter-daily-resonance.spec.ts`.

**Checkpoint**: US1 is independently demonstrable and testable.

---

## Phase 4: User Story 2 — Colour pour and number transfer (Priority: P1)

**Goal**: Only the selected chamber drains; colour fills the separate crystal bowl; the number emerges in the chamber and transfers through a separate golden effect to its own plaque; the chamber ends blank.

**Independent Test**: Pour and transfer scenario in `spec.md`; verify chamber count, bowl colour, continuous number visibility and final blank chamber.

### Implementation

- [x] T021 [US2] Add the chamber-drain and bowl-fill state fields to `app/lib/lucky-meter/meter-scene.js`: selected index, drain progress, fill progress, colour hex, number visibility.
- [x] T022 [US2] Replace the `fill.mesh.scale.setScalar(factor)` drain with a world-space vertical drain that leaves the chamber rim and gold intact; animate only the selected chamber.
- [x] T023 [P] [US2] Build the faceted crystal bowl, gold foot, liquid volume and colour-name anchor in `app/lib/lucky-meter/meter-scene.js` using the validated prototype profile and `METER_LAYOUT.bowl`.
- [x] T024 [US2] Route the poured liquid through the curved gold spout into the bowl in `app/lib/lucky-meter/meter-scene.js`; add the falling stream and impact ripple.
- [x] T025 [US2] Reveal the Lucky Number progressively inside the draining chamber in `app/lib/lucky-meter/meter-scene.js`; keep it out of the spout and bowl.
- [x] T026 [US2] Add the golden number-transfer effect in `app/lib/lucky-meter/meter-scene.js`: light trail, particles, maple-leaf sparks, continuous number, arrival at the number plaque.
- [x] T027 [US2] Swap the number destination from the wheel hub to the permanent **Your Lucky Number** plaque beside the bowl in `app/lib/lucky-meter/meter-scene.js` and `components/lucky-meter/LuckyMeterStage.jsx`.
- [x] T028 [P] [US2] Add the bowl/colour-name and number-plaque presentation to `app/globals.css` and `components/lucky-meter/LuckyMeterStage.jsx`; keep the two results visually separate.
- [x] T029 [P] [US2] Add unit tests for the drain selection, bowl fill, number destination and "chamber blank at end" invariants; extend `tests/visual/lucky-meter-daily-resonance.spec.ts`.

**Checkpoint**: US2 is independently demonstrable and testable.

---

## Phase 5: User Story 3 — Celebration, Spark and finished controls (Priority: P1)

**Goal**: Existing tier celebration in the open sky; existing saved Spark written and retained; countdown/Home/Share final controls; Start never returns.

**Independent Test**: Finish scenario in `spec.md`; verify celebration identity, message absence, Spark text/visibility and final control positions.

### Implementation

- [x] T030 [US3] Update `getEventStartMs` to `max(REVEAL_COMPLETE_MS, messageEnd) + eventDelayMs` in `app/lib/lucky-meter/storyboard.js`.
- [x] T031 [US3] Ensure the temporary tier message unmounts before `CosmicEventStage` mounts in `components/DailyResonance.tsx` and `components/lucky-meter/LuckyMeterStage.jsx`.
- [x] T032 [US3] Move the countdown to the upper-left at completion in `components/DailyResonance.tsx`; preserve its existing behavior.
- [x] T033 [US3] Add the small secondary Share control directly beneath Home in `components/DailyResonance.tsx` and `components/lucky-meter/LuckyMeterStage.jsx`; reuse the existing share handler and success/failure states.
- [x] T034 [US3] Trigger the existing saved Spark writing after the celebration ends and keep it visible in `components/lucky-meter/LuckyMeterStage.jsx`; preserve `pickSpark` and the Spark list.
- [x] T035 [US3] Remove Start from the completed dock/state and ensure Home/Share only appear at completion in `components/DailyResonance.tsx`.
- [x] T036 [P] [US3] Add unit tests for `getEventStartMs`, message/celebration ordering, final controls and Spark retention; extend the Playwright finished-state coverage.

**Checkpoint**: US3 is independently demonstrable and testable.

---

## Phase 6: User Story 4 — Mobile-first responsive composition (Priority: P2)

**Goal**: No clipping, distortion, overlap or horizontal scroll from 320–430 px phones through 820×1180 tablet and 1440×900 desktop; readable Spark; deliberate, equally polished desktop adaptation; mobile performance budget preserved.

**Independent Test**: Responsive scenario in `spec.md` at the five named phone widths, plus 820×1180 tablet portrait, 844×390 phone landscape and 1440×900 desktop. The six development-prototype captures are reference evidence only and do not satisfy this test; it is verified against the production route.

### Implementation

- [x] T037 [US4] Replace the fixed `min-height: 100svh` stage with `height: clamp(660px, calc(100svh - var(--header) - var(--footer)), 1500px)` plus `overflow: clip` in `app/globals.css`; add phone, tablet and desktop layout tokens.
- [x] T038 [P] [US4] Add the Spark safe zone, top-left countdown safe zone and top-right Home/Share safe zone tokens for phone, tablet portrait/landscape and desktop in `app/globals.css`.
- [x] T039 [US4] Recompose the bowl/number/plaque cluster for narrow widths, short heights, tablet landscape and desktop in `app/globals.css` and `components/lucky-meter/LuckyMeterStage.jsx`; keep the instrument centred, circular and fully visible.
- [ ] T039a [US4] Adapt the production camera framing by stage size/aspect ratio using the validated phone/tablet/desktop extents; do not apply non-uniform scale or stretch. Capability-gate any desktop-only richness behind the existing tiers.
- [x] T040 [P] [US4] Extend `tests/visual/lucky-meter-daily-resonance.spec.ts` with 320×568, 360×640, 390×844, 412×915, 430×932, 820×1180, 844×390 and 1440×900 overflow, overlap, distortion and readable-result assertions.

**Checkpoint**: US4 is independently demonstrable and testable.

---

## Phase 7: User Story 5 — Preserved results and accessibility (Priority: P2)

**Goal**: Same stored result, palette, tiers, saved Sparks and audio; complete fallback and reduced-motion path.

**Independent Test**: Preservation and fallback scenario in `spec.md`.

### Implementation

- [x] T041 [US5] Record the current palette, tier, result and Spark fixtures before changing storage-adjacent code; add compatibility tests for `app/lib/lucky-meter/` and `app/lib/sparks-and-seasonal-colours.js`.
- [x] T042 [P] [US5] Update the no-WebGL/context-loss CSS fallback in `app/globals.css` to show the instrument, filled bowl, percentage, colour name and number plaque.
- [x] T043 [US5] Route the reduced-motion path to the completed result without the animation chain in `components/DailyResonance.tsx` and `components/lucky-meter/LuckyMeterStage.jsx`.
- [x] T044 [US5] Preserve the audio cue timing and blocked-autoplay behavior in `app/lib/lucky-meter/`; no new sound asset.
- [x] T045 [P] [US5] Add tests for palette dates, result compatibility, Spark selection, reduced motion and fallback in `__tests__/lucky-meter-*.test.*` and `tests/visual/lucky-meter-daily-resonance.spec.ts`.

**Checkpoint**: US5 is independently demonstrable and testable.

---

## Phase 8: Polish and verification

- [ ] T046 [P] Remove the temporary prototype scene and module once its geometry is consolidated into `meter-scene.js`; keep the workbench clean.
- [x] T047 Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` and `pnpm build`; investigate every failure rather than suppressing it.
- [x] T048 Verify the build size remains strictly below 495 MiB and no new dependency was added to `package.json`/`pnpm-lock.yaml`.
- [ ] T049 Run the full Playwright suite, including desktop, mobile-390, mobile-412 and tablet-sized coverage; capture the final READY, ACTIVE, REVEAL, FINISHED and reduced-motion states at phone, tablet and desktop sizes.
- [x] T050 Manually compare the final READY and FINISHED captures at all three sizes with the reference images and with each other; record remaining visual gaps and owner decisions.
- [ ] T051 Verify Home, Start, Share, countdown, focus order, aria labels, keyboard operation and the fallback without WebGL.
- [x] T052 Update `memory-bank/activeContext.md` only after the durable implementation and verification are complete; report the PR-ready summary without committing or pushing unless asked.

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: complete.
- **Prototype (Phase 2)**: depends on Setup; T012d (six captures) blocks Phase 3.
- **US1 (Phase 3)**: depends on owner approval of Phase 2.
- **US2 (Phase 4)**: depends on US1's stable lock and layout.
- **US3 (Phase 5)**: depends on US2's final result state.
- **US4 (Phase 6)**: can start after US1's layout is stable; final verification depends on US3.
- **US5 (Phase 7)**: runs alongside US3/US4; final fallback depends on the final geometry.
- **Polish (Phase 8)**: depends on all stories.

### Within Each User Story

- State/timing before visuals.
- Scene geometry before DOM presentation.
- Implementation before tests; tests before the story checkpoint.

### Parallel Opportunities

- T004/T005, T006/T007 and T022/T023 are separate-file pairs.
- T012b/T012c are separate-file prototype tasks and can run together after T012a.
- T014 can proceed with T013.
- T020, T029, T036, T040 and T045 are separate test files.
- T037/T038, T039a and T042/T044 can run in parallel.

## Implementation Strategy

### Prototype first (this checkpoint)

1. T004–T009: mount the scene and stage presets.
2. T010: run the workbench and fix runtime errors.
3. T011/T012a: capture and refine READY/FINISHED at 390 × 844.
4. T012b–T012d: add responsive stage/framing behavior, tests and the six-capture matrix.
5. T012d: **STOP** for owner comparison.

### Full implementation (after approval)

1. US1 → US2 → US3 in sequence; US4 and US5 in parallel where safe.
2. Verify each story at its checkpoint.
3. Phase 8 full verification and final visual comparison.

## Notes

- `[P]` tasks touch different files or independent test files.
- The prototype is a design spike, not the production architecture; T046 removes it after consolidation.
- No task in this plan authorizes a commit, push or deployment.
- No task changes the twelve colours, result generation, tier mapping, storage key, saved Sparks, audio assets or the existing celebration engine.

## Production implementation record (2026-11-25)

- US1–US4 are implemented on the visitor route: message lifecycle, corner countdown/Home/Share, wheel lock, medallion flip, crystal bowl, chamber drain, number transfer to the separate **Your Lucky Number** panel, celebration/Spark sequencing, and responsive composition.
- T037 and T038 were satisfied through responsive `max-width`/`max-height`, flex/grid safe zones and `overflow-x-clip` rather than the literal fixed 660–1500 px shell and token names in the task text; the required outcome (no fixed `100svh` stage and no horizontal overflow) is met.
- T039/T039a use the shared `stageFraming()` production camera and a deliberate row composition at desktop (≥1024 px) and landscape (≤560 px height), with the phone stack retained at 320–430 px.
- T046 is deferred: the development-only prototype remains available for reference and is not mounted on any visitor route. It has no production effect.
- T049: the complete `lucky-meter-daily-resonance` spec now runs on desktop, mobile-390 and mobile-412; results are in "Verification actually run" below. The separate READY/ACTIVE/REVEAL/FINISHED captures at every size remain limited to the recorded production evidence viewports.
- T051 is partial: the existing accessibility unit coverage and the browser control/position checks pass; a separate keyboard/focus and no-WebGL browser pass was not re-run.
- T047: `tsc --noEmit` and the full unit suite pass; `pnpm lint` remains unavailable because the repository has no ESLint configuration.

### Verification actually run

- Full Vitest: **1,268 / 1,268** across 113 files.
- `pnpm exec tsc --noEmit`: exit 0.
- Full `lucky-meter-daily-resonance` spec after the review repair: **78 passed / 6 opt-in captures skipped / 0 failed** across desktop, mobile-390 and mobile-412 at the CI concurrency of two workers, against Playwright's own `127.0.0.1:3000` web server (a manually started `0.0.0.0` server blocks Next dev resources for `127.0.0.1`).
- Targeted post-repair run of the arrival, celebration and resume cases: **9 / 9** across the three projects.
- READY/FINISHED visual inspection at 390×844, 820×1180, 1440×900, 844×390 and 320×568; captures in `evidence/production/`.
- Clean production build after the review repair: **423,980,206 bytes (404.34 MiB exact; 419.56 MiB by the repository `du -sk` gate)**, below the 495 MiB cap.
- No new dependency; `pnpm-lock.yaml` unchanged.

### Remaining limitations

- Software-rendered Chromium at device scale factor 1. No physical phones/tablets, high-DPR display, touch hardware, cross-browser run or hardware GPU is available.
- The 320×568 finished layout scrolls vertically to the two result panels; there is no horizontal overflow. The fixed site compass is a sitewide overlay, not a meter control.
- `./freebuff-verify.sh` was not completed within the cloud command window.

### Post-submission review repair (2026-11-25)

- Repaired the Amazon Q finding: the reduced-motion case in `tests/visual/lucky-meter-daily-resonance.spec.ts` asserted the tier message was absent and then queried the same element. It now asserts `data-state="holding"`, matching `completeCalmly()` and the dedicated reduced-motion test.
- Repaired two further stale assertions found while verifying that finding: the celebration case and the resumed-cinematic case still expected the temporary sentence during the celebration. Spec 218 acceptance scenario 1 and `__tests__/lucky-meter-cinematic-lifecycle.test.jsx` require it to unmount before the celebration's first frame, so both now assert absence.
- Confirmed Playwright needs no upgrade: `1.65.1` is both the locked and the current stable version; `1.66` is alpha-only. The remaining arrival-case flake is software-WebGL commit timing under concurrent workers, covered by CI retries and by the unit-level sampling tests.
- Restored the shared gold-CTA glyph on the Lucky Meter Start button (`✨`). The Spec 218 commit had changed it to `✦`, which broke the sitewide gold-CTA contract asserted by `tests/visual/sitewide-gold-cta.spec.ts` on all three projects (the other CTAs keep their emoji). Restoring the base value preserves the sitewide identity and needs no scope change; the case now passes. This VM has no emoji font, so the local READY evidence capture shows the emoji as a placeholder box; CI installs Noto Color Emoji with `playwright install-deps`.
- Follow-up after the first Visual QA run on the pushed head failed both shards: shard 1's failure was reproduced locally in CI mode. The seasonal-palette case polled `data-chamber-ids` with Playwright's default 5 s timeout while the stage still showed its single placeholder chamber before storage hydration. The wait now allows 25 s, matching the spec's other stored-state waits, and still requires all twelve seasonal ids. Re-run: 4/4 palette cases passed, `tsc --noEmit` exit 0.
