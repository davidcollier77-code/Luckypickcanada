# Feature Specification: Publish a FAILED Report Instead of a Placeholder

**Feature Branch**: `freebuff/856a686c49f64f37f6ddb027-failed-report`

**Created**: 2026-11-21

**Status**: Implemented

**Input**: The consolidated PR verification report renders and writes its complete seven-category body before it exits. Exit 0 means every category is `PASSED`, `WARNING` or `NOT RUN`; exit 1 means at least one category is `FAILED`; exit 2 means the evidence could not be built. The workflow currently treats any non-zero exit as a render failure and replaces the body with a `NOT RUN` placeholder, so a real `FAILED` category is never published and the failure detail is lost.

## User Scenarios & Testing

### User Story 1 — A failing category is published, not hidden (Priority: P1)

An owner opening a pull request whose declaration, scope or dependency check failed sees the real report with the failing category, its summary and its evidence, instead of a "could not be built" placeholder.

**Why this priority**: A `FAILED` result is the report's most important output. Replacing it with `NOT RUN` both hides which category failed and mislabels a completed render as a build error.

**Independent Test**: Render a report whose QA declaration is missing and assert the renderer returns 1 while the written body starts with the report marker and contains `**FAILED**`; assert the workflow publishes that body for exit 1 and reserves the placeholder for other statuses or an empty body.

**Acceptance Scenarios**:

1. **Given** a category is `FAILED`, **When** the renderer exits 1, **Then** the complete report body is published with the failing category and the job still fails.
2. **Given** the evidence cannot be built, **When** the renderer exits 2, **Then** the marker-first `NOT RUN` placeholder replaces any previous report.
3. **Given** the renderer exits 1 but produces no body, **Then** the placeholder is still published so a stale passing report cannot remain visible.
4. **Given** the renderer exits with an unexpected status, **Then** the placeholder is published and the gate reports the unexpected status.

### User Story 2 — Nothing else about the report changes (Priority: P1)

The seven categories, their meanings, the four statuses, the sticky publication, the digest approvals and the exit codes remain as they are.

**Independent Test**: The existing report, scope and workflow-contract suites pass unchanged in meaning; the workflow still publishes one sticky comment and still fails on a non-zero renderer status.

## Requirements

### Functional Requirements

- **FR-001**: A renderer exit of 1 (at least one category `FAILED`) MUST publish the rendered report body.
- **FR-002**: The `NOT RUN` placeholder MUST still replace the report for any other non-zero status or when the body is missing or empty.
- **FR-003**: The job MUST still fail for exit 1, with the existing "at least one category is FAILED" message, and MUST still fail for every other non-zero status.
- **FR-004**: The seven categories, their meanings, the four statuses and the marker-first sticky publication MUST remain unchanged.
- **FR-005**: Regression tests MUST prove the renderer writes a body on exit 1, that the workflow guards the placeholder with the exit-1 exception, and that the placeholder remains for a render error.

### Key Entities

- **Rendered report body**: the seven-category Markdown written by `pr_verification_report.py` before it chooses its exit code.
- **Placeholder**: the marker-first `NOT RUN` body the workflow writes when rendering failed or produced nothing.
- **Exit codes**: 0 = no `FAILED` category, 1 = at least one `FAILED` category, 2 = evidence or render error.

## Success Criteria

- **SC-001**: A `FAILED` category is visible in the published report on the pull request.
- **SC-002**: A render error still replaces the previous report rather than leaving a stale pass.
- **SC-003**: The job conclusion is unchanged for every renderer status.

## Assumptions

- The renderer keeps writing `--comment` before it returns, so exit 1 always has a body in a normal run.
- The workflow continues to run from the trusted `main` checkout and never executes pull request code.
