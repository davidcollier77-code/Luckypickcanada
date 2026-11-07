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
- [ ] T009 Verify `pnpm run test` and the standalone TypeScript check on the latest PR head. Earlier results are not sufficient evidence for the merged revision; the follow-up PR reruns these checks.

## Phase 3: User Story 2 — Consistent saved Master Work Request (Priority: P1)

**Goal**: Align the reusable Library template with the single-source governance and canonical PR-summary rules.

**Independent Test**: Read the saved `/Freebuff_Master_Work_Request_1.md` Library file after replacement; confirm it refers to `AGENTS.md` and selected task-group files only, and requires one concise evidence-based PR-body summary.

- [x] T010 Update the saved Library file `/Freebuff_Master_Work_Request_1.md` to remove the obsolete entrypoint reference and align reporting with `AGENTS.md`.
- [x] T011 Re-read the saved Library file and confirm the replacement content and governance/reporting instructions.

## Final Phase: Verification, audit, and delivery

- [ ] T012 Run `./freebuff-verify.sh` and all required `deep-dive` and `testing` group checks on the latest PR head. The follow-up PR reruns the required repository gate; record only the new run's result.
- [x] T013 Search active instructions/configuration for references to the deleted entrypoint, retaining historical specification and PR records unchanged.
- [x] T014 Review the complete PR #1751 diff and publish its canonical PR-body summary; the owner subsequently merged PR #1751.

## Phase 4: Review correction — governance regression test

**Goal**: Correct the merged test's missing `beforeAll` import finding while also eliminating module-scope filesystem I/O.

**Independent Test**: The focused governance Vitest module passes; `AGENTS.md` is read only when the two relevant test callbacks execute.

- [x] T015 Confirm PR #1751 is merged, inspect Pullfrog review #5810741955, and reproduce the unimported `beforeAll` usage in the current `main` test source.
- [x] T016 Reuse and amend `specs/104-agent-governance-single-source/spec.md`, `plan.md`, and `tasks.md` to record the review correction without creating a duplicate feature directory.
- [x] T017 Refactor `__tests__/agent-governance-single-source.test.js` so `readAgents()` performs file reads only inside the two test callbacks; do not add a lifecycle hook.
- [ ] T018 Run `pnpm exec vitest run __tests__/agent-governance-single-source.test.js` and `pnpm run test` on the follow-up PR head.
- [ ] T019 Run `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`; record the actual build size and all gate results.
- [ ] T020 Review the final PR diff and CI results, update the single canonical PR body, and leave the follow-up PR open and unmerged.


## Completion Conditions

- `AGENTS.md` is the sole general agent-governance entrypoint and retains every unique operating requirement.
- The redundant `.freebuff/freebuff.md` file is absent.
- All eight specialist task-group files and the installed Spec Kit command directory remain.
- The saved Library Master Work Request is aligned with repository governance.
- The follow-up PR remains open and unmerged for owner review; the latest PR-head verification results are reported accurately.