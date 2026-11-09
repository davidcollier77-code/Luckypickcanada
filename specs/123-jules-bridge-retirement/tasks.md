# Tasks: Retire Jules Bridge

**Feature**: Jules Bridge retirement
**Plan**: `specs/123-jules-bridge-retirement/plan.md`

## Phase 1 — Setup
- [x] T001 Read `AGENTS.md`, required Memory Bank context, applicable task-group guidance, and Spec Kit stage commands.
- [x] T002 Inspect the default branch for the Worker, workflow, scanner exceptions, and existing retirement work.

## Phase 2 — Removal
- [ ] T003 Delete the dedicated `workers/jules-bridge/` source, test, and Wrangler configuration.
- [ ] T004 Delete `.github/workflows/deploy-jules-bridge.yml`.
- [ ] T005 Remove the Worker-specific DevSkim suppression path, helper, unit test, and justification without changing other rules.
- [ ] T006 Replace stale active `.amazonq` folder inventory reference from `.jules/` to `.freebuff/`.
- [ ] T007 Update Memory Bank current context and progress to record retirement; preserve history.

## Phase 3 — Verification
- [ ] T008 Search for remaining active Jules Bridge/API/deployment references and classify historical matches.
- [ ] T009 Confirm only the intended Worker-related paths and task artifacts changed; confirm the three remaining Workers are untouched.
- [ ] T010 Run focused Python tests, full required repository verification, and relevant CI checks; report actual results and blockers.
- [ ] T011 Inspect the complete PR diff and ensure it remains open and unmerged.
