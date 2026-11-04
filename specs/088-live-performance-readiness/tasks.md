# Tasks: Live-Traffic Performance Readiness

**Feature**: `specs/088-live-performance-readiness`
**Input**: `spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Record the baseline: build the production bundle and run `artifacts/perf-audit/probe.cjs` on the mobile and desktop profiles, writing `artifacts/perf-audit/baseline-mobile.json` and `artifacts/perf-audit/baseline-desktop.json`

## Phase 2: Foundational

- [x] T002 Confirm the duplicate hero transfer in the baseline reports: both `homepage-hero-lucky-pick-canada.avif` (198.6 KiB) and `homepage-hero-lucky-pick-canada.webp` (293.1 KiB) are requested in each AVIF-capable profile

## Phase 3: User Story 1 — one hero variant per view (P1)

**Goal**: The browser transfers only the hero artwork variant it displays.

**Independent test**: Cold mobile-emulated load of `/`; exactly one
`homepage-hero-lucky-pick-canada*` image response, and the painted hero is the
AVIF source.

- [x] T003 [US1] Remove the redundant WebP `preload()` hint and document the single-format hint in `app/homepage/Hero.js`
- [x] T004 [US1] Add the source guard `__tests__/homepage-hero-preload.test.js` pinning one AVIF hint, unchanged AVIF/WebP `<picture>` sources, the WebP `<img>` fallback, and both asset files
- [x] T005 [US1] Rebuild and re-run the probe on both profiles; record `artifacts/perf-audit/after-mobile.json` and `artifacts/perf-audit/after-desktop.json` and confirm one hero request

## Phase 4: User Story 2 — first paint preserved (P2)

- [x] T006 [US2] Compare FCP, LCP, CLS, and total transfer against the baseline reports on both profiles
- [x] T007 [US2] Capture 1440x900 and 390x844 first-screen screenshots and compare them with the baseline screenshots

## Phase 5: User Story 3 — nothing else changes (P3)

- [x] T008 [US3] Run the full `pnpm exec vitest run` suite
- [x] T009 [US3] Run `./freebuff-verify.sh` and record the production build size against the 495 MB limit

## Phase 6: Polish

- [x] T010 Update `PR_SUMMARY.md` with the task, selected groups, documents reviewed, implementation, verification results, and remaining limitations
- [x] T011 Inspect the complete final diff and confirm it matches the reported files

## Dependencies

- T001 → T002 → T003 → T004 → T005 → T006/T007 → T008/T009 → T010 → T011.
- T003 and T004 touch different files and can be written together; T005 needs
  the build from T003.

## Implementation Strategy

Single focused change on the homepage hero hint, guarded by a source test and
verified by measured before/after browser reports. No asset re-encoding and no
markup/behaviour change beyond removing one redundant resource hint.
