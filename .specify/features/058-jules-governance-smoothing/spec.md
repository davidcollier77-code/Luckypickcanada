# Feature Specification: Smooth Jules Governance Workflow

**Feature Branch**: `chore/smooth-jules-governance-20261026`
**Created**: 2026-10-26
**Status**: Draft
**Input**: Align the repository governance, Jules entrypoint, and task specialists without changing Jules Master Work Request #1.

## Goal

Make normal Jules tasks simpler and predictable by removing duplicate standing document requirements, aligning PR reporting with the master request, and separating PR creation from task completion.

## User Story 1 — One consistent workflow (Priority: P1)

As the repository owner, I want the master request, root governance, and Jules entrypoint to describe one compatible workflow, so tasks do not acquire unnecessary reading or reporting work.

**Independent Test**: Compare the instructions and confirm they name the same required task-group documents, approval boundaries, and reporting lifecycle.

**Acceptance Scenarios**
1. Given a normal task, when Jules loads the selected group, then the Gemini API reference remains required and the Gemini CLI snapshot is loaded only when directly relevant.
2. Given a PR with checks still running, when the changes are safe to review, then the PR can be opened with pending status recorded honestly.
3. Given a failed mandatory check, Jules reports the failure and does not declare the task complete.

## Requirements

- **FR-001**: Leave Jules Master Work Request #1 unchanged.
- **FR-002**: Keep `AGENTS.md` authoritative and keep `.jules/jules.md` a shorter entrypoint, not a competing policy.
- **FR-003**: Remove the Gemini CLI snapshot from standing per-task requirements while retaining the Gemini API reference requirement.
- **FR-004**: Require one concise, evolving PR summary rather than exhaustive resource matrices or duplicate reports.
- **FR-005**: Preserve required verification, explicit approval gates, the 495 MB build limit, and the prohibition on agent merges.

## Out of Scope

Application code, website visuals, dependencies, deployment, secrets, the Gemini CLI snapshot itself, and Jules Master Work Request #1.

## Success Criteria

- All standing Gemini CLI requirements are removed from Jules task-specialist files; Gemini API requirements remain.
- The PR-summary lifecycle and mandatory-check behavior are stated without implying that pending checks automatically prevent PR creation.
- All changes are available for review in one open, unmerged PR.
