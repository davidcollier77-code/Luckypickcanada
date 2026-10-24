# Feature Specification: DevSkim Self-Test False-Positive Filtering

**Feature Branch**: `fix/devskim-self-suppression-20261024`

**Created**: 2026-10-24

**Status**: In Progress

**Input**: User request: safely resolve the 12 findings listed in `devskim-alerts.md`, discard verified false positives, remediate any valid issues, and leave zero entries after verification.

## User Scenarios & Testing

### User Story 1 — Keep scanner self-tests from polluting security results (Priority: P1)

As the repository maintainer, I need the DevSkim suppression helper and its own regression tests to have their intentional localhost fixtures classified correctly, so that security results show genuine issues rather than the scanner testing itself.

**Why this priority**: All 12 current ledger entries point only to the suppression helper or its test file. Those are deliberate examples used to validate narrow false-positive handling; their filtering currently fails because those two paths are rejected before the contextual suppression rules are reached.

**Independent Test**: Feed representative DevSkim SARIF results for both contextual rule IDs and both exact helper paths through the real suppressor, and verify only the reviewed test-fixture findings are removed.

**Acceptance Scenarios**:

1. **Given** a DS137138 or DS162092 result on either exact DevSkim helper/test path and a source line containing the reviewed localhost fixture, **When** the suppressor processes the SARIF, **Then** the result receives the existing reviewed justification and is removed before upload.
2. **Given** the same rule on a non-allowlisted path, **When** the SARIF is processed, **Then** the result remains in the upload.
3. **Given** a different rule on either helper/test path, **When** the SARIF is processed, **Then** the result remains unless a pre-existing, independently verified suppression predicate applies.
4. **Given** the regression tests and current-head DevSkim scan pass, **When** the report is reconciled, **Then** the 12 verified false-positive ledger entries are removed while the report header and append marker remain intact.

## Requirements

### Functional Requirements

- **FR-001**: The source-path resolver MUST permit only the two exact DevSkim helper/test paths for reviewed source-context inspection.
- **FR-002**: The suppressor MUST permit these helper/test paths only for the DS137138 and DS162092 contextual checks; existing path and rule allowlists for all other findings MUST remain unchanged.
- **FR-003**: Regression tests MUST exercise the actual SARIF-processing and removal path, including negative controls for an unrelated path and a different rule.
- **FR-004**: The report MUST retain its title, explanatory text, and append marker, and MUST contain zero finding rows after the verified reconciliation.
- **FR-005**: No DevSkim rule, scan directory, global filtering behavior, production application code, or security control may be disabled or weakened.

## Edge Cases

- A finding on an unreviewed file must remain reportable even when its text resembles a localhost fixture.
- An unrelated DevSkim rule reported against a helper/test file must remain visible.
- A malformed or unsafe SARIF path must continue to be rejected by the safe resolver.
- If CI or the current-head DevSkim scan does not prove the expected filtering, do not claim the report has zero verified outstanding findings.

## Success Criteria

- **SC-001**: The targeted regression proves the four expected helper/test false-positive combinations are removed and the negative controls remain.
- **SC-002**: Python syntax and suppression tests pass in current-head CI.
- **SC-003**: The current-head DevSkim check uploads no findings from the twelve reviewed source locations.
- **SC-004**: The reconciled `devskim-alerts.md` contains zero finding entries; its header and marker are preserved.
- **SC-005**: All repository-required verification gates are either passed with evidence or explicitly reported as outstanding; no unrun check is claimed successful.

## Assumptions

- The 12 current ledger rows are historical findings from DevSkim's intentional source fixtures, not 12 distinct production vulnerabilities.
- The report is cleared only after the exact-path, exact-rule filtering is covered by regression tests and current-head CI.
- The task does not require an application build change, dependency update, deployment change, or user-facing behavior change.
