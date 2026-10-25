# Feature Specification: Remove Verified DevSkim Checksum False Positive

**Feature Branch**: `chore/remove-verified-devskim-checksum-alert-20261025`
**Created**: 2026-10-25
**Status**: Draft
**Input**: User requested remediation of the only entry in `devskim-alerts.md` and removal of the entry after verification.

## User Scenarios & Testing

### User Story 1 — Keep the DevSkim report actionable (Priority: P1)

As the repository owner, I want a proven false-positive checksum entry removed from the running report after its safety has been verified, so the report reflects findings that still need review.

**Why this priority**: Keeping a known, already-filtered checksum false positive in the report creates misleading security work.

**Independent Test**: Confirm the existing suppression and its regression tests accept only the exact checksum field in the exact template metadata file, confirm the latest main scan passed, and verify the row is absent from the updated report.

**Acceptance Scenarios**:
1. **Given** the reported 64-character value is the template's SHA-256 checksum and not a credential, **When** the suppression rule validates its exact file, field, value format, and source span, **Then** the scanner marks it as a verified false positive.
2. **Given** current main scan evidence shows the filter/tests pass and no new findings are appended, **When** the report is cleaned up, **Then** only the stale DS173237 row is removed.
3. **Given** a different file, field, or unrelated 64-character value, **When** the suppression runs, **Then** it remains unsuppressed unless its own exact conditions have been reviewed.

## Requirements

- **FR-001**: Do not modify the constitution template or its SHA-256 checksum to silence the scan.
- **FR-002**: Preserve the existing narrowly scoped suppression logic and positive/negative regression tests.
- **FR-003**: Remove only the verified false-positive row with identity `81298a9d79b888769be1` from `devskim-alerts.md`.
- **FR-004**: Preserve the report header, marker, and append-only behavior for future findings.
- **FR-005**: Record actual evidence and pending checks honestly; do not claim the new PR's CI passed before it runs.

## Success Criteria

- **SC-001**: The checksum row is absent from the candidate `devskim-alerts.md`.
- **SC-002**: The current template metadata and checksum remain unchanged.
- **SC-003**: Latest completed base-branch DevSkim scan evidence confirms the filter tests pass and the report updater appends zero new findings.
- **SC-004**: Current-head PR checks are inspected before the cleanup is considered complete.

## Assumptions

- Prior source triage and exact-match regression tests already classify this row as a false positive.
- The report is append-only by design and therefore requires a manual, evidence-backed removal of stale entries.
