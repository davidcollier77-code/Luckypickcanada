# Tasks: Reliable Updater Scheduling

**Input**: `.specify/features/035-updater-scheduler-reliability/spec.md` and `plan.md`

## Phase 1: Investigation and specification

- [x] T001 Read root `AGENTS.md` first, inspect both updater workflow schedules and run history, and identify the five approved Atlantic target slots.
- [x] T002 Create the specification, plan, requirements checklist, research notes, and safe cutover sequence.

## Phase 2: Scheduler implementation

- [x] T003 Implement fixed target mapping, `America/Halifax` timestamp conversion, disabled-by-default dispatch, and redacted error logs in `workers/updater-scheduler/src/index.mjs`.
- [x] T004 Add Node.js tests for target mappings in daylight/standard time, rejection of non-target events, request payload, disabled behavior, configuration errors, and log redaction.
- [x] T005 Add Worker configuration and an isolated test script in `workers/updater-scheduler/wrangler.toml` and `workers/updater-scheduler/package.json`.
- [x] T006 Add PR verification and disabled-on-deploy automation in `.github/workflows/deploy-updater-scheduler.yml`.
- [x] T007 Document cost, quota, token permissions, safe cutover, rollback, and unverifiable live configuration in `workers/updater-scheduler/README.md`.

## Phase 3: Governance and verification

- [x] T008 Add/update task-specific Spec Kit artifacts, active feature pointer, PR Summary, and Memory Bank notes.
- [x] T009 Run the standalone Node.js test suite locally. The locally developed version passed 11 tests; the exact PR-head version must be confirmed by CI.
- [x] T013 Use the documented Cloudflare `controller.noRetry()` on approved slots before dispatch and add tests that it runs before GitHub fetch and is skipped for non-target slots.
- [ ] T010 Run `./jules-verify.sh`, repository tests, required type/build checks, and confirm the 495 MiB size gate on the exact PR head.
- [ ] T011 Inspect the complete GitHub PR diff, verify the Wrangler dry run, and reconcile each changed file with the PR Summary.
- [ ] T012 Confirm Cloudflare quota, deployment and secrets, then perform a separately reviewed safe cutover and verify one naturally scheduled dispatch. Keep the existing GitHub schedules until those conditions are proven.

## Dependencies

- T010 and T011 require passing current-head GitHub CI.
- T012 requires Cloudflare account access and the repository-restricted dispatch token. This PR does not perform a real dispatch or cutover.

## Implementation strategy

Add and validate the isolated Worker first, leaving existing GitHub automation untouched. Activate only through a later explicitly reviewed cutover after deployment, secret, and trigger registration have been verified.
