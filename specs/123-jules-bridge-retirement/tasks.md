# Tasks: Retire Jules Bridge

**Feature**: Jules Bridge retirement
**Plan**: `specs/123-jules-bridge-retirement/plan.md`

## Phase 1 — Setup
- [x] T001 Read `AGENTS.md`, required Memory Bank context, applicable task-group guidance, and Spec Kit stage commands.
- [x] T002 Inspect the default branch for the Worker, workflow, scanner exceptions, and existing retirement work.

## Phase 2 — Removal
- [x] T003 Delete the dedicated `workers/jules-bridge/` source, test, and Wrangler configuration.
- [x] T004 Delete `.github/workflows/deploy-jules-bridge.yml`.
- [x] T005 Remove the Worker-specific DevSkim suppression path, helper, unit test, and justification without changing other rules.
- [x] T006 Replace stale active `.amazonq` folder inventory reference from `.jules/` to `.freebuff/`.
- [x] T007 Update Memory Bank current context and progress to record retirement; preserve history.

## Phase 3 — Verification
- [x] T008 Search for remaining active Jules Bridge/API/deployment references and classify historical matches.
- [x] T009 Confirm only the intended Worker-related paths and task artifacts changed; confirm the three remaining Workers are untouched.
- [ ] T010 **PENDING CI:** Run the focused Python tests, full Vitest, `./freebuff-verify.sh`, and any applicable workflow checks on the submitted PR head. This API-only session cannot execute repository shell commands.
- [x] T011 PASS — inspected the published 12-path compare; PR #1787 exists and is open and unmerged.
