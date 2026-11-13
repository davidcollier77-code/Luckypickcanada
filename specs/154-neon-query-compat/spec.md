# Feature Specification: Restore Lucky Stories Database Reads

**Feature Branch**: `154-neon-query-compat`

**Created**: 2026-11-13

**Status**: Implemented

**Input**: User description: "Restore the live Lucky Community Stories map and story feed after the Neon serverless driver update."

## User Scenarios & Testing

### User Story 1 - Browse published Canadian community stories (Priority: P1)

A visitor opens the Lucky Community Stories map and sees the published story total, province and territory counts, recent activity and the stories available for the selected province.

**Why this priority**: The map and stories are unavailable when the configured database reads fail. Restoring this journey brings the site's existing community content back to visitors.

**Independent Test**: Use a configured data store containing 21 approved stories, open the map and browse a province with stories.

**Acceptance Scenarios**:

1. **Given** the data store is configured and contains 21 approved stories, **When** a visitor opens the map, **Then** the map reports 21 total stories and the appropriate province and territory counts.
2. **Given** a province has published stories, **When** a visitor selects that province or loads another page, **Then** the correct stories and province total are returned.
3. **Given** a visitor opens a shared story link, **When** the story is looked up, **Then** the corresponding approved story is returned.
4. **Given** the database is genuinely unavailable, **When** the map is requested, **Then** the existing unavailable-database state remains safe and truthful.

### Edge Cases

- A province has no approved stories.
- The visitor requests a later page after reaching the end of a province's stories.
- A 24-hour filter is active while all-time province totals remain available.
- A shared-story ID does not identify an approved story.
- Database reads fail; the application must not fabricate counts or stories.

## Requirements

### Functional Requirements

- **FR-001**: The map MUST load the published story summary when the configured data store is available.
- **FR-002**: Visitors MUST be able to browse stories by province or territory, including paged results and recent activity.
- **FR-003**: A valid shared-story link MUST return its matching approved story.
- **FR-004**: Existing unavailable-database behavior MUST remain in place when the data store cannot be accessed.
- **FR-005**: Existing story records, publication status, schema, and submission safeguards MUST remain unchanged.

### Key Entities

- **Community Story**: An approved visitor-submitted story with its author name, Canadian location, text and creation time.
- **Province Summary**: Published story counts grouped by the thirteen Canadian provinces and territories.

## Success Criteria

### Measurable Outcomes

- **SC-001**: With 21 approved records present, the map reports 21 total stories after a successful load.
- **SC-002**: Province counts and story pages correctly represent the stored approved stories.
- **SC-003**: Recent activity and shared-story links load without a database-unavailable response when the data store is available.
- **SC-004**: No existing story record or submission safeguard is changed by this repair.

## Assumptions

- The existing Neon database, its schema, and its 21 approved records are the source of truth.
- The existing province matching, story pagination, recent-activity rules, caching, and user interface remain in scope only as behavior to preserve.
- The repair is limited to restoring compatibility with the already-installed database driver; it is not a database migration or a hosting change.
