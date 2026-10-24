# Implementation Plan: PR Summary Lifecycle and Human-Owned Merges

**Branch**: `chore/jules-pr-summary-owner-merge-guard-20261024` | **Date**: 2026-10-24 | **Spec**: `.specify/features/pr-summary-merge-ownership/spec.md`

## Summary
Make the PR Summary explicitly mandatory and maintainable without repeat approval questions, and add a clear prohibition against AI-agent merging. Keep `AGENTS.md` as the single policy source. Leave Jules Master Work Request #1 unchanged.

## Technical Context
- **Language/Version**: Markdown governance files; no application language changes.
- **Dependencies**: None.
- **Testing**: Inspect governance hierarchy, search merge/auto-merge instructions and repository automation, inspect the main-branch ruleset, review the final diff, and check current-head CI where available.
- **Project Type**: Repository governance/documentation.
- **Constraints**: Small, surgical diff. Do not modify `.docs/`, Jules Master Work Request #1, `.jules/jules.md`, `.specify/memory/constitution.md`, workflows, application code, or settings.

## Governance Check
- `AGENTS.md` is authoritative and already identifies the PR Summary as canonical, but did not explicitly prohibit Jules from merging or say summary maintenance is routine and must not require asking.
- `.jules/jules.md` and the Constitution make `AGENTS.md` authoritative and do not authorize agent merges. The Constitution's `REPORT → CREATE PR` sequence is compatible with drafting the summary before PR creation and updating the same summary thereafter.
- The active main ruleset requires a PR but sets zero required approvals and no required status checks. Repository metadata reports auto-merge disabled. Branch-protection details requiring administration access could not be read through this connector, so no technical owner-only permission block is claimed.

## Implementation
1. Update only `AGENTS.md` Sections 4, 5, and 7 for the report lifecycle, merge prohibition, and final audit.
2. Create the task-scoped Spec Kit artifacts in this directory.
3. Inspect the full resulting diff, create one PR, leave it open/unmerged, and report unavailable verification honestly.
