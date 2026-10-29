# Feature Specification: Gemini Reviewer Startup Repair

**Feature Branch**: `fix/gemini-reviewer-targeted-fix-guard-20261028`
**Created**: 2026-10-28
**Status**: Draft
**Input**: User description: Repair the Gemini PR review workflow after its automatic run failed before review processing could start.

## User Scenarios & Testing

### User Story 1 — Restore automatic PR reviews (Priority: P1)

As the repository owner, I need the automated reviewer to start reliably so eligible pull requests can receive evidence-based reviews instead of a startup failure.

**Why this priority**: The reviewer is unusable when its trusted entrypoint cannot start.

**Independent Test**: Trigger the reviewer with an eligible pull request after the repair is on the trusted base branch and verify it proceeds beyond script startup.

**Acceptance Scenarios**:
1. **Given** an eligible pull-request event, **When** the reviewer starts, **Then** it enters the intended review path without a syntax-parse crash.
2. **Given** a manually dispatched review request, **When** its selected mode is validated, **Then** only supported manual modes are accepted.
3. **Given** a reviewer prompt is assembled, **When** changed PR data is included, **Then** execution-control logic is not accidentally treated as prompt content.\n4. **Given** a targeted repair request matches no findings, **When** the reviewer handles the request, **Then** it posts the existing no-match message and returns without breaking the enclosing async handler.

## Edge Cases

- Manual dispatch and pull-request/comment events have different permitted modes.
- A malformed reviewer script must be rejected by automated regression checks before it is considered ready.
- The reviewer must keep using trusted base-branch code and must not execute pull-request-head code.

## Requirements

### Functional Requirements

- **FR-001**: The reviewer must validate the requested mode once, before building review prompts.
- **FR-002**: Manual dispatch must accept only its supported modes; event-triggered review handling must retain its supported automatic and explicit modes.
- **FR-003**: Regression checks must detect both syntax-parse failures and a duplicated or misplaced mode-validation statement.
- **FR-004**: The repair must preserve existing reviewer permissions, trusted-base execution, secret handling, model fallback behavior, and the separation of PR content from instructions.
- **FR-005**: The repair must not change application behavior, add dependencies, or modify the Tip Jar changes in PR #1605.\n- **FR-006**: The targeted-fix no-match guard must remain around its explanatory response, before the autofix module is loaded, so the reviewer script remains syntactically valid and safely exits when no findings match.

## Success Criteria

- **SC-001**: The reviewer entrypoint has zero syntax-parse failures in the focused automated checks.
- **SC-002**: All focused reviewer regression assertions pass on the proposed revision.
- **SC-003**: After the repair reaches the trusted base branch, an eligible reviewer run proceeds past startup and produces its normal completion outcome.\n- **SC-004**: The focused regression test asserts that the no-match guard, message, and autofix module stay in the expected order.

## Assumptions

- The failed job checks out the trusted base commit, so the defect must be corrected on a repair branch targeting `main`; changing PR #1605's Tip Jar files alone would not repair it.
- End-to-end verification using the trusted base requires an owner-controlled merge followed by a new reviewer event or rerun. No agent may merge the repair PR.