# Feature Specification: DevSkim Alerts Report Resolution

**Feature Branch**: `freebuff/c9e5ec63a91aa6449065899b`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User request: Audit and resolve every finding recorded in `devskim-alerts.md`, fix genuine issues, remove confirmed false positives/outdated/duplicate/non-issue entries, re-run the scan, and leave the report empty only because every entry is resolved or confirmed not actionable.

## User Scenarios & Testing

### User Story 1 — Every recorded finding is audited against its current source (Priority: P1)

As the repository owner, I need each entry in the shared DevSkim report checked against the file and line that exist today, so I can tell a real weakness from a heuristic match or a stale entry.

**Why this priority**: The report is append-only, so entries outlive the code and files they came from. Removing one without evidence would weaken the report.

**Independent Test**: For each recorded entry, inspect the current source (or its absence) and record the classification and evidence.

**Acceptance Scenarios**:

1. **Given** a report entry whose file no longer exists, **When** the path is checked, **Then** the entry is classified as stale and removed only after that is proven.
2. **Given** an entry whose line numbers no longer match the recorded rule, **When** the current file is inspected, **Then** the entry is classified as outdated rather than assumed fixed.
3. **Given** an entry that still occurs in a current scan, **When** the source is inspected, **Then** it is classified as a genuine issue, a reviewed false positive, or unknown with evidence.

### User Story 2 — Genuine issues are fixed and reviewed false positives cannot reappear (Priority: P1)

As the repository owner, I need the remaining real or noisy findings handled so that future scans do not re-add them immediately.

**Why this priority**: Clearing the report without addressing the scanner's current output would be immediately undone by the next scheduled scan.

**Independent Test**: Run the scanner locally, run the repository's production suppression filter on its output, and confirm that no finding still recorded in the report survives.

**Acceptance Scenarios**:

1. **Given** a loopback origin that exists only in local Playwright server configuration, **When** the filter runs, **Then** only that exact reviewed line is filtered.
2. **Given** committed browser-probe measurement reports under `artifacts/`, **When** a loopback URL inside valid JSON data is reported, **Then** it is filtered, while a loopback value in a non-URL string, malformed JSON, or another directory stays visible.
3. **Given** a callable timer callback with a fixed delay in the share-image download, **When** the filter runs, **Then** only that exact statement is filtered and other callbacks remain visible.

### User Story 3 — The report is accurate after the audit (Priority: P1)

As the repository owner, I need the report to contain no entry that is unresolved, and to stay append-only in behaviour.

**Why this priority**: An empty file must mean "nothing actionable", not "nothing was checked".

**Independent Test**: Confirm the report contains no finding entries, the append script appends zero results from the filtered scan, and every removed class is covered by a regression test.

**Acceptance Scenarios**:

1. **Given** the audit is complete, **When** the report is read, **Then** it contains only its header and append marker.
2. **Given** a future scan reports a new genuine finding, **When** the append step runs, **Then** the finding is still appended; no scanner rule, glob, or workflow trigger is weakened.

### Edge Cases

- Public commit checksums in `.docs/manifest.json` look like secrets to the scanner but are read-only documentation metadata.
- A quoted test assertion that contains timer source text is not an executed timer.
- A `.json` file under `artifacts/` is data, but a renamed script in the same directory must not inherit the exception.
- An entry can be a duplicate of another entry for the same rule and file with a shifted line number.
- Missing or invalid scanner coordinates must fail closed and leave the finding visible.

## Requirements

### Functional Requirements

- **FR-001**: Every entry currently present in `devskim-alerts.md` MUST be classified with its rule, path, and current-source evidence.
- **FR-002**: Entries MUST be removed only when the finding is fixed, stale, duplicated, or confirmed non-actionable; unresolved findings MUST remain.
- **FR-003**: A current scan MUST be executed and its output passed through the repository's production filter to prove which entries still occur.
- **FR-004**: New filtering MUST stay path-, rule-, and source-span-specific; no broad directory exemption, rule disablement, or scan-glob change is permitted.
- **FR-005**: `.docs/` MUST remain read-only and unchanged.
- **FR-006**: Application runtime behavior, payments, email, database, authentication, dependencies, and deployment configuration MUST remain unchanged.
- **FR-007**: Each new filtered class MUST have positive and negative regression tests, and the real-SARIF replay gate MUST cover it.
- **FR-008**: The report MUST remain append-only for genuine future findings.
- **FR-009**: The final report MUST state the measured production build size and every check that was not run.

## Key Entities

- **Recorded finding**: One bullet in `devskim-alerts.md` with severity, rule, path:line, message, and a stable ID.
- **Current scan result**: A DevSkim SARIF result with rule, path, span, and snippet from today's source.
- **Reviewed false positive**: A finding whose exact path, rule, and source span were inspected and found not to be a shipped-code weakness.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every recorded entry has a documented classification, and zero genuine unresolved entries were removed.
- **SC-002**: After filtering today's scan with the production filter, zero results point at a location still recorded in the report.
- **SC-003**: The suppression unit suite and the real-SARIF replay gate pass, including the new negative controls.
- **SC-004**: The report contains no finding entries.
- **SC-005**: The production build stays below the 495 MB hard maximum, with the measured size reported.
- **SC-006**: No application source behavior, dependency, secret, or deployment setting changes.

## Assumptions

- The scanner's own current output is the source of truth for whether an entry still occurs; the append-only report is a historical log.
- The report-update workflow appends findings from the filtered SARIF artifact, so verified suppressions stop re-appending.
- Local scanning uses the same DevSkim CLI release as CI, with dependency directories excluded because CI checks out without them.
