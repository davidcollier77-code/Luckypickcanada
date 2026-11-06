# Feature Specification: Playwright Version Alignment

**Feature Branch**: `fix/playwright-version-alignment-20261106`

**Created**: 2026-11-06

**Status**: Ready

**Input**: Fix the Playwright version mismatch that made Visual QA fail during test discovery. On 2026-11-06 the `playwright` CLI resolved to 1.63.0 while `@playwright/test` and `playwright-chromium` resolved to 1.64.1, so Visual QA aborted with "Playwright Test did not expect test() to be called here."

## User Scenarios & Testing

### User Story 1 — Visual QA discovers tests again (Priority: P1)

A reviewer opens a pull request that can change rendered output. Visual QA installs the Playwright browser and runs the existing visual regression suite instead of failing before any test executes.

**Why this priority**: The reported symptom is total loss of visual regression coverage, not a flaky comparison or a single stale baseline.

**Independent Test**: Run the repository's Playwright test discovery against the corrected dependency set and confirm every visual spec is listed with no registration error.

**Acceptance Scenarios**:

1. **Given** the corrected dependency set, **When** Playwright test discovery runs, **Then** all three projects are listed and no "test() to be called here" error is produced.
2. **Given** the corrected dependency set, **When** the visual regression suite runs locally against the app, **Then** the existing specs execute with their existing assertions and baselines.

### User Story 2 — The runner, test package, and browser package share one version (Priority: P1)

The Playwright CLI, the test package the specs import, and the Chromium package stay on the same release, so the runner and the test registration code cannot disagree.

**Why this priority**: A split version set is the root cause; leaving any of the three packages behind lets the same failure return on the next update.

**Independent Test**: Read the declared dependency ranges and the installed package versions and confirm all three Playwright packages report the already-pinned 1.64.1.

**Acceptance Scenarios**:

1. **Given** the corrected manifest, **When** the lockfile is installed with `--frozen-lockfile`, **Then** the installation succeeds and every Playwright package reports 1.64.1.
2. **Given** the corrected lockfile, **When** a future change raises only one Playwright package, **Then** an automated guard fails rather than allowing a silent split.

### User Story 3 — Preserved visual coverage (Priority: P2)

No screenshot baseline, visual assertion, threshold, project definition, website behaviour, or artwork changes as a side effect of the dependency correction.

**Why this priority**: Regenerating baselines would hide real visual regressions and is not part of the reported defect.

**Independent Test**: Inspect the final diff and confirm it contains no `tests/visual/**`, app, theme, asset, or configuration change.

**Acceptance Scenarios**:

1. **Given** the final change set, **When** the diff is reviewed, **Then** only dependency metadata, task artifacts, and record-keeping files change.

## Requirements

### Functional Requirements

- **FR-001**: The direct `playwright` dependency MUST declare the same version as the existing `@playwright/test` dependency (1.64.1).
- **FR-002**: `pnpm-lock.yaml` MUST be updated so the root importer and package snapshots resolve `playwright` and `playwright-core` to 1.64.1, with no remaining 1.63.0 entries.
- **FR-003**: Playwright test discovery MUST complete without the "test() to be called here" registration error.
- **FR-004**: The existing visual tests, committed screenshot baselines, diff thresholds, and Playwright project definitions MUST remain unchanged.
- **FR-005**: Application behavior, pages, artwork, audio, payments, email, database, and deployment configuration MUST remain unchanged.
- **FR-006**: No dependency other than `playwright` may change version as part of this correction.
- **FR-007**: An automated guard MUST fail if the three Playwright packages stop sharing one version, so the split cannot silently return.
- **FR-008**: The production build MUST remain below the 495 MB hard maximum.

### Key Entities

- **Playwright dependency set**: The `playwright` CLI package, the `@playwright/test` runner package the specs import, and the `playwright-chromium` browser package.
- **Visual baseline set**: The committed screenshots under `tests/visual/__screenshots__/`, which must not be regenerated.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `pnpm exec playwright --version` reports 1.64.1.
- **SC-002**: Installed `playwright`, `@playwright/test`, `playwright-chromium`, and `playwright-core` all report 1.64.1.
- **SC-003**: Test discovery lists the visual suite with zero registration errors.
- **SC-004**: The visual regression suite executes without changing any baseline.
- **SC-005**: The final diff contains zero visual-test, baseline, application, or asset changes.
- **SC-006**: The measured production build stays below 495 MB.

## Assumptions

- `@playwright/test` 1.64.1 and `playwright-chromium` 1.64.1 are the intended current versions; only the `playwright` CLI was left behind.
- The Visual QA workflow installs Chromium through `pnpm exec playwright`, so aligning the CLI also aligns the browser download to the same release.
- The failing pull request is left untouched; this correction ships on its own branch and pull request.
