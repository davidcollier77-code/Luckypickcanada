# Feature Specification: Visual QA Install Timing Reporter Corrections

**Feature Branch**: `freebuff/visual-qa-timings-fixes`

**Created**: 2026-11-15

**Status**: Implemented

**Input**: Correct the confirmed reporting and cache-classification defects in the Visual QA install timing reporter introduced by PR #1917, in one follow-up pull request against `main`.

## User Scenarios & Testing

### User Story 1 — Cache states are trustworthy (Priority: P1)

An owner reading the report must be able to trust each cache state. A Chromium "hit" must mean the Chromium cache really was restored, and the cache key shown must be the one that was actually restored, even when a log repeats restore lines.

**Why this priority**: The report exists to prove whether the skipped browser download was avoided. A fabricated hit would hide a real cold-cache run.

**Independent Test**: Feed a job whose restore step failed, was cancelled, was skipped or never finished, and confirm the Chromium state is `unknown`; feed a job with no miss-only step and confirm it is `unknown` so the log supplies the state; feed two restore lines for the same cache family and confirm the first key is kept.

**Acceptance Scenarios**:

1. **Given** a restore step that did not complete successfully, **When** the miss-only step is skipped, **Then** the Chromium state is `unknown`, not `hit`.
2. **Given** a restore step that completed successfully, **When** the miss-only step was skipped, **Then** the Chromium state is `hit`.
3. **Given** a restore step that completed successfully, **When** the miss-only step executed successfully, **Then** the Chromium state is `miss`.
4. **Given** two cache restore lines for one family, **When** the second line carries a different key, **Then** the first recorded key is reported.

### User Story 2 — Every Visual QA job is reported (Priority: P1)

A run with more jobs than one API page must still report every Visual QA job, including on responses that omit `total_count` or report zero.

**Why this priority**: A truncated job list silently omits a browser shard, so the comparison would look complete when it is not.

**Independent Test**: Serve one or more full pages of 100 jobs with a missing total, a zero total and a positive total, and confirm the requested pages and collected job count.

**Acceptance Scenarios**:

1. **Given** a response without `total_count` and a full page of 100 jobs, **When** the next page is requested, **Then** pagination continues.
2. **Given** a `total_count` of zero and two full pages, **When** the third page is short, **Then** pagination stops after that page.
3. **Given** a positive `total_count` that has been reached, **When** the last page is full, **Then** pagination stops.

### User Story 3 — Corrupt evidence fails visibly (Priority: P2)

An unavailable log may leave cache details `unknown`, but a corrupt log archive must fail the report with a clear error instead of being reported as a healthy run.

**Why this priority**: Silent corruption turns broken evidence into a confident-looking report, which is the same risk the report was built to remove.

**Independent Test**: Serve an unavailable log and confirm the state is `unknown` with a successful load; serve a corrupt zip and confirm a clear error and a non-zero exit.

**Acceptance Scenarios**:

1. **Given** a log request that fails, **When** the report loads, **Then** the row still renders with an `unknown` cache state.
2. **Given** a corrupt zip payload, **When** the report loads, **Then** a clear error is raised and the command exits non-zero.

### User Story 4 — Runtime failures explain themselves (Priority: P2)

When the API returns unparseable JSON, the error must name the path and keep the decoding detail so the failure can be diagnosed without guessing.

**Independent Test**: Serve invalid JSON and confirm the error message contains the API path and the decoder's message and position.

### Edge Cases

- The restore step is present but its conclusion is missing.
- The miss-only step is absent altogether; the log fallback must still classify the cache.
- A job list page is short but the reported total is larger; the short page ends pagination.
- A `total_count` value is not an integer.
- A log payload is plain text rather than a zip, including text that begins with `PK` but is not a valid archive.

## Requirements

### Functional Requirements

- **FR-001**: Chromium classification MUST validate that the restore step completed with a successful conclusion before interpreting a skipped miss-only step as a hit.
- **FR-002**: Any restore step that is missing a successful completion MUST yield `unknown`, and a successfully executed miss-only step MUST remain a `miss`.
- **FR-003**: A missing miss-only step MUST yield `unknown` so the log-based classification can supply the state.
- **FR-004**: Job pagination MUST continue while a page contains 100 jobs unless a positive `total_count` has been reached, and MUST stop on a shorter page.
- **FR-005**: A missing, zero or unusable `total_count` MUST NOT stop pagination after a full page.
- **FR-006**: An unavailable log MUST leave cache details `unknown` without failing the report.
- **FR-007**: A corrupt zip log MUST raise a clear report error, fail the command visibly and preserve the existing corruption validation.
- **FR-008**: Cache parsing MUST keep the first recorded state for each cache family; a later duplicate restore line MUST NOT overwrite it.
- **FR-009**: Invalid JSON from the API MUST raise a report error that keeps the decoder's diagnostic detail.
- **FR-010**: The test fixture's commit identifier MUST be a harmless dummy value that cannot be mistaken for a real credential-like identifier, while output formatting coverage is preserved.
- **FR-011**: Every corrected behaviour MUST have focused offline regression tests; unit tests MUST NOT use the network.
- **FR-012**: The existing report output, PR #1914 baseline comparison, read-only API behaviour, token handling, fixture mode, cache keys, install and Chromium provisioning steps, visual-change classification and application behaviour MUST remain unchanged.

### Key Entities

- **Reporter**: `.github/scripts/report_visual_qa_install_timings.py` — reads run, jobs and logs; prints a table or JSON.
- **Cache record**: family (`pnpm` or `chromium`), state (`hit`/`miss`/`unknown`/`n/a`) and key.
- **Fixture**: offline `run.json`, `jobs.json` and `logs/<job-id>.txt` used by the tests and fixture mode.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Failed, cancelled, skipped and incomplete restore steps all report `unknown` in the focused suite.
- **SC-002**: Full pages with a missing or zero total request the next page, and multiple full pages are collected in the focused suite.
- **SC-003**: A corrupt zip log produces a non-zero exit and a clear error; an unavailable log still renders the row.
- **SC-004**: A duplicate restore line cannot change the first recorded cache key.
- **SC-005**: The reporter and its tests compile and the whole focused suite passes offline.
- **SC-006**: The production build remains strictly below the 495 MiB cap and no unrelated file changes.

## Assumptions

- GitHub returns at most 100 jobs per page for the jobs endpoint and omits `total_count` on some responses.
- `actions/cache` restore steps report `completed` with a `success` conclusion when a cache entry was restored, including an exact-hit restore.
- The DevSkim finding on the hexadecimal fixture value comes from its secret-like shape; a non-hex dummy keeps the intended formatting coverage.
