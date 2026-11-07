# Tasks: Single-Source Freebuff Governance

**Input**: Design documents from `spec.md` and `plan.md`

**Prerequisites**: `spec.md` and `plan.md`

**Tests**: Regression coverage is required by the specification's acceptance criteria. No separate TDD workflow was requested.

## Phase 1: Setup and baseline

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, the selected `.freebuff/deep-dive.md` and `.freebuff/testing.md` instructions, Memory Bank files, `.specify/memory/constitution.md`, `.docs/manifest.json`, and Spec Kit integration settings.
- [x] T002 Inspect the current branch, `.specify/feature.json`, existing task artifacts, and open PRs; confirm no existing PR covers this task.
- [x] T003 Compare the complete `AGENTS.md` and `.freebuff/freebuff.md` contents and identify the unique MCP connection/initialization clarification to preserve.

## Phase 2: User Story 1 — One authoritative governance file (Priority: P1)

**Goal**: Make `AGENTS.md` the sole general repository-governance entrypoint while preserving all specialist instructions and unique operating requirements.

**Independent Test**: The governance regression test passes, `.freebuff/freebuff.md` is absent, `AGENTS.md` contains the sole-authority wording and MCP-use clarification, and all eight specialist files plus core Spec Kit commands remain present.

- [x] T004 Update `AGENTS.md` to identify it as the single authority for every coding agent, remove the redundant entrypoint read, and preserve the MCP connection/initialization clarification.
- [x] T005 Delete only `.freebuff/freebuff.md`; retain the eight `.freebuff/<group>.md` files and `.freebuff/cmds/` Spec Kit commands.
- [x] T006 Add regression coverage in `__tests__/agent-governance-single-source.test.js` for the sole-entrypoint rule, retained MCP clarification, all specialist groups, and the core Spec Kit commands.
- [x] T007 Point `.specify/feature.json` to `specs/104-agent-governance-single-source`.
- [x] T008 Record the active governance task in `memory-bank/activeContext.md` and `memory-bank/progress.md`, preserving historical entries.
- [ ] T009 Verify `pnpm run test` and the standalone TypeScript check on the latest PR head. The full suite (46 files / 358 tests, including the new 4-test governance suite) and TypeScript check passed on the preceding PR revision; the latest revision's CI rerun is pending.

## Phase 3: User Story 2 — Consistent saved Master Work Request (Priority: P1)

**Goal**: Align the reusable Library template with the single-source governance and canonical PR-summary rules.

**Independent Test**: Read the saved `/Freebuff_Master_Work_Request_1.md` Library file after replacement; confirm it refers to `AGENTS.md` and selected task-group files only, and requires one concise evidence-based PR-body summary.

- [x] T010 Update the saved Library file `/Freebuff_Master_Work_Request_1.md` to remove the obsolete entrypoint reference and align reporting with `AGENTS.md`.
- [x] T011 Re-read the saved Library file and confirm the replacement content and governance/reporting instructions.

## Final Phase: Verification, audit, and delivery

- [ ] T012 Run `./freebuff-verify.sh` and all required `deep-dive` and `testing` group checks on the latest PR head. The repository gate passed on the preceding PR revision, including 36 refresh-docs tests; its latest-head CI rerun is pending.
- [x] T013 Search active instructions/configuration for references to the deleted entrypoint, retaining historical specification and PR records unchanged.
- [x] T014 Review the complete PR diff, update the single canonical PR-body summary with actual verification states, and leave PR #1751 open and unmerged.

## Completion Conditions

- `AGENTS.md` is the sole general agent-governance entrypoint and retains every unique operating requirement.
- The redundant `.freebuff/freebuff.md` file is absent.
- All eight specialist task-group files and the installed Spec Kit command directory remain.
- The saved Library Master Work Request is aligned with repository governance.
- The latest PR-head verification results are reported accurately; no pending check is described as passed.
