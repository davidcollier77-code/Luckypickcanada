# Feature Specification: Crystal Ball Token Budgets and Fallback Resilience

**Feature Branch:** `freebuff/afd3081cdcd4503da85c6349`
**Created:** 2026-11-13
**Status:** Implemented

**Input:** Adjust the Crystal Ball's Groq token limits and improve its existing fallback handling
without changing the daily fortune flow, the 197 curated daily fallbacks, the seasonal selection
logic, the Crystal Ball visuals or the daily allowances.

## User Scenarios & Testing

### User Story 1 — Correct Groq budgets per request type (Priority: P1)

The Crystal Ball keeps `openai/gpt-oss-20b` at low reasoning effort, spends at most 900 completion
tokens on a daily fortune and at most 700 on a follow-up answer, and leaves every other Groq
setting unchanged.

**Why this priority**: The daily reading needs more room than the concise follow-up answer, and an
incorrect budget can return an empty response.

**Independent Test**: Inspect the provider request built for a fortune and for a follow-up; assert
the model, `reasoning_effort`, temperature and both `max_completion_tokens` values.

**Acceptance Scenarios**:

1. **Given** a daily fortune request, **When** the oracle calls Groq, **Then** the payload uses
   `openai/gpt-oss-20b`, `reasoning_effort: "low"` and `max_completion_tokens: 900`.
2. **Given** a follow-up request, **Then** the same model and reasoning effort are used with
   `max_completion_tokens: 700`.
3. **Given** either request, **Then** the existing temperature, messages, prompt and timeout
   behaviour are unchanged.

---

### User Story 2 — A different fallback fortune on consecutive local days (Priority: P1)

A visitor who receives a curated fallback fortune today does not receive that same fortune again
tomorrow if the provider is unavailable again. The fortune returns to the pool after a day has
passed, and fallback selection stays seasonal and occasion-appropriate.

**Why this priority**: Repeating the same reading on back-to-back days makes an outage obvious and
weakens the daily experience.

**Independent Test**: Simulate a fallback on day one, then request the next local day's fallback
with that fortune recorded as the previous day's; assert a different fortune is selected. Repeat
with a two-day-old record and assert the original fortune is eligible again.

**Acceptance Scenarios**:

1. **Given** every daily fallback fortune, **Then** it has a stable unique identifier.
2. **Given** the visitor received fallback fortune X on the previous local calendar day, **When**
   today's fallback is selected, **Then** X is not selected.
3. **Given** the last fallback record is two or more local days old, **Then** that fortune is
   eligible again.
4. **Given** the browser stores the last fallback, **Then** only its identifier and local date are
   stored.
5. **Given** a seasonal or occasion-specific date, **Then** exclusion never causes an unrelated
   general fortune to replace the appropriate seasonal or occasion pool.

---

### User Story 3 — A clear follow-up outage message without a substitute fortune (Priority: P1)

When Groq cannot provide a usable follow-up answer, the visitor sees the supplied apology message
after submitting the question. The Crystal Ball does not substitute another fortune, the daily
fortune still works, and no question, answer or Q&A history is persisted.

**Why this priority**: The follow-up is a separate feature; a provider outage must not corrupt the
daily fortune or masquerade as an answer.

**Independent Test**: Force a provider failure for a follow-up and assert the response contains no
reading, the exact message is returned, and the component displays it after submission. Inspect
browser storage and assert only the daily allowance flags and fortune remain.

**Acceptance Scenarios**:

1. **Given** a follow-up request and a missing key, network error, non-success response, malformed
   JSON or empty content, **When** the request completes, **Then** the visitor sees exactly:
   `🔮 The Crystal Ball has been hit hard with fortunes and questions today. I've used up my magical energy and need a little rest.`
   followed by the two supplied closing paragraphs.
2. **Given** the follow-up failure, **Then** no fallback fortune or other reading is returned in
   its place.
3. **Given** the daily fortune is requested during the same outage, **Then** it still returns a
   usable curated fallback.
4. **Given** a follow-up question is submitted, **Then** the question, any generated answer and any
   Q&A history are not written to browser storage or kept after the page is left.
5. **Given** the follow-up outage, **Then** the existing one-follow-up-per-day limit and local
   midnight reset still apply.

---

### User Story 4 — Preserved daily fortune experience (Priority: P2)

The daily fortune still works exactly as before, including all 197 curated fallbacks, their
general, seasonal and occasion-specific selection logic, the daily limit, reset countdown, artwork,
layout, animations and unrelated functionality.

