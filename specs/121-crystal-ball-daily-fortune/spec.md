# Feature Specification: Crystal Ball Daily Fortune Experience

**Feature Branch**: `freebuff/312cb61fb800667e9da40810`

**Created**: 2026-11-09

**Status**: Implemented

**Input**: Upgrade the Crystal Ball from a question-first interaction into a daily fortune experience with one optional follow-up question, update its FAQ, and synchronize the Card Reveal, Crystal Ball and Lucky Meter reset countdowns on one local-midnight clock.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate today's fortune without writing a question (Priority: P1)

A visitor opens the Crystal Ball, sees one of three playful greetings, presses **Generate My Fortune**, and receives a daily fortune that remains available after a refresh.

**Why this priority**: Removing the question gate is the central change and makes the Crystal Ball a daily ritual rather than an open-ended chatbot.

**Independent Test**: Open `/crystal-ball` with empty browser storage, confirm a greeting and an enabled Generate button, generate once, refresh, and confirm the same fortune returns without another generation.

**Acceptance Scenarios**:

1. **Given** no saved fortune for today, **When** the page loads, **Then** exactly one of the three approved greetings is displayed and **Generate My Fortune** is enabled without any question text.
2. **Given** the visitor presses **Generate My Fortune**, **When** the response contains a usable reading, **Then** the reading is revealed with the existing pulse, golden maple-leaf, progressive-text and completion effects and saved for the rest of the local day.
3. **Given** today's fortune was already delivered, **When** the visitor refreshes or opens another tab, **Then** the saved fortune is shown again and no additional fortune is requested.
4. **Given** the request fails or returns no usable reading, **When** the visitor tries again, **Then** no daily allowance was consumed.
5. **Given** two tabs request today's fortune at nearly the same time, **When** both requests compete for the daily allowance, **Then** same-origin tabs serialize the operation and only one provider request can deliver and persist a fortune.

### User Story 2 - Ask one optional follow-up about the fortune (Priority: P1)

After the daily fortune is revealed, the visitor may submit one question related to it and receives one follow-up reading that uses the original fortune as context.

**Why this priority**: The follow-up preserves the interactive, personal part of the old experience without turning the feature into an unlimited conversation.

**Independent Test**: Generate a fortune, ask one follow-up, verify the request carries the original fortune, refresh, and confirm both the fortune and the follow-up answer remain and the follow-up input is unavailable.

**Acceptance Scenarios**:

1. **Given** a fortune has been revealed, **When** the reveal finishes, **Then** the prompt "Curious about your fortune? Ask the Crystal Ball one follow-up question." and the **Ask the Crystal Ball** button are displayed.
2. **Given** a non-empty follow-up, **When** it is submitted, **Then** the original fortune is included as context and the answer appears without replaying the full fortune animation.
3. **Given** today's follow-up was already delivered, **When** the visitor refreshes or opens another tab, **Then** the saved question and answer remain and no second follow-up can be submitted.
4. **Given** two tabs submit a follow-up at nearly the same time, **When** both compete for the daily allowance, **Then** only one follow-up request can deliver and persist an answer.
4. **Given** a failed or empty follow-up response, **When** the visitor retries, **Then** the follow-up allowance was not consumed.

### User Story 3 - Read one accurate daily reset across three features (Priority: P2)

Card Reveal, Crystal Ball and Lucky Meter each show a countdown to the same next local midnight while keeping their own daily allowances.

**Why this priority**: Three independent timers can drift, disagree at the reset boundary, and break the promise of a fresh daily experience.

**Independent Test**: On a page with all three displays, compare the rendered remaining time; it agrees, advances once per second, and each feature still resets only its own allowance. Change the local date or time zone and confirm all displays recalculate.

**Acceptance Scenarios**:

1. **Given** the countdown is visible, **When** one second passes, **Then** every display advances from the same shared remaining-time value.
2. **Given** a daylight-saving transition, **When** the next local midnight is calculated, **Then** the deadline follows the local calendar day (23 or 25 hours) rather than a fixed 24-hour offset.
3. **Given** the browser tab returns from the background or regains focus, **When** it becomes active, **Then** the displayed time catches up immediately.
4. **Given** the visitor's local date or time zone changes, **When** the next tick or focus event occurs, **Then** the deadline and date key recalculate.
5. **Given** the reset boundary passes, **When** each feature checks its own stored state, **Then** only that feature's own allowance resets.

### User Story 4 - Enjoy a distinct, calendar-aware Canadian voice (Priority: P2)

Fortunes and fallbacks feel clever, mysterious, warm and unmistakably Canadian, and reflect the visitor's real local season, weekday and nearby Canadian holidays.

