# Feature Specification: Documentation Updater Reliability and Safety

**Feature Branch**: `freebuff/fffa8bcf4af337cbdf4839af`

**Created**: 2026-11-07

**Status**: Implemented — verification recorded in `PR_SUMMARY.md`

**Task groups**: `troubleshooting` (broken source URLs and download failures), `deep-dive` (evidence-based audit of symlinks, manifest indexes and automation), `testing` (executed unit and complete-workflow verification).

**Input**: Improve the reliability and safety of `scripts/refresh-docs.js` without changing the existing schedule, retry timing or Atlantic timezone automation.

## User Scenarios & Testing

### User Story 1 — Bad downloads never replace good documentation (Priority: P1)

When an upstream source returns an empty, binary, garbled, malformed or error page, the updater rejects it, keeps the existing snapshot, and reports the affected document and URL.

**Independent Test**: Serve empty, NUL-containing, random-character, HTTP-error-page and HTTP 404 responses in the isolated workflow test and confirm the existing snapshots are byte-identical afterwards.

### User Story 2 — Deliberately removed documents stay removed (Priority: P1)

A document removed from the manifest is never downloaded again, its stale manifest indexes are pruned, and its updater-managed snapshots and symlinks are deleted.

**Independent Test**: Leave a removed document in `sources`, `inventory`, `githubShas` and on disk but out of `groups`; the complete updater must not request its URL and must prune every trace.

### User Story 3 — Broken sources and links are reported and repaired safely (Priority: P1)

Broken source URLs are reported with their URL and error in the refresh report and PR body; source URLs are never guessed or rewritten. Broken or duplicated internal snapshots links are repaired without overwriting differing content.

**Independent Test**: Include a failing new source, a broken symlink and an identical duplicate copy in the isolated workflow; confirm the failure is reported, the link is repaired and conflicting content is preserved.

### User Story 4 — The library stays consistent (Priority: P1)

Manifest routing, indexes, snapshots and links stay in agreement after additions, updates, moves and removals; duplicate and stale entries are eliminated.

**Independent Test**: Compare `inventory`, `sources` and `githubShas` with the union of manifest groups and resolve every routed link to its canonical snapshot after the complete workflow.

### Edge Cases

- A source returns a valid HTTP 200 challenge or error page.
- A routed document has no source configuration.
- A primary snapshot is missing while its secondary links exist.
- A secondary group contains a differing regular file instead of a link.
- A document is moved between groups or an entire group directory is removed.
- An unexpected `.md` file exists that no manifest entry or routed library owns.

## Requirements

- **FR-001**: Every downloaded document MUST pass a structural integrity check before it can replace or create a snapshot.
- **FR-002**: Empty, binary, garbled, random-character, error-page, challenge-page and JSON-error downloads MUST be rejected.
- **FR-003**: A rejected download MUST preserve an existing good snapshot; with no existing copy nothing is written and the problem is reported.
- **FR-004**: The updater MUST only download libraries routed in `manifest.groups`, and MUST prune non-routed `sources`, `inventory` and `githubShas` entries plus their snapshots and symlinks.
- **FR-005**: Broken source URLs and download failures MUST be reported with the affected document, URL and error, both in the run summary and the documentation refresh PR body.
- **FR-006**: Source URLs MUST NOT be automatically guessed, rewritten or replaced.
- **FR-007**: Broken, incorrect and duplicate updater-managed links MUST be repaired atomically; differing duplicate content MUST be reported and left unchanged.
- **FR-008**: `inventory` MUST equal the union of routed libraries, and every routed library MUST have exactly one source entry and a resolvable snapshot in every assigned group.
- **FR-009**: Existing schedules, retry count/timing, Atlantic timezone settings, Cloudflare Worker slots and workflow triggers MUST remain unchanged.
- **FR-010**: The complete updater MUST be verified against a copy of the current library, not only through isolated unit tests.
- **FR-011**: Critical unresolved link problems and critical library-consistency problems MUST make the report say `FAILED` and the updater exit non-zero, even when no download failed. An unmanaged/orphan snapshot is informational and MUST NOT by itself fail the run.
- **FR-012**: The updater MUST detect different library identifiers that map to the same snapshot filename. It MUST NOT delete or overwrite a snapshot owned by a currently routed document, and MUST fail safely without writing when ownership is ambiguous.
- **FR-013**: Temporary symlink cleanup MUST use `lexistsSync()` so dangling symlinks are removed, while atomic write/rename repair behaviour is preserved.
- **FR-014**: The PR report MUST state the measured index counts accurately: 64 `inventory` entries, 64 `sources` entries and 51 `githubShas` entries; it MUST NOT claim all three indexes contain the same 64 entries.
- **FR-015**: Regression tests MUST cover consistency failures without download failures, unresolved link problems without download failures, removed-versus-routed filename collisions, dangling temporary-symlink cleanup, and preservation of an existing valid snapshot when a repair is rejected.

## Success Criteria

- **SC-001**: All 64 current library documents pass the integrity validator; the complete workflow leaves them byte-identical.
- **SC-002**: A removed document present only in indexes and snapshots is never requested and is fully pruned.
- **SC-003**: The refresh report contains the affected document, URL, error and preservation status for every failure.
- **SC-004**: Every routed link resolves to its canonical snapshot inside `.docs` after the workflow.
- **SC-005**: Unit tests, the isolated end-to-end workflow, TypeScript, the repository gate and the production build all pass, with the build below 495 MB.
- **SC-006**: A run with only critical consistency or link defects reports `FAILED` and exits non-zero; a run with only informational orphan warnings still reports `SUCCESS`.
- **SC-007**: A filename collision never removes or rewrites the snapshot of a routed document, and the collision is reported as critical.
- **SC-008**: A dangling `.tmp.symlink.*` entry is removed by cleanup, and a rejected repair leaves the existing valid snapshot byte-identical.

## Assumptions and Limitations

- The integrity check is structural (readability and error-page detection), not a relevance, quality or ownership review.
- `.freebuff/<group>.md` files intentionally list only a subset of each manifest group (some sources are referenced in prose), so they are not auto-edited; consistency is enforced over `manifest.groups`, indexes and the snapshot tree.
- Unowned orphan files are reported rather than deleted, because the updater cannot prove they are library snapshots.