**Why this priority**: The change must improve resilience without regressing the core experience.

**Independent Test**: Run the existing Crystal Ball unit and visual checks; request fallbacks on
ordinary, seasonal, holiday and solemn dates and confirm pool-appropriate readings.

**Acceptance Scenarios**:

1. **Given** all 197 daily fallback fortunes, **Then** all remain available and no follow-up
   fallback pool remains.
2. **Given** an ordinary, seasonal or holiday date, **Then** the existing weighted selection and
   tone rules still choose from the appropriate pools.
3. **Given** no Groq key or a provider failure, **Then** a daily fortune is still delivered and
   consumed once for the local day.
4. **Given** the existing Crystal Ball page, **Then** artwork, CSS, animations, audio, navigation
   and layout are unchanged.

### Edge Cases

- A corrupt or unreadable fallback-history record is ignored and never blocks a fortune.
- Browser storage is unavailable: the daily fortune still works for the page lifetime and the
  fallback-history feature silently does nothing.
- The excluded fortune is the only candidate in a very small pool: selection falls back to the
  unfiltered pool rather than returning nothing.
- A stored follow-up question or answer from an older client is dropped the next time usage is
  normalised and never displayed again.
- A follow-up response arrives after local midnight: the existing clock-turn behaviour applies.

## Requirements

### Functional Requirements

- **FR-001**: The daily fortune request MUST keep model `openai/gpt-oss-20b` and
  `reasoning_effort: "low"`.
- **FR-002**: The daily fortune request MUST use `max_completion_tokens: 900`.
- **FR-003**: The follow-up request MUST use `max_completion_tokens: 700`.
- **FR-004**: All other Groq request settings MUST remain unchanged.
- **FR-005**: All 197 daily fallback fortunes and their existing general, seasonal and
  occasion-specific selection logic MUST be preserved.
- **FR-006**: Every daily fallback fortune MUST have a stable unique identifier.
- **FR-007**: Browser-local storage MUST retain only the last fallback fortune identifier and its
  local date.
- **FR-008**: A fallback fortune received on the previous local calendar day MUST be excluded from
  the next local day's selection and MUST become eligible again once a day has passed.
- **FR-009**: Exclusion MUST preserve seasonal and occasion relevance.
- **FR-010**: The 14 pre-written follow-up fallback answers MUST be removed.
- **FR-011**: When Groq cannot provide a usable follow-up answer, the visitor MUST see the exact
  supplied message after submitting the question.
- **FR-012**: A follow-up failure MUST NOT be replaced with a fortune or other substitute reading.
- **FR-013**: Daily fortunes MUST still be delivered, including a curated fallback, when Groq is
  unavailable.
- **FR-014**: Visitor follow-up questions, AI-generated follow-up answers and Q&A history MUST NOT
  be stored.
- **FR-015**: Existing daily limits, reset behaviour, visuals, artwork, layout, animations and
  unrelated functionality MUST be preserved.

### Key Entities

- **Daily fallback fortune**: Curated reading with a stable identifier and pool membership
  (general, season or occasion).
- **Fallback history record**: The last fallback identifier and the visitor's local calendar date.
- **Daily usage record**: The local date, the daily fortune, and the daily fortune/follow-up used
  flags. It no longer contains follow-up question or answer text.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both provider requests carry the exact token budgets and unchanged model settings.
- **SC-002**: The daily fallback collection still contains exactly 197 readings and the follow-up
  fallback collection contains zero.
- **SC-003**: A recorded fallback from the previous day cannot be selected the next day, while a
  record older than one day can be selected again.
- **SC-004**: The follow-up outage message is displayed character-for-character as supplied, and no
  substitute reading is returned.
- **SC-005**: Browser storage after a follow-up contains no question, answer or Q&A text.
- **SC-006**: Focused tests, the applicable full unit suite, type check and production build pass,
  with the build below 495 MiB.

## Assumptions

- "Groq cannot provide a usable answer" covers a missing key, network failure, timeout, non-success
  response, malformed JSON and blank content.
- The follow-up attempt counts toward the existing one-per-day allowance, matching the supplied
  message's "come back tomorrow" wording and the previous fallback-answer behaviour.
- The fallback identifier is an internal variety hint; it never bypasses the daily allowance or
  affects the daily fortune's content selection beyond exclusion.
- The existing Nobel-style curated text and weighted selection are retained verbatim.
