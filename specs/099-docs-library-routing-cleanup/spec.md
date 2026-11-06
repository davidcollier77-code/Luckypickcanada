# Feature Specification: Documentation Library and Specialist Routing Cleanup

**Feature Branch**: `freebuff/cf8f9386a7381a2d31381dd8`

**Created**: 2026-11-06

**Status**: Ready

**Input**: Clean up and reorganize the `.docs` reference library and its Freebuff documentation routing. Remove four approved references (Pillow, the Chrome Extensions Offscreen API reference, Android Developers, Gemini CLI), retain and where appropriate move the remaining references (NumPy to Audio, Gemini API, Debian Reference, PostHog JS, Magic UI), audit every remaining group assignment, and keep the manifest, snapshots, and specialist routing consistent. The documentation updater must keep working exactly as it does now.

## User Scenarios & Testing

### User Story 1 — Approved references are gone from the library (Priority: P1)

An agent selecting a task group no longer finds routing, manifest entries, or local snapshots for Pillow, the Chrome Extensions Offscreen API page, Android Developers, or Gemini CLI.

**Why this priority**: Removing unused material is the requested outcome; leftover routing would keep pointing agents at documents the owner has retired.

**Independent Test**: Inspect `.docs/manifest.json` for the four identifiers, list the group directories, and confirm no snapshot or symlink remains.

**Acceptance Scenarios**:

1. **Given** the repository does not use Pillow anywhere in application code, scripts, or configuration, **When** the cleanup is applied, **Then** `/python-pillow/Pillow` is absent from every manifest section and its snapshot is deleted.
2. **Given** the repository has no Chrome Extensions Offscreen API integration, **When** the cleanup is applied, **Then** the Offscreen API snapshot is replaced by general Chrome documentation and the existing Chrome Developer routing is preserved.
3. **Given** Android Developers is retired, **When** the cleanup is applied, **Then** `/android/developers` and its snapshot are removed from the Deep Dive group.
4. **Given** Gemini CLI documentation is retired but the Gemini API remains in use, **When** the cleanup is applied, **Then** `/google-gemini/gemini-cli` is removed from all routing, sources, inventory, SHA pins, and snapshots, while `/google-gemini/gemini-skills/gemini-api-dev` and `/websites/ai_google_dev_gemini-api` are untouched.

### User Story 2 — Retained references are routed to the group that uses them (Priority: P1)

NumPy documentation is reachable from the Audio group, which owns the repository's NumPy-consuming audio tooling, and no longer from Polishing.

**Why this priority**: Correct routing is the point of the audit; NumPy without an Audio route is effectively unavailable to the specialist that needs it.

**Independent Test**: Confirm `.docs/audio/_numpy_numpy.md` exists, the manifest routes `/numpy/numpy` from `audio` only, and `.freebuff/audio.md` lists it.

**Acceptance Scenarios**:

1. **Given** NumPy is imported by the repository's audio/media tooling, **When** the cleanup is applied, **Then** `/numpy/numpy` is routed from `audio` and removed from `polishing`.
2. **Given** `.docs/` snapshots mirror manifest routing, **When** NumPy moves, **Then** its snapshot lives in `.docs/audio/` and the Polishing copy is gone.

### User Story 3 — The library remains internally consistent (Priority: P1)

Every routed identifier has exactly one source entry, one inventory entry, and a readable snapshot, with no orphan files and no document routed to a specialist group that cannot use it.

**Why this priority**: Manifest drift breaks the updater's deduplicated snapshot model and leaves agents with stale references.

**Independent Test**: Compare manifest routing against the `.docs` tree programmatically and review each remaining identifier's group assignment against actual project use.

**Acceptance Scenarios**:

1. **Given** the cleanup is complete, **When** routing, `sources`, `inventory`, and `githubShas` are compared, **Then** all four sets agree exactly.
2. **Given** the cleanup is complete, **When** the group directories are listed, **Then** every non-symlink snapshot maps to a routed identifier and every routed identifier has a readable snapshot.

### User Story 4 — Retained references stay available (Priority: P2)

Gemini API, Debian Reference, PostHog JS, and Magic UI documentation remain routed and readable.

**Why this priority**: Removal was authorized only for four references; the rest must not regress.

**Independent Test**: Query the manifest for each retained identifier and open its snapshot.

**Acceptance Scenarios**:

1. **Given** the four approved removals, **When** the library is inspected, **Then** no additional documentation was removed.

