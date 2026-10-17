# Feature Specification: Remove the No-op Code-scanning Debug Artifact

**Feature Branch**: alert-autofix-16

**Created**: 2026-10-17

**Status**: Approved for implementation; remote verification pending

**Input**: Fully repair PR #1510 by removing the no-op code-scanning transformation and resolving the related verification failures without changing unrelated application behavior.

## User Scenarios & Testing

### User Story 1 — Keep debugging artifacts out of the maintained repository (Priority: P1)

Maintainers need security/code-scanning fixes to remove the actual source of the finding without leaving behind a temporary script that reads application source and does no meaningful work.

**Why this priority**: A dead debugging script can continue to trigger static-analysis findings and mislead maintainers into believing it provides test coverage.

**Independent Test**: Inspect the pull request tree and run the repository verification workflow. The debugging script is absent; normal unit, type, governance, build, and code-scanning checks run against the updated branch.

**Acceptance Scenarios**:

1. **Given** the root-level test_fix.js has no assertions or useful output after the no-op replacement is removed, **when** the cleanup is applied, **then** the entire temporary script is removed instead of being retained as an empty shell.
2. **Given** Spec Kit verification requires the active feature artifacts to be changed for the current task, **when** the validation workflow runs, **then** the active feature pointer identifies this task's spec, plan, and task list and the governance check accepts those artifacts.
3. **Given** the PR changes no application implementation, **when** the full validation runs, **then** application functionality and dependencies remain unchanged and the normal checks still run.

## Edge Cases

- The script may be needed by a workflow even if it is absent from package scripts; repository code search and tracked workflow/script inventory must be checked before removing it.
- Code-scanning alert status may not refresh until analysis runs again and/or the change is merged.
- Robin may fail to obtain an LLM response because the upstream free-model router is unavailable; that result must be reported separately from code correctness and must not be hidden by weakening the review gate.
- Build-size verification must remain strictly below the repository's hard 495 MiB cap.

## Requirements

### Functional Requirements

- **FR-001**: Remove the temporary root-level test_fix.js artifact because, after its no-op transformation was removed, it only read a source file and contained no assertions, output, or productive transformation.
- **FR-002**: No application source, runtime behavior, dependency manifest, lockfile, deployment configuration, secrets, or protected workflow is to be changed for this cleanup.
- **FR-003**: The active Spec Kit feature pointer must reference task-specific, non-empty spec.md, plan.md, and tasks.md files that are changed on this PR branch.
- **FR-004**: The PR Summary and Memory Bank must record the actual changes and actual verification outcomes without claiming unrun checks passed.
- **FR-005**: External reviewer-service failures must be diagnosed and recorded without disabling or weakening the review check.

## Success Criteria

- **SC-001**: The no-op transformation and its surrounding temporary debugging script are absent from the candidate branch.
- **SC-002**: The Spec Kit task-artifact gate passes on the candidate branch.
- **SC-003**: Unit tests, TypeScript validation, repository verification, production build, OpenNext validation, and code-scanning results are recorded from real workflow runs.
- **SC-004**: Measured build output remains below 495 MiB.
- **SC-005**: No unrelated application implementation or dependencies are changed.

## Assumptions

- The root-level file is a temporary debugging artifact, not a maintained test: the candidate content contains no assertions or useful output, and package.json does not invoke it.
- User-facing functionality is out of scope because this PR changes no application implementation.
- The owner wants the PR repaired and verified, not automatically merged.
