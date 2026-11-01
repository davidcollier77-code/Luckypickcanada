# Feature Specification: Shared Engineering Practices Reference Routing

**Feature Branch**: `freebuff/gemini-api-skill-conditional-routing-20261101`
**Created**: 2026-11-01
**Status**: In progress
**Input**: Add Google's general Engineering Practices code-review checklist as a shared optional reference available in every Freebuff task group, with correct documentation-updater routing.

## User Scenarios & Testing

### User Story 1 — Every task group can access the shared reference (Priority: P1)

As a repository owner, I want the same engineering-practices source routed to all eight task groups, so Freebuff can consult common guidance regardless of which single primary group it selects.

**Independent Test**: Parse `.docs/manifest.json`; verify the source ID appears exactly once in each of the eight groups and has one valid upstream URL.

### User Story 2 — Guidance remains conditional rather than mandatory (Priority: P1)

As a repository owner, I want each group to identify the reference as optional and relevant-driven, so unrelated tasks are not forced to load it.

**Independent Test**: Inspect all eight `.freebuff/<group>.md` files and the repository entrypoint. Each points to the correct group snapshot and says the reference supplements, but does not override, repository governance.

### User Story 3 — The existing updater creates the correct shared snapshot and links (Priority: P1)

As a repository owner, I want the existing documentation updater to download one canonical copy and link it into every group, so updates do not create divergent duplicates.

**Independent Test**: Confirm the updater's manifest-driven grouping logic processes the source once, writes the canonical file to the first group (Creation), and creates links for the other seven groups.

## Requirements

- **FR-001**: Add the source ID `/google/eng-practices` with the official raw Markdown URL for Google's “What to Look For in a Code Review.”
- **FR-002**: Route the source ID to exactly these eight groups: Creation, Troubleshooting, Polishing, Testing, Security, Audio, Deep-dive, and SEO.
- **FR-003**: Add a matching optional local-snapshot reference to every group instruction file.
- **FR-004**: Identify the snapshot as cross-cutting guidance for design, functionality, complexity, tests, naming, comments, style, and documentation.
- **FR-005**: State that the reference is not mandatory reading for every task and never overrides `AGENTS.md`, repository conventions, or group instructions.
- **FR-006**: Keep the updater implementation unchanged; its existing manifest-driven logic must handle canonical download and cross-group links.
- **FR-007**: Preserve source attribution and identify the upstream archive status.
- **FR-008**: Do not change application behavior, add dependencies, or modify unrelated updater logic.

## Success Criteria

- **SC-001**: All eight groups contain the source ID exactly once, with one matching source configuration.
- **SC-002**: Every group references its correct local snapshot name: `.docs/<group>/_google_eng-practices.md`.
- **SC-003**: The updater source-key sanitization and first-group/symlink behavior match the chosen ID and group order.
- **SC-004**: Guidance is explicitly optional and subordinate to repository governance.
- **SC-005**: The existing PR remains open and unmerged; updater execution is left for the owner's planned re-trigger.
