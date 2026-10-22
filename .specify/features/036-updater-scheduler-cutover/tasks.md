# Tasks: Safe Updater Scheduler Cutover Preparation

**Input**: `.specify/features/036-updater-scheduler-cutover/spec.md` and `plan.md`

## Phase 1: Scope and specification

- [x] T001 Read `AGENTS.md` first; inspect scheduler config, deployment workflow, existing schedules, prior scheduler PRs, and secret-sync evidence.
- [x] T002 Document the guarded preparation state and activation prerequisites in the task-specific specification and plan.

## Phase 2: Safe preparation changes

- [x] T003 Keep Worker dispatch disabled and native GitHub schedules active during preparation.
- [x] T004 Gate native scheduled job execution with `UPDATER_SCHEDULER_ACTIVE`, preserving manual dispatch.
- [x] T005 Make the enabled-deployment token preflight wait for the unique no-op canary to finish successfully.
- [x] T006 Add the updater workflows and canary to the deployment workflow's pull-request path filter.
- [x] T007 Assert Friday workflow filenames in the scheduler tests.
- [x] T008 Update operational documentation for preparation, activation prerequisites, and rollback.

## Phase 3: Verification and activation gate

- [ ] T009 Verify current-head Node.js tests and regression assertions.
- [ ] T010 Run `./jules-verify.sh` and Wrangler dry run through current-head CI.
- [ ] T011 Review the complete changed-file set and ensure no secret values or unrelated application changes are included.
- [ ] T012 Before a separate activation change, confirm at least two available Cloudflare Cron Trigger slots and the fine-grained token's Actions read/write permission.
- [ ] T013 After the separate activation, verify the first natural Worker dispatch and its corresponding GitHub Actions run.

## Dependencies

- T009–T011 depend on current-head PR CI.
- T012 blocks the separate activation change, not this safe preparation.
- T013 requires activation to be explicitly applied; no production updater is manually dispatched for credential testing.
