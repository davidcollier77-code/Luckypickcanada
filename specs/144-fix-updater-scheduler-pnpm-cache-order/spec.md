# Feature Specification: Fix Updater Scheduler pnpm Setup Order

**Feature Branch**: `fix/updater-scheduler-pnpm-setup-order-20261112`

**Created**: 2026-11-12

**Status**: Implemented

**Input**: Repair the GitHub Actions failure in the updater scheduler workflow.

## User Scenarios & Testing

### User Story 1 - Scheduler verification starts successfully (Priority: P1)

A maintainer opens or updates a pull request that triggers the updater scheduler workflow. The verification job installs pnpm before configuring the pnpm cache, then proceeds to dependency installation and scheduler checks.

**Why this priority**: The current ordering stops the job before any scheduler verification runs.

**Independent Test**: Inspect and execute the workflow on a pull request; confirm the pnpm setup and Node setup steps succeed in order.

**Acceptance Scenarios**:
1. **Given** a clean GitHub-hosted runner without pnpm on PATH, **When** the verification job starts, **Then** pnpm is installed before setup-node configures the pnpm cache.
2. **Given** the setup steps succeed, **When** the job continues, **Then** dependency installation and all existing verification steps remain enabled.

## Requirements

### Functional Requirements

- **FR-001**: Both the pull-request verification job and main-branch deployment job MUST install the pinned pnpm version before configuring the pnpm cache through actions/setup-node.
- **FR-002**: The workflow MUST retain Node.js 26, pnpm 10.30.3, the pnpm-lock.yaml cache dependency path, and frozen-lockfile installation.
- **FR-003**: The workflow MUST preserve all existing scheduler tests, governance checks, build-size enforcement, canary safeguards, and deployment conditions.
- **FR-004**: The change MUST be limited to the verified setup-order defect and its task documentation.

## Edge Cases

- A clean runner does not have pnpm available before the pnpm setup action.
- The deploy job uses the same setup sequence and must be corrected as well, even though the supplied failure came from the verification job.
- Existing scheduler tests and deployment safeguards must not be skipped or reordered beyond the required tool setup.

## Assumptions

- The pinned pnpm action can run before setup-node selects Node.js 26 because the action itself runs using its declared GitHub Actions runtime.
- No package, lockfile, scheduler behavior, secret, or deployment configuration change is needed.

## Success Criteria

- **SC-001**: Both jobs install pnpm before setup-node requests the pnpm cache.
- **SC-002**: The workflow retains every existing verification and deployment step.
- **SC-003**: A new current-head workflow run passes the setup steps and reaches the scheduler verification commands.