**Why this priority**: The experience must not read like a generic chatbot or repeat a handful of fortune-cookie lines.

**Independent Test**: Request fortunes for fixed local dates around Easter, Victoria Day, Canada Day, Thanksgiving, Halloween, Remembrance Day and Christmas and confirm the supplied context names the correct weekday, season and occasion.

**Acceptance Scenarios**:

1. **Given** a local date, **When** a fortune is generated, **Then** the request context uses the visitor's local calendar date with a deterministically calculated weekday, season and Canadian holidays.
2. **Given** a holiday or season, **When** the AI is unavailable, **Then** a seasonal or holiday-aware fallback is delivered and counted as the day's fortune.
3. **Given** any fortune, **When** it mentions an upcoming day or occasion, **Then** the wording uses only supplied calendar facts and never invents a date.
4. **Given** any reading or fallback, **When** it discusses lotteries, **Then** it never promises a win, claims winning numbers, or encourages chasing losses.

### User Story 5 - Read a FAQ that matches the new experience (Priority: P3)

The homepage FAQ explains the daily fortune, the separate daily follow-up, the local-midnight reset and the entertainment-only nature of the readings.

**Independent Test**: Open the homepage FAQ and verify the five new Crystal Ball entries and the updated daily-reset answer match the implemented limits.

**Acceptance Scenarios**:

1. **Given** the homepage, **When** the FAQ is opened, **Then** the Crystal Ball answers describe one fortune and one optional follow-up per local day.
2. **Given** the FAQ, **When** read alongside the Crystal Ball, **Then** no wording still claims three questions per day.
3. **Given** the homepage outside the FAQ, **When** compared with the baseline, **Then** its wording is unchanged.

### Edge Cases

- Browser storage is unavailable: the current page lifetime keeps a usable in-memory allowance and reading.
- Storage contains yesterday's state, malformed JSON, an empty fortune or an out-of-range date: a fresh day starts with no fortune.
- A second tab changes the stored state: the first tab updates through the `storage` event; Web Locks serialize simultaneous same-origin fortune/follow-up requests before either provider call starts.
- A response arrives after the visitor leaves: timers, audio and animation state are cleaned up without consuming an allowance.
- The AI provider is missing, times out, fails, returns blank content or malformed JSON: a usable fallback for the requested mode is delivered and counts as that day's fortune or follow-up; a follow-up failure must never receive a fortune-mode fallback.
- Reduced motion is enabled: decorative pulse and leaf flight are skipped while the full text remains available.
- A 25-hour or 23-hour local day: the countdown reflects the real duration until the next local midnight.

## PR Review Follow-up (2026-11-09)

An independent review of PR #1785 raised five follow-up findings. Only reproducible defects are changed; claims that do not reproduce are covered by regression tests rather than speculative production edits.

### Additional Acceptance Scenarios

1. **Given** another tab saves today's fortune while this tab's request is still in flight, **When** this tab's duplicate response is rejected, **Then** the UI immediately reflects the already-saved fortune, hides **Generate My Fortune**, and does not remain in a stale no-fortune state.
2. **Given** two tabs request a fortune at the same time with Web Locks available, **When** the first response is held open and the second tab competes for the same local day, **Then** exactly one Oracle request succeeds, both tabs display the same saved reading, and storage contains only that reading.
3. **Given** a tab that misses the storage event and has no Web Locks support, **When** a second response arrives after another tab has already delivered today's fortune, **Then** the second response is rejected, the already-saved reading is adopted, and the second reading is never stored.
4. **Given** a successful Oracle response, **When** the client receives it, **Then** the payload contains only fields the client consumes and does not expose the server's internal calendar context.
5. **Given** the fallback promise queue, **When** an operation throws synchronously or rejects, **Then** the queue releases and a later caller for the same local day still runs.
6. **Given** the initial-fortune adoption effect, **When** the saved reading is adopted, **Then** the effect settles without an infinite render loop; no production change is made without a reproduced loop.

### Additional Functional Requirements

- **FR-021**: A duplicate successful fortune response MUST NOT overwrite the delivered reading; the client state MUST reflect the persisted reading before reporting the duplicate.
- **FR-022**: The Oracle success response MUST NOT include the internal calendar `context` object because the client does not consume it.
- **FR-023**: The daily-usage fallback queue MUST recover after synchronous throws and rejected operations.
- **FR-024**: The Playwright Linux harness MUST provide a usable font fallback when the host has no fontconfig configuration or system fonts, without adding a production dependency or changing production rendering.

### Test Environment Note

