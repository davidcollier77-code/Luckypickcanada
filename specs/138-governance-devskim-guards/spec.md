# Feature Specification: Protect Agent Governance and Repair DevSkim Benchmark Filtering

**Feature Branch**: `138-governance-devskim-guards`
**Created**: 2026-11-11
**Status**: In progress
**Input**: Owner-authorized correction of stale governance QA assertions, missing AGENTS.md protection and the failing DevSkim local benchmark path check.

## User Scenarios & Testing

### User Story 1 — Protect the authoritative agent instructions (Priority: P1)

As the repository owner, I need changes to `AGENTS.md` to trigger the existing human-authorization gate and request owner review, so a coding agent cannot silently rewrite repository governance.

**Independent Test**: Inspect a pull request changing only `AGENTS.md` and verify the Protected File Changes workflow runs, detects the file, and requires the configured human authorization. Confirm CODEOWNERS assigns the owner.

**Acceptance Scenarios**:
1. **Given** a pull request changes `AGENTS.md`, **When** the protection workflow runs, **Then** the file is detected and the human authorization environment is required.
2. **Given** a pull request changes an unrelated unprotected file, **When** the workflow runs, **Then** it does not require this protected-file authorization gate.

### User Story 2 — Keep governance QA aligned with the current policy (Priority: P1)

As the repository owner, I need automated governance tests to verify the current `AGENTS.md` requirements and its supporting files, rather than obsolete headings and wording from previous versions.

**Independent Test**: Run the focused Vitest governance test and confirm it checks the current A/B/C workflow, mandatory `PR_SUBMISSION.md`, project QA expectations, task-group files, Spec Kit commands and explicit AGENTS.md protection.

**Acceptance Scenarios**:
1. **Given** the current `AGENTS.md`, **When** the governance test runs, **Then** it verifies current policy requirements without requiring retired sections or phrases.
2. **Given** the protection workflow or owner rule no longer covers `AGENTS.md`, **When** the governance test runs, **Then** it fails.

### User Story 3 — Recognize only reviewed local performance reports in DevSkim (Priority: P1)

As the repository owner, I need DevSkim's loopback-origin filter to recognize the exact committed Spec Kit performance-report paths while preserving the existing validation of JSON, URL values and finding spans.

**Independent Test**: Run the Python suppression unit suite. The two reviewed report filenames suppress a loopback URL only when the file is valid JSON and the finding is inside a JSON value; other paths and non-URL loopback text remain unsuppressed.

**Acceptance Scenarios**:
1. **Given** `specs/<numbered-feature>/perf-baseline.json` or `perf-after.json` contains a measured local URL, **When** the DevSkim filter evaluates the reported span, **Then** it suppresses only that reviewed local-origin finding.
2. **Given** an unreviewed filename/path, malformed JSON or a loopback address that is not a URL, **When** the filter evaluates the finding, **Then** the finding is not suppressed.

## Edge Cases

- Unexpected or malformed Spec Kit feature directory names must not qualify.
- Nested report paths, backup suffixes and unrelated `specs/**/*.json` files must not qualify.
- A valid report filename does not make arbitrary JSON strings or object keys safe.
- If GitHub cannot list pull-request files, the protection workflow must continue to fail closed.
- Historical Spec Kit records remain historical; only active checker assertions are updated.

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST include `AGENTS.md` in the Protected File Changes workflow path filter and its protected-file detection list.
- **FR-002**: CODEOWNERS MUST assign `AGENTS.md` to `@davidcollier77-code`.
- **FR-003**: The governance test MUST assert current `AGENTS.md` requirements and MUST NOT depend on retired headings or obsolete wording.
- **FR-004**: The governance test MUST fail if the explicit AGENTS.md authorization gate or owner assignment is removed.
- **FR-005**: DevSkim MUST recognize only `perf-baseline.json` and `perf-after.json` at the root of a numbered `specs/<feature>/` directory as eligible performance reports.
- **FR-006**: Existing JSON validity, loopback URL, finding-span and workspace-boundary checks MUST remain unchanged.
- **FR-007**: The DevSkim regression tests MUST prove both positive reviewed cases and negative unreviewed-path/content cases.
- **FR-008**: `AGENTS.md`, the suppression workflow's scan scope, other suppression allowlists and historical records MUST NOT be changed.

## Success Criteria

- **SC-001**: The governance test passes and verifies current policy and AGENTS.md protection.
- **SC-002**: The DevSkim suppression suite passes without `NameError`.
- **SC-003**: Both reviewed performance report filenames qualify, and unrelated paths or content remain unsuppressed.
- **SC-004**: `AGENTS.md` remains byte-for-byte unchanged.
- **SC-005**: All repository-required verification passes and the measured production build remains below 495 MiB before PR submission.

## Assumptions

- The existing `protected-file-authorization` GitHub environment remains the human-approval gate; this task adds `AGENTS.md` to its existing scope rather than inventing a new approval mechanism.
- Existing numbered Spec Kit feature directories use the repository's three-digit-or-longer numeric prefix and lowercase hyphenated name.
- The current performance artifacts are documentation/measurement data and are not shipped as production code.
