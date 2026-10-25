# Feature Specification: DeepSource PR Smoke Test

**Feature Branch**: `test/deepsource-autofix-smoke-20261025`  
**Created**: 2026-10-25  
**Status**: Draft  
**Input**: User requested a harmless pull request to check whether DeepSource responds to a new PR.

## User Scenarios & Testing

### User Story 1 — Verify PR-level DeepSource processing (Priority: P1)

The repository owner opens a temporary PR with a plain-text-only change to see whether DeepSource automatically processes it.

**Why this priority**: The owner needs evidence that the installed app responds to PR events before relying on it.

**Independent Test**: Open the PR, then inspect its checks and conversation for activity from DeepSource.

**Acceptance Scenarios**:
1. **Given** the repository's DeepSource integration is installed, **When** this PR opens, **Then** any DeepSource checks or comments are recorded accurately.
2. **Given** no DeepSource activity is visible at inspection time, **When** the result is recorded, **Then** the outcome remains pending/not observed rather than being treated as proof of a specific cause.

## Requirements

- **FR-001**: The PR MUST add only an inert plain-text smoke-test file plus the required task records.
- **FR-002**: The PR MUST NOT change application code, tests, dependencies, workflows, permissions, secrets, or deployment settings.
- **FR-003**: The PR MUST remain open and unmerged while the owner observes the result.
- **FR-004**: The report MUST distinguish PR-level processing from the separate Autofix action that previously failed to clone the repository.

## Success Criteria

- **SC-001**: A single test PR is open against `main`.
- **SC-002**: The final diff contains no production code or configuration changes.
- **SC-003**: DeepSource activity is either observed and documented or explicitly marked not observed; no unverified success is claimed.

## Assumptions

- This checks whether DeepSource reacts to a newly opened PR. A plain-text-only PR does not itself prove that the separate code Autofix operation can clone the repository or apply a fix.
- The owner may close the PR after observing the result. It must not be merged.
