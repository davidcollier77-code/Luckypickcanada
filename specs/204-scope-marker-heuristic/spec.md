# Feature Specification: Accept Filled QA Scope Fields That Mention the Marker Word

**Feature Branch**: `freebuff/856a686c49f64f37f6ddb027-scope-marker-heuristic`

**Created**: 2026-11-21

**Status**: Implemented

**Input**: The QA scope checker applies one bare-word pattern to the summary, feature names, per-file purposes, scope-expansion reasons, visual-impact reasons and the "Scope changed" explanation. A complete field that legitimately mentions the marker-first fallback report is therefore rejected as unfilled. Filled prose must be accepted while bare markers and template instructions remain rejected.

## User Scenarios & Testing

### User Story 1 — A filled QA scope field may mention the word (Priority: P1)

A submitter writes a summary, feature name or per-file purpose that is a complete phrase and mentions the marker-first fallback report. The declaration is accepted, and the scope checker continues to compare the declared paths with the diff.

**Why this priority**: The QA scope declaration is mandatory, and a legitimate technical term must not turn a completed declaration into a template error. The same collision affects the scope-expansion and visual-impact reasons and the "Scope changed" explanation, which share the heuristic.

**Independent Test**: Build a declaration whose summary, feature name or file purpose contains "the marker-first placeholder fallback" and assert validation accepts it; repeat for a scope-expansion reason, a visual-impact reason and a "Scope changed" explanation.

**Acceptance Scenarios**:

1. **Given** a summary that is a complete sentence containing "placeholder" in ordinary prose, **When** the declaration is validated, **Then** the summary is accepted.
2. **Given** a feature name or per-file purpose that is a complete phrase containing the same word, **When** the declaration is validated, **Then** the field is accepted.
3. **Given** a scope-expansion reason, visual-impact reason or "Scope changed" explanation that is a complete phrase containing the word, **When** the declaration is validated, **Then** the phrase is accepted and the normal approval requirement still applies.

### User Story 2 — Real markers are still rejected (Priority: P1)

A field that consists only of a marker, an explicit template instruction or an angle-bracket placeholder still fails validation.

**Why this priority**: The fix must not weaken the checker into accepting the unfilled text it exists to catch.

**Independent Test**: Submit marker-only values for the summary, feature names, purposes, reasons and "Scope changed" explanation and assert every one is rejected.

**Acceptance Scenarios**:

1. **Given** a summary of `placeholder`, `**Placeholder**`, `placeholder text`, `placeholder goes here`, `TODO`, `TBD`, `fill this in` or `<describe the change>`, **When** the declaration is validated, **Then** it fails.
2. **Given** a feature name or file purpose that is only a marker or an explicit instruction such as `name each ...`, `describe the ...`, `describe this ...` or `fill this in`, **When** the declaration is validated, **Then** it fails.
3. **Given** a scope-expansion reason, visual-impact reason or "Scope changed" explanation that is only a marker, **When** the declaration is validated, **Then** it fails or the explanation is not accepted.

### User Story 3 — Every other scope rule is unchanged (Priority: P2)

Path matching, exact-path requirements, approvals, digests, visual metadata, governance handling, browser evidence and the returned statuses remain unchanged.

**Independent Test**: The existing scope checker suite passes without changes to its other assertions; the only production change is the shared marker helper and the field patterns.

## Requirements

### Functional Requirements

- **FR-001**: A summary, feature name or per-file purpose that is substantive prose and contains the word "placeholder" MUST NOT be rejected solely because of that word.
- **FR-002**: A field that consists only of "placeholder", optionally with bold, backticks, punctuation or the common `text`, `value`, `here` or `goes here` suffix, MUST still be rejected.
- **FR-003**: The existing per-field instruction markers (`TODO`, `TBD`, `fill this in`, `name each`, `describe the`, `describe this`) and angle-bracket placeholders MUST still be rejected where they are already rejected.
- **FR-004**: The same whole-value distinction MUST apply to scope-expansion reasons, visual-impact reasons and the "Scope changed" explanation, which currently share the bare-word pattern.
- **FR-005**: Exact-path matching, duplicate detection, approvals, approval digests, visual metadata, governance handling, browser evidence and returned statuses MUST remain unchanged.
- **FR-006**: Regression tests MUST cover accepted prose and rejected marker-only values for the named fields, the shared reason fields and the "Scope changed" explanation.

### Key Entities

- **QA scope field**: the summary, a feature name, a per-file purpose, a scope-expansion reason, a visual-impact reason or the "Scope changed" explanation.
- **Bare marker**: a field that is only a placeholder word or short marker phrase, with optional formatting, punctuation and the common suffix.
- **Filled field**: a substantive phrase that may legitimately contain a technical word such as "placeholder".

## Success Criteria

- **SC-001**: A complete summary, feature name or per-file purpose that mentions the marker-first fallback report passes validation.
- **SC-002**: Every existing marker and a bare "placeholder" still fails validation in the fields that already reject it.
- **SC-003**: The existing scope checker suite passes with no change to path matching, approvals, digests, statuses or any other rule.

## Assumptions

- Only `.github/scripts/check_qa_pr_scope.py` and its tests change; the consolidated report checker and its separate heuristic are out of scope.
- A complete phrase is filled even if it contains a word that is also used as a marker; a field that is only the marker is not.
- No application code, dependency, workflow, build output or visitor-facing behaviour is affected.
