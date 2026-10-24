# Feature Specification: DevSkim Report Failure Guard

**Feature Branch**: `fix/devskim-report-failure-guard-20261024`

**Created**: 2026-10-24

**Status**: In review

**Input**: User request to reduce recurring DevSkim false-positive noise with a narrow, verified fix.

## User Scenarios & Testing

### User Story 1 — Prevent unfiltered findings from polluting the report (Priority: P1)

As the repository maintainer, I need the append-only DevSkim report to update only after its suppression checks succeed, so a broken filter cannot turn a failed scan pipeline into a batch of false-positive ledger entries.

**Why this priority**: Historical run [40024403456](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40024403456) shows the suppression unit test failed with an `IndentationError`, the suppressor was skipped, and the workflow continued. The notification inbox recorded three findings from that run. Current main is clean: the latest run completed successfully and the updater appended zero findings. This task prevents recurrence when suppression fails.

**Independent Test**: Feed workflow source through regression checks asserting the suppression test and filter steps fail the lint job on error, report updates require lint success, and raw scan output remains available.

**Acceptance Scenarios**:
1. **Given** the suppression tests fail, **when** DevSkim runs, **then** the lint job fails and the dependent append-only report updater does not execute.
2. **Given** the suppression script fails, **when** DevSkim runs, **then** the lint job fails and the report updater does not publish raw findings as new ledger rows.
3. **Given** suppression fails, **when** later steps run, **then** raw scan results and the SARIF artifact are still uploaded for security visibility and diagnosis.
4. **Given** suppression tests and filtering succeed, **when** the workflow finishes, **then** the existing scan upload and report-update behavior remain unchanged.

## Requirements

### Functional Requirements

- **FR-001**: The suppression test step MUST fail the `lint` job when its tests fail; it MUST NOT use `continue-on-error`.
- **FR-002**: The suppressor step MUST fail the `lint` job when filtering fails; it MUST NOT use `continue-on-error`.
- **FR-003**: The append-only report job MUST remain dependent on successful completion of `lint` and MUST NOT bypass dependency failure with `always()`.
- **FR-004**: Raw SARIF upload and artifact preservation MUST continue even when the suppression pipeline fails, so the task does not silently discard scanner output.
- **FR-005**: No DevSkim rule, suppression predicate, application code, dependency, deployment configuration, or scan path may be broadened or disabled as part of this fix.

## Edge Cases

- A Python syntax error in the suppression helper must fail the scan job and skip the report updater.
- A regression-test failure must not cause unsuppressed SARIF findings to be appended to `devskim-alerts.md`.
- The report must still receive current, filtered results during a successful run.
- Uploads guarded by `always()` must remain intact for diagnosis and security visibility.

## Success Criteria

- **SC-001**: Regression tests verify both suppression steps propagate failure.
- **SC-002**: Regression tests verify the report job still depends on successful lint completion.
- **SC-003**: Regression tests verify raw SARIF and artifact uploads remain available on failure.
- **SC-004**: Focused tests and required CI checks pass on the final PR head.
- **SC-005**: The final diff changes only the DevSkim workflow, its regression tests, scoped Spec Kit artifacts, and task status summaries.

## Assumptions

- Historical notification batches include scanner noise, but this task addresses only the verified fail-open path; it does not assume every historical finding is false.
- Current main's `devskim-alerts.md` has zero finding rows; the task is a regression guard, not a fresh broad suppression campaign.
- The workflow should keep raw SARIF visible even if the filtering pipeline fails, while preventing that failed pipeline from updating the append-only ledger.
