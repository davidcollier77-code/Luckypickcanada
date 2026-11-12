# Feature Specification: Crystal Ball Visual Greeting Alignment

**Feature Branch**: `fix/crystal-ball-visual-greeting-tests-20261112`

**Created**: 2026-11-12

**Status**: Implemented

**Input**: Repair the failing Crystal Ball visual tests after the daily greeting pool expanded from four to ten personalities.

## User Scenarios & Testing

### User Story 1 - Visual QA validates the live greeting experience (Priority: P1)

A visitor sees the Crystal Ball greeting, and automated browser coverage recognizes the greetings the application currently serves, including its quiet commemorative-day messages.

**Why this priority**: Stale expectations currently fail Visual QA on valid, intentional greeting content and obscure real regressions.

**Independent Test**: Run the three affected Crystal Ball visual specs across the configured desktop, mobile-390 and mobile-412 projects.

**Acceptance Scenarios**:

1. **Given** an ordinary local date, **When** a browser spec reads the greeting, **Then** it recognizes any personality from the application's current greeting pool.
2. **Given** Remembrance Day, National Day for Truth and Reconciliation or Good Friday, **When** a browser spec reads the greeting, **Then** it recognizes the correct quiet greeting rather than requiring a playful personality or time-of-day salutation.
3. **Given** the previous day's stored greeting index is zero, **When** a new daily greeting is selected, **Then** the persisted index is not zero and remains stable after refresh.

## Requirements

### Functional Requirements

- **FR-001**: Visual tests MUST use the application's exported `GREETINGS` collection as the source of truth instead of maintaining a duplicate four-item list.
- **FR-002**: Shared browser assertions MUST accept the active quiet greeting returned by `getQuietGreeting` for the browser's own local date.
- **FR-003**: Greeting stability and consecutive-day non-repetition checks MUST remain covered.
- **FR-004**: The visual test changes MUST preserve existing assertions for greeting placement, typing cursor, Crystal Ball artwork, fortune reveal and follow-up behavior.
- **FR-005**: No application behavior, greeting copy, artwork, CSS or production routes may change as part of this repair.

## Edge Cases

- The greeting pool may grow again; tests must not need a manually synchronized copy.
- Quiet greetings replace the personality and local salutation on selected commemorative dates.
- Browser-local date may differ from the CI runner's timezone; quiet-day evaluation must use the browser's date key.

## Assumptions

- `GREETINGS` and `getQuietGreeting` are the authoritative exports from the existing client greeting module.
- The existing Playwright projects and Visual QA workflow are the intended verification environment.

## Success Criteria

- **SC-001**: All hard-coded four-greeting expectations are removed from the three failing visual specs.
- **SC-002**: The shared assertion recognizes all ten current personalities and the configured quiet greetings.
- **SC-003**: Desktop, mobile-390 and mobile-412 visual suites pass after the PR-triggered run.
