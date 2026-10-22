# Tasks: Updater Scheduler Cutover

**Input**: `.specify/features/036-updater-scheduler-cutover/spec.md` and `plan.md`

## Phase 1: Scope and specification

- [x] T001 Read `AGENTS.md` first; inspect scheduler configuration, deployment workflow, target schedules, prior scheduler PRs, and credential-sync evidence.
- [x] T002 Write the cutover specification and implementation plan with explicit account-level activation gates.

## Phase 2: Coordinated cutover implementation

- [x] T003 Enable the Worker in the proposed cutover configuration and remove only the competing GitHub `schedule` blocks, preserving manual `workflow_dispatch`.
- [x] T004 Add static regression coverage for a single automatic dispatcher.
- [x] T005 Add a no-op canary workflow and fail-closed token preflight before Worker deployment; synchronize the secret before deploy.
- [x] T006 Update scheduler operating instructions with token validation, activation prerequisites, and rollback.

## Phase 3: Verification and review

- [ ] T007 Verify current-head Node.js tests, including the cutover regression test.
- [ ] T008 Run `./jules-verify.sh` and Wrangler dry-run through current-head GitHub Actions.
- [ ] T009 Inspect the complete PR diff and confirm no unrelated files, credential values, or application changes are included.
- [ ] T010 Before applying the cutover, confirm the Cloudflare account has two free Cron Trigger slots and that the token is assigned Actions write permission.
- [ ] T011 After activation, verify one natural Cloudflare scheduled dispatch and its corresponding GitHub Actions run.

## Dependencies

- T007–T009 depend on current-head PR CI.
- T010 is a required owner-side gate before applying the cutover.
- T011 can only be completed after the reviewed cutover is applied; no production updater is manually dispatched to test it.
