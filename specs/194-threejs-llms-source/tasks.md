# Tasks: Three.js short documentation source

**Input**: Design documents from `specs/194-threejs-llms-source/`
**Prerequisites**: plan.md and spec.md

## Phase 1: Source and manifest
- [X] T001 Add the separate URL source `/websites/threejs_llms_txt` to `.docs/manifest.json`.
- [X] T002 Route the new source to Creation and Polishing and append it to inventory.
- [X] T003 Preserve the existing full-documentation source and inventory entry.

## Phase 2: Snapshots
- [X] T004 Add the concise upstream source snapshot to `.docs/creation/_websites_threejs_llms_txt.md`.
- [X] T005 Add the Polishing symlink to the canonical Creation snapshot.

## Phase 3: Project context
- [X] T006 Update `memory-bank/activeContext.md` with the completed documentation-library addition.
- [X] T007 Update `memory-bank/progress.md` with the source, routing and preservation milestone.
- [X] T008 Record the task research, plan and implementation artifacts.

## Phase 4: Verification and handoff
- [ ] T009 Verify manifest invariants, snapshot equality, symlink target and unchanged full snapshot in an authorized environment.
- [ ] T010 Run updater tests and applicable repository verification in Node 26/pnpm 10.30.3 environment; explicitly report this agent's execution limitation.
