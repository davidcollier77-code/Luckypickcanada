# Feature Specification: Enable Cloudflare Updater Scheduler

**Feature Branch**: `fix/updater-scheduler-activation-20261022`  
**Created**: 2026-10-22  
**Status**: Activation PR pending review; live credential preflight and controlled handoff remain to be verified  
**Input**: The repository owner explicitly requested enabling `DISPATCH_ENABLED` after confirming the existing `UPDATER_DISPATCH_TOKEN` repository secret is present.

## User Scenarios & Testing

### User Story 1 — Route scheduled updater launches through Cloudflare (Priority: P1)

As the repository maintainer, I want the Cloudflare scheduler enabled for the existing Spec Kit and documentation update workflows so the approved Atlantic-time schedule can be dispatched by the Worker.

**Independent Test**: The scheduler unit test confirms the checked-in configuration is enabled, both existing updater workflows retain their schedule/manual entry points, and the deliberate handoff variable remains the gate for native scheduled events.

**Acceptance Scenarios**:
1. Given the activation change has not been deployed, when its pull-request checks run, then verification tests and the Wrangler dry run must complete before the change is considered ready.
2. Given the activation change reaches `main`, when deployment starts, then the existing deployment workflow must dispatch a uniquely identified no-op canary and wait for that exact run to finish successfully before deploying the enabled Worker.
3. Given the canary is missing, fails, or times out, when deployment runs, then deployment must stop before the enabled Worker is deployed.
4. Given the enabled Worker has deployed and its canary has succeeded, when the maintainer sets `UPDATER_SCHEDULER_ACTIVE=true` before the next scheduled target, then native schedule events are suppressed while manual `workflow_dispatch` runs remain available.

### Edge Cases

- The repository secret exists but lacks the permissions required to dispatch and read workflow-run status.
- GitHub accepts the dispatch request but the exact canary run cannot be found or does not conclude successfully.
- The deployment fails; native GitHub scheduled runs must remain available until the deliberate handoff variable is set.
- A manual update is needed during the handoff; manual workflow dispatch must remain enabled.
- The dashboard variable and checked-in Wrangler configuration differ; the reviewed repository configuration must be the durable source of truth.

## Requirements

### Functional Requirements

- **FR-001**: The reviewed Worker configuration MUST set `DISPATCH_ENABLED` to the exact string `"true"`.
- **FR-002**: The activation MUST reuse the existing `UPDATER_DISPATCH_TOKEN` repository secret and MUST NOT create, expose, or log a credential value.
- **FR-003**: Enabled deployment MUST use the existing unique no-op canary preflight and MUST block deployment unless the exact canary run concludes successfully.
- **FR-004**: Both updater workflows MUST retain native schedules and manual `workflow_dispatch` until `UPDATER_SCHEDULER_ACTIVE` is deliberately set to `true`.
- **FR-005**: Manual updater workflow dispatch MUST remain available after the handoff.
- **FR-006**: The credential canary MUST NOT run either production updater.
- **FR-007**: The feature MUST remain limited to scheduler activation, its regression test, its operational instructions, and task evidence; unrelated application behavior MUST remain unchanged.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Current-head pull-request CI passes the scheduler regression tests, `./jules-verify.sh`, and Wrangler dry run.
- **SC-002**: After merge, the deployment workflow's unique no-op canary completes successfully and the enabled Worker deployment succeeds.
- **SC-003**: Before the next approved schedule target, the handoff variable is set only after enabled deployment and canary success are confirmed.
- **SC-004**: A subsequent natural scheduled event is matched to the intended GitHub Actions workflow; until that evidence exists, live scheduling is reported as unverified.

## Assumptions

- The existing repository secret named `UPDATER_DISPATCH_TOKEN` is the intended token. Its presence is visible in GitHub Settings, but its permission sufficiency is not inferred from its presence.
- The existing deployment workflow, no-op canary, two Cloudflare cron triggers, five-slot allowlist, and handoff guards remain the approved implementation.
- This pull request prepares the repository-backed activation; it does not merge itself, change GitHub repository variables, or claim a successful future canary/natural dispatch before evidence exists.
