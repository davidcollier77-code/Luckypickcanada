# Tasks: Adaptive Graphics Capability Foundation

**Input**: Design documents from `/specs/162-graphics-capability-foundation/`

**Prerequisites**: plan.md, spec.md, research.md

**Scope guard**: Preserve artwork, appearance, animations, sounds and functionality. Do not migrate
any feature to GPU rendering. Do not change the normal Playwright or SwiftShader configurations.

## Phase 1: Setup and Baseline

- [X] T001 Record the current canvas/WebGL call sites, null-check gaps and reduced-motion/visibility behaviour in `research.md`
- [X] T002 Confirm the normal Playwright configuration, SwiftShader configuration, visual QA workflow and committed baselines are out of scope (`playwright.config.ts`, `playwright.swiftshader.config.ts`, `.github/workflows/visual-qa.yml`)
- [X] T003 Confirm no new dependency, service or build step is required (`package.json` unchanged)

## Phase 2: User Story 1 — Capable devices render exactly as before (P1)

**Goal**: Every active renderer keeps its current appearance and uses the browser's chosen graphics
path.

**Independent Test**: Load the homepage and Lucky Meter in Chromium desktop and mobile emulation;
the canvas and WebGL effects render and no graphics errors appear.

- [X] T004 [US1] Create `app/lib/graphics-capabilities.js` with the cached device profile, safe Canvas 2D/WebGL getters, lazy feature probes, pixel-ratio cap, reduced-motion/visibility helpers and context-loss watcher
- [X] T005 [P] [US1] Adopt safe context acquisition and the shared profile in `app/homepage/HomePage.js` without changing default star density or appearance
- [X] T006 [P] [US1] Adopt safe context acquisition and DPR caps in `components/Aurora.tsx`
- [X] T007 [P] [US1] Adopt the shared WebGL getter in `components/cosmic-event-engine.js` without changing the render pipeline
- [X] T008 [P] [US1] Adopt the safe painted-pixel getter in `app/lucky-reveal-celebration.jsx`
- [X] T009 [P] [US1] Adopt safe context acquisition in `app/lucky-card-reveal.js`, `app/lucky-card-share.js` and `app/lucky-reveal-share-image.js`
- [X] T010 [P] [US1] Adopt the shared context/profile pattern in `components/Starfield.tsx`, `components/TwinklingStars.tsx` and `components/ShootingStars.tsx`
- [X] T011 [US1] Confirm no forced-compositing hints or renderer-specific code were added and that the standard Playwright/SwiftShader configurations are unchanged

## Phase 3: User Story 2 — Limited devices get a complete page (P2)

**Goal**: Missing graphics features fall back instead of blanking or throwing.

**Independent Test**: Disable Canvas 2D and WebGL in the browser; the page and static stage
fallbacks still render with no uncaught graphics error.

- [X] T012 [US2] Make the homepage canvas fail quietly when no 2D context is available and keep the existing backdrop/content visible
- [X] T013 [US2] Add an `onContextLost` path from `components/cosmic-event-engine.js` to `components/CosmicEventStage.jsx` so loss shows the existing static glow and still completes
- [X] T014 [US2] Add the existing handled share-image failure when the card share canvas has no 2D context in `app/lucky-card-share.js`
- [X] T015 [US2] Guard the reveal canvas effect in `app/lucky-card-reveal.js` so a missing context never throws while CSS/Framer presentation and audio continue
- [X] T016 [P] [US2] Use the `Path2D` capability in `app/lib/mapleLeafConfetti.mjs` and keep the basic-shape fallback
- [X] T017 [P] [US2] Make confetti instance creation failures non-fatal in `app/homepage/ExploreLuckButton.js` while the Explore scroll still runs
- [X] T018 [US2] Add a focused unit/source test file `__tests__/graphics-capabilities.test.js` covering null-safe getters, WebGL fallback names, no forced-renderer options, Path2D fallback and source guards

## Phase 4: User Story 3 — Motion and visibility are consistent (P3)

**Goal**: Reduced motion paints a static frame; hidden tabs pause and resume without duplicates.

**Independent Test**: Emulate reduced motion and document visibility; confirm one static frame and
one resumed loop.

- [X] T019 [US3] Use the shared reduced-motion read/listener in `app/homepage/HomePage.js` and pause/resume its RAF on visibility changes
- [X] T020 [US3] Wire the shared reduced-motion and visibility helpers into `components/Aurora.tsx` and the legacy starfield canvases
- [X] T021 [US3] Add unit coverage for reduced-motion listener cleanup and visibility/pixel-ratio helpers in `__tests__/graphics-capabilities.test.js`

## Phase 5: User Story 4 — The foundation stays small and cheap (P4)

**Goal**: Lazy probes, no dependency, no per-frame detection.

**Independent Test**: Import the module without a probe; repeated checks return cached values;
source guards reject vendor sniffing and forced flags.

- [X] T022 [US4] Assert lazy caching in `__tests__/graphics-capabilities.test.js` (no probe at import; one probe per feature)
- [X] T023 [US4] Add source guards that reject `failIfMajorPerformanceCaveat`, user-agent/renderer-vendor branches and forced launch flags in the shared layer
- [X] T024 [US4] Confirm `package.json`, `pnpm-lock.yaml`, `playwright.config.ts` and `playwright.swiftshader.config.ts` are unchanged

## Phase 6: Verification and Delivery

- [X] T025 Run the focused graphics test and the full Vitest suite
- [X] T026 Run `pnpm exec tsc --noEmit` and the production build; confirm the build is below 495 MiB
- [X] T027 Run `./freebuff-verify.sh`
- [X] T028 Run focused Playwright Chromium checks: desktop and mobile homepage render, no graphics console errors, reduced-motion static frame, simulated no-2D page still renders
- [X] T029 Attempt Firefox/WebKit only if the browsers and required libraries are available; otherwise record the limitation
- [ ] T030 Record evidence in `evidence.md`, update `.specify/feature.json` and the Memory Bank, then prepare and open the PR
- [ ] T031 Review the final diff against the PR scope checker and protected-file rules before submission

## Dependencies

- T001–T003 establish the baseline.
- T004 blocks T005–T011 and T012–T021.
- T012–T018 depend on T004; T013 also depends on T007.
- T019–T023 depend on T004; T022–T023 depend on the final module API.
- T025–T031 depend on all implementation work.

## Notes

- The homepage canvas currently uses CSS pixels; do not change its coordinate model, only its
  safety/lifecycle and constrained-device density.
- Do not gate confetti creation on a capability probe; the library remains the source of truth and
  the existing test harness stubs it.
- Do not add `will-change`, `translateZ` or forced-compositing properties.
- The visual baselines use device pixel ratio 1; the DPR cap must not affect them.
