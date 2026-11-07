# Feature Specification: Efficient and Reliable Pull-Request Review Checker

**Feature Branch**: `perf/devskim-review-checker-20261107`

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Investigate and improve the existing pull-request review checker so it delivers thorough, competent and reliable reviews while keeping sufficient performance and responsiveness. Address the actual causes of slow processing and closed gaps in accuracy, coverage and duplicate handling, and prove with before/after evidence that the improvements do not reduce review depth, coverage or defect detection.

## Context

Every custom LLM reviewer in this repository is retired: the Gemini reviewer (`specs/097-gemini-reviewer-retirement`), the CodeRabbit CLI, and PR-Agent (`specs/050`). Pullfrog is an external console product whose workflow is marked "DO NOT EDIT". The review system this repository owns — the code that inspects every pull-request change, decides whether a finding is a false positive, removes duplicates and reports what it checked — is the DevSkim pipeline in `.github/scripts/`:

- `suppress_devskim_false_positives.py` decides which scanner findings are audited false positives.
- `verify_devskim_sarif_replay.py` replays every audited family and fails if one survives.
- `append_devskim_findings.py` records distinct findings in `devskim-alerts.md` without duplicates.

That pipeline runs on every pull request (`.github/workflows/devskim.yml`), so its per-finding cost and its duplicate handling directly determine how fast and how trustworthy the repository's PR review is.

## User Scenarios & Testing

### User Story 1 — Review a large pull request without slow filtering (Priority: P1)

As the repository owner, I want the false-positive filter to process a large SARIF report in proportion to the number of *distinct source files*, not the number of findings, so that reviewing a big pull request does not become slower and slower as findings accumulate.

**Why this priority**: Measured on the real allowlisted files, 460 findings took 1.72 s and every extra finding added a full-file read, a full JSON parse and two full-file UTF-16↔code-point scans.

**Independent Test**: Run the deterministic benchmark harness against the same fixture with the pre-change and post-change checker and compare elapsed time, source reads, JSON parses, suppression counts and the filtered-SARIF digest.

**Acceptance Scenarios**:

1. **Given** N findings in the same file, **When** the filter runs, **Then** that file is read once and (for JSON) parsed once per run.
2. **Given** any finding set, **When** the filter runs, **Then** every suppression decision is byte-identical to the pre-change decision (same suppressed count and same filtered-SARIF digest).
3. **Given** the same fixture, **When** both versions run, **Then** the post-change run is at least 5× faster at 460 findings.

### User Story 2 — Verify audited false positives faster and just as strictly (Priority: P1)

As the repository owner, I want the replay gate to verify every audited false-positive family with one shared source cache, so that the gate stays strict and gets cheaper.

**Independent Test**: Build a SARIF document containing one real audited finding per reviewed family plus one finding that must survive, run `replay()` with the pre-change and post-change checker, and compare the removed families, survivor count and runtime.

**Acceptance Scenarios**:

1. **Given** the eight audited families, **When** replay runs, **Then** all eight are removed and none is reported absent.
2. **Given** a finding outside every allowlist, **When** replay runs, **Then** it survives and replay succeeds.
3. **Given** the same SARIF, **When** both versions run, **Then** the verdict text is identical and the post-change run is faster.

### User Story 3 — Do not lose distinct findings when the report is appended (Priority: P2)

As the repository owner, I want `devskim-alerts.md` to record every distinct finding once, so that the review report does not silently hide a second finding that shares a line with another.

**Independent Test**: Run the pre-change and post-change appender over a SARIF document holding two distinct findings on one line with no fingerprint, then over an exact duplicate and over an already-recorded report.

**Acceptance Scenarios**:

1. **Given** two distinct findings on one line without fingerprints, **When** the report is appended, **Then** both entries are recorded.
2. **Given** the identical finding twice, **When** the report is appended, **Then** one entry is recorded.
3. **Given** a report already holding an entry written by the earlier appender, **When** the current appender runs, **Then** it appends nothing.
4. **Given** an unchanged SARIF, **When** the appender runs twice, **Then** the second run appends nothing.

### Edge Cases

- A source file containing astral characters (emoji) must still resolve DevSkim's UTF-16 offsets to the same code points as before; a wrong conversion would suppress or keep the wrong span.
- A malformed or non-JSON source file must fall back to the previous behaviour instead of raising.
- A finding with neither `partialFingerprints` nor `fingerprints` must still be identified stably across runs.
- An allowlisted path absent from the SARIF must not cause a read.
- Replay must still fail loudly when an audited false positive survives.

## Requirements

### Functional Requirements

- **FR-001**: The filter MUST read each distinct source file at most once per run.
- **FR-002**: The filter MUST parse each distinct JSON source file at most once per run.
- **FR-003**: The filter MUST derive every reported span from cached, correct UTF-16-to-code-point conversion, with the same result as the previous implementation for both BMP and astral text.
- **FR-004**: The filter MUST produce the same suppression decisions as before the change for the same SARIF input.
- **FR-005**: The replay gate MUST share one source cache across the audited families it verifies.
- **FR-006**: The replay gate MUST keep its current strictness: every audited family removed, no suppressible result left, a second pass appending nothing.
- **FR-007**: The report appender MUST record two distinct unlocated findings that share a line as two entries.
- **FR-008**: The report appender MUST record an identical duplicate once and MUST NOT re-append an entry already present, including entries written by the earlier identity scheme.
- **FR-009**: The changes MUST NOT reduce scan scope, allowlist entries, audited families, suppression predicates or test coverage.

### Success Criteria

- **SC-001**: At 460 findings the filter is at least 5× faster than the pre-change baseline (measured 12.1×).
- **SC-002**: Source reads and JSON parses per run are constant (3 reads, 2 parses) instead of growing with findings (420 reads, 401 parses at 460 findings).
- **SC-003**: Suppressed counts and the filtered-SARIF SHA-256 are identical before and after at every fixture size.
- **SC-004**: Replay removes all eight audited families, leaves the non-allowlisted finding, and is faster than before.
- **SC-005**: The duplicate/identity gap is demonstrated on the pre-change code and closed on the post-change code.
- **SC-006**: The full unit suite, `./freebuff-verify.sh`, TypeScript and the production build pass, and the build stays below 495 MB.

## Scope

**In scope**: the three `.github/scripts/` checker modules, their unit tests, reproducible evidence under `artifacts/devskim-review-pipeline/`, Spec Kit artifacts and Memory Bank records.

**Out of scope**: the DevSkim scan scope or workflow triggers, Pullfrog, retired reviewers, `.docs/`, application code, dependencies, workflows, payment, database, authentication, secrets and deployment.
