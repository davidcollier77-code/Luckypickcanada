# Tasks: Shared Adaptive Performance and Rendering System

**Feature**: `specs/180-adaptive-performance-rendering`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, the four Memory Bank files, the selected task groups and the applicable `.docs/` sources.
- [X] T002 Inspect the existing capability layer, its consumers and its tests in `app/lib/graphics-capabilities.js` and `__tests__/graphics-capabilities.test.js`.

## Phase 2: Foundational

- [X] T003 Create `app/lib/adaptive-performance.js` with network reading and measurement-first classification, device reading, heap-pressure reading and pure `resolveAdaptivePlan`.
- [X] T004 Add the shared subscription, plan cache, signature-based notification, debounce and complete listener/timer teardown in `app/lib/adaptive-performance.js`.
- [X] T005 Add `createAdaptiveFrameLoop`, the prefetch/audio policy helpers, the capability report and the release registry in `app/lib/adaptive-performance.js`.
- [X] T006 Add the client hook `app/lib/use-adaptive-plan.js`.

## Phase 3: User Story 1 and 2 — Constrained stability, capable fidelity

- [X] T007 [US1] Route `components/Starfield.tsx` through the frame governor without changing density, artwork or reduced-motion behaviour.
- [X] T008 [P] [US1] Route `components/TwinklingStars.tsx` through the frame governor.
- [X] T009 [P] [US1] Route `components/ShootingStars.tsx` through the frame governor.
- [X] T010 [P] [US1] Route `components/Aurora.tsx` through the frame governor.
- [X] T011 [P] [US1] Route the homepage ambient canvas in `app/homepage/HomePage.js` through the frame governor.
- [X] T012 [US2] Assert in tests that capable and hint-free profiles keep 60 fps, hover prefetch, eager audio and full image quality.

## Phase 4: User Story 3 — Reassessment and recovery

- [X] T013 [US3] Make `components/IntentPrefetchLink.jsx` plan-aware while keeping navigation and intent handlers intact.
- [X] T014 [US3] Add plan-aware speculative loading and `releaseIdleAudio` to `app/lib/audio.js`, with forced loading on activation.
- [X] T015 [US3] Test condition change, recovery, shared-listener multiplicity, idempotent teardown and pressure release.

## Phase 5: User Story 4 — Accessibility

- [X] T016 [US4] Test that reduced motion pauses animation and leaves all functional budgets intact.

## Phase 6: Polish and verification

- [X] T017 Add `__tests__/adaptive-performance.test.js`, extend `__tests__/intent-prefetch-link.test.jsx` and add `__tests__/audio-adaptive-release.test.js`.
- [X] T018 Update `docs/graphics-rendering-architecture.md` and the Memory Bank files.
- [X] T019 Run the focused suites, the full Vitest suite, `tsc --noEmit`, `./freebuff-verify.sh` and measure the production build size.
- [X] T020 Record evidence in `specs/180-adaptive-performance-rendering/evidence.md` and submit the PR.
