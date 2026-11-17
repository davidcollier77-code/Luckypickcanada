# Feature Specification: Correct web.dev Images Lesson Source URL

**Feature Branch**: `docs/177-web-images-source-correction`

**Created**: 2026-11-17

**Status**: Source mapping correction implemented; post-merge refresh pending

**Input**: Owner-authorized correction after review found that the web.dev Images library entry pointed to the course index rather than the lesson represented by its existing snapshot.

## User Scenarios & Testing

### User Story 1 — Refresh the intended web.dev Images lesson (Priority: P1)

When the documentation updater refreshes the web.dev Images library entry, it retrieves the official lesson about site generators, frameworks, and content management systems rather than the overall Learn Images course index.

**Why this priority**: The configured URL and the existing snapshot describe different levels of the course. Correcting the source mapping keeps future refreshes aligned with the specific lesson already represented in the library.

**Independent Test**: Fetch the configured source and confirm that it returns the lesson titled “Site Generators, frameworks, and CMSs” and that its content corresponds to the existing snapshot. After merge, the next normal documentation refresh must use that source successfully.

**Acceptance Scenarios**:

1. **Given** the updated manifest, **When** the source URL is opened, **Then** it returns the intended lesson at `https://web.dev/learn/images/cms`.
2. **Given** the next normal documentation refresh after merge, **When** the updater processes `/websites/web_dev_images`, **Then** it fetches the lesson source rather than the course index.
3. **Given** the upstream lesson becomes unavailable or returns invalid content, **When** the updater processes the response, **Then** its existing validation and snapshot-preservation safeguards remain in effect.

## Edge Cases

- web.dev changes or retires the lesson URL.
- The lesson URL begins redirecting to the course index, an error page, or unrelated content.
- The next refresh returns content that fails the updater’s existing integrity validation.

## Requirements

### Functional Requirements

- **FR-001**: The `/websites/web_dev_images` source in `.docs/manifest.json` MUST point to `https://web.dev/learn/images/cms`.
- **FR-002**: The source entry MUST remain a URL source and retain its existing library identifier and group routing.
- **FR-003**: All other manifest values, including `lastUpdated`, inventory, group membership, and other source URLs, MUST remain unchanged by this correction.
- **FR-004**: The existing generated web.dev Markdown snapshot MUST NOT be manually edited or replaced in this change.
- **FR-005**: Updater code, validation safeguards, tests, workflow schedules, dependencies, application code, and deployment configuration MUST remain unchanged.
- **FR-006**: The next normal post-merge documentation refresh MUST retrieve and validate the configured lesson source.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `.docs/manifest.json` parses as valid JSON and the web.dev Images source has the exact approved URL.
- **SC-002**: The live source returns HTTP 200 with the title “Site Generators, frameworks, and CMSs” and the lesson content corresponding to the current snapshot.
- **SC-003**: The semantic manifest diff contains exactly one value change: the web.dev Images source URL.
- **SC-004**: No generated snapshot or updater implementation is changed by this correction.

## Assumptions

- The current canonical web.dev lesson URL is `https://web.dev/learn/images/cms`, confirmed from the live page.
- The existing Markdown snapshot is intended to represent this individual lesson, not the entire Learn Images course.
- The normal documentation refresh after the owner merges the correction is the appropriate end-to-end verification.
