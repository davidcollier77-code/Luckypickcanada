# Tasks: Site-Wide Resource-Readiness Hub

**Feature**: `specs/186-resource-readiness-hub`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the four Memory Bank files, the selected task groups and the applicable `.docs/` sources.
- [X] T002 Audit `app/lib/adaptive-performance.js`, `app/lib/use-adaptive-plan.js`, `app/lib/graphics-capabilities.js`, `app/lib/audio.js`, `components/IntentPrefetchLink.jsx`, `docs/graphics-rendering-architecture.md`, cache headers, service-worker status and experience asset loading.
- [X] T003 Record the evidenced gaps: ad-hoc per-experience preloads, no shared readiness contract, no deduplication across experiences, no active-experience hold, no service worker and immutable existing asset caching.

## Phase 2: Foundational

- [X] T004 Add the registration contract, validation, version invalidation and idempotent unregister in `app/lib/resource-readiness.js`.
- [X] T005 Add the image, code and audio adapters plus the renderer-agnostic adapter registry.
- [X] T006 Add the plan-bounded queue, priority ordering, background pause/resume and idle scheduling.
- [X] T007 Add per-resource readiness states, experience snapshots, deduplication, automatic retry and explicit retry.
- [X] T008 Add release integration with the existing release registry and server-safe guards.

## Phase 3: Experience coverage (US2, US3, US5)

- [X] T009 Register Lucky Card Reveal once for the personal and gift routes in `app/lib/resource-readiness-manifest.js`.
- [X] T010 Register Lucky Meter/Daily Resonance and Lucky Number Generator, sharing the `/lucky-meter` route bundle by dependency.
- [X] T011 Register Crystal Ball with its pedestal derivative and existing Howler preparation, with audio excluded from background.
- [X] T012 Register Lucky Map and Lucky Stories, sharing the `/map` route bundle and deferring the heavy sky backdrop.
- [X] T013 Assert registrations only reference existing assets and never API/data endpoints.

## Phase 4: Integration (US1, US4)

- [X] T014 Add the invisible `components/ResourceReadiness.jsx` mount and insert it once in `app/layout.js`.
- [X] T015 Gate current-route and homepage preparation behind `whenPageSettled` (load plus a quiet LCP/resource window) before the plan-bounded idle scheduler runs.
- [X] T016 Add one delegated hover/focus/press listener set that uses the existing prefetch policy.
- [X] T017 Hold the active-experience marker during the Daily Resonance cinematic and the Lucky Card Reveal without changing their timing or sound.
- [X] T018 Wire the Next.js router prefetch into the hub's code adapter from the mount.

## Phase 5: Verification

- [X] T019 Add focused hub tests for registration, deduplication, dependencies, priority/yield/resume, readiness, failure/retry, release, cache reuse and server safety.
- [X] T020 Add manifest tests for experience coverage, route resolution, shared bundles, budgets and asset existence.
- [X] T021 Run the focused suites, the affected regression suites and `tsc --noEmit`.
- [X] T022 Run `./freebuff-verify.sh`, measure the production build size and capture browser evidence with Playwright.
- [X] T023 Update the architecture document, Memory Bank and evidence file with measured results and limitations.
