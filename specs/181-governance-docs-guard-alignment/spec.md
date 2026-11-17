# Feature Specification: Governance and Refresh-Docs Guard Alignment

**Feature Branch**: `freebuff/1716deb7870376472b3b3bb7-governance-docs`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: Owner-authorized repair of two pre-existing required-check failures on `main`: the governance
single-source assertion and the refresh-docs snapshot check.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Governance still enforces ChatGPT's Playwright exclusion (Priority: P1)

A maintainer changes or reviews agent governance. The governance regression test continues to prove that
ChatGPT is barred from the repository Playwright CLI and from maintaining unavailable tools, using the
wording that `AGENTS.md` actually contains after #1942.

**Why this priority**: The check must fail when the exclusion is removed, not when governance wording is
legitimately restated.

**Independent Test**: Run `__tests__/agent-governance-single-source.test.js` and confirm it passes against the
current `AGENTS.md`, then temporarily remove the CLI exclusion and confirm the test fails.

**Acceptance Scenarios**:

1. **Given** the current `AGENTS.md`, **When** the governance suite runs, **Then** it passes.
2. **Given** the current test, **When** the "must not use or attempt to use" list is removed, **Then** the
   suite fails.
3. **Given** the current test, **When** the Playwright CLI entry is removed from that list, **Then** the
   suite fails.

---

### User Story 2 - Refresh-docs validates every snapshot without requiring legacy HTML (Priority: P1)

A maintainer runs the documentation refresh checks. Every routed `.docs` snapshot is still validated as
usable Markdown, while the test no longer fails merely because the library contains no legacy HTML or
unconvertible JavaScript-shell page.

**Why this priority**: The assertion was a fixture assumption, not a documentation-quality requirement, and
blocked the required workflow after the library became fully Markdown.

**Independent Test**: Run `node scripts/test-refresh-docs.js` and confirm all tests pass; inspect the snapshot
loop to confirm every routed snapshot still receives `validateDocumentContent`.

**Acceptance Scenarios**:

1. **Given** a fully-Markdown routed library, **When** the refresh-docs suite runs, **Then** it passes.
2. **Given** an invalid or empty snapshot, **When** the suite runs, **Then** it fails with that snapshot's
   validation reason.
3. **Given** a legacy HTML snapshot, **When** the suite runs, **Then** the legacy branch still validates that
   its normalized content is usable or safely rejected.

### Edge Cases

- `AGENTS.md` may restate the exclusion again; the test should assert the current explicit list plus the CLI
  item and maintenance restriction, not a historical sentence.
- The documentation library may later contain legacy HTML again; the existing legacy branch remains active.
- A missing snapshot, or a snapshot that fails `validateDocumentContent`, must still fail the suite.
- The repair must not edit `AGENTS.md`, `.docs` snapshots or the refresh implementation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The governance test MUST assert the current `AGENTS.md` exclusion heading.
- **FR-002**: The governance test MUST retain explicit assertions for the Playwright CLI entry and the
  instruction not to maintain unavailable tools.
- **FR-003**: The refresh-docs test MUST validate every routed snapshot.
- **FR-004**: The refresh-docs test MUST NOT require the presence of a legacy HTML or unconvertible snapshot.
- **FR-005**: The repair MUST NOT change `AGENTS.md`, `.docs` content, refresh behaviour or production code.
- **FR-006**: Owner authorization MUST be recorded through the repository's protected-file mechanism before
  merge.

### Key Entities

- **Governance assertion**: The Vitest expectation that anchors the ChatGPT Playwright exclusion.
- **Snapshot validation loop**: The refresh-docs test that reads each manifest-routed file and validates it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The governance suite passes on the repaired tree.
- **SC-002**: The refresh-docs suite reports 48 passed, 0 failed.
- **SC-003**: The full Vitest suite reports 915 passed, 0 failed.
- **SC-004**: Removing the Playwright CLI exclusion or corrupting a routed snapshot still fails the relevant
  check.
- **SC-005**: The production build remains below 495 MiB and no production file changes.

## Assumptions

- `AGENTS.md` as merged by #1942 is authoritative; the test sentence it removed was not restored.
- The routed `.docs` library is fully Markdown at this commit; the test should accept that state.
- This repair is submitted as a dedicated PR from `main` and requires owner approval because it changes a
  protected governance test.
