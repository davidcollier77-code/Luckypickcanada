# Feature Specification: Trustworthy DevSkim Findings

**Feature Branch**: `jules-6324508496259981099-e3abaa85-8989833840928023399`

**Created**: 2026-10-22

**Status**: In Progress

**Input**: User description: "Fix the additional DevSkim findings appearing in PR #1558 without weakening scan coverage."

## User Scenarios & Testing

### User Story 1 — Trustworthy security scan results (Priority: P1)

The repository owner needs security findings to distinguish actual weak-hash use from harmless text that merely names a known dependency package, without hiding genuine problems.

**Why this priority**: The new findings were introduced in the same change intended to make security scanning more reliable, so they must be resolved before that work can be treated as verified.

**Independent Test**: Run the targeted regression suite and a fresh DevSkim scan against the updated pull-request revision.

**Acceptance Scenarios**:

1. **Given** source code or a test fixture names one of the two explicitly known dependency packages, **When** DevSkim scans the helper and its tests, **Then** the package-name text alone does not produce weak/broken-hash findings.
2. **Given** the matcher receives one of the two exact approved package identifiers, **When** it checks a lockfile line, **Then** the package is recognized.
3. **Given** the matcher receives an unrelated package name with a similar substring, **When** it checks the line, **Then** it does not treat that name as an approved package.
4. **Given** suppression tests fail or filtering cannot complete, **When** the workflow handles the scan, **Then** the original scan results remain available for Security upload.

## Requirements

- **FR-001**: Findings may be suppressed only when the source evidence satisfies the existing narrow allowlist and complete-value checks; generic keys or arbitrary values must not qualify.
- **FR-002**: Ambiguous matches, findings that overlap other fields, or unsafe source paths must remain visible rather than being suppressed.
- **FR-003**: The two approved lockfile dependency names must continue to match exactly, and unrelated lookalike names must remain rejected.
- **FR-004**: A source-code or test-fixture reference to an approved dependency name must not, by itself, create a weak/broken-hash finding.
- **FR-005**: If filtering or its regression suite fails, the original scan results must still be uploaded.
- **FR-006**: The correction must not change application behavior, broaden security suppressions, add dependencies, introduce secrets, or change deployment configuration.

## Edge Cases

- A lookalike package name contains a similar algorithm substring but is not in the explicit allowlist.
- A package identifier is assembled from multiple source fragments but must resolve to the same exact value at runtime.
- The SARIF filtering step fails; the original scan artifact must remain uploadable.
- An actual weak-hash issue is present alongside harmless package-name text; the real finding must not be hidden.

## Success Criteria

- **SC-001**: A fresh pull-request scan produces zero weak/broken-hash findings in the suppression helper and regression test solely because of package-name text.
- **SC-002**: The regression suite proves that both exact package names still match and a similar unapproved name does not.
- **SC-003**: The DevSkim SARIF upload step succeeds, and genuine unrelated findings remain reportable.

## Assumptions

- The newly observed findings are triggered by text naming dependency packages, not by code that performs hashing.
- The approved dependency names and the current narrowly scoped suppression behavior remain unchanged.
- GitHub Actions is the authoritative environment for the current-head scan and repository-required verification.

<!-- Updated for current run -->