# Feature Specification: Mandatory Pull Request Completion

**Feature Branch**: `governance/mandatory-pr-completion`

**Created**: 2026-11-11

**Status**: In progress

**Input**: Clarify the repository task completion rule so Freebuff automatically opens the required PR after completing authorized repository changes, and align active governance regression checks with the updated policy.

## User Scenarios & Testing

### User Story 1 — Complete repository-changing tasks with a PR (Priority: P1)

When the owner authorizes repository changes, Freebuff proceeds from implementation and pre-submission verification directly to PR preparation and submission without waiting for another prompt.

**Independent Test**: The current governance regression suite verifies the mandatory PR handoff language and its scope boundaries.

**Acceptance Scenarios**:
1. Given a task authorizes repository changes, when implementation and required pre-submission verification are complete, then Freebuff follows `PR_SUBMISSION.md` and opens one complete PR.
2. Given Freebuff has completed implementation or testing, when it has not yet submitted the PR, then it does not report the repository-changing task as complete or wait for a separate PR request.
3. Given a task is read-only, when it produces findings or advice without changing repository files, then no PR is required.
4. Given the owner explicitly directs that no PR be opened, when the task is performed, then that explicit instruction is respected.
5. Given PR creation cannot safely be completed, when Freebuff encounters the blocker, then it reports the exact blocker and preserves the completed work.

### User Story 2 — Keep governance protection active (Priority: P1)

The new completion rule must be enforced by the active governance regression test without weakening the human authorization controls protecting `AGENTS.md`.

**Independent Test**: The focused governance test checks the new completion requirements, Protected File Changes workflow detection, and owner CODEOWNERS assignment.

**Acceptance Scenarios**:
1. Given the mandatory PR rule is removed or weakened, when the governance test runs, then the test fails.
2. Given `AGENTS.md` protection is removed from the workflow or CODEOWNERS, when the governance test runs, then the test fails.
3. Given a PR changes `AGENTS.md`, when the existing Protected File Changes workflow runs, then it continues to require the configured human authorization.

## Requirements

- **FR-001**: `AGENTS.md` MUST state that tasks authorizing repository changes proceed directly from implementation and pre-submission verification to PR preparation and submission.
- **FR-002**: The rule MUST state that opening the PR is mandatory completion, not an optional follow-up, and MUST prohibit waiting for a separate PR request or permission when repository changes are already authorized.
- **FR-003**: The rule MUST distinguish read-only investigations, audits, recommendations and advice from repository-changing tasks.
- **FR-004**: An explicit owner instruction not to open a PR MUST be respected.
- **FR-005**: If a PR cannot safely be opened, Freebuff MUST report the exact blocker and preserve the completed work.
- **FR-006**: The detailed PR preparation, verification, submission, handoff and immediate-stop procedures MUST remain solely in `PR_SUBMISSION.md`.
- **FR-007**: The governance regression test MUST fail if the mandatory completion rule or any of its scope/exception conditions are removed.
- **FR-008**: The existing Protected File Changes workflow and `CODEOWNERS` owner assignment for `AGENTS.md` MUST remain unchanged and enforced.
- **FR-009**: No other governance protections, application behavior, deployment settings, integrations or secrets may be weakened or changed.

## Success Criteria

- **SC-001**: The focused governance test contains assertions for every required PR completion condition and exception.
- **SC-002**: The governance test still enforces the `AGENTS.md` protected-file path, human authorization environment, and owner assignment.
- **SC-003**: `AGENTS.md` remains the sole authoritative repository-wide governance file and retains its reference to `PR_SUBMISSION.md`.
- **SC-004**: `PR_SUBMISSION.md` remains the single source of truth for detailed PR procedures and its immediate post-submission hard stop.
- **SC-005**: The final PR includes the full Spec Kit artifacts, accurate checker self-review, and actual verification status.
- **SC-006**: No unrelated files or protected behavior are changed.
