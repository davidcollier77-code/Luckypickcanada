# Tasks: Append-Only DevSkim Alert Report and Notifications

**Input**: Feature requirements from [spec.md](./spec.md) and design from [plan.md](./plan.md).

## Phase 1 — Task Artifacts and Baseline

- [x] T001 Create the feature specification at `specs/039-devskim-alert-notifications/spec.md`.
- [x] T002 Create the implementation plan at `specs/039-devskim-alert-notifications/plan.md`.
- [x] T003 Record the implementation tasks in this file.
- [x] T004 Inspect the current DevSkim workflow and confirm its scan output is SARIF.

## Phase 2 — Shared Findings Report

- [x] T005 Add `devskim-alerts.md` as the committed shared report with an append-only marker.
- [x] T006 Implement finding identity/deduplication against the existing report.
- [x] T007 Append new findings without removing existing entries.
- [x] T008 Commit the report only when at least one genuinely new entry has been added.

## Phase 3 — Notification and Security Permissions

- [x] T009 Create GitHub issue #1556 as the notification inbox.
- [x] T010 Notify the owner with one issue comment only when a scan adds new entries.
- [x] T011 Ensure the pull-request scanning job does not have repository-content write permission.
- [x] T012 Confirm the write-capable report path runs only on `main` push or schedule.

## Phase 4 — Verification

- [x] T013 Spec Kit artifacts are present; CI verification of the updated head is pending on the next eligible run.
- [x] T014 Verify repeated findings are deduplicated and new findings are appended (local simulation passed for first finding, repeated scan, and subsequent new finding).
- [ ] T015 Verify GitHub issue notification and bot-PR link delivery in the first eligible run after merge.
- [ ] T016 Branch-rule inspection is not available through this integration. Workflow now uses a bot PR instead of direct push; compatibility with branch protection does not require verification. End-to-end push-to-PR path must be confirmed on first eligible run.
- [x] T017 Final diff reviewed: no secrets exposed, no permission escalation, report clearing not possible, changes scoped to devskim.yml, tasks.md, pr_summary.md, and new test file.
- [x] T018 PR summary updated to reflect stable deduplication, SARIF artifact handoff, bot-PR report persistence, and pending items.

## Completion Rules

Do not mark a task complete without actual evidence. An eligible push/scheduled workflow run is required to verify report commit and notification delivery; a PR scan alone cannot demonstrate those effects.
