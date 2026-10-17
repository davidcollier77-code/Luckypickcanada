# Feature Specification: Crystal Ball Browser-Local Daily Allowance

**Feature Branch**: \`028-crystal-ball-browser-daily-limit\`

**Created**: 2026-10-17

**Status**: In Progress

**Input**: User-authorized change: track the Crystal Ball's three-question daily allowance in the visitor's browser, reset it at their local midnight, and show a countdown, removing the separate persistent IP-based daily quota.

## User Scenarios & Testing

### User Story 1 — Understand the daily allowance (Priority: P1)

A visitor opens the Crystal Ball and can see how many of their three daily AI-backed answers remain and how long until the allowance resets.

**Why this priority**: Clear feedback prevents surprise lockout and helps the visitor understand the daily cap.

**Independent Test**: Open \`/crystal-ball\` with empty local storage and verify that three questions remain and a live countdown to the visitor's next local midnight is shown.

**Acceptance Scenarios**:

1. **Given** no saved usage for today's local date, **When** the Crystal Ball loads, **Then** it shows three questions remaining.
2. **Given** a visitor has used one or two AI-backed answers, **When** the Crystal Ball displays its allowance, **Then** the remaining count reflects those completed answers.
3. **Given** the allowance is displayed, **When** one second passes, **Then** its countdown decreases by approximately one second.
4. **Given** the visitor reaches the local day boundary, **When** the local date changes, **Then** the allowance resets to three and the countdown starts toward the next local midnight.

### User Story 2 — Enforce a lightweight visitor-side daily limit (Priority: P1)

The visitor may receive up to three successful AI-backed answers per local calendar day. The browser stores the usage count. Clearing or editing browser storage can reset/bypass the counter; this limitation is accepted as a deliberate simple, low-friction design choice.

**Why this priority**: Limits normal daily AI usage without keeping a persistent server-side daily IP quota.

**Independent Test**: Submit three successful AI-backed questions; confirm the fourth submission is disabled and no fourth API request is sent. Reset or change the saved local date and confirm a fresh allowance is available.

**Acceptance Scenarios**:

1. **Given** fewer than three AI-backed answers today, **When** a valid question receives an AI answer, **Then** one slot is consumed and saved.
2. **Given** three AI-backed answers today, **When** the visitor attempts a fourth question, **Then** submission is disabled and a clear reached-limit message is displayed.
3. **Given** a different local calendar date, **When** the page checks usage, **Then** yesterday's count is not reused.
4. **Given** browser storage is unavailable, **When** the visitor uses the current page, **Then** an in-memory counter still limits normal use for that page lifetime.
5. **Given** the AI provider is unavailable and the API returns a fallback fortune, **When** that fallback is displayed, **Then** it does not consume an AI-answer slot.

### User Story 3 — Keep API protections and fallback behavior (Priority: P1)

Valid questions continue to use the current Oracle API and its short-window request limiter. Malformed, empty, oversized, or prompt-injection-like questions are rejected before any AI provider call.

**Independent Test**: Post empty and invalid bodies to the Oracle API and verify a 400 response; verify a valid question follows the existing AI/fallback flow and request-rate limit.

**Acceptance Scenarios**:

1. **Given** an empty or missing question, **When** a POST reaches the Oracle API, **Then** it returns 400 and does not call the AI provider.
2. **Given** an overlength or filtered question, **When** it is submitted, **Then** it returns 400 and does not call the AI provider.
3. **Given** the short-window request limit is exceeded, **When** another request arrives, **Then** the API returns 429.
4. **Given** no AI key or an upstream failure, **When** a valid question is submitted, **Then** the existing generic fallback fortune remains available.

## Edge Cases

- A stored date from an earlier local day must reset to zero usage.
- Malformed JSON or a non-string question must be rejected.
- Local storage can be denied or unavailable; use in-memory state for the current page lifetime.
- Multiple tabs in the same browser should receive storage change events and refresh the displayed count.
- Visitors can clear or edit local storage to bypass the daily cap. This is accepted and is not presented as tamper-proof cost control.
- Daylight-saving transitions must use the browser's local calendar constructor rather than assuming a 24-hour day.
- A failed or fallback response must not falsely increment successful AI-backed answer usage.

## Requirements

### Functional Requirements

- **FR-001**: Limit visitors to three successful AI-backed answers per local calendar day in browser storage.
- **FR-002**: Store a local date key and bounded usage count in \`localStorage\`.
- **FR-003**: Reset usage when the visitor's local calendar date changes.
- **FR-004**: Display the remaining count, exhausted message, and a live HH:MM:SS countdown to the next local midnight.
- **FR-005**: Disable the submit button when the local allowance is exhausted.
- **FR-006**: Remove the separate persistent daily IP-based quota and its GET status endpoint.
- **FR-007**: Preserve the Oracle API's short-window rate limit, CORS behavior, question sanitation/validation, AI prompt, response aliases, and fallback fortune behavior.
- **FR-008**: Reject missing, non-string, empty, overlength, and filtered questions before calling the AI provider.
- **FR-009**: Do not add dependencies, tables, environment variables, or new persistent backend quota state.
- **FR-010**: Keep the current artwork, reveal sequence, audio behavior, accessibility behavior, and responsive UI unchanged aside from the allowance countdown.

## Key Entities

- **Visitor Daily Usage**: Local calendar date and number of completed AI-backed answers (0–3), stored client-side.
- **Daily Countdown**: Milliseconds between the current browser clock and next local midnight.

## Success Criteria

- **SC-001**: A fresh browser day starts with three remaining AI-backed answers.
- **SC-002**: After three successful AI-backed answers, the UI prevents a fourth submission until local midnight.
- **SC-003**: The timer visibly updates at one-second intervals and targets the visitor's local midnight, including across daylight-saving transitions.
- **SC-004**: Invalid questions are rejected before any provider fetch.
- **SC-005**: The IP-based persistent daily quota code and server-side GET status flow are removed while the ten-requests-per-minute API limiter remains.
- **SC-006**: Automated tests, TypeScript verification, build, and build-size checks pass; the combined \`.next + public\` output remains below the hard 495 MiB cap.

## Assumptions

- The daily allowance counts successful AI-backed responses, consistent with the existing behavior. Generic fallback fortunes do not consume a slot because they do not represent an AI-backed answer.
- The counter is a usability limit, not tamper-resistant security or billing enforcement. Clearing browser storage can restore the local allowance.
- The browser's local calendar date and timezone define the daily boundary.
- The existing short-window IP request-rate limiter stays in place.
