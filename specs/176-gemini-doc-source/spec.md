# Feature Specification: Gemini API Documentation Source Correction

**Feature Branch**: `docs/176-gemini-doc-source`

**Created**: 2026-11-17

**Status**: Source correction implemented; post-merge refresh pending

**Input**: Owner-authorized correction of the failing Gemini API documentation source in the existing documentation-refresh pull request.

## User Scenarios & Testing

### User Story 1 — Refresh official Gemini API documentation (Priority: P1)

When the documentation updater refreshes the Gemini API reference, it retrieves Google's current official documentation index as Markdown instead of following the retired source URL to an HTML page on another origin.

**Why this priority**: The current source makes the refresh report fail and leaves the existing Gemini snapshot as raw HTML.

**Independent Test**: Run the normal documentation refresh after the source correction is merged. The Gemini entry must download valid Markdown, the legacy HTML snapshot must be normalized, and the report must contain no critical integrity issue for this entry.

**Acceptance Scenarios**:

1. **Given** the corrected manifest, **When** the updater fetches the Gemini documentation source, **Then** it receives Google's official AI Studio documentation index as Markdown.
2. **Given** the existing raw-HTML Gemini snapshot, **When** the updater refreshes after merge, **Then** the existing HTML snapshot is replaced with validated Markdown.
3. **Given** any unexpected redirect, HTML response, or invalid content, **When** the updater validates the response, **Then** existing redirect and integrity protections remain in force.

### Edge Cases

- Google changes or retires the published `llms.txt` endpoint.
- The endpoint returns HTML, an error page, or an unsafe redirect instead of Markdown.
- The previous snapshot is raw HTML and its stored upstream version metadata has not changed.

## Requirements

### Functional Requirements

- **FR-001**: The Gemini API documentation source in `.docs/manifest.json` MUST point to Google's official full documentation index at `https://aistudio.google.com/llms.txt`.
- **FR-002**: The source entry MUST remain a URL source and retain its existing library identifier and routing.
- **FR-003**: The change MUST NOT weaken updater redirect, content-validation, or snapshot-preservation safeguards.
- **FR-004**: Unrelated manifest entries, generated documentation snapshots, updater code, dependencies, workflow schedules, and application files MUST remain unchanged by this correction.
- **FR-005**: The next normal post-merge documentation refresh MUST verify that the Gemini snapshot is valid Markdown and that the corresponding integrity issue is cleared.

## Success Criteria

- **SC-001**: The manifest parses as valid JSON and has exactly the approved official Gemini source URL.
- **SC-002**: The new source returns Google's official Gemini API and AI Studio documentation index in Markdown.
- **SC-003**: The next post-merge refresh updates or normalizes the Gemini snapshot without a Gemini download failure or critical integrity finding.
- **SC-004**: All existing updater security and integrity checks remain enabled and unchanged.

## Assumptions

- Google's current AI Studio `llms.txt` is the canonical full documentation index for the Gemini API and Google GenAI SDK documentation.
- Google documents that individual documentation pages are available in clean Markdown by appending `.md` to their page URL.
- The already-open documentation refresh PR is the intended delivery vehicle; it remains open and unmerged for the owner.
