# Feature Specification: Development-Only Crystal Ball Date Preview

**Feature Branch:** `freebuff/3625a98e3b6b0eab9e6a60b2-date-preview`
**Created:** 2026-11-12
**Status:** Implemented
**Depends on:** PR #1842 (`freebuff/3625a98e3b6b0eab9e6a60b2`), which adds the seasonal
calendar and local-time system this preview exercises.

**Input:** Add a development-only way to preview the Crystal Ball on any local date so every
seasonal window can be reviewed without changing the system clock.

## User Scenarios & Testing

### User Story 1 — Preview any date without touching the system clock (P1)

A developer opens the preview route, chooses a local date and time, and immediately sees the
Crystal Ball as a visitor would on that date: the greeting, the fortune context and the generated
reading.

**Independent Test:** Open `/crystal-ball/preview?previewDate=2026-12-24&previewTime=20:30` in
development and confirm the preview is active, the date/time inputs show those values, the
greeting uses the December 24 local moment, and generated fortunes use that date.

**Acceptance Scenarios**:

1. **Given** the preview route without parameters, **When** it loads, **Then** it redirects to the
   current local date and time so a preview is always active.
2. **Given** a valid `previewDate` and `previewTime`, **Then** the page uses exactly that local
   date and time for the greeting and oracle requests.
3. **Given** an invalid or impossible date, **Then** the preview does not activate and the route
   falls back to the current local date.
4. **Given** a time omitted from the URL, **Then** the current local wall-clock time is used.
5. **Given** the preview is active, **Then** the real browser date and system clock are unchanged.

### User Story 2 — Review every seasonal window quickly (P2)

The preview offers shortcuts to the notable windows so a reviewer does not have to type dates.

**Independent Test:** Use the occasion selector to jump to Canada Day build-up, Canada Day,
Remembrance Day, Christmas stages, Boxing Day, New Year anticipation, New Year's Eve and
New Year's Day, and confirm the date input and experience update.

**Acceptance Scenarios**:

1. **Given** the preview controls, **Then** presets cover January 1, February 14, Good Friday,
   Easter, Mother's Day, Victoria Day, Father's Day, June 24/27/30, July 1/2, Labour Day,
   September 30, Thanksgiving, October 31, November 11, December 1/11/21/24/25/26/27/30/31 and
   January 1/2 of the next year.
2. **Given** a preset is chosen, **Then** the route reloads with that date while preserving the
   selected time.

### User Story 3 — Daily limits do not block review (P1)

Previewing a date repeatedly must not consume the visitor's real daily fortune or follow-up.

**Independent Test:** Generate a fortune and follow-up on the preview page, reload, change date,
and confirm the page still offers a new fortune and that `/crystal-ball` keeps its real daily
allowance.

**Acceptance Scenarios**:

1. **Given** preview mode, **When** a fortune is generated, **Then** it is held in page state only
   and never written to the daily-usage storage key.
2. **Given** preview mode, **When** the follow-up is used, **Then** it is held in page state only.
3. **Given** preview mode, **Then** the reset line explains that the daily allowance is bypassed.
4. **Given** the normal `/crystal-ball` route, **Then** its daily allowance, greeting storage and
   behaviour are unchanged.

### User Story 4 — Development-only and production-safe (P1)

The preview must not exist in production.

**Independent Test:** Build for production and request `/crystal-ball/preview`; the response is the
standard 404. Confirm `/crystal-ball` renders unchanged in production.

**Acceptance Scenarios**:

1. **Given** `NODE_ENV=production`, **Then** the preview route renders the not-found page.
2. **Given** a production build, **Then** `isPreviewEnabled()` is false and no preview controls
   render.
3. **Given** the normal Crystal Ball page, **Then** no preview markup, query parsing or visual
   change is added to it.

## Requirements

- **FR-001**: Add a development-only preview route and no preview UI on `/crystal-ball`.
- **FR-002**: Read and validate `previewDate` (`YYYY-MM-DD`) and `previewTime` (`HH:MM`) from the
  URL; default the time to the current local clock and the route to today's local date.
- **FR-003**: Use one shared preview moment for the greeting, the oracle payload and the displayed
  time zone.
- **FR-004**: Provide a date input, time input, occasion presets and time-of-day shortcuts.
- **FR-005**: Bypass daily-usage storage and locks in preview mode; keep readings in page state.
- **FR-006**: Return the standard 404 for the route in production.
- **FR-007**: Preserve `/crystal-ball`, its artwork, CSS, animations, daily allowance and
  follow-up flow exactly.
- **FR-008**: Keep the production build below 495 MiB.

## Key Entities

- **Preview Selection**: validated local date, local time and the constructed local `Date`.
- **Preview Preset**: label, optional group, and `YYYY-MM-DD` key.

## Success Criteria

- **SC-001**: A valid preview URL activates the selected local date and time.
- **SC-002**: Invalid dates cannot activate the preview.
- **SC-003**: All seasonal windows are reachable from presets or the date input.
- **SC-004**: Preview readings never touch the real daily-usage storage.
- **SC-005**: Production returns 404 for the preview route and `/crystal-ball` is unchanged.
- **SC-006**: Tests, type check, build and the repository gate pass below 495 MiB.
