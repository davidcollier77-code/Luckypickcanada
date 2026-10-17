# Feature Specification: Robin OpenRouter Fallback Recovery

**Feature Branch**: `fix/robin-openrouter-fallback`
**Created**: 2026-10-17
**Status**: Implemented in branch; automated verification pending
**Task Group**: troubleshooting

## User Scenarios & Testing

### User Story 1 — Keep Robin as the reviewer with OpenRouter failover (Priority: P1)

When Robin's primary OpenRouter free-router attempt cannot produce a review, the workflow makes a bounded second Robin attempt through a different OpenRouter free model. Amazon Q continues to run its existing independent reviewer and is not dispatched or counted as Robin's fallback.

**Why this priority**: The Robin check should recover from transient model-route failures without coupling it to a separate review provider.

**Independent Test**: Make the primary review fail while the OpenRouter free quota remains above zero; verify a second pinned Robin action uses the existing OpenRouter secret and a separate `:free` model, then confirms a review for the current PR head.

**Acceptance Scenarios**:

1. **Given** an eligible pull request or `/review` or `/robin` request, **When** Robin does not post a current-head review, **Then** the workflow invokes a second pinned Robin action against the configured OpenRouter endpoint using the existing `OPENROUTER_API_KEY`.
2. **Given** the primary model is `openrouter/free`, **When** the fallback is selected, **Then** the fallback uses a separately named free model and rejects a configured paid-model ID or router alias.
3. **Given** Amazon Q independently reviews the pull request, **When** Robin's workflow completes, **Then** that Amazon Q review is neither triggered by Robin nor accepted as Robin's successful review.

### User Story 2 — Fail safely when free inference is unavailable (Priority: P1)

The workflow avoids futile fallback inference when OpenRouter explicitly reports zero free requests and never passes the review check without a qualifying Robin review on the exact current PR head.

**Independent Test**: Stub or inspect quota outputs for zero and positive values. Zero must skip both inference attempts that cannot run; a positive or unknown count may proceed to the bounded fallback after the primary result is not verified.

**Acceptance Scenarios**:

1. **Given** the quota endpoint reports zero remaining requests, **When** the primary is skipped or fails, **Then** the fallback does not run and the check fails unless a qualifying Robin review for the current head is already found.
2. **Given** a fallback action reports success, **When** no qualifying current-head Robin review can be found, **Then** the final check remains failed.
3. **Given** the existing secret is present, **When** the workflow changes, **Then** no secret is rotated, renamed, printed, or replaced.

## Requirements

- **FR-001**: Preserve the pinned Robin action and existing primary review configuration.
- **FR-002**: Use the existing `secrets.OPENROUTER_API_KEY` for both Robin attempts.
- **FR-003**: Select a distinct OpenRouter model whose ID ends in `:free` for the fallback; support `vars.ROBIN_LLM_FALLBACK_MODEL` and safely default to `nvidia/nemotron-3-super-120b-a12b:free`.
- **FR-004**: Use a bounded fallback timeout and keep the overall workflow timeout bounded.
- **FR-005**: Remove Robin-workflow requests to `/q review` and remove any acceptance path based on an Amazon Q review.
- **FR-006**: Verify a Robin review's commit SHA equals the current PR head and its submission time is at or after the current run's start time before passing the review check.
- **FR-007**: Preserve supported non-review Robin slash commands such as `/summary` and `/help`; do not demand a code-review object for those successful commands.
- **FR-008**: When OpenRouter reports exactly zero free requests remaining, skip fallback inference and report a failed review result unless a qualifying Robin review exists.
- **FR-009**: Do not modify Amazon Q's independent workflow, repository secrets, paid models, app runtime, dependencies, or deployment configuration.

## Scope

**In scope**: `.github/workflows/robin.yml`, its targeted static regression test, active Spec Kit task artifacts and pointer, and task memory records.

**Out of scope**: Amazon Q reviewer setup, API-key creation/rotation, non-free inference, application code or runtime behavior, dependency changes, and direct pushes to `main`.

## Success Criteria

- **SC-001**: Exactly two pinned Robin action invocations exist in the workflow: primary and OpenRouter fallback.
- **SC-002**: Both Robin steps reference the existing OpenRouter secret and configured endpoint.
- **SC-003**: No Robin workflow path contains `/q review`, `q_fallback`, or Q-review acceptance logic.
- **SC-004**: The fallback only selects a model ending in `:free` and is skipped when the quota endpoint confirms zero remaining requests.
- **SC-005**: A successful code-review check requires a Robin review for the exact current PR head, not an unrelated provider's review.
- **SC-006**: The targeted static test, repository-required verification, and pull-request CI results are reported accurately; no unrun check is claimed as passed.
