# Tasks: DevSkim Report Failure Guard

**Input**: Design documents from `specs/046-devskim-report-failure-guard/`

**Prerequisites**: `spec.md` and `plan.md`

## Phase 1: Setup

- [X] T001 Confirm the current ledger is empty and inspect historical DevSkim run 40024403456, the failed suppression step, and its three-row notification batch.

## Phase 2: Regression Coverage

- [X] T002 Add workflow regression tests in `.github/scripts/test_suppress_devskim_false_positives.py` for failure propagation, report-job dependency behavior, and raw SARIF/artifact retention.

## Phase 3: User Story 1 — Prevent unfiltered results from polluting the report (Priority: P1)

**Goal**: A failed suppression pipeline must not publish unsuppressed findings to the append-only report.

**Independent Test**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`

- [X] T003 Remove `continue-on-error` from the suppression test and suppressor steps in `.github/workflows/devskim.yml`.
- [X] T004 Preserve `always()` raw SARIF and artifact uploads while retaining the report updater's `needs: lint` success dependency.

## Phase 4: Verification and Double-Check

- [ ] T005 Run the focused Python test suite and repository verification in CI on the final PR head; record the current-head results in `pr_summary.md`.
- [ ] T006 Review the complete final diff and confirm the false-positive allowlist, report contents, production code, and deployment configuration are unchanged.

## Dependencies & Execution Order

- T001 establishes the verified failure mode before code changes.
- T002 tests the intended workflow contract.
- T003 and T004 implement the narrowly scoped guard.
- T005 and T006 are required before merge; this PR is left open for owner review.

## Implementation Strategy

- One sequential Security task, one branch, one PR.
- Keep raw scan evidence available, but make report appends contingent on a successful suppression pipeline.
- Do not merge or deploy.