The `/reveal` countdown case originally could not navigate in the minimal Linux browser image because Chromium's fontconfig interface aborted when no system font was available. Playwright now creates a temporary fontconfig file pointing at the Geist TTF already bundled with Next, but only when the host has neither a fontconfig file nor a system font directory. This is test-environment setup only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Crystal Ball MUST randomly display one of the three approved greetings on each visit.
- **FR-002**: The primary action MUST be **Generate My Fortune** and MUST NOT require a question.
- **FR-003**: The system MUST deliver at most one successfully received fortune per visitor per local calendar day.
- **FR-004**: After the fortune is revealed, the system MUST offer exactly one optional follow-up question per visitor per local calendar day.
- **FR-005**: A follow-up request MUST include the original fortune as context and MUST NOT become an open-ended conversation.
- **FR-006**: The daily fortune, follow-up question, follow-up answer and both usage flags MUST persist in browser-local storage for the local date.
- **FR-007**: Refreshing the page or opening a second tab MUST restore the saved state without generating or consuming another allowance. Same-origin tabs MUST serialize same-day allowance operations so simultaneous requests cannot deliver multiple fortunes or follow-ups.
- **FR-008**: A failed request or a response without a usable reading MUST NOT consume the relevant allowance.
- **FR-009**: A successfully delivered fallback reading MUST count as that day's delivered experience, and the fallback MUST match the requested fortune or follow-up mode.
- **FR-010**: The experience MUST reset at the visitor's next local midnight.
- **FR-011**: The existing short-window API rate limit, validation, sanitization, prompt-injection checks, CORS behavior, error handling and fallback path MUST remain in force.
- **FR-012**: The API MUST distinguish an initial fortune request from a follow-up request.
- **FR-013**: Fortune and follow-up copy MUST use Crystal Ball naming, 2-4 well-written sentences for fortunes, and a distinctly Canadian, varied voice.
- **FR-014**: Calendar context MUST be computed from the visitor's local date with accurate weekday, season and movable Canadian holidays; the AI MUST NOT be asked to guess them.
- **FR-015**: The fallback collection MUST be expanded and include seasonal and holiday-aware alternatives.
- **FR-016**: No reading or fallback may guarantee a win, claim winning numbers, promise supernatural certainty, or encourage overspending or chasing losses.
- **FR-017**: Card Reveal, Crystal Ball and Lucky Meter MUST share one countdown engine and one authoritative next-local-midnight deadline while retaining independent allowances.
- **FR-018**: The shared countdown MUST update every second, recalculate on date/time-zone change, and recover on focus, visibility or page-show.
- **FR-019**: The existing artwork, Milky Way backdrop, starfield, gold/emerald palette, position, reveal animations, maple-leaf transition, audio cues and reduced-motion behavior MUST remain in use.
- **FR-020**: The homepage FAQ MUST describe one fortune and one optional follow-up per local day and MUST NOT alter homepage wording outside the FAQ.

### Key Entities

- **Daily Crystal Ball State**: Local date key, fortune-used flag, follow-up-used flag, saved fortune, saved follow-up question and saved follow-up answer.
- **Daily Reset Clock**: One authoritative `deadlineMs` for the next local midnight plus a shared `remainingMs` and `HH:MM:SS` display value.
- **Fortune Context**: Visitor local date, calculated weekday, month, year, season, today's Canadian holiday and upcoming occasions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can generate and read a fortune without entering any question.
- **SC-002**: All three approved greetings can be observed across visits.
- **SC-003**: After one successful fortune and one successful follow-up, additional requests are blocked until the next local day.
- **SC-004**: A refresh preserves the fortune and follow-up without an extra API request.
- **SC-005**: Failed and unusable responses leave the allowance available; successful fallbacks consume it.
- **SC-006**: All three countdown displays show the same remaining time and advance together, including across a simulated local date change and focus recovery.
- **SC-007**: The FAQ answers match the implemented one-fortune, one-follow-up daily limits.
- **SC-008**: Existing Crystal Ball artwork, animations, audio and reduced-motion support remain intact.
- **SC-009**: All required checks pass and the production build stays below the 495 MB hard maximum.
- **SC-010**: Simultaneous same-day requests from two tabs result in no more than one delivered fortune and one delivered follow-up, including a tab that misses the storage event.
- **SC-011**: A successful Oracle response contains no unused calendar context.

## Assumptions

- The visitor's browser clock and time zone are the source of truth for the local calendar day, matching the existing browser-local allowance design.
- The existing Groq provider and model remain the AI backend; no new service or dependency is introduced.
- The Crystal Ball remains an entertainment feature, and browser storage is a usability limit rather than a tamper-proof quota.
- The homepage outside the FAQ is out of scope and must remain unchanged.
