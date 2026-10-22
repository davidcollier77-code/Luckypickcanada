# Tasks: Updater Secret Deployment Order

**Spec**: .specify/features/038-updater-scheduler-secret-bundling/spec.md  
**Plan**: .specify/features/038-updater-scheduler-secret-bundling/plan.md

## Phase 1 — Diagnose and specify

- [x] T001 Read AGENTS.md, current deployment workflow, scheduler configuration/tests/README, and latest failed deployment logs.
- [x] T002 Verify the canary passed and identify Cloudflare's exact secret-update deployment-order error.
- [x] T003 Confirm Wrangler documents deploying secrets alongside Worker code.

## Phase 2 — Implement

- [x] T004 Replace the separate secret mutation with same-operation secret bundling for enabled deployment; keep disabled deployment token-free.
- [x] T005 Add a regression test for canary-before-deploy ordering and reject the old secret-only command.
- [x] T006 Update scheduler operations documentation.
- [x] T007 Update canonical PR summary and project active context.

## Phase 3 — Verify

- [ ] T008 Run node --test workers/updater-scheduler/test/index.node-test.mjs on current head via CI.
- [ ] T009 Run ./jules-verify.sh and Wrangler dry-run via current-head PR CI.
- [ ] T010 Review the complete final diff and confirm no secret values, unrelated files, or changes to UPDATER_SCHEDULER_ACTIVE were introduced.
- [ ] T011 After the fix reaches main, verify canary success, Worker deployment success, and then a natural scheduled dispatch plus its corresponding GitHub Actions run.

## Notes

- This task does not merge the pull request.
- Do not change the already-true UPDATER_SCHEDULER_ACTIVE variable as part of the fix.
- CI and live deployment evidence are mandatory before claiming operational success.
