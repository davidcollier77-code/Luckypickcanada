# Feature Specification: Unused Documentation Reference Retirement

**Feature Branch**: `docs/retire-unused-library-references-20261106`

**Created**: 2026-11-06

**Status**: Ready

**Input**: Remove the four remaining documentation references identified as not useful in PR #1740 — PostHog JS, Magic UI, React Three Fiber, and Upstash Ratelimit — from the documentation library. Remove their manifest entries, group routing, and local snapshots. Preserve the earlier PR #1740 removals and keep NumPy routed to Audio.

## User Scenarios & Testing

### User Story 1 — The reference library contains only the retained sources (Priority: P1)

A Freebuff task-group specialist sees only the approved reference material for its group. Four references previously identified as not useful are no longer offered or refreshed.

**Why this priority**: Removing unused references prevents irrelevant material from being presented during future repository tasks and keeps the manifest and local documentation tree aligned.

**Independent Test**: Inspect the manifest, all eight group routes, the four affected specialist instructions, and the documentation snapshot tree. Confirm all four identifiers and their snapshots are absent.

**Acceptance Scenarios**:

1. **Given** the four references are currently present in the library, **When** the cleanup is applied, **Then** each identifier is absent from every group route, `sources`, `inventory`, and `githubShas`.
2. **Given** each reference has one canonical group snapshot, **When** the cleanup is applied, **Then** its snapshot is deleted and its specialist routing line is removed.
3. **Given** NumPy was moved to Audio by PR #1740, **When** the cleanup is applied, **Then** NumPy remains routed only to Audio and its canonical snapshot remains in `.docs/audio/`.
4. **Given** PR #1740 already retired Pillow, Android Developers, and Gemini CLI, **When** this cleanup is applied, **Then** those removals remain intact.

### Edge Cases

- A retired identifier appears in an unexpected group or an unexpected snapshot copy.
- A manifest section, source, inventory item, or SHA pin is already missing or inconsistent.
- A prior retirement or the NumPy Audio routing is accidentally undone.

## Requirements

### Functional Requirements

- **FR-001**: The four specified identifiers MUST be absent from every manifest group, source, inventory entry, and upstream SHA pin.
- **FR-002**: The four corresponding canonical snapshots MUST be deleted, and the corresponding specialist routing entries MUST be removed.
- **FR-003**: The NumPy reference MUST remain assigned only to Audio, with its Audio snapshot intact and no Polishing copy.
- **FR-004**: The three earlier source retirements from PR #1740 MUST remain absent from all manifest indexes and snapshots.
- **FR-005**: No unrelated library entry, upstream URL, specialist instruction, application behavior, dependency, updater implementation, workflow, schedule, or Cloudflare configuration may change.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All four retired identifiers have zero occurrences in active manifest routing/indexes and their specialist route files.
- **SC-002**: All four retired snapshots are absent from the repository tree.
- **SC-003**: The manifest has exact agreement between unique group routes, source keys, and inventory entries.
- **SC-004**: NumPy remains routed only to Audio, and the existing Audio snapshot remains present.
- **SC-005**: Automated regression tests pass for the four retirements, the earlier PR #1740 removals, and the NumPy group assignment.

## Assumptions

- The findings in PR #1740 are still valid: these four references were recorded as not useful and without a declared package or source-code integration in the repository.
- The task authorizes removal of these four references only; all other library references remain unchanged.
- The updater and its scheduler are intentionally excluded from this cleanup and will be addressed in the separate next task.
