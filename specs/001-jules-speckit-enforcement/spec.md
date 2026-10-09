# Feature Specification: Reliable Jules Spec Kit Enforcement

**Feature Branch**: `001-jules-speckit-enforcement`

**Created**: 2026-10-09

**Status**: Approved

**Input**: User description: "Determine why Jules stopped following Spec Kit after the governance change and make compliance reliable."

## User Scenarios & Testing

### User Story 1 - Jules follows the required workflow (Priority: P1)

As the repository owner, I need every Jules task—including CI/CD, documentation, and maintenance tasks—to follow the repository's required Spec Kit workflow so that task scope cannot be used as a reason to skip it.

**Why this priority**: The current governance rule is mandatory, but the constitution still says Spec Kit is used only when task scope requires it. A recent PR then explicitly skipped Spec Kit for a CI/CD task.

**Independent Test**: On a clean task checkout, the active feature pointer and non-empty `spec.md`, `plan.md`, and `tasks.md` allow the governance verifier to pass. Missing or invalid state causes it to fail.

**Acceptance Scenarios**:

1. **Given** a Jules task with a valid active feature pointer and all three required artifacts, **When** task verification runs, **Then** the Spec Kit artifact gate passes.
2. **Given** a task that skipped the specification workflow, **When** task verification runs, **Then** the gate fails before build/test verification continues.
3. **Given** a CI/CD-only task, **When** Jules routes the work, **Then** it still follows the same Spec Kit sequence with concise, task-scoped artifacts.
4. **Given** an old feature directory contains all three artifacts, **When** no artifact changed in the current task worktree or branch, **Then** task verification rejects the stale pointer.

### User Story 2 - Execution is accurately reported (Priority: P2)

As the repository owner, I need the PR Summary to distinguish native slash-command dispatch from following the Markdown command definitions directly, so that the report records what actually happened.

**Why this priority**: The generic integration is configured to store command definitions in `.jules/cmds`; a report must not assume that a slash command was natively dispatched when it was not.

**Independent Test**: Review the PR Summary and verify it names the four command definition paths, the actual execution method, outcomes, and generated artifact paths.

**Acceptance Scenarios**:

1. **Given** native command dispatch is available, **When** Jules executes a stage, **Then** the report says `NATIVE DISPATCH` only if that dispatch actually occurred.
2. **Given** native dispatch is unavailable, **When** Jules carries out a command's Markdown procedure, **Then** the report says `FILE-DRIVEN PROCEDURAL EXECUTION` and does not claim native dispatch.

### Edge Cases

- `.specify/feature.json` is missing, empty, malformed, or has no `feature_directory`.
- The active feature path attempts to escape the repository root.
- One of `spec.md`, `plan.md`, or `tasks.md` is missing or empty.
- The automated `Update Spec Kit` GitHub Actions workflow calls `jules-verify.sh` outside a Jules task session and therefore has no task-local active feature pointer.

## Requirements

### Functional Requirements

- **FR-001**: Jules MUST follow specify → plan → tasks → implement for every Jules task, regardless of task type or size.
- **FR-002**: `AGENTS.md` MUST identify the exact Markdown command-definition files and explain the fallback when native slash-command dispatch is unavailable.
- **FR-003**: The Spec Kit constitution MUST not contradict the mandatory all-task rule.
- **FR-004**: The task-local verifier MUST fail closed if the active feature pointer is missing/invalid or any required artifact is missing/empty.
- **FR-005**: The verifier MUST reject an active feature path that resolves outside the repository root.
- **FR-006**: Regression tests MUST cover missing state, malformed state, path traversal, missing artifacts, and a complete valid feature.
- **FR-007**: The PR Summary MUST truthfully report execution method and exact artifact paths.
- **FR-008**: The build-verification script MUST retain its automated `Update Spec Kit` workflow path, which runs outside a Jules task session.
- **FR-009**: The verifier MUST require all three active feature artifacts to be created or modified in the current task worktree or branch, preventing a stale pointer from satisfying the gate.

## Success Criteria

- **SC-001**: The regression test script passes all negative and positive cases.
- **SC-002**: A task with no active Spec Kit state cannot pass `jules-verify.sh` in a Jules task session.
- **SC-003**: The governance instruction and constitution state the same requirement.
- **SC-004**: No application code, website visuals, wording, audio, or deployment behavior changes.
- **SC-005**: The automated Spec Kit updater can still call `jules-verify.sh` without needing Jules task artifacts.
- **SC-006**: A stale pointer to unchanged artifacts from a previous task fails verification.

## Assumptions

- A Jules task starts from a repository checkout where `.specify/feature.json` is local-only state and is not pre-populated from a previous task.
- The configured Spec Kit generic integration remains `.specify/integration.json` with `commands_dir: .jules/cmds`.
- CI/CD and maintenance tasks still receive concise Spec Kit artifacts; their task scope affects artifact detail, not whether the workflow is required.
