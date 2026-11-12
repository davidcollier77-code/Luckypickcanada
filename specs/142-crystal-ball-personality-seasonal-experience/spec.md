# Feature Specification: Crystal Ball Personality, Local Time and Canadian Seasonal Identity

**Feature Branch**: `freebuff/3625a98e3b6b0eab9e6a60b2`
**Created**: 2026-11-12
**Status**: Implemented

**Input**: Improve the existing Crystal Ball experience with stronger personality and humour,
more varied fortunes, browser-local date/time awareness, and accurate Canadian seasonal and
holiday recognition. Preserve the existing artwork, design, animations and fortune/follow-up
functionality.

## User Scenarios & Testing

### User Story 1 — A funny, warm Canadian voice (P1)

A visitor presses **Generate My Fortune** and receives a reading that sounds like the Lucky Pick
Canada Crystal Ball: clever, warm, occasionally cheeky, unmistakably Canadian and never mean.

**Independent Test**: Generate fortunes across many local dates and inspect the system prompt and
fallback pools; confirm humour guidance is present on ordinary days, absent on solemn days, and
that fallback readings rotate across styles.

**Acceptance Scenarios**:

1. **Given** an ordinary day, **When** a fortune is generated, **Then** the reading may use Canadian
   expressions, everyday situations, gentle sarcasm and an unexpected punchline without forcing them.
2. **Given** repeated requests, **When** readings are produced, **Then** style, opening, length and
   punchline vary rather than repeating one template.
3. **Given** any reading, **Then** it never promises a lottery win, guaranteed wealth, or knowledge of
   winning numbers, and never makes cruel, political or tragedy-related jokes.

### User Story 2 — Browser-local time and greetings (P1)

The Crystal Ball uses the visitor's browser clock, time zone and calendar date as one shared local
time system, and greets the visitor appropriately for the time of day.

**Independent Test**: Load `/crystal-ball` at simulated local times and confirm the greeting and
fortune context change between morning, afternoon, evening and late night; confirm the greeting
updates while the page stays open and resets at local midnight.

**Acceptance Scenarios**:

1. **Given** a local time between 05:00 and 11:59, **Then** the experience uses a morning greeting.
2. **Given** 12:00–16:59, **Then** an afternoon greeting; 17:00–21:59, an evening greeting;
   22:00–04:59, a late-night greeting.
3. **Given** the page remains open across a greeting boundary, **Then** the greeting updates without
   a reload.
4. **Given** local midnight, **Then** the daily fortune, follow-up and greeting reset correctly.
5. **Given** a daylight-saving transition or time-zone change, **Then** the local date and next
   midnight remain correct because they are built from the browser's local `Date`.

### User Story 3 — Canadian holidays and seasons (P1)

Fortunes recognise the current season and the major Canadian holidays, build anticipation before
them, recognise the day itself, and return naturally to everyday fortunes afterwards.

**Independent Test**: Request the calendar context for representative dates for every holiday and
inspect the occasion focus, tone and prompt; confirm movable holidays (Easter, Victoria Day,
Mother's Day, Father's Day, Labour Day, Thanksgiving) are calculated correctly.

**Acceptance Scenarios**:

1. **Given** New Year's Day, Valentine's Day, Easter, Victoria Day, Canada Day, Labour Day, the
   National Day for Truth and Reconciliation, Thanksgiving, Remembrance Day, Christmas, Boxing Day,
   Mother's Day or Father's Day, **Then** the date is recognised.
2. **Given** June 24–30, **Then** a Canada Day build-up increments daily; July 1 is a full Canadian
   celebration; July 2 returns to ordinary summer fortunes.
3. **Given** December 1–24, **Then** subtle Christmas magic grows through the month; December 25 is a
   distinct Christmas Day.
4. **Given** December 26–30, **Then** New Year's anticipation builds; December 31 is a distinct New
   Year's Eve; January 1 is a distinct New Year's Day; January 2 returns to everyday winter.
5. **Given** November 11, **Then** the tone is respectful and reflective with no humour or
   celebration, and no anticipation before or afterglow after.
6. **Given** September 30, **Then** the tone is thoughtful and respectful with no humour.
7. **Given** no occasion, **Then** everyday seasonal fortunes remain interesting and no holiday is
   forced into the reading.

### User Story 4 — Existing experience preserved (P1)

The daily AI fortune, optional follow-up question, reveal animation, audio, artwork, daily
allowance, multi-tab locking, validation and rate limiting continue to work unchanged.

**Independent Test**: Run the existing Crystal Ball unit and visual tests, plus the oracle route
validation tests, and verify the fortune/follow-up flow and artwork assertions still pass.

## Requirements

- **FR-001**: Use one shared visitor-local time module for the greeting, the API request context and
  the fortune atmosphere; never use the server's time zone for the visitor's local date.
- **FR-002**: Keep the four approved daily greetings, expand the pool for variety, and prefix the
  greeting with a time-of-day salutation unless the day calls for a solemn greeting.
- **FR-003**: Keep the daily greeting stable for the local day and never repeat the previous day's
  greeting.
- **FR-004**: Recognise the listed Canadian holidays and calculate movable dates correctly.
- **FR-005**: Implement the Canada Day (June 24–30), Christmas (December 1–24), New Year
  (December 26–January 1) windows exactly, with escalating intensity and a natural return.
- **FR-006**: Remembrance Day and the National Day for Truth and Reconciliation must never use humour,
  celebration or political commentary.
- **FR-007**: Keep the existing fortune/follow-up API contract, validation, rate limiting, daily
  browser allowance and fallback behaviour.
- **FR-008**: Provide substantial, curated fallback pools for every occasion and season so a
  provider failure still produces an appropriate, varied reading.
- **FR-009**: Preserve the artwork, CSS, animations, audio and page structure.
- **FR-010**: Keep the production build strictly below 495 MiB.

## Key Entities

- **Local Moment**: the browser's date key, weekday, wall-clock time, time zone and time-of-day
  period.
- **Occasion Focus**: the active holiday or seasonal window, its phase, intensity and tone.
- **Fallback Reading**: a curated reading selected by occasion, season or general pool.

## Success Criteria

- **SC-001**: Greeting, API context and fallback selection all use the same local-time helpers.
- **SC-002**: All listed holidays and windows produce the specified focus and tone in automated tests.
- **SC-003**: Existing Crystal Ball and oracle tests pass, with new coverage for dates, greetings and
  fallback selection.
- **SC-004**: Type checking, the production build and `./freebuff-verify.sh` pass below 495 MiB.
- **SC-005**: No visual redesign, artwork change or change to the follow-up flow.
