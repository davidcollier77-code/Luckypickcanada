# Feature Specification: Reliable Updater Scheduling

**Feature Branch**: `fix/updater-scheduler-reliability-1540`  
**Created**: 2026-10-20  
**Status**: Implementation candidate; live deployment and cutover pending

**Input**: Owner authorized an isolated, zero-recurring-cost path to reduce the impact of repeatedly delayed GitHub Actions scheduled events for the Spec Kit and documentation updaters.

## User Scenarios & Testing

### User Story 1 — Dispatch existing updates at intended Atlantic times (Priority: P1)

The maintainer needs the two existing updater workflows to be invoked automatically at their intended local times without manually clicking Run workflow.

**Independent Test**: Unit tests map every Tuesday and Friday target in daylight and standard time to the correct existing workflow and confirm every non-target event is ignored.

**Acceptance Scenarios**:
1. Given a scheduler event at an approved local target, when the Worker is enabled, then it sends a workflow-dispatch request to the correct existing workflow on `main`.
2. Given any non-target event, when it runs, then it sends no GitHub API request.
3. Given daylight-saving time changes, when the same local time target arrives on Tuesday or Friday, then the workflow mapping remains correct.

### User Story 2 — Preserve existing update safety during migration (Priority: P1)

The maintainer needs the replacement to remain harmless until its configuration and live operation are verified.

**Independent Test**: With the default disabled configuration, approved events produce a disabled log entry and zero GitHub API calls.

**Acceptance Scenarios**:
1. Given dispatch remains disabled, when the Worker is deployed, then it cannot start either updater.
2. Given account or credential setup is incomplete, when a target occurs, then the existing GitHub schedule remains active and no claim of live cutover is made.
3. Given the first natural scheduled dispatch fails after a future cutover, then the documented rollback restores the GitHub schedules and disables Worker dispatch.

## Requirements

- **FR-001**: The Worker MUST use `America/Halifax` and handle Atlantic daylight/standard time without a hard-coded single UTC offset.
- **FR-002**: Only the five existing Tuesday/Friday target slots may dispatch workflows.
- **FR-003**: The Worker MUST map 1:05 AM and 5:05 AM to `.github/workflows/update-spec-kit.yml` and 2:21 AM, 6:21 AM, and 10:21 AM to `.github/workflows/refresh-docs.yml`.
- **FR-004**: Dispatch MUST remain disabled by default.
- **FR-005**: GitHub credentials MUST be a secret, with no values committed or logged.
- **FR-006**: The implementation MUST not perform a real workflow dispatch as a test.
- **FR-007**: This PR MUST leave the existing `schedule` entries intact and must not enable dispatch.
- **FR-008**: Current-head CI MUST run the Worker tests, repository governance check, and Wrangler dry run.
- **FR-009**: Deployment/credential checks and cutover MUST be reported separately from code test results.
- **FR-010**: Any required repository build MUST respect the 495 MiB hard size limit.

## Unknowns and boundaries

Cloudflare account trigger usage, token configuration, actual deployment success, and live scheduled delivery cannot be determined from repository source alone. This task does not disable existing schedules or change the public application.
