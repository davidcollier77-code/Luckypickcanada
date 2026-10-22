# Feature Specification: Safe Updater Scheduler Cutover

**Feature Branch**: `fix/updater-scheduler-cutover-20261022`  
**Created**: 2026-10-22  
**Status**: Preparation only — live cutover remains gated by external prerequisites

**Input**: The repository owner authorized preparing the migration from delayed native GitHub schedules to the Cloudflare updater scheduler, without risking missed updates before the Worker is proven ready.

## User Scenarios & Testing

### User Story 1 — Keep updater automation reliable during preparation (Priority: P1)

The maintainer needs the existing automatic schedules to continue until the replacement scheduler is ready and verified.

**Independent Test**: A focused regression test confirms the Worker is disabled in the preparation state, both workflows retain native scheduling and manual dispatch, and both expose a controlled handoff gate.

**Acceptance Scenarios**:
1. Given the preparation PR is applied before external prerequisites are verified, when an existing Tuesday/Friday target arrives, then the native GitHub workflow still runs and the Worker sends no request.
2. Given a future activation is ready, when the owner deliberately enables the Worker, then the current native schedules remain available during the short verification window.
3. Given the owner activates the guarded handoff after a successful Worker deployment and before the next target, then native schedule events are skipped while manual workflow dispatch remains available.

### User Story 2 — Verify dispatch credentials before enabling Worker scheduling (Priority: P1)

The maintainer needs the dispatch credential to be shown capable of launching and completing a workflow before deployment of the enabled Worker.

**Independent Test**: An enabled deployment preflight dispatches a uniquely identifiable no-op canary, identifies its exact run, waits for completion, and rejects missing, failed, or timed-out canary runs.

**Acceptance Scenarios**:
1. Given the Worker configuration is disabled, when deployment runs, then the Worker deploys disabled without launching either production updater.
2. Given an enabled configuration and a missing token, when deployment begins, then the preflight fails before secret sync or Worker deployment.
3. Given an enabled configuration and insufficient token permission, when the canary does not run successfully, then deployment is blocked.
4. Given a successful canary, when deployment proceeds, then the credential is synchronized through standard input before Worker deployment.

## Edge Cases

- The dispatch endpoint accepts the event but the workflow run fails or never appears.
- The repository token is missing, revoked, or lacks workflow-dispatch/read permission.
- The Cloudflare account has insufficient Cron Trigger quota.
- The Worker has been deployed, but the repository's schedule-handoff variable is not set before the next native scheduled event.
- An operator needs a manual updater run during preparation or rollback.

## Requirements

- **FR-001**: The Worker MUST use `America/Halifax` and preserve all five approved Tuesday/Friday local targets.
- **FR-002**: The default checked-in Worker configuration MUST remain disabled until external prerequisites are verified.
- **FR-003**: Both existing updater workflows MUST preserve native schedules and manual `workflow_dispatch` during preparation.
- **FR-004**: Both workflows MUST support a deliberate handoff gate using repository variable `UPDATER_SCHEDULER_ACTIVE`, and manual dispatch MUST remain available when the gate is active.
- **FR-005**: For an enabled Worker deployment, the preflight MUST require `UPDATER_DISPATCH_TOKEN`, dispatch a unique no-op canary, find the exact corresponding run, and wait for a successful completion before deployment.
- **FR-006**: A missing, failed, or timed-out canary MUST block deployment.
- **FR-007**: Token values MUST never be committed, echoed, or placed in command-line arguments.
- **FR-008**: Regression tests MUST assert the correct workflow mapping for every Tuesday and Friday target, including each Friday row's workflow filename.
- **FR-009**: Changes to either updater workflow MUST trigger the scheduler verification job.
- **FR-010**: Current-head CI MUST run Worker tests, `./jules-verify.sh`, and a Wrangler dry run.
- **FR-011**: The owner MUST confirm at least two available Cloudflare Cron Trigger slots and token permissions before the separate activation change.
- **FR-012**: The first natural scheduled dispatch MUST be verified after activation; a deployment or unit-test pass alone does not prove live operation.
- **FR-013**: Rollback MUST restore the native schedule execution gate and disable Worker dispatch before the next intended target if the first natural dispatch fails.

## Success Criteria

- **SC-001**: All five local target slots map to the intended workflow and remain correct across daylight-saving transitions.
- **SC-002**: The preparation state keeps Worker dispatch off and preserves the existing GitHub automatic schedules.
- **SC-003**: The enabled preflight does not pass on a mere HTTP-accepted dispatch; it requires the exact canary run to conclude successfully.
- **SC-004**: A missing or unsuccessful canary prevents deployment of the enabled Worker.
- **SC-005**: Workflow changes always trigger regression verification.
- **SC-006**: Production cutover is treated as complete only after owner-side quota/permission confirmation and a verified natural scheduled dispatch.

## Assumptions

- The repository owner will validate quota and token permissions before enabling Worker dispatch.
- A repository variable is a deliberate operational gate, not proof by itself that deployment succeeded.
- Existing updater jobs, daily guards, PR creation behavior, permissions, concurrency, and notifications remain unchanged.
