# Feature Specification: Updater Scheduler Cutover

**Feature Branch**: `fix/updater-scheduler-cutover-20261022`  
**Created**: 2026-10-22  
**Status**: Draft — cutover PR awaits review and account-level prerequisites

**Input**: The repository owner authorized completing the coordinated switch from GitHub's delayed native schedules to the prepared Cloudflare updater scheduler.

## User Scenarios & Testing

### User Story 1 — Run the updater workflows from one scheduler (Priority: P1)

The maintainer needs the Spec Kit and documentation refresh tasks to run at their intended Tuesday/Friday Atlantic local times without two independent scheduler systems launching them.

**Independent Test**: A repository regression test checks that the Worker is enabled in the proposed cutover configuration, both updater workflows preserve manual dispatch, and neither retains a native scheduled trigger.

**Acceptance Scenarios**:
1. Given an approved Tuesday/Friday target, when the Cloudflare Worker receives its cron event, then it dispatches only the corresponding existing workflow.
2. Given a non-target cron event, when the Worker receives it, then it makes no GitHub request.
3. Given the cutover configuration, when either workflow is inspected, then it has manual dispatch available but no competing native schedule.
4. Given a manual recovery request, when the owner uses GitHub's workflow UI, then the selected updater remains manually runnable.

### User Story 2 — Avoid activating an unusable scheduler (Priority: P1)

The maintainer needs an invalid or absent dispatch credential to stop deployment before the Worker is enabled.

**Independent Test**: The deploy workflow's active-cutover preflight requires the repository dispatch secret and dispatches only a harmless no-op canary workflow; it does not start either production updater.

**Acceptance Scenarios**:
1. Given the active configuration and no `UPDATER_DISPATCH_TOKEN` secret, when deployment runs, then the preflight fails before token synchronization or Worker deployment.
2. Given a token that lacks Actions workflow-dispatch permission, when the preflight runs, then the canary request fails and the enabled Worker is not deployed.
3. Given a valid token, when deployment proceeds, then the token is synchronized through stdin before the Worker deployment.
4. Given the repository owner has not verified available Cloudflare cron quota, then the cutover is not treated as ready for production activation.

## Edge Cases

- GitHub accepts a dispatch request but later delivery fails; the Worker must not automatically replay the ambiguous request, and later approved recovery slots remain available.
- The repository dispatch secret is missing, revoked, or lacks required permission.
- The Cloudflare account has insufficient Cron Trigger quota.
- A scheduled event arrives outside one of the five approved local target slots.
- The owner needs an immediate manual run during a cutover or incident.

## Requirements

- **FR-001**: The system MUST use one automatic scheduler for the Spec Kit and documentation refresh workflows after cutover.
- **FR-002**: The Worker MUST preserve the five approved Tuesday/Friday `America/Halifax` target slots.
- **FR-003**: Both existing updater workflows MUST retain manual workflow dispatch.
- **FR-004**: Neither updater workflow MAY retain a competing GitHub scheduled trigger after cutover.
- **FR-005**: Active Worker deployment MUST require a configured GitHub token and a successful harmless canary workflow dispatch.
- **FR-006**: The token MUST be synchronized into Cloudflare before deployment and MUST never be printed, committed, or placed in command-line arguments.
- **FR-007**: A token preflight MUST NOT dispatch a production updater for test purposes.
- **FR-008**: Current-head CI MUST run the focused Worker tests, repository governance verification, and Wrangler dry run.
- **FR-009**: The owner MUST verify at least two Cloudflare Cron Trigger slots are available before merging the cutover.
- **FR-010**: The first naturally scheduled dispatch and resulting GitHub Actions run MUST be checked after activation; tests or deployment alone do not establish live success.
- **FR-011**: If the initial natural dispatch fails, recovery instructions MUST disable Worker dispatch and restore the native schedules.

## Success Criteria

- **SC-001**: All five approved local time slots still map to their intended existing workflows.
- **SC-002**: The cutover regression test confirms the Worker-enabled setting, manual dispatch on both workflows, and zero competing native schedules.
- **SC-003**: Missing or insufficient dispatch credentials prevent an active Worker deployment.
- **SC-004**: The production change remains unapplied until the pull request is reviewed and account-level quota is confirmed.
- **SC-005**: Post-activation acceptance records one natural scheduled dispatch in Cloudflare logs and its corresponding GitHub Actions run.

## Assumptions

- The repository owner will review and apply the cutover only after checking the account's available Cron Trigger quota and the token's Actions write permission.
- The configured Cloudflare `GITHUB_TOKEN` and repository `UPDATER_DISPATCH_TOKEN` are credential values, not non-secret variables; values must never be shared in chat or source.
- Workflow jobs, PR creation behavior, daily guards, notifications, and manual recovery paths remain unchanged.
