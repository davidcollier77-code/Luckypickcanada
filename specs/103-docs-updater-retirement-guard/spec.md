# Feature Specification: Documentation Updater Retirement Guard and Resilience

**Feature Branch**: `freebuff/0c7146a6c6b6866b90666004`

**Created**: 2026-11-06

**Status**: Ready

**Input**: Repair `scripts/refresh-docs.js` so the four documents retired by PR #1746 can never be recreated by a future updater run, and so dangling symlinks or missing document targets neither crash the refresh nor disturb valid documents. Add isolated regression tests in `scripts/test-refresh-docs.js`. Preserve schedules, time zones, triggers, retry timings, Cloudflare Worker behaviour, and GitHub trigger integration.

## User Scenarios & Testing

### User Story 1 — Retired documents stay retired (Priority: P1)

A scheduled or manually dispatched documentation refresh reads `.docs/manifest.json`. Even if an old or accidentally restored manifest lists the four retired documents again, the run must not recreate their snapshots or re-index them.

**Why this priority**: The PR #1746 cleanup is only durable if the automation that owns `.docs/` enforces it. Without this guard the next scheduled run can silently undo the retirement.

**Independent Test**: Seed a manifest listing the four retired IDs in groups, sources, inventory, and `githubShas`, plus one retained source; run the guard twice and confirm the retired IDs are removed, the retained source survives, the second run removes nothing, and the manifest text no longer contains any retired ID.

**Acceptance Scenarios**:

1. **Given** the manifest lists a retired ID in any group, source, inventory, or SHA index, **When** the updater starts, **Then** that entry is removed before any fetch or write.
2. **Given** a retired canonical snapshot exists, including as a dangling symlink, in any `.docs` group directory, **When** the updater runs, **Then** the file or link is deleted, including in groups no longer routed by the manifest.
3. **Given** the updater runs repeatedly, **When** no retired IDs or snapshots remain, **Then** subsequent runs remove nothing and leave the manifest byte-identical.
4. **Given** a retired ID is reintroduced by restoring an old manifest, **When** the next run executes, **Then** it is stripped again.

### User Story 2 — Broken links do not break the refresh (Priority: P1)

A canonical snapshot can be deleted or renamed while deduplicated links in other groups still point at it. The updater must tolerate that state, restore the target and missing link, and leave every other document untouched.

**Why this priority**: A single dangling link currently aborts the whole run during path validation, which prevents every later document from refreshing.

**Independent Test**: Create a missing canonical file with a dangling link in a second group and an unrelated valid document; confirm path resolution and size measurement do not throw, the canonical write plus link repair produce a readable document, and the unrelated document is unchanged. Then execute the real updater twice against a temporary fixture with mocked HTTPS and confirm both runs succeed, the second is byte-stable, and the restored link reads back. Confirm a dangling link that escapes `.docs` is still rejected.

**Acceptance Scenarios**:

1. **Given** a final-path symlink whose target is missing but inside `.docs`, **When** the path is resolved or `.docs` size is measured, **Then** no exception is raised.
2. **Given** a dangling link that points outside `.docs`, **When** the path is resolved, **Then** the existing containment guard still rejects it.
3. **Given** a current document whose dedup link is dangling, **When** the updater verifies links, **Then** the dangling link is replaced by the correct relative link rather than failing with `EEXIST` or writing a duplicate.
4. **Given** any of these repairs, **When** they complete, **Then** valid documents and valid links keep their exact content.

### Edge Cases

- Retired snapshot present in a directory that is not a current manifest group.
- Retired canonical snapshot removed, leaving a dangling dedup link in another group.
- Nested documentation with a retired-looking filename under a group subdirectory (must not be deleted).
- Second and later updater runs encountering an already-clean manifest and tree.

## Requirements

### Functional Requirements

- **FR-001**: The updater MUST hold the exact four PR #1746 identifiers — `/posthog/posthog-js`, `/magicuidesign/magicui`, `/pmndrs/react-three-fiber`, `/upstash/ratelimit` — and their canonical snapshot filenames, taken from the repository retirement records rather than guessed.
- **FR-002**: The updater MUST strip those identifiers from every manifest group, `sources`, `inventory`, and `githubShas` entry before fetching or writing.
- **FR-003**: The updater MUST delete those canonical snapshots from every `.docs` group directory, including dangling links and groups absent from the manifest, and MUST NOT delete nested files.
- **FR-004**: Path resolution and size measurement MUST tolerate a dangling final-path symlink inside `.docs` and MUST still reject symlink targets outside `.docs`.
- **FR-005**: Missing canonical targets and dangling dedup links MUST be repairable without crashing and without modifying unrelated valid documents or links.
- **FR-006**: `scripts/test-refresh-docs.js` MUST execute isolated regression tests for the retirement guard, repeated-run idempotency, snapshot cleanup, dangling-link tolerance, link repair, escape rejection, and two full updater runs against a temporary fixture.
- **FR-007**: All updater schedules, Halifax time zones, triggers, retry timings, Cloudflare Worker behaviour, workflow integration, and unrelated behaviour MUST remain unchanged.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All four retired IDs and their snapshot filenames are absent from the manifest and tree after a guard run seeded with them, and remain absent after a second run.
- **SC-002**: A manifest seeded with the four IDs and one retained ID preserves the retained ID in groups, sources, inventory, and `githubShas`.
- **SC-003**: Dangling-link and missing-target fixtures complete without an exception, and the repaired document reads back with the canonical content while unrelated documents retain their exact bytes.
- **SC-004**: Two consecutive full updater runs on a seeded fixture both succeed, leave the second manifest byte-stable, and keep valid documents and repaired links readable.
- **SC-005**: The isolated updater suite passes and the repository verification gate passes with a production build below 495 MB.

## Assumptions

- `__tests__/docs-library-retirement.test.ts` and `specs/102-unused-reference-retirement/` are the authoritative repository records for the four retired IDs and their snapshot paths.
- The existing Jules retirement guard and the updater's containment and size limits remain in force.
- No manifest or `.docs` content change is required by this task; the guard is preventive.
