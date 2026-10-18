# Feature Specification: CI Stability Repair

**Feature Branch**: `fix/ci-stability-1518`  
**Created**: 2026-10-18  
**Status**: Implementation prepared; current-head CI verification pending  
**Input**: Resolve verified CI failures surfaced while reviewing PR #1518, without changing application behavior.

## User Scenarios & Testing

### User Story 1 — Automated review fallback remains callable (Priority: P1)

A repository maintainer expects the Robin workflow's Groq fallback to use a model ID that is supported on the configured developer tier so that a failed primary review can proceed instead of stopping at a provider 404.

**Acceptance Scenarios**

1. **Given** the configured Groq fallback runs, **when** it reads its model configuration, **then** both the action input and diagnostic/preflight fallback model name identify the same supported model.
2. **Given** the workflow test validates the fallback configuration, **when** the model setting changes, **then** the test checks the exact configured model ID and still ensures the fallback uses Groq independently from OpenRouter.

### User Story 2 — Crystal Ball allowance Visual QA reflects the actual UI (Priority: P1)

A maintainer expects the daily-limit test to verify the live UI reliably and to compare the exhausted-allowance message exactly as rendered.

**Acceptance Scenarios**

1. **Given** three successful answers, **when** the allowance message renders, **then** the test matches the message punctuation used by the UI and confirms the button is disabled.
2. **Given** the button is expected to re-enable between answers, **when** the next answer can be submitted, **then** the test retains an explicit enabled-state assertion after the remaining-count message.
3. **Given** cold navigation and animated reveals take longer than usual, **when** the test runs, **then** the overall allowance-flow budget is 90 seconds and bounded assertions retain explicit timeouts.

## Requirements

- **FR-001**: The Groq fallback model identifiers in the workflow must be identical and supported on the configured tier.
- **FR-002**: The workflow regression test must assert the configured fallback model ID and retain provider-isolation checks.
- **FR-003**: The daily-limit Visual QA test must match the displayed exhausted-allowance text exactly, preserve the after-answer re-enable assertion, and use a realistic bounded test timeout.
- **FR-004**: No application runtime logic, dependency, lockfile, security setting, or deployment architecture may change as part of this repair.
- **FR-005**: Verification claims must be limited to actual current-head CI/local command results.

## Success Criteria

- **SC-001**: The workflow no longer configures either deprecated Llama model ID for the developer-tier Groq fallback.
- **SC-002**: The workflow unit test passes with the configured model ID.
- **SC-003**: The Crystal Ball daily-limit Playwright test passes against the live UI text while retaining all three-answer and button re-enable checks.
- **SC-004**: The required repository checks pass on the final commit and the build-size gate remains below 495 MB.
