# Feature Specification: Gemini Reviewer Uses the Current Trusted Base

**Feature Branch**: fix/gemini-reviewer-fresh-base-checkout-20261025
**Created**: 2026-10-25
**Status**: Draft
**Input**: Repair the repeated automatic Gemini reviewer failure after the previous syntax repair was merged.

## User Scenarios & Testing

### User Story 1 — Automatic reviews use the repaired trusted code (Priority: P1)

As the repository owner, I need automatic Gemini reviews to run the current trusted reviewer code so that fixing a defect on the default branch restores reviews on existing pull requests.

**Why this priority**: A workflow pinned to an older base commit can continue running broken code after a repair reaches the trusted branch.

**Independent Test**: Inspect the workflow checkout expression and run the existing reviewer-workflow regression test; after merge, trigger a fresh pull_request_target event and confirm the reviewer passes startup.

**Acceptance Scenarios**:
1. Given an open PR whose event payload contains an older base SHA, when the automatic reviewer checks out its trusted code, then it checks out the current tip of the PR's base branch.
2. Given a PR event, when the workflow checks out reviewer code, then it does not check out the pull-request head or execute PR content as trusted code.
3. Given the checkout configuration is changed, when the regression test runs, then it fails if the old base-SHA expression is reintroduced.

## Requirements

- **FR-001**: For pull-request-targeted runs, checkout must resolve the latest current ref of the PR's trusted base branch, with the default branch as fallback for other events.
- **FR-002**: The workflow must continue to checkout trusted base-branch code only; it must not checkout the PR head.
- **FR-003**: A regression assertion must require the branch-ref expression and reject the stale base-SHA expression.
- **FR-004**: Existing workflow permissions, secret handling, event triggers, model fallback configuration, and application behavior must remain unchanged.

## Success Criteria

- **SC-001**: The workflow no longer uses the immutable pull_request.base.sha expression for trusted-code checkout.
- **SC-002**: The focused reviewer-workflow tests pass on the proposed revision.
- **SC-003**: After merge and a new eligible pull-request event, the automatic Gemini reviewer gets past script startup using the repaired base-branch code.

## Assumptions

- The verified failed run demonstrates that the PR event's recorded base SHA can remain behind the latest main branch commit for an existing PR.
- The base branch name is the intended trust boundary; checking out that branch name resolves its current tip without executing code from the PR head.
