# Feature Specification: DevSkim Alert Report Review and Cleanup

**Feature Branch**: `freebuff/c3e3aea4b5256eb42e63e937`

**Created**: 2026-11-17

**Status**: Complete

**Input**: User request: "Properly review and resolve all 9 existing findings in `devskim-alerts.md`, removing verified false positives and stale entries while identifying genuine security issues and presenting recommended fixes for approval before implementation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every recorded entry is audited against its current source (Priority: P1)

As the repository owner, I need each recorded entry checked against the file and line that exist today, so a stale line number or a relocated token cannot be mistaken for a live defect.

**Why this priority**: `devskim-alerts.md` is append-only. Entries outlive the code they came from, and several scans accumulated positional duplicates without any code change.

**Independent Test**: For each recorded entry, inspect the current source, recover the source revision that produced the entry from Git history, and re-run the scanner against the current tree.

**Acceptance Scenarios**:

1. **Given** a recorded rule, path, and line, **When** the current file is inspected, **Then** the path exists and the line content is recorded as either the matched token or a shifted location.
2. **Given** a line that no longer contains the matched token, **When** the token is located elsewhere in the same file, **Then** the entry is classified as a stale positional duplicate of the live entry and not as a separate defect.
3. **Given** a file that no longer produces the rule, **When** a current DevSkim scan reports zero results for it, **Then** the entry is classified as stale only when the remediation is also identified.

---

### User Story 2 - Only evidenced entries are removed, without weakening scanner coverage (Priority: P1)

As the repository owner, I need verified false positives and stale entries removed while the report format, scanner rules, suppression behaviour, and workflows remain unchanged.

**Why this priority**: Removing a finding without evidence would falsify the report; changing suppressions or scanner configuration would exceed the authorized cleanup.

**Independent Test**: Confirm the report retains its title, explanatory text, and append marker with zero finding rows, and confirm no rule, severity, scan glob, workflow, or suppression file changed.

**Acceptance Scenarios**:

1. **Given** a live false positive, **When** its source context and trust boundary are documented, **Then** the entry is removed as a reviewed false positive.
2. **Given** a stale positional duplicate or a remediated entry, **When** the current scan no longer reports that location, **Then** the entry is removed with the superseding location or fix recorded.
3. **Given** the cleanup is complete, **When** the diff is reviewed, **Then** only the report, task artifacts, and memory-bank records changed.

---

### User Story 3 - Genuine issues are isolated for owner approval (Priority: P1)

As the repository owner, I need any genuine or unresolved security issue reported with evidence and a recommended fix, but not implemented before review.

**Why this priority**: Security-related source, suppression, and scanner changes require explicit owner approval.

**Independent Test**: Review the triage record and confirm every genuine or unresolved entry has a file, location, impact, minimal fix, risks, and required regression tests, and that none was implemented.

**Acceptance Scenarios**:

1. **Given** a finding that survives the false-positive gates, **When** the task completes, **Then** it is listed with impact and an approval-ready fix rather than being changed in this task.
2. **Given** a finding whose disposition cannot be established, **When** the task completes, **Then** the exact missing evidence is stated and the entry remains in the report.

### Edge Cases

- Two entries can share a DevSkim rule and still have different dispositions; each is classified independently.
- A scanner result can relocate when a file is edited, creating a new identity while the old identity remains in the append-only report.
- A remediated entry can remain recorded because the report is not pruned automatically.
- A live false positive that is removed from the report without an audited suppression will be appended again by the next scheduled scan; this limitation must be disclosed rather than hidden.
- The current report contains ten bullets, although the request counted nine; every bullet is audited and the discrepancy is reported.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every bullet currently present in `devskim-alerts.md` MUST be classified individually with rule, path, current source, and evidence.
- **FR-002**: The reported file path and location MUST be checked against the current tree; a missing token MUST be traced to its historical and current position.
- **FR-003**: A current DevSkim scan using the repository's release line MUST be executed for every affected file and for the pre-fix revision where remediation is claimed.
- **FR-004**: Live findings MUST be evaluated with the repository's designated false-positive workflow, including data flow, reachability, trust boundaries, and real impact.
- **FR-005**: Entries MUST be removed only when false-positive, stale, or remediated status is supported by source, Git history, and scanner evidence.
- **FR-006**: The report MUST retain its title, explanatory text, and append marker, and MUST contain no finding rows after the audited cleanup.
- **FR-007**: No DevSkim rule, severity, scan glob, workflow trigger, or suppression rule may be changed.
- **FR-008**: No application source, payment, email, database, authentication, dependency, or deployment configuration may change.
- **FR-009**: Genuine or unresolved findings MUST be reported with location, impact, recommended minimal fix, risks, and required regression tests, and MUST NOT be implemented.
- **FR-010**: The re-append risk for live false positives without an approved suppression MUST be disclosed.
- **FR-011**: Verification MUST include the Spec Kit gate, the repository gate, the relevant QA checker suites, and a measured production build below 495 MiB.
- **FR-012**: The completion report MUST state actual commands, results, and any check that could not run.

## Key Entities

- **Recorded entry**: One bullet in `devskim-alerts.md` with severity, rule, path:line, message, and stable identity.
- **Live finding**: A rule result the current scanner still reports at a location recorded in the report.
- **Positional duplicate**: A recorded entry whose token moved to another line in the same file; the old identity is stale while the finding remains live at the new line.
- **Remediated entry**: A recorded entry whose matched token was replaced and which the current scan no longer reports.
- **Reviewed false positive**: A live finding whose exact source context is not a shipped-code weakness.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All ten recorded bullets have a documented disposition; zero entries are removed without evidence.
- **SC-002**: The current scan reports exactly the live findings recorded in the triage table, and the pre-fix scan reproduces the remediated error.
- **SC-003**: `devskim-alerts.md` contains only its header and append marker after the cleanup.
- **SC-004**: The complete diff contains no scanner, suppression, workflow, application, dependency, or deployment change.
- **SC-005**: The production build remains strictly below 495 MiB and the measured size is reported.
- **SC-006**: No genuine or unresolved finding is implemented or silently dropped.

## Assumptions

- DevSkim CLI 1.0.103 is the same release line used by `microsoft/DevSkim-Action` in the repository workflow and is an acceptable local reproduction of the scan.
- A stable scanner identity can change when lines move, so the report legitimately accumulates positional duplicates.
- `.github/scripts/**` is CI-only tooling that is not imported by the Next.js application and is not part of the production build or runtime.
- The report is a historical log; removal records an audited disposition rather than closing a GitHub alert directly.
