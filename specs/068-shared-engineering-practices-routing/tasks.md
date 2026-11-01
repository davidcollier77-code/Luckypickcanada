# Tasks: Shared Engineering Practices Reference Routing

**Input**: `specs/068-shared-engineering-practices-routing/spec.md` and `specs/068-shared-engineering-practices-routing/plan.md`

## Phase 1: Inspect and specify

- [x] T001 Read `AGENTS.md`, Freebuff entrypoint, all eight group instructions, the manifest, and the documentation updater's manifest-driven routing behavior.
- [x] T002 Search the user's Library and the repository manifest for an existing Google Engineering Practices reference; none was found.
- [x] T003 Verify the official source, its license, and its archive status.
- [x] T004 Specify the shared optional-reference behavior and exact routing.

## Phase 2: Plan and implement

- [x] T005 Define the single manifest source ID, stable snapshot filename, group list, and updater behavior.
- [x] T006 Add the source and official raw Markdown URL to `.docs/manifest.json`, routed to all eight groups.
- [x] T007 Add the shared optional-reference section to all eight `.freebuff/<group>.md` instructions.
- [x] T008 Add the optional shared-reference note to `.freebuff/freebuff.md`.
- [x] T009 Update the active Spec Kit pointer and Memory Bank context.

## Phase 3: Verification and reporting

- [x] T010 Inspect the updater's existing logic for canonical snapshot creation, cross-group symlinks, and inventory recording.
- [ ] T011 Run manifest validation and focused assertions for eight-group coverage and snapshot-path consistency in a checked-out workspace.
- [ ] T012 Re-trigger the documentation updater and verify the canonical snapshot plus all seven group links are created.
- [ ] T013 Review the complete PR diff and update the canonical PR summary; leave PR #1662 open and unmerged.

## Verification record

- **PASS** — Library and manifest searches found no existing Google Engineering Practices reference.
- **PASS** — Official source and CC BY 3.0 attribution were verified; upstream repository archive date was verified.
- **PASS** — Source ID sanitization produces `_google_eng-practices.md`; existing updater logic handles one canonical file in the first group and links in the remaining groups.
- **PENDING** — Execute repository validation and re-trigger the actual updater. The owner plans to perform the updater run after this PR update; generated snapshots and links are not claimed as present yet.
- **PENDING** — Final full diff audit and current-head automated checks.
