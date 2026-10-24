# Feature Specification: PR Summary Lifecycle and Human-Owned Merges

**Feature Branch**: `chore/jules-pr-summary-owner-merge-guard-20261024`
**Created**: 2026-10-24
**Status**: Proposed
**Input**: Owner request to reconcile repository governance without changing Jules Master Work Request #1.

## User Scenarios & Testing

### User Story 1 — Keep one PR report current (Priority: P1)
The owner needs Jules to create and maintain the task's PR Summary as routine work, update the existing report with material progress and actual verification results, and never pause to ask whether to create or update it.

**Independent Test**: Inspect the revised governance and PR body to confirm the report is mandatory, updated in place, evidence-based, and not duplicated.

**Acceptance Scenarios**:
1. Given a task has a PR report, when implementation or verification results change, Jules updates that report instead of asking whether to update it.
2. Given a PR report does not yet exist, Jules creates it as part of normal workflow without a separate approval pause.
3. Given checks have not run or remain blocked, Jules marks them pending/blocked/unavailable rather than claiming they passed.

### User Story 2 — Preserve human ownership of merging (Priority: P1)
The owner needs Jules and other AI agents to prepare PRs for review but never merge or enable automatic merging.

**Independent Test**: Inspect the governing rule and related instructions/settings evidence; confirm no agent-facing instruction grants merge permission.

**Acceptance Scenarios**:
1. Given a PR is ready or all checks pass, Jules leaves it open and unmerged for the human owner.
2. Given a tool offers merge or auto-merge, Jules does not invoke it.
3. Related governance that is silent on merging does not authorize an agent to merge.

## Requirements
- **FR-001**: Keep `AGENTS.md` as the single authoritative source for repository-wide PR Summary lifecycle and agent merge prohibition.
- **FR-002**: Make PR Summary creation/update routine and mandatory; update the existing report in place, avoid duplicates, and record only evidenced progress/results.
- **FR-003**: Prohibit agent-initiated/manual/API/CLI merges and auto-merge enablement; only the human repository owner may merge.
- **FR-004**: Do not modify Jules Master Work Request #1, `.jules/jules.md`, the Constitution, `.docs/`, application code, workflows, or deployment settings.
- **FR-005**: Report separately whether GitHub settings technically enforce the human-only merge boundary; do not claim instruction text is an access-control block.

## Scope and Exclusions
Only missing/ambiguous repository-level wording in `AGENTS.md` is changed. Existing subordinate governance is inspected but not unnecessarily duplicated. No production behavior is changed.
