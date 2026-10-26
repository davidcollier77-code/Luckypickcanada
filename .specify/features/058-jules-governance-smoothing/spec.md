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
4. Given a Gemini CLI task assigned to Creation, Troubleshooting, or Deep-dive, Jules has a conditional pointer to the relevant local snapshot; unrelated tasks do not load it.
5. Given the scheduled documentation refresh, `.docs/manifest.json` routes the Gemini CLI snapshot only to Creation, Troubleshooting, and Deep-dive.
4. Given a Gemini CLI task assigned to Creation, Troubleshooting, or Deep-dive, Jules has a conditional pointer to the relevant local snapshot; unrelated tasks do not load it.
5. Given the scheduled documentation refresh, `.docs/manifest.json` routes the Gemini CLI snapshot only to Creation, Troubleshooting, and Deep-dive.

## Requirements

- **FR-001**: Leave Jules Master Work Request #1 unchanged.
- **FR-002**: Keep `AGENTS.md` authoritative and keep `.jules/jules.md` a shorter entrypoint, not a competing policy.
- **FR-003**: Remove Gemini CLI from standing per-task requirements while retaining the Gemini API reference requirement; provide conditional Gemini CLI snapshot guidance only in Creation, Troubleshooting, and Deep-dive.
- **FR-004**: Require one concise, evolving PR summary rather than exhaustive resource matrices or duplicate reports.
- **FR-005**: Preserve required verification, explicit approval gates, the 495 MB build limit, and the prohibition on agent merges.
- **FR-006**: Configure `.docs/manifest.json` so the scheduled documentation updater maintains Gemini CLI snapshots only for Creation, Troubleshooting, and Deep-dive.
- **FR-006**: Configure `.docs/manifest.json` so the scheduled documentation updater maintains Gemini CLI snapshots only for Creation, Troubleshooting, and Deep-dive.

## Out of Scope

Application code, website visuals, dependencies, deployment, secrets, the contents of Gemini CLI documentation snapshots, changes to the refresh schedule, and Jules Master Work Request #1.

## Success Criteria

- Gemini CLI is not a standing requirement for any task; conditional pointers exist only in Creation, Troubleshooting, and Deep-dive; the manifest routes snapshot updates only to those three groups; Gemini API requirements remain.
- The PR-summary lifecycle and mandatory-check behavior are stated without implying that pending checks automatically prevent PR creation.
- All changes are available for review in one open, unmerged PR.
