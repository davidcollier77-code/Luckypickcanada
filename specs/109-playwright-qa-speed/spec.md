# Feature Specification: Faster Playwright Visual QA

**Feature Branch**: `perf/visual-qa-speed-20261107`

**Created**: 2026-11-07

**Status**: Ready

**Input**: Improve the execution time of the existing visual regression checker without reducing its coverage, changing approved screenshots, or weakening its checks.

## User Scenarios & Testing

### User Story 1 — Complete the full visual suite faster (Priority: P1)

As the repository owner, I want the existing Playwright visual checks to use available CI capacity so that a full visual run finishes sooner while testing the same pages, devices, interactions, and approved baselines.

**Why this priority**: The most recent comparable PR run executed 93 Playwright cases with one worker and took 6.1 minutes. The test run is the largest measured part of the Visual QA job.

**Independent Test**: Run the unchanged Playwright suite on the same GitHub-hosted runner class, confirm the same 93 cases are discovered, and compare wall-clock duration and outcomes against the one-worker baseline.

**Acceptance Scenarios**:

1. **Given** the Visual QA CI job, **When** independent Playwright test files run, **Then** up to two worker processes may execute separate files concurrently.
2. **Given** tests inside an individual spec file, **When** they execute, **Then** their existing in-file order is retained; full parallel execution within files is not enabled.
3. **Given** the unchanged visual suite, **When** the optimized run completes, **Then** all existing test cases, projects, assertions, screenshots, thresholds, retries, and committed baselines remain in place.

### User Story 2 — Avoid repeatedly downloading package dependencies (Priority: P2)

As the repository owner, I want CI to reuse pnpm's package store across compatible runs so that dependency installation can avoid downloading packages already in cache.

**Why this priority**: The latest Visual QA job spent 12.5 seconds installing dependencies from a cold store. The current workflow already caches Chromium but does not configure pnpm's package-store cache.

**Independent Test**: Verify setup-node restores a cache keyed by the lockfile and that `pnpm install --frozen-lockfile` still runs on every Visual QA job.

**Acceptance Scenarios**:

1. **Given** an unchanged lockfile and compatible runner, **When** a later Visual QA run starts, **Then** setup-node attempts to restore the pnpm store cache before installation.
2. **Given** a cache miss or lockfile change, **When** dependencies are installed, **Then** the existing frozen-lockfile install runs and the new cache is saved under the updated key.
3. **Given** either cache outcome, **When** CI finishes, **Then** no dependency or lockfile changes are introduced by this optimization.

### Edge Cases

- A cache miss must not prevent or skip the frozen-lockfile install.
- A lockfile change must not restore a stale dependency store key.
- A Playwright worker failure or retry must not suppress any test or screenshot comparison.
- Parallel execution must not make tests depend on shared mutable state or alter the existing three project viewports.
- If two workers do not produce a meaningful and reliable speed improvement, report the measured outcome and revert or revise the worker setting rather than claiming success.

## Requirements

### Functional Requirements

- **FR-001**: The Visual QA workflow MUST execute the complete existing Playwright suite for every PR classified as requiring visual QA.
- **FR-002**: CI MAY run up to two independent Playwright test files concurrently.
- **FR-003**: The Playwright configuration MUST retain `fullyParallel: false`, preserving ordered execution of tests within each file.
- **FR-004**: The number and definitions of Playwright projects MUST remain unchanged: desktop 1440×900, mobile-390 390×844, and mobile-412 412×915.
- **FR-005**: All existing visual tests, functional assertions, committed screenshots, snapshot paths, screenshot comparison thresholds, retry settings, and failure diagnostics MUST remain unchanged.
- **FR-006**: The workflow MUST enable setup-node's pnpm package-store cache using `pnpm-lock.yaml` as its dependency key input.
- **FR-007**: pnpm MUST be configured before setup-node attempts to discover/cache its package store.
- **FR-008**: `pnpm install --frozen-lockfile` MUST continue to run on every Visual QA job.
- **FR-009**: The existing documentation-only classifier and versioned Chromium cache MUST remain intact.
- **FR-010**: The implementation MUST report comparable baseline and post-change Playwright durations and actual test totals. No speed improvement may be claimed without measured evidence.

### Scope Boundaries

Do not remove tests, reduce screenshot or viewport coverage, relax thresholds, lower retry counts, disable failure artifacts, modify application code or artwork, or change the current documentation-only classifier or Chromium cache strategy.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The optimized Visual QA run discovers and executes the same 93 Playwright cases as the recorded baseline, including the same three intentionally skipped project variants.
- **SC-002**: A comparable PR-head run shows at least a 20% reduction in Playwright wall-clock duration versus the 6.1-minute one-worker baseline, without increased test failures or flakiness.
- **SC-003**: The pnpm store cache is configured, while frozen-lockfile installation continues on every run.
- **SC-004**: All existing tests, projects, screenshot baselines and comparison thresholds remain unchanged.
- **SC-005**: Required repository verification passes and the production build remains below the 495 MB hard maximum.

## Assumptions

- The existing GitHub-hosted Ubuntu runner can support two Playwright workers without materially reducing test stability.
- Parallelism is limited to separate test files; the suite's internal test sequences and interactions remain sequential.
- The package-store cache is an optimization only; correctness continues to be enforced by the frozen lockfile and normal tests.
