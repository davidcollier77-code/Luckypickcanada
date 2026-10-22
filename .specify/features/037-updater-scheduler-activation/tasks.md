# Tasks: Enable Cloudflare Updater Scheduler

**Input**: `.specify/features/037-updater-scheduler-activation/spec.md` and `plan.md`

## Phase 1: Setup and specification

- [x] T001 Read repository governance first and inspect current scheduler configuration, deployment preflight, existing updater workflows, prior PR #1559, and the current secret-name evidence in `.specify/features/037-updater-scheduler-activation/spec.md`.
- [x] T002 Define measurable activation, canary, handoff, and rollback requirements in `.specify/features/037-updater-scheduler-activation/spec.md`.
- [x] T003 Create the requirements-quality checklist in `.specify/features/037-updater-scheduler-activation/checklists/requirements.md`.
- [x] T004 Plan the minimal change and post-merge acceptance gates in `.specify/features/037-updater-scheduler-activation/plan.md`.

## Phase 2: User Story 1 — Enable guarded Worker dispatch (Priority: P1)

- [ ] T005 [US1] Change `DISPATCH_ENABLED` to exact string `"true"` in `workers/updater-scheduler/wrangler.toml`.
- [ ] T006 [US1] Update the scheduler config/handoff regression assertion and test description in `workers/updater-scheduler/test/index.node-test.mjs`.
- [ ] T007 [US1] Replace preparation-only instructions with activation and rollback instructions in `workers/updater-scheduler/README.md`.
- [ ] T008 [US1] Record verified findings, changed files, actual verification state, and pending gates in `PR_SUMMARY.md`.
- [ ] T009 [US1] Update the current scheduler state and post-merge acceptance steps in `memory-bank/activeContext.md`.

## Phase 3: Verification and controlled handoff

- [ ] T010 [US1] Confirm all scheduler unit tests pass in current-head CI for `workers/updater-scheduler/test/index.node-test.mjs`.
- [ ] T011 [US1] Confirm `./jules-verify.sh` and the Wrangler dry run pass in current-head CI through `.github/workflows/deploy-updater-scheduler.yml`.
- [ ] T012 [US1] After merge, verify the exact no-op canary run and enabled deployment in `.github/workflows/deploy-updater-scheduler.yml` before changing the repository handoff variable.
- [ ] T013 [US1] After canary/deployment success, set `UPDATER_SCHEDULER_ACTIVE=true` in repository Actions variables before the next approved target and verify the first natural dispatch in Cloudflare logs and GitHub Actions.

## Dependencies and Execution Order

- T005-T009 are sequential changes to the same task branch and documentation evidence.
- T010-T011 depend on the final PR head being tested by GitHub Actions.
- T012 requires the activation change to be merged and the deployment workflow to run; it is not a PR-only check.
- T013 depends on successful T012 and must occur before the next scheduled target.

## MVP

The PR MVP is the enabled checked-in config plus aligned static regression coverage and operational instructions. Production activation is not considered complete until T012 and T013 have observable evidence.