### User Story 5 — The documentation updater is unaffected (Priority: P1)

The scheduled refresh workflow, its script, its schedule, and its expected manifest shape continue to work exactly as before.

**Why this priority**: The updater is an existing automation the task must not change.

**Independent Test**: Inspect the diff for `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, and `.github/workflows/refresh-docs.yml`, and run the refresh-docs test suite.

**Acceptance Scenarios**:

1. **Given** the cleanup is applied, **When** `node scripts/test-refresh-docs.js` runs, **Then** it passes without any modification to the updater or its tests.
2. **Given** the retired identifiers are absent from the manifest, **When** the refresh next runs, **Then** it cannot recreate their snapshots because it only materializes routed identifiers.

### Edge Cases

- The Gemini CLI snapshot was symlinked from three group directories; removing only the canonical file would leave dangling links.
- `__tests__/reviewer-retirement.test.ts` asserted that the Gemini CLI snapshot existed. That assertion must move to the retained Gemini API snapshot rather than being deleted, so the retirement guard keeps its meaning.
- The Chrome Developer source URL pointed directly at the Offscreen API page, so the identifier is preserved with a general Chrome documentation URL instead of being removed.
- The `auto/docs-refresh` branch is force-pushed from `main` on every scheduled run; the cleanup therefore cannot be reintroduced by an old refresh branch after it merges to `main`.

## Requirements

### Functional Requirements

- **FR-001**: The library MUST NOT use or route `/python-pillow/Pillow` after confirming no Pillow (or `PIL`) usage exists in repository code, scripts, or configuration.
- **FR-002**: The Chrome Extensions Offscreen API reference MUST be removed while general Chrome/browser documentation routing (`/websites/developer_chrome`) is retained.
- **FR-003**: `/android/developers` MUST be removed from routing, sources, inventory, and snapshots.
- **FR-004**: `/google-gemini/gemini-cli` MUST be removed from routing, sources, inventory, SHA pins, and snapshots, including its symlinks.
- **FR-005**: Gemini API documentation (`/google-gemini/gemini-skills/gemini-api-dev`, `/websites/ai_google_dev_gemini-api`) and all Gemini application/reviewer code MUST remain unchanged.
- **FR-006**: `/numpy/numpy` MUST be routed from `audio` only, with its snapshot under `.docs/audio/`.
- **FR-007**: Debian Reference, PostHog JS, and Magic UI routing MUST be retained.
- **FR-008**: No documentation beyond the four approved references may be removed.
- **FR-009**: The manifest MUST preserve its existing structure (`lastUpdated`, `groups`, `sources`, `inventory`, `githubShas`) and all unrelated entries.
- **FR-010**: `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, and `.github/workflows/refresh-docs.yml` MUST NOT be modified.
- **FR-011**: Website code, dependencies, functionality, visuals, audio, payments, security, and deployment MUST NOT change.
- **FR-012**: The retirement regression test MUST be updated to assert the retained Gemini API snapshot instead of the removed Gemini CLI snapshot.
- **FR-013**: One accurate PR report MUST record the reviewed documents, the implemented changes, verification results, and limitations.

### Key Entities

- **Manifest entry**: A library identifier routed from one or more groups, with a source URL, inventory membership, and optional upstream commit SHA.
- **Snapshot**: The local `.docs/<group>/<sanitized-id>.md` copy; the first routed group holds the file and later groups hold relative symlinks.
- **Specialist routing file**: `.freebuff/<group>.md`, which lists the identifiers and snapshot paths that group may consult.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero occurrences of the four retired identifiers in `.docs/manifest.json` (except none), `.freebuff/`, or the `.docs` tree.
- **SC-002**: Manifest routing, sources, inventory, and SHA pins reference exactly the same identifier set (68 entries after the removals).
- **SC-003**: Zero orphan snapshots, zero missing snapshots, and zero broken symlinks in `.docs`.
- **SC-004**: `node scripts/test-refresh-docs.js` passes without any diff to the updater or its tests.
- **SC-005**: `./freebuff-verify.sh` exits 0 and the measured production build stays below the 495 MB hard maximum.

## Assumptions

- Pillow is not used by the project; this is verified before removal rather than assumed.
- The general Chrome documentation page `https://developer.chrome.com/docs/web-platform` is an appropriate non-Offscreen replacement source for the retained Chrome Developer routing.
- Retaining every reference not explicitly named for removal is the correct reading of the task, even where project use is indirect.
