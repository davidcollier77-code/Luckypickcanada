# Feature Specification: Fix DevSkim Checksum SARIF Span Matching

**Feature Branch**: `fix/devskim-checksum-sarif-span-20261026`
**Created**: 2026-10-26
**Status**: Draft
**Input**: Repair the verified DevSkim checksum false-positive filter regression, add a regression test based on the actual SARIF artifact, and remove only the corresponding stale row from `devskim-alerts.md` after the fix is covered.

## User Scenarios & Testing

### User Story 1 — Filter the exact checksum false positive safely (Priority: P1)

As the repository owner, I want DevSkim's filter to recognize the known constitution-template checksum using validated source offsets, so the scanner does not leave a known false positive in the alert report while genuine findings remain visible.

**Why this priority**: A false positive that survives the filter can be automatically reintroduced into the append-only report, undoing a manual cleanup and obscuring meaningful findings.

**Independent Test**: Run the focused Python unittest suite. A SARIF result with the exact template path, `sha256` field, 64-character digest, matching absolute offset/length, and matching snippet must be removed from the filtered SARIF; the same one-column-early range without validated offsets must not be suppressed.

**Acceptance Scenarios**:
1. **Given** DevSkim reports the exact quoted SHA-256 checksum with valid `charOffset`, `charLength`, and matching `snippet.text`, **When** the suppression helper validates it against the exact source file and `sha256` field, **Then** the known false positive is excluded from uploaded SARIF.
2. **Given** the scanner's columns are one character early but absolute span and snippet match the source, **When** the checksum helper evaluates the finding, **Then** it uses the validated source span rather than incorrectly rejecting the finding because of the columns.
3. **Given** offsets, snippet, field, file, digest, or range validation is missing or mismatched, **When** the helper evaluates the finding, **Then** the finding stays visible unless all existing exact-match conditions pass.
4. **Given** the regression test covers the actual SARIF shape, **When** the report is updated in the same PR, **Then** only report entry `devskim-id:81298a9d79b888769be1` is removed and the report header and append marker are preserved.

## Edge Cases

- Absolute source offsets or character length are missing, malformed, inconsistent with the snippet, or cross source lines.
- The finding points to another file or JSON key, or the value is not a complete 64-character hexadecimal digest.
- The scanner's start/end columns do not exactly enclose the quoted checksum.
- The SARIF contains other findings; they must remain in the output unless their own existing narrow suppression predicates match.

## Requirements

### Functional Requirements

- **FR-001**: The checksum exception MUST verify the exact path `.specify/memory/.constitution-template.json`, the `sha256` key, and a complete 64-character hexadecimal value.
- **FR-002**: When absolute offsets are supplied, the filter MUST use the existing validated source-span helper, including its source-line and snippet checks.
- **FR-003**: The complete finding span MAY include the checksum's quotation marks but MUST remain entirely within that exact quoted value.
- **FR-004**: Missing or invalid span data MUST fail closed; this change MUST NOT broaden the suppression allowlist or bypass existing negative checks.
- **FR-005**: After adding the regression test, remove only the known stale report row with identity `81298a9d79b888769be1`; preserve the report heading and append marker.
- **FR-006**: Preserve the constitution template/checksum, other alert entries, scan rules, workflow triggers, permissions, and application behavior.

## Success Criteria

- **SC-001**: The regression test reproduces the actual DevSkim SARIF region (`startColumn: 12`, `endColumn: 78`, `charOffset: 14`, `charLength: 66`) and verifies the false positive is filtered.
- **SC-002**: A columns-only mismatch fails closed; existing positive and negative suppression tests remain in place.
- **SC-003**: The report contains no row with identity `81298a9d79b888769be1`, with its header and marker preserved.
- **SC-004**: Current-head CI and `./jules-verify.sh` are checked and their actual results recorded before completion.

## Assumptions

- Verified source triage establishes that this value is the template's SHA-256 checksum, not a credential.
- The current scheduled-run artifact is authoritative evidence for the SARIF coordinate/offset shape.
- No workflow schedule or manual-dispatch change is required to fix this filtering defect.
