# Feature Specification: Repair Gemini PR-Agent Workflow

**Feature Branch**: `fix/gemini-pr-agent-workflow-1530`

**Created**: 2026-10-19

**Status**: In progress

**Input**: User-authorized repair of the existing Gemini automated pull-request reviewer.

## User Scenarios & Testing

### User Story 1 - Receive a Gemini review on pull requests (Priority: P1)

A repository maintainer expects the automated Gemini reviewer to run when a pull request is opened, reopened, updated with new commits, marked ready for review, or has a review requested.

**Why this priority**: The reviewer has no value if the workflow is invalid, uses the wrong model, or silently skips relevant events.

**Independent Test**: Open or update a same-repository test PR after the corrected workflow reaches the default branch and confirm the PR Agent job succeeds and posts its review summary.

**Acceptance Scenarios**:

1. **Given** a pull request event is one of the configured trigger types, **When** GitHub Actions processes the event, **Then** the PR Agent workflow attempts a Gemini review.
2. **Given** a pull request is authored or updated by a repository automation bot, **When** the event occurs, **Then** the job is not skipped solely because the event sender is a bot.
3. **Given** the review action runs, **When** PR-Agent selects its provider, **Then** it uses the configured Gemini 3.8 Flash model.

### User Story 2 - Fail clearly and safely when the credential is unavailable (Priority: P2)

A maintainer needs to tell whether the repository credential is available without exposing its value in logs.

**Why this priority**: A missing or unavailable credential must be diagnosable without leaking sensitive material.

**Independent Test**: Inspect the workflow and its run output; a missing credential must fail with a clear message, while a present credential is acknowledged without printing its value.

**Acceptance Scenarios**:

1. **Given** the Actions secret is missing or unavailable, **When** the credential preflight executes, **Then** the job fails with a safe diagnostic before calling PR-Agent.
2. **Given** the secret is present, **When** the preflight executes, **Then** the log confirms availability without showing the secret value.

### Edge Cases

- A PR is created by Jules or another bot; the event must not be ignored solely due to sender type.
- The secret exists in repository settings but is not exposed to a particular run; the credential preflight must fail safely.
- A push to an existing PR branch produces a `synchronize` event; PR-Agent's internal event filter must also include that event.
- The Gemini provider rejects an invalid, expired, or quota-limited key; GitHub Actions must show the action failure without any code path printing the credential.

## Requirements

### Functional Requirements

- **FR-001**: The workflow MUST trigger for pull-request events `opened`, `reopened`, `synchronize`, `ready_for_review`, and `review_requested`.
- **FR-002**: PR-Agent MUST use the configured model identifier `gemini/gemini-3.8-flash`.
- **FR-003**: The workflow MUST map the existing `GEMINI_API_KEY` Actions secret to PR-Agent's Google AI Studio provider configuration and MUST NOT store credential values in repository files.
- **FR-004**: The credential preflight MUST fail with a clear message when the secret is absent and MUST NOT print the secret value.
- **FR-005**: The workflow MUST enable automatic code review while keeping automatic PR description and improvement commands disabled.
- **FR-006**: The workflow MUST NOT skip a pull request solely because its event sender is a bot.
- **FR-007**: The change MUST leave CodeRabbit, Amazon Q, Robin-retirement state, application runtime code, and deployment workflows untouched.
- **FR-008**: The workflow MUST retain least-privilege repository permissions needed to read the PR and publish review output.
- **FR-009**: PR-Agent fallback configuration MUST remain on the Gemini provider and MUST NOT use an unrelated default provider.
- **FR-010**: Gemini 3.8 Flash MUST remain the primary model; when it is temporarily unavailable, fallback MAY use Gemini 3.6 Flash.

## Key Entities

- **Pull-request event**: An opened, reopened, synchronized, ready-for-review, or review-requested event that starts the workflow.
- **Gemini Actions secret**: The repository-provided `GEMINI_API_KEY` credential; its value is consumed by the workflow but never logged or committed.
- **PR-Agent review**: The automated review summary and findings published to the pull request.

## Success Criteria

- **SC-001**: Regression tests detect the prior malformed step configuration and reject a workflow that does not select `gemini/gemini-3.8-flash`.
- **SC-002**: A workflow run after this correction reaches the PR-Agent step for every configured same-repository pull-request event type, including bot-authored PRs.
- **SC-003**: A valid credentialed run completes and a Gemini review is visible on the pull request.
- **SC-004**: The secret's value is absent from committed files and workflow output.
- **SC-005**: No unrelated reviewer, application, dependency, or deployment behavior is changed.

## Assumptions

- The repository secret is intended to be named `GEMINI_API_KEY`; this implementation does not create, rotate, or change the secret.
- The secret's existence and validity cannot be confirmed through the available repository-file interface and must be confirmed through a workflow run.
- A real Gemini review cannot be confirmed until the corrected workflow is available on the default branch and a new eligible PR event runs.
