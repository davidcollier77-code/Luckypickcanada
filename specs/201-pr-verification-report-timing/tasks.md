---
description: "Tasks for the PR verification report timing correction"
---

# Tasks: PR Verification Report Timing

**Input**: Design documents from `/specs/201-pr-verification-report-timing/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Required by FR-007 and FR-008. Regression tests cover the early-trigger snapshot, delayed check creation, a pending required check, a pending conditional shard, a head change during the wait, the timeout path and the workflow timing contract.

## Phase 1: Report timing (US1, US2)

- [X] T001 [US1] Insert a bounded wait (`--wait-seconds 600 --poll-interval 15`) on the current head between the pull-request resolution and the evidence fetch in `.github/workflows/pr-verification-report.yml`.
- [X] T002 [US1] Keep the wait non-authoritative: capture `wait_status`, continue on error, and leave the audit, renderer, sticky publication and status gate unchanged.
- [X] T003 [US1] Document the trigger-timing rationale in the workflow header and step comment.
- [X] T004 [US2] Rely on the audit's existing `wait_for_current_head` instead of adding a second polling loop; it re-reads the head each poll, tolerates delayed check creation and bounds each sleep.

## Phase 2: Regression coverage (US1, US2, US3)

- [X] T005 [US1] Add settling-wait tests for a pending required check, an empty early snapshot, delayed creation of the remaining required checks, and a pending Visual QA shard.
- [X] T006 [US2] Add a head-change-during-wait test that asserts the final audit names the new SHA.
- [X] T007 [US1] Add a deadline test that asserts the wait returns within the bound and the audit reports `PENDING`/`NOT VERIFIED`, plus a cancelled-check test that settles the wait without becoming a pass.
- [X] T008 [US1] Add a documentation-only test proving the wait returns immediately once the required checks are settled and no Visual QA run applies.
- [X] T009 [US3] Add report-workflow contract assertions for the wait flags, its position before the evidence fetch and its bound relative to the job timeout.
- [X] T010 [US3] Add the equivalent Vitest workflow-hygiene assertion in `__tests__/checker-suite-workflows.test.js`.

## Phase 3: Submission reading points (US4)

- [X] T011 [US4] Require the two `PR_SUBMISSION.md` reading points in the guide itself and at the start of Section 4.
- [X] T012 [US4] Carry the same two reading points in `.github/pull_request_template.md` without changing sections, markers or exact declarations.
- [X] T013 [US4] Run the consolidated report contract suite from `freebuff-verify.sh` and replace its manual-browser reminder with the submission-checklist and automated-Playwright facts.

## Phase 4: Verification

- [X] T014 Run both Python checker suites and the focused Vitest workflow-contract suite.
- [X] T015 Run `./freebuff-verify.sh` (install, Spec Kit gate, checker suites, type check, production build, refresh-docs) and measure the production build size against the 495 MiB cap.
- [ ] T016 The GitHub-triggered report remains **PENDING — runs after PR creation**; it is not claimed as executed.

## Completion Summary

- **Total tasks**: 16
- **User Story 1**: 8 tasks
- **User Story 2**: 2 tasks
- **User Story 3**: 2 tasks
- **User Story 4**: 3 tasks
- **Independent test**: the auditor suite drives the wait with an injected loader, clock and sleep; the report and Vitest suites assert the workflow waits before reading evidence and stays bounded by the job timeout.
