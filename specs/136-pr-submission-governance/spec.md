# Feature Specification: PR Submission Governance Consolidation

**Feature Branch**: docs/pr-submission-governance-20261111

**Created**: 2026-11-11

**Status**: In progress

**Input**: Consolidate PR submission governance into one dedicated procedure, retain concise pre-work Gatekeeper guidance in AGENTS.md, remove duplicate/conflicting submission details from AGENTS.md, remove the obsolete root PR_SUMMARY.md, and keep AGENTS.md at or below the 300-line target.

## User Scenarios & Testing

### User Story 1 - One clear PR procedure (Priority: P1)

When an agent finishes an assigned task, it can follow one document to prepare a complete PR description, verify the correct source and target branches and head SHA, submit a regular PR, and know exactly when to stop.

**Independent Test**: Review the new procedure against a sample PR body and the repository's required submission safeguards.

**Acceptance Scenarios**:
1. When implementation and pre-submission checks are complete, the PR body contains the task summary, exact changed files, Spec Kit/library reporting, verification evidence, preserved behaviour, remaining work, status, and intended branch/head details.
2. When the agent creates the PR, exactly one regular, non-draft PR is created against the intended base and head.
3. After successful creation, the agent stops without commits, body edits, comments, monitoring, or follow-up activity.

### User Story 2 - Gatekeepers inform implementation (Priority: P1)

Before making changes, an agent understands what each applicable repository Gatekeeper checks and uses those requirements to shape implementation and pre-submission verification.

**Independent Test**: Confirm AGENTS.md directs the agent to inspect actual workflow definitions, triggers, requirements, and failure conditions before implementation.

**Acceptance Scenarios**:
1. The agent identifies applicable event/path conditions and required checks before changing code.
2. The agent reviews the final diff and verifies it against every applicable pre-submission requirement.

### User Story 3 - Lean authoritative governance (Priority: P1)

The repository keeps AGENTS.md concise and authoritative while avoiding repeated procedural instructions.

**Independent Test**: Count AGENTS.md lines and inspect its PR handoff reference and the active PR_SUBMISSION.md procedure.

**Acceptance Scenarios**:
1. AGENTS.md contains a direct reference to PR_SUBMISSION.md, not a duplicate procedure.
2. The obsolete root PR_SUMMARY.md is removed; PR_SUBMISSION.md is the reusable submission procedure.
3. AGENTS.md is no longer than 300 lines.

## Requirements

- **FR-001**: AGENTS.md MUST remain the sole authoritative repository-wide governance document.
- **FR-002**: AGENTS.md MUST contain 300 lines or fewer and direct agents to PR_SUBMISSION.md at the PR handoff stage.
- **FR-003**: AGENTS.md MUST require inspection of applicable Gatekeeper workflows, referenced scripts, event/path filters, required checks, evidence, thresholds, and failure conditions before implementation.
- **FR-004**: PR_SUBMISSION.md MUST be the single detailed procedure for PR description preparation, source/head and target/base validation, submission, and the post-submission hard stop.
- **FR-005**: The PR description MUST be complete before PR creation and include What Changed, exact files changed, Spec Kit/.docs reporting, actual verification, final review, remaining work/follow-up, implementation/verification status, and intended branch/head SHA.
- **FR-006**: All applicable mandatory pre-submission checks MUST be completed before PR creation. Checks that can only run after PR creation may truthfully be marked pending.
- **FR-007**: PR creation MUST create one regular, non-draft PR against the intended source and base, leaving it open and unmerged for the human owner.
- **FR-008**: After successful creation, the agent MUST stop; no later commits, pushes, description edits, comments, status reports, polling, monitoring, or review-response activity is allowed.
- **FR-009**: Later gatekeeper/reviewer findings MUST become a separately authorized follow-up task and PR.
- **FR-010**: The obsolete root PR_SUMMARY.md MUST be removed; PR_SUBMISSION.md replaces its former procedural role.
- **FR-011**: Historical Spec Kit records and unrelated governance content MUST remain unchanged.

## Key Entities

- AGENTS.md: Authoritative repository governance, including Gatekeeper preflight and the PR_SUBMISSION.md handoff reference.
- PR_SUBMISSION.md: Detailed PR body and submission/stop procedure.
- PR body: One complete, task-specific report published at PR creation.

## Success Criteria

- **SC-001**: AGENTS.md contains 300 lines or fewer.
- **SC-002**: AGENTS.md has one clear handoff reference and no copied PR submission procedure.
- **SC-003**: Gatekeeper preflight explicitly requires workflow inspection before implementation.
- **SC-004**: PR_SUBMISSION.md covers all required description fields, correct head/base, non-draft creation, and the immediate hard stop.
- **SC-005**: Root PR_SUMMARY.md is absent and PR_SUBMISSION.md is the active submission procedure.
- **SC-006**: No unrelated application, workflow, integration, secret, or deployment changes are introduced.

## Assumptions

- Root PR_SUMMARY.md was an obsolete procedural report and has been intentionally removed.
- The reusable PR procedure is named PR_SUBMISSION.md.
- Repository automation runs PR-triggered Gatekeepers after creation; the agent does not monitor or modify the submitted PR in response.
