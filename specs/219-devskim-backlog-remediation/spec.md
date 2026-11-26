# Feature Specification: DevSkim Backlog Investigation and Remediation

**Feature Branch**: `freebuff/devskim-backlog-remediation-219`

**Created**: 2026-11-26

**Status**: Implemented; verification recorded in `evidence.md`

**Input**: Owner direction: investigate why the repository's open DevSkim alert count rose sharply, explain the reported "approximately 100" figure, resolve the 422 open alerts without weakening production security coverage, and fix the report's alert counting.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The default-branch alert count reflects real, reviewed findings (Priority: P1)

As the repository owner, I need the 422 open DevSkim alerts to represent genuine risk rather than repeated documentation noise, so the Security tab is a trustworthy backlog and the DevSkim category can pass without hiding production issues.

**Why this priority**: A permanently red security category trains reviewers to ignore it, which is a greater risk than the noise itself.

**Independent Test**: Run the production suppression filter over the real DevSkim SARIF from the default branch and confirm that every reviewed false positive is removed while no production finding is.

**Acceptance Scenarios**:

1. **Given** the current default-branch SARIF, **When** the updated filter runs, **Then** all 421 loopback findings in the Spec 217 evidence JSON files are suppressed and the report up to date.
2. **Given** the same SARIF, **When** the updated filter runs, **Then** the readiness-watchdog finding is suppressed because its callback is callable and its delay is a fixed constant.
3. **Given** a production source file, a non-JSON evidence file, a malformed JSON file, or a non-loopback URL, **When** the filter runs, **Then** the finding remains visible.

---

### User Story 2 - Reporting shows the true alert count (Priority: P1)

As the repository owner, I need the consolidated report to state how many code-scanning alerts are actually open, so a large backlog cannot hide behind a page-size cap.

**Why this priority**: The previous report showed exactly 100 whenever the true count exceeded 100, which made the increase look like a jump from about 100 to 422 rather than a single batch of 422.

**Independent Test**: Inspect the report workflow and its contract tests; the code-scanning alert request must follow every page and flatten the pages before the renderer counts them.

**Acceptance Scenarios**:

1. **Given** more than 100 open alerts, **When** the report fetches evidence, **Then** it requests every page and renders the full count.
2. **Given** a failed alert request, **When** the report renders, **Then** it publishes the existing "could not be read" warning rather than a zero or a partial count.

---

### User Story 3 - The remediation cannot become a broad suppression (Priority: P1)

As the repository owner, I need each new exemption to be rule-scoped, path-scoped and content-validated, so DevSkim keeps detecting real issues in shipped code.

**Why this priority**: Suppressing a whole directory or all findings for a rule would trade away the scanner's value to reach zero.

**Independent Test**: Run the negative matrix: production paths, markdown evidence, malformed JSON, non-loopback values, and a different timer in the allowlisted file must all remain reported.

**Acceptance Scenarios**:

1. **Given** a loopback value in a production file, **When** the filter runs, **Then** the finding is retained.
2. **Given** a non-loopback URL or a bare address in an evidence JSON file, **When** the filter runs, **Then** the finding is retained.
3. **Given** a different `setTimeout` call in the meter scene, **When** the filter runs, **Then** the finding is retained.

### Edge Cases

- Evidence JSON files may sit in nested directories below `evidence/`; the path predicate must admit them without admitting a sibling non-evidence directory.
- A future Spec Kit feature directory must match the existing numeric-prefix convention; arbitrary names must not qualify.
- DevSkim offsets are UTF-16 based and may point one column early; the existing absolute-offset validation remains authoritative and must fail closed.
- The scanner SARIF and the checked-out source must belong to the same commit; a stale SARIF can make the suppressor's own self-test findings appear unsuppressed because their offsets moved.
- The 422 alerts remain open until the next default-branch scan ingests the filtered SARIF; this change does not dismiss them manually.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The filter MUST admit `specs/<NNN-feature>/evidence/**/*.json` as a source-inspection path for DS162092 only.
- **FR-002**: The evidence predicate MUST require a valid JSON document and a reported span inside a JSON string value whose URL host is loopback, or a JSON value that contains a loopback URL.
- **FR-003**: The filter MUST NOT admit markdown, non-JSON, `..`-containing, non-evidence, or non-numeric feature paths.
- **FR-004**: The filter MUST suppress the meter readiness watchdog only when the reported span starts at the reviewed `readyWatchdog = window.setTimeout(() => {` statement.
- **FR-005**: The meter allowlist MUST NOT admit other DS172411 findings in the same file or any DS162092 finding in it.
- **FR-006**: No scanner rule, severity, scan glob, workflow trigger, dependency or application code may change.
- **FR-007**: The report workflow MUST fetch code-scanning alerts with `gh api --paginate --slurp` and flatten the pages before counting.
- **FR-008**: The report MUST retain its existing failure behaviour when the alert request fails.
- **FR-009**: Tests MUST cover each positive finding and the negative matrix in FR-003, FR-004 and FR-005.
- **FR-010**: The report and workflow contract tests MUST assert pagination so a single-page regression fails.
- **FR-011**: The real-SARIF replay gate MUST still pass and MUST confirm that no audited false positive survives and no removal falls outside the allowlist.
- **FR-012**: Verification MUST record the real default-branch SARIF counts before and after filtering, the focused suites, the type check and the production build size or its documented inapplicability.

## Key Entities

- **Spec Kit evidence report**: A committed JSON measurement file under `specs/<feature>/evidence/`, captured from a local browser or performance run and never bundled into production.
- **Loopback origin**: A local development URL recorded as data inside an evidence report.
- **Reviewed timer statement**: The exact watchdog assignment whose first argument is an inline arrow function and whose delay is a reviewed constant.
- **Alert backlog**: The default-branch code-scanning alerts shown in the Security tab and counted by the consolidated report.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The real default-branch SARIF drops from 422 remaining results to 0 after the updated filter runs against matching source.
- **SC-002**: The suppression filter and its negatives pass (115 tests before this feature's final fixture edit; the final run is recorded in `evidence.md`).
- **SC-003**: The report contract suite passes and asserts the paginated alert request.
- **SC-004**: No finding in production application code is suppressed by this change.
- **SC-005**: The production build remains strictly below 495 MiB, or is documented as not applicable because the change set is build-exempt.
- **SC-006**: No dependency, scanner configuration, workflow trigger, or application source changes.

## Assumptions

- The owner authorized resolving the existing DevSkim backlog in a separate task and branch, not on PR #2035.
- The 13 Spec 217 evidence JSON files are documentation data; the build classifier exempts `specs/` and the Next.js configuration does not reference it.
- The GitHub code-scanning alerts for the default branch will close automatically when the next scan uploads SARIF without the suppressed results.
- The downloaded default-branch SARIF used for verification belongs to the commit whose source is being filtered; the clean-source replay satisfies this condition.
