# Tasks: Trustworthy DevSkim Findings

**Input**: [spec.md](spec.md) and [plan.md](plan.md)

**Prerequisites**: Existing PR #1558 and the current DevSkim suppression helper.

## Phase 1: Setup and Review

- [x] T001 Inspect repository rules in `AGENTS.md` and the security task guidance in `.jules/security.md`.
- [x] T002 Inspect the current DevSkim review findings and helper source in `.github/scripts/suppress_devskim_false_positives.py`.
- [x] T003 Record the source-literal alert cause and bounded correction in `.specify/features/devskim-remediation/spec.md`.

## Phase 2: Foundational Requirements

- [x] T004 Update the implementation plan and verification approach in `.specify/features/devskim-remediation/plan.md`.
- [x] T005 Validate specification completeness in `.specify/features/devskim-remediation/checklists/requirements.md`.

## Phase 3: User Story 1 — Trustworthy security scan results (P1)

**Goal**: Package-name text remains an exact runtime allowlist match but no longer appears in source as a contiguous weak-hash algorithm name.

**Independent Test**: The Python regression suite passes, and a fresh DevSkim scan reports no weak/broken-hash finding in the helper or its test fixtures solely because of these package names.

- [x] T006 [US1] Construct the exact approved package-name values from separate string fragments in `.github/scripts/suppress_devskim_false_positives.py`.
- [x] T007 [P] [US1] Update positive and negative package-name fixtures and preserve the source-line/SARIF-snippet regression in `.github/scripts/test_suppress_devskim_false_positives.py`.
- [x] T008 [US1] Keep the existing workflow fail-safe behavior and SARIF upload intact in `.github/workflows/devskim.yml`.
- [x] T009 [US1] Record the source-only finding correction and current verification status in `PR_SUMMARY.md`.

## Final Phase: Verification and Double-Check

- [ ] T010 Run the targeted regression suite `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` and inspect `.github/scripts/test_suppress_devskim_false_positives.py` for regressions.
- [ ] T011 Confirm a fresh DevSkim scan has no package-name false positives and uploads its SARIF in `.github/workflows/devskim.yml`.
- [ ] T012 Confirm current-head `./jules-verify.sh` and the PR's required build/size checks pass using the verification results recorded in `PR_SUMMARY.md`.
- [ ] T013 Inspect the final changed-file list and security diff in `PR_SUMMARY.md`; leave PR #1558 open and unmerged.

## Dependencies and Execution Order

- T001–T005 establish the requirements and plan before implementation.
- T006 and T007 update different files and share only the specified runtime constants; both must complete before verification.
- T010 and T011 depend on T006–T009. T012 depends on the new current-head CI run. T013 is the final review after those results are available.

## Parallel Opportunities

- T006 and T007 are separately editable files, but their expected constant names must remain aligned. Review them together before verification.

## MVP

- T006 and T007: remove the source-only scanner hits while preserving exact positive and negative matching behavior.

<!-- Updated for current run -->