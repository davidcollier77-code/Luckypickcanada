# Feature Specification: Bounded Robin Review Failover

Feature Branch: fix/robin-bounded-review-fallback
Created: 2026-10-16
Status: In progress
Input: User-authorized investigation and repair of slow Robin review failures and unbounded provider waits.

## User Scenarios & Testing

### User Story 1 — Get a prompt review result (Priority: P1)

A contributor opens or updates a pull request and receives a review, or a clear failure, promptly rather than waiting through repeated provider stalls.

Why this priority: Slow, unbounded review attempts delay merge decisions and consume runner time across a high-volume pull-request workflow.

Independent Test: Trigger the review workflow and verify that its running job reaches a review or a clear failure within the configured total runtime budget.

Acceptance Scenarios:
1. Given the primary model responds, when the review runs, then Robin posts its review and the workflow succeeds.
2. Given the router stalls or errors, when the bounded action ends, then the check fails promptly unless a complete Robin review was posted.
3. Given the one review attempt does not complete, when the workflow finishes, then the check fails within the overall job limit and records the result.

### User Story 2 — Avoid duplicate and misleading reviews (Priority: P1)

A contributor must not receive duplicate reviews because an action timed out immediately after posting a review, and missing credentials must not waste several minutes of retries.

Why this priority: Duplicate comments undermine confidence in the reviewer; a misleading green check is worse than a clear failure.

Independent Test: Inspect review objects for the current pull-request head after a timeout and verify that at most one attempt posts a completed review for the current run.

Acceptance Scenarios:
1. Given the primary action posted a review before timing out, when the final review guard runs, then the workflow must avoid a duplicate or false failure.
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
- FR-002: The single Robin review action must have a two-minute hard execution limit.
- FR-003: The default model must be OpenRouter’s free router, with configurable overrides; the entire action must be bounded independently of the router’s internal retries.
- FR-004: Missing API credentials must cause a fast, explicit failure before any provider request.
- FR-005: The workflow must preserve authorized slash commands, PR review permissions, no-request-changes policy, and per-pull-request concurrency behavior.
- FR-006: The workflow must never mark a review recovered unless an action succeeded or a completed Robin review for the current head was confirmed.
- FR-007: The Robin action version must be pinned to an immutable commit SHA.

## Assumptions

- OpenRouter’s free router can select rate-limited or unhealthy endpoints; this change bounds the wait but cannot guarantee every review finds issues.
- Runtime budgets measure execution after a GitHub Actions job starts; they cannot control runner queue delays before a job starts.
- The repository owner may need to configure OPENROUTER_API_KEY as a Dependabot secret if GitHub withholds ordinary Actions secrets from Dependabot workflows.
