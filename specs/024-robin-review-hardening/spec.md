# Feature Specification: Bounded Robin Review Failover

Feature Branch: fix/robin-bounded-review-fallback
Created: 2026-10-16
Status: In progress
Input: User-authorized investigation and repair of slow Robin review failures and fallback behavior.

## User Scenarios & Testing

### User Story 1 — Get a prompt review result (Priority: P1)

A contributor opens or updates a pull request and receives a review, or a clear failure, promptly rather than waiting through repeated provider stalls.

Why this priority: Slow, unbounded review attempts delay merge decisions and consume runner time across a high-volume pull-request workflow.

Independent Test: Trigger the review workflow and verify that its running job reaches a review or a clear failure within the configured total runtime budget.

Acceptance Scenarios:
1. Given the primary model responds, when the review runs, then Robin posts its review and the workflow succeeds.
2. Given the primary model stalls or fails, when its bounded step ends, then the alternate free model is attempted if no review was already posted.
3. Given both model attempts fail, when the workflow finishes, then the check fails within the overall job limit and records which attempts ran.

### User Story 2 — Avoid duplicate and misleading reviews (Priority: P1)

A contributor must not receive duplicate reviews because an action timed out immediately after posting a review, and missing credentials must not waste several minutes of retries.

Why this priority: Duplicate comments undermine confidence in the reviewer; a misleading green check is worse than a clear failure.

Independent Test: Inspect review objects for the current pull-request head after a timeout and verify that at most one attempt posts a completed review for the current run.

Acceptance Scenarios:
1. Given the primary action posted a review before timing out, when the failure guard runs, then the fallback is skipped.
2. Given the required API key is absent, when preflight runs, then the job fails before any model request and gives a safe setup hint without printing a credential.
3. Given a failure cannot be recovered, when the job ends, then the required check remains failed instead of silently passing.

## Edge Cases

- OpenRouter credentials are unavailable in a Dependabot-triggered run.
- The provider returns an empty response, an upstream error, or stalls after the first response chunk.
- An action posts a review just before its execution deadline is reached.
- An unrelated issue comment or bot comment arrives during an in-flight review.
- The pull-request head changes while a review is running; per-pull-request cancellation must remain intact.

## Requirements

- FR-001: A running review job must reach success or failure within eight minutes.
- FR-002: The primary model step and one fallback model step must each have a three-minute hard execution limit.
- FR-003: The fallback must use a different explicitly selected free model, and must run only after primary failure when a completed review for the current head was not already posted.
- FR-004: Missing API credentials must cause a fast, explicit failure before any provider request.
- FR-005: The workflow must preserve authorized slash commands, PR review permissions, no-request-changes policy, and per-pull-request concurrency behavior.
- FR-006: The workflow must never mark a review recovered unless an action succeeded or a completed Robin review for the current head was confirmed.
- FR-007: The primary and fallback action versions must be pinned to an immutable commit SHA.

## Assumptions

- Free OpenRouter models remain subject to provider rate limits and can still fail; fallback improves recovery but cannot guarantee provider availability.
- Runtime budgets measure execution after a GitHub Actions job starts; they cannot control runner queue delays before a job starts.
- The repository owner may need to configure OPENROUTER_API_KEY as a Dependabot secret if GitHub withholds ordinary Actions secrets from Dependabot workflows.
