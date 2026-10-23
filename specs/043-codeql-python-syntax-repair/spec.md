# Feature Specification: Restore CodeQL Python Analysis

**Feature Branch**: `fix/codeql-python-syntax-repair-20261023`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: Repair the CodeQL `language:python` syntax-error warning shown in the repository's CodeQL configuration.

## User Scenarios & Testing

### User Story 1 - Keep Python security analysis available (Priority: P1)

As the repository maintainer, I need the DevSkim suppression helper to remain valid Python so CodeQL can analyze it and security-filter regressions are caught before they are silently skipped.

**Why this priority**: A syntax error prevents CodeQL from analyzing a Python file and can also cause the DevSkim suppression tests to fail. Preserving analysis is more important than hiding the warning.

**Independent Test**: Compile the helper with Python and run its existing unit tests.

**Acceptance Scenarios**:

1. **Given** CodeQL analyzes the repository's Python files, **When** it reaches `.github/scripts/suppress_devskim_false_positives.py`, **Then** it can parse the file without a syntax-error warning.
2. **Given** the checksum-metadata suppression branch is executed, **When** a finding qualifies under the existing allowlist and structure checks, **Then** it receives the existing explicit justification.
3. **Given** the suppression helper is malformed in a future change, **When** the DevSkim workflow starts its Python validation, **Then** the workflow fails on the syntax check rather than silently continuing past a tolerated test failure.

## Edge Cases

- Existing approved false-positive justifications must remain unchanged.
- Non-allowlisted paths and unrecognized or ambiguous findings must continue to be reported.
- The syntax check must not install dependencies or change runtime application behavior.

## Requirements

- **FR-001**: The suppression helper MUST be syntactically valid Python 3.
- **FR-002**: The checksum-metadata branch MUST assign the existing justification only after its current predicate succeeds.
- **FR-003**: Source-line extraction MUST reuse the already-read source text rather than re-reading the same file.
- **FR-004**: The DevSkim workflow MUST run a non-optional Python syntax check for the suppression helper before its suppression-test step.
- **FR-005**: The patch MUST NOT broaden allowlists, remove security findings by new rules, change runtime application behavior, or add dependencies.

## Success Criteria

- **SC-001**: `python3 -m py_compile .github/scripts/suppress_devskim_false_positives.py` succeeds on the task head.
- **SC-002**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` passes.
- **SC-003**: A completed CodeQL analysis no longer reports that this Python source file could not be processed because of a syntax error.
- **SC-004**: Existing suppression rule predicates and justification strings remain unchanged.
