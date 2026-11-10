# Feature Specification: Conditional Visual QA with Cached Chromium

**Feature Branch**: `freebuff/474320d3cde04a21a6a32a0f`

**Created**: 2026-11-06

**Status**: Ready

**Input**: Improve the existing visual QA workflow so Playwright/Chromium is installed only when visual QA is required, and its browser installation is cached and reused across GitHub Actions runs to eliminate unnecessary repeated downloads.

## User Scenarios & Testing

### User Story 1 — Non-visual pull requests skip the browser entirely (Priority: P1)

A pull request that only touches documentation, specifications, memory notes, or reference material completes its quality checks without downloading or provisioning Chromium.

**Why this priority**: This is the requested saving. Every documentation-only pull request currently pays the full browser download and dependency installation cost for tests that cannot possibly observe a visual change.

**Independent Test**: Run the change classifier against a documentation-only path list and confirm it reports `visual_required=false`; confirm the workflow's browser steps are conditional on that result.

**Acceptance Scenarios**:

1. **Given** a pull request that changes only Markdown files and the `specs/`, `memory-bank/`, or `.docs/` trees, **When** Visual QA runs, **Then** no Chromium install, cache restore, baseline check, or visual regression step executes, and all unit tests, the TypeScript check, and the repository gate still run.
2. **Given** a pull request that changes an application, theme, asset, or visual test path, **When** Visual QA runs, **Then** the existing Chromium and Playwright visual regression path executes unchanged.

### User Story 2 — Chromium is cached and reused across runs (Priority: P1)

Repeated runs for the same Playwright version on the same runner image restore the cached Chromium build instead of downloading it again.

**Why this priority**: Repeated downloads of the same browser build are the other half of the wasted time this task targets.

**Independent Test**: Inspect the cache key and the cache-hit conditions in the workflow, and confirm the miss path downloads Chromium while the hit path only provisions system dependencies.

**Acceptance Scenarios**:

1. **Given** a populated cache for the current Playwright version and runner OS, **When** Visual QA runs, **Then** the Chromium download is skipped and only the system dependency installation runs.
2. **Given** an empty cache, **When** Visual QA runs, **Then** Chromium is downloaded once with system dependencies and saved under the version-and-OS key.
3. **Given** a Playwright version change, **When** Visual QA runs, **Then** the cache key no longer matches, so a fresh matching Chromium build is installed rather than a stale one reused.

### User Story 3 — Uncertain classifications never skip visual QA (Priority: P2)

When the changed-file list cannot be read, is empty, or contains a path the classifier does not positively recognise as documentation-only, visual QA runs.

**Why this priority**: A skipped visual regression that should have run is a silent quality loss; an unnecessary run only costs time. The safe failure direction is to run.

**Independent Test**: Execute the classifier with empty input, a failed listing simulation, and unrecognised path types, and confirm every case reports `visual_required=true`.

**Acceptance Scenarios**:

1. **Given** the GitHub file listing call fails, **When** the classification step runs, **Then** it reports `visual_required=true` and warns in the log.
2. **Given** an empty or unclassifiable change set, **When** the classifier runs, **Then** it reports `visual_required=true`.
3. **Given** a mixed change set, **When** the classifier runs, **Then** any non-documentation path makes the whole pull request visual.

## Requirements

### Functional Requirements

- **FR-001**: The workflow MUST classify the pull request change set before deciding whether to install a browser.
- **FR-002**: Non-rendering changes (Markdown at any depth, `specs/`, `memory-bank/`, `.docs/`, `.specify/feature.json`, and `__tests__/*.test.{js,jsx,ts,tsx}` unit tests) MUST skip the Chromium install, cache step, baseline verification, and visual regression run.
- **FR-003**: Any other changed path MUST run the existing Chromium and Playwright visual QA.
- **FR-004**: A failed file listing, an empty change set, or an unexpected classification value MUST be treated as visual QA required.
- **FR-005**: The Chromium cache key MUST include both the resolved Playwright version and the runner operating system.
- **FR-006**: A Playwright version change MUST produce a cache miss and a matching fresh download, with no stale-cache fallback.
- **FR-007**: Only Chromium MUST be installed; Firefox and WebKit MUST NOT be installed.
- **FR-008**: Every existing quality check (targeted unit tests, full unit suite, standalone TypeScript check, Spec Kit governance gate, committed baseline verification, visual regression, report upload) MUST remain in the workflow.
- **FR-009**: Visual baselines, test assertions, thresholds, and the three Playwright projects MUST remain unchanged.

### Key Entities

- **Change classifier**: The repository script that turns a changed-path list into `visual_required=true|false`.
- **Chromium cache entry**: The cached `~/.cache/ms-playwright` directory identified by runner OS and Playwright version.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A documentation-only pull request downloads zero browser binaries.
- **SC-002**: A repeated run with an unchanged Playwright version on the same runner OS restores the cached browser instead of downloading it.
- **SC-003**: A Playwright version change invalidates the cache entry and downloads exactly one matching Chromium build.
- **SC-004**: Every fail-closed case (listing failure, empty list, mixed set, unknown file type) resolves to running visual QA.
- **SC-005**: The number of Playwright projects, committed baselines, and executed visual assertions is unchanged.
- **SC-006**: The production build remains below the 495 MB hard maximum.

## Assumptions

- `ubuntu-latest` is the only runner image used by this workflow, so the runner OS plus Playwright version fully identifies a browser build.
- System libraries are not cacheable; the cache-hit path therefore still runs `playwright install-deps chromium`, which installs OS packages without downloading browsers.
- Only the Visual QA workflow's browser handling changes; the application, its scripts, dependencies, and deployment configuration are untouched.
- Playwright's own documentation discourages browser caching on general performance grounds; the requested outcome is explicitly to cache it, so the cache is retained and measured rather than removed.


## Non-rendering test and metadata paths

The classifier may skip browser provisioning for the exact Spec Kit feature pointer (`.specify/feature.json`) and unit-test files directly under `__tests__/` using the supported `.test.js`, `.test.jsx`, `.test.ts` and `.test.tsx` extensions. This does not include browser/e2e tests under `tests/`, visual baselines, application code, assets, themes, workflows, scripts or unknown paths; those continue to require Playwright visual QA. Unit tests, TypeScript checks and repository verification continue to run on every pull request.
