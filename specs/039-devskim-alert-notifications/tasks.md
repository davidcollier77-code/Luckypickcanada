# Tasks: Append-Only DevSkim Alert Report and Notifications

**Input**: Feature requirements from [spec.md](./spec.md) and design from [plan.md](./plan.md).

## Phase 1 — Task Artifacts and Baseline

- [x] T001 Create the feature specification at `specs/039-devskim-alert-notifications/spec.md`.
- [x] T002 Create the implementation plan at `specs/039-devskim-alert-notifications/plan.md`.
- [x] T003 Record the implementation tasks in this file.
- [x] T004 Inspect the existing DevSkim workflow and its SARIF output.

## Phase 2 — Shared Findings Report

- [x] T005 Add `devskim-alerts.md` as the committed shared report with an append-only marker.
- [x] T006 Implement stable finding identity using rule ID + file URI + stable SARIF fingerprint; use the source line as fallback.
- [x] T007 Append new findings without removing existing entries.
- [x] T008 Create/update a report PR only when a new finding is added; do not push directly to main or auto-merge.
- [x] T019 Transfer only the SARIF artifact so the scan job cannot overwrite the shared Markdown report.

## Phase 3 — Notification and Security Permissions

- [x] T009 Use existing GitHub issue #1556 as the notification inbox.
- [x] T010 Notify the owner only after a report PR URL is verified.
- [x] T011 Keep repository-content write permission out of the pull-request scan job.
- [x] T012 Restrict the write-capable report job to main pushes and scheduled runs.

## Phase 4 — Verification

- [ ] T013 Verify `./jules-verify.sh` and all required checks on the current PR head; results are pending.
- [ ] T014 Verify the actual Python report implementation in CI for first finding, repeated finding, wording change with the same fingerprint, and genuinely new finding. A local four-case simulation of this implementation passed; the committed Vitest run is pending.
- [ ] T015 Verify bot-PR creation/update and issue #1556 notification on the first eligible main/schedule run.
- [x] T016 Use a branch-protection-compatible report PR because repository branch-rule settings could not be verified through the available integration. End-to-end execution remains pending.
- [ ] T017 Complete a final diff/security/scope review after current-head checks finish.
- [x] T018 Update the PR summary to describe the actual implementation and pending evidence.

## Completion Rules

Do not mark a task complete without actual evidence. An eligible main/schedule workflow run is required to verify report PR creation/update and issue notification. A pull-request scan alone cannot demonstrate those effects.
