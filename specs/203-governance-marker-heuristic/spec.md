# Feature Specification: Reject Only Real Template Markers in Governance Declarations

**Feature Branch**: `freebuff/856a686c49f64f37f6ddb027-placeholder-heuristic`

**Created**: 2026-11-21

**Status**: Implemented

**Input**: The consolidated report's governance checker treats any declaration value containing the literal word "placeholder" as unfilled template text. A complete Memory Bank declaration that references the marker-first fallback report is therefore reported missing, and Governance fails. The checker must keep rejecting bare markers and template instructions while accepting a filled sentence that legitimately uses the word.

## User Scenarios & Testing

### User Story 1 — A filled declaration that uses the word is accepted (Priority: P1)

A submitter writes a complete Memory Bank declaration that mentions the marker-first fallback report. The Governance category reads the declaration as filled and does not fail the pull request.

**Why this priority**: The declaration is the only place the submitter can record the context the checker asks for. Rejecting a complete sentence because it contains a legitimate technical term turns a vocabulary collision into a false Governance failure.

**Independent Test**: Call the placeholder helper with a complete declaration sentence containing "placeholder" and assert it is not treated as unfilled; then build a report whose Memory Bank line is that sentence and assert Governance is `PASSED`.

**Acceptance Scenarios**:

1. **Given** a Memory Bank value that is a complete sentence containing "the marker-first placeholder fallback", **When** Governance evaluates it, **Then** the category passes.
2. **Given** the same value with the word in ordinary prose, **When** the helper is called directly, **Then** it returns not-a-placeholder.

### User Story 2 — Real placeholders are still rejected (Priority: P1)

A value that is only a marker, an explicit template instruction or an angle-bracket placeholder still fails Governance.

**Why this priority**: The fix must not weaken the checker into accepting the unfilled template text it exists to catch.

**Independent Test**: Call the helper with bare and formatted markers, the existing instruction phrases and empty values, and assert every one is rejected; repeat at the Governance-category level for the Memory Bank declaration.

**Acceptance Scenarios**:

1. **Given** a Memory Bank value of `placeholder`, `**Placeholder**`, `placeholder text`, `TODO`, `TBD`, `fill this in`, `name each ...`, `describe the ...`, `replace with ...`, `list the completed ...`, `select the applicable ...` or `<memory bank>`, **When** Governance evaluates it, **Then** it fails.
2. **Given** an empty or whitespace-only value, **When** the helper is called, **Then** it is treated as unfilled.

### User Story 3 — Nothing else about the report changes (Priority: P2)

The five governance labels, the category statuses, the seven categories and the other checker rules remain unchanged.

**Independent Test**: The existing report contract suite passes without changes to its other assertions; the only production change is the placeholder helper and its patterns.

## Requirements

### Functional Requirements

- **FR-001**: A declaration value that is a substantive sentence and contains the word "placeholder" MUST NOT be classified as unfilled solely because of that word.
- **FR-002**: A value that consists only of "placeholder", optionally with bold, backticks, punctuation or the common "text", "value", "here" or "goes here" suffix, MUST still be classified as unfilled.
- **FR-003**: The existing instruction markers (`TODO`, `TBD`, `fill this in`, `name each`, `describe the`, `replace with`, `list the completed`, `select the applicable`) and angle-bracket placeholders MUST still be rejected wherever they appear.
- **FR-004**: Empty and whitespace-only values MUST be rejected.
- **FR-005**: The five governance labels, the category's statuses and summaries, the seven categories and every other checker rule MUST remain unchanged.
- **FR-006**: Regression tests MUST cover the accepted prose case and the rejected marker cases both at the helper level and at the Governance-category level.

### Key Entities

- **Declaration value**: the text after one of the five governance labels in the PR description.
- **Bare marker**: a value that is only a placeholder word or short marker phrase, with optional formatting and punctuation.
- **Filled declaration**: a substantive sentence that may legitimately contain a technical word such as "placeholder".

## Success Criteria

- **SC-001**: A complete Memory Bank declaration that mentions the marker-first fallback report passes Governance.
- **SC-002**: Every existing marker and a bare "placeholder" still fails Governance.
- **SC-003**: The existing report suite passes with no change to its other categories or assertions.

## Assumptions

- Only `pr_verification_report._placeholder` changes; the separate QA scope checker's field checks are out of scope.
- A complete sentence is filled even if it contains a word that is also used as a marker; a value that is only the marker is not.
- No application code, dependency, build output or visitor-facing behaviour is affected.
