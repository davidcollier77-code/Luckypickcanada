# Feature Specification: Community Stories Map Population and Statistics Cleanup

**Feature Branch**: fix/community-stories-map-21-20261108
**Created**: 2026-11-08
**Status**: Draft
**Input**: Fix only the Lucky Community Stories section: remove two redundant statistic cards, retain the all-time total, publish the prepared 21 stories with their province assignments and timestamps so exactly two appear in Last 24 Hours. Do not change the homepage.

## User Scenarios & Testing

### User Story 1 - See the complete community story collection (Priority: P1)
A visitor opens Lucky Community Stories and sees all 21 approved stories represented in the map and province browsing experience.

**Why this priority**: The map is incomplete and misleading if production does not contain the prepared collection.

**Independent Test**: Load the production map and verify 21 stories, their province groupings, and their story content.

**Acceptance Scenarios**:
1. Given 21 prepared approved stories, when a visitor opens the map, then the all-time total displays 21.
2. Given a story has a Canadian province or territory, when map data loads, then that story is included under its matching region.
3. Given the original eight production stories exist, when the prepared collection is published, then those records are retained without duplication or loss.

### User Story 2 - Understand the map at a glance (Priority: P1)
A visitor sees one useful statistic for total stories submitted, without redundant province-count or marker-count cards.

**Why this priority**: The map itself communicates provincial distribution; the extra cards are confusing and unnecessary.

**Independent Test**: Inspect the rendered statistics area and verify it contains only the all-time total card.

**Acceptance Scenarios**:
1. Given the map page is displayed, when the statistics section renders, then only Total Lucky Stories Shared (All-Time) is shown.
2. Given the map is populated, when stories are grouped by province, then province markers and province story listings remain functional.

### User Story 3 - Show the intended recent stories (Priority: P1)
A visitor selects Last 24 Hours and sees exactly the two stories intentionally assigned to the recent window.

**Why this priority**: The recent filter is a key part of the prepared map experience.

**Independent Test**: Verify the recent filter returns the two intended records and excludes the other 19.

**Acceptance Scenarios**:
1. Given 21 approved stories exist, when Last 24 Hours is selected, then exactly the two prepared recent stories appear.
2. Given All-Time is selected, when the map loads, then all 21 stories remain available.
3. Given the user selects a province, when the view updates, then story-to-province relationships remain correct.

### Edge Cases
- A production record already has a prepared ID: do not duplicate or overwrite it without confirming its identity.
- A story has an unrecognized or missing location: do not guess a province.
- Cached map data may be stale after publication; invalidate or wait out the relevant cache before claiming the live view is current.
- Timestamps are UTC; the 24-hour filter uses elapsed time, not calendar-day boundaries.

## Requirements

### Functional Requirements
- FR-001: Statistics MUST display only the all-time total story count.
- FR-002: Statistics MUST NOT display a province-count card.
- FR-003: Statistics MUST NOT display a mapped-marker-count card.
- FR-004: Production MUST contain the 21 prepared approved story records, preserving the original eight and adding the remaining 13 without duplication.
- FR-005: Every prepared story MUST retain its intended province or territory.
- FR-006: The prepared timestamps MUST be applied, with the two intended recent records inside the rolling 24-hour window at publication.
- FR-007: Last 24 Hours MUST show exactly those two stories at verification; All-Time MUST show all 21.
- FR-008: Province markers, counts, province selection, previews and full-story viewing MUST continue to work.
- FR-009: Homepage and unrelated routes, artwork, copy, navigation and payment behavior MUST remain unchanged.

### Key Entities
- Community Story: approved visitor story with display name, province/territory, text and creation timestamp.
- Province/Territory Group: Canadian region used to group stories and populate the corresponding map marker.

## Success Criteria
- SC-001: The all-time statistic displays exactly 21 approved stories.
- SC-002: Exactly 21 prepared stories are available across province/territory groupings.
- SC-003: Last 24 Hours displays exactly two intended stories at publication verification.
- SC-004: Only one statistic card is visible.
- SC-005: All 13 province/territory marker controls remain selectable and accessible.
- SC-006: No homepage files or unrelated product behavior are changed.

## Assumptions
- Development's 21 records are the approved prepared collection; IDs 1–8 match production in display name, location and story content.
- The intended recent records are ID 20 (DevLee, Northwest Territories, 2026-11-07 14:30 UTC) and ID 21 (DevMorgan, Nunavut, 2026-11-08 08:15 UTC).
- Prepared dates for all 21 records are authoritative.
- The user's request explicitly authorizes the production story-data publication.
