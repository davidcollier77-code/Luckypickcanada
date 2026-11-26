# Tasks: DevSkim Backlog Investigation and Remediation

**Input**: Design documents from `specs/219-devskim-backlog-remediation/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`

## Phase 1: Investigation

- [x] T001 Establish the true open-alert count and pagination boundary: page 422 returns alert #713, page 423 is empty; total 422.
- [x] T002 Confirm rule and severity distribution: 421 DS162092 and 1 DS172411, all severity `note`; no high or critical.
- [x] T003 Confirm creation timestamps: every alert was created at `2026-11-24T23:48:05Z`; the oldest open alert is therefore that batch.
- [x] T004 Confirm the source of the 421 loopback findings: 13 Spec 217 evidence JSON files added by PR #2033 (`ae844b49`), with 11 files containing loopback URLs.
- [x] T005 Exclude Dependabot as the cause: the November 24 npm updates touched no DevSkim file; the November 25 Actions update changed only the `upload-sarif` pin from v4.39.3 to v4.39.4.
- [x] T006 Exclude scanner/configuration drift: the DevSkim action has been pinned at v1.0.16 since 2026-10-24; the workflow logic last changed 2026-11-14; no scan-glob or DevSkim configuration file exists.
- [x] T007 Explain the "approximately 100" report: the report fetched one page with `per_page=100` and never followed pagination, so any backlog of 100 or more rendered as exactly 100.
- [x] T008 Review the DS172411 watchdog: callable inline arrow, fixed constant delay, cleared on readiness/disposal; a genuine false positive of the broad timer rule.
- [x] T009 Reproduce the baseline against real SARIF: 3,545 raw results, 3,123 already suppressed, 422 remaining (421 DS162092 + 1 DS172411).

## Phase 2: Implementation

- [x] T010 Add the exact Spec Kit evidence JSON path predicate to the suppression filter.
- [x] T011 Reuse the existing JSON-document, JSON-value-span and loopback-URL validation for evidence findings.
- [x] T012 Add a dedicated meter timer allowlist with an exact watchdog statement pattern; do not widen other DS172411 or DS162092 handling.
- [x] T013 Paginate the report's code-scanning alert fetch with `gh api --paginate --slurp` and `jq 'add // []'`.
- [x] T014 Add positive tests for evidence loopback suppression and the meter watchdog.
- [x] T015 Add negative tests for production paths, non-JSON evidence, malformed JSON, non-loopback values, a sibling non-evidence directory, and a different timer in the allowlisted file.
- [x] T016 Add report and workflow contract assertions for the paginated alert fetch.

## Phase 3: Verification

- [x] T017 Run the suppression unit suite (115 tests) and the report contract suite (102 tests).
- [x] T018 Run the workflow contract Vitest file (14 tests).
- [x] T019 Run the production filter against the real default-branch SARIF with matching source: 3,545 suppressed, 0 remaining.
- [x] T020 Run the real-SARIF replay gate: exit 0, no audited false positive survived, second pass found no suppressions.
- [x] T021 Record the investigation, remediation and evidence in the Spec 219 artifacts and Memory Bank.
- [ ] T022 Post-merge confirmation: the first default-branch scan with the filtered SARIF closes the 422 existing alerts in the Security tab. This cannot be verified before merge.

## Phase 4: Polish

- [x] T023 Confirm no dependency, scanner rule, scan glob, trigger, protected file or application source changed.
- [x] T024 Record the build applicability decision and any measured build result.
- [x] T025 Prepare the PR body with the exact QA scope declaration, file purposes, local results and limitations.
- [x] T026 Fresh-eyes simplification review: reuse the shared local-origin path predicate and replace the magic-offset workflow assertion with an anchored regex; re-ran the suites and proved the assertion fails when pagination is removed.
