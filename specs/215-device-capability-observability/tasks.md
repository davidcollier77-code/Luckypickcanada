# Tasks: Device Capability and Observability

**Input**: Design documents from `specs/215-device-capability-observability/`

**Prerequisites**: `spec.md`, `research.md`, `plan.md`

**Tests**: Required. The feature changes capability detection, a shared diagnostic report and an observational monitor.

## Phase 1: Setup and Characterization

- [X] T001 Record the render-gate boundary and exact device matrix in `specs/215-device-capability-observability/research.md`.
- [X] T002 Add characterization assertions for the current `resolveRenderQuality`, `getGraphicsProfile`, `getRenderQuality` and `readDeviceState` outputs in `__tests__/graphics-capabilities.test.js` and `__tests__/adaptive-performance.test.js`.
- [X] T003 [P] Add a focused monitor test file at `__tests__/performance-monitor.test.js` for the planned statuses, windows and resets.

---

## Phase 2: User Story 1 — One Device Assessment (Priority: P1)

**Goal**: Every existing capability consumer shares one cached hardware assessment, and missing hints never imply weakness.

**Independent Test**: Read the assessment repeatedly with injected and browser sources; verify one cached read, the confidence/unknown-signal fields, and unchanged wrapper output.

- [X] T004 [US1] Add `readDeviceSignals`, `assessDeviceCapabilities` and cached `getDeviceAssessment` in `app/lib/graphics-capabilities.js`.
- [X] T005 [US1] Delegate `getGraphicsProfile` and `getRenderQuality` hardware reads to the assessment without changing their output profiles.
- [X] T006 [US1] Add the lazy WebGL1/WebGL2/limits report in `app/lib/graphics-capabilities.js` and delegate `supportsWebGL`.
- [X] T007 [US1] Delegate `readDeviceState` in `app/lib/adaptive-performance.js` to the assessment and display demand; keep its keys and semantics.
- [X] T008 [US1] Extend `getAdaptiveCapabilities` additively and preserve the exact `features` shape.
- [X] T009 [US1] Add tests for cache behaviour, missing hints, one-known-signal cases, WebGL2 fallback, limits and no identity strings.

---

## Phase 3: User Story 2 — Capability Separate from Display Demand (Priority: P2)

**Goal**: Report capability, display demand, render budget and limiter separately while keeping render output unchanged.

**Independent Test**: Run the documented device matrix and assert unchanged profiles plus the correct `limitedBy` values for surface, pointer density, capability and policy.

- [X] T010 [US2] Add `getDisplayDemand`, demand bands and gate constants in `app/lib/graphics-capabilities.js`.
- [X] T011 [US2] Add `describeRenderBudget` with `limitedBy` and both gate states; do not change `resolveRenderQuality` output.
- [X] T012 [US2] Add the device/surface matrix tests, including 4K, MacBook, S23, iPhone, A17, Pixel 7a, Save-Data and no-hint profiles.
- [X] T013 [US2] Add source guards for the retained gates and the absence of vendor/renderer identity reads.

---

## Phase 4: User Story 3 — Observational Frame Monitor (Priority: P3)

**Goal**: Report warming/healthy/strained/critical from existing frame loops without adding a loop, timer, listener or adaptation.

**Independent Test**: Drive the monitor with synthetic timestamps for 60 fps, 30 fps, below-critical delivery, startup, hidden page, long gap, viewport change and duplicate loop samples.

- [X] T014 [US3] Add `createPerformanceMonitor`, the singleton, `recordFrameSample`, `getPerformanceSnapshot` and `resetPerformanceMonitor` in `app/lib/adaptive-performance.js`.
- [X] T015 [US3] Record painted frame timestamps from `createAdaptiveFrameLoop` and from the existing cosmic frame function; de-duplicate same-frame samples.
- [X] T016 [US3] Add monitor tests for warm-up, each status, hysteresis, resets, snapshot shape and duplicate suppression.
- [X] T017 [US3] Add source guards confirming no new frame loop/timer/listener and an unchanged cosmic 42/18 fps step.

---

## Phase 5: Polish and Verification

- [X] T018 [P] Update `docs/graphics-rendering-architecture.md` with the assessment, display-demand, gate-boundary and monitor contract.
- [X] T019 [P] Correct stale renderer references and record the feature state in `memory-bank/activeContext.md`, `memory-bank/techContext.md` and `memory-bank/progress.md`.
- [X] T020 Run the focused graphics, adaptive and performance-monitor suites.
- [X] T021 Run `pnpm exec tsc --noEmit` and the full Vitest suite.
- [X] T022 Run `./freebuff-verify.sh` with the Spec Kit base reference and record the production build size.
- [X] T023 Review the complete diff against the QA checker requirements, `PR_SUBMISSION.md` and the 495 MiB cap.
- [X] T024 Commit and open one regular, non-draft, unmerged PR with the exact declarations and QA scope JSON.

## Verification Record

- Focused suites: `__tests__/graphics-capabilities.test.js` 35 tests, `__tests__/adaptive-performance.test.js` 41 tests, `__tests__/performance-monitor.test.js` 12 tests and `__tests__/resource-readiness.test.js` 45 tests passed.
- `pnpm exec tsc --noEmit`: exit 0.
- Full suite: 111 files / 1,233 tests passed.
- `SPEC_KIT_BASE_REF=6afebdfa ./freebuff-verify.sh`: exit 0; 471 Python checker tests and 51 docs tests passed.
- Production build: 434,126,848 bytes (414.02 MiB), strictly below the 495 MiB cap.
- Hardware GPU, Samsung Internet and Safari/Firefox mobile evidence are unavailable in this VM; the monitor thresholds remain provisional. Visual output is unchanged by design and no manual browser pass is claimed.

## Dependencies

- Phase 1 characterization must pass before any refactor.
- US1 is foundational for US2 and US3 diagnostics.
- US2 depends on the assessment but not on the monitor.
- US3 depends on the shared capabilities report only for its snapshot placement; the monitor itself is independent.
- Phase 5 starts only after the three user stories pass.

## Parallel Opportunities

- T003, T018 and T019 can run in parallel with the implementation once their inputs are stable.
- T012 and T016 touch different test files and can run in parallel.
- Documentation and Memory Bank updates touch different files.

## Implementation Strategy

Implement in priority order. Keep the existing render-quality output pinned first, then add detection and diagnostics, then the monitor, then documentation and verification. Do not start any deferred adaptive-quality, loading-priority or cadence work.
