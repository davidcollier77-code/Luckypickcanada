---
description: "Task list for reliable Jules Spec Kit enforcement"
---

# Tasks: Reliable Jules Spec Kit Enforcement

**Input**: Design documents from `specs/001-jules-speckit-enforcement/`

**Prerequisites**: `plan.md` and `spec.md`

## Phase 1: Investigation

- [x] T001 Inspect the active Spec Kit integration config and verify the four command definition paths.
- [x] T002 Compare the mandatory rule with PR #1410 and the Spec Kit constitution to identify the conflicting task-scope wording.
- [x] T003 Inspect `jules-verify.sh` and confirm it had no Spec Kit artifact gate.

## Phase 2: Governance and Verification

- [x] T004 Clarify `AGENTS.md` with exact command-definition paths, native-dispatch versus file-driven execution, truthful reporting, and required task artifacts.
- [x] T005 Align `.specify/memory/constitution.md` with mandatory Spec Kit execution and update its version/amendment date.
- [x] T006 Add `scripts/verify-speckit-task.sh` to validate a safe active feature pointer and non-empty spec/plan/tasks artifacts.
- [x] T007 Wire the task artifact gate into `jules-verify.sh`, preserving the automated `Update Spec Kit` workflow.
- [x] T008 Add regression tests for missing state, malformed state, path traversal, missing artifacts, and a valid feature directory.

## Phase 3: Verification

- [x] T009 Run shell syntax validation and the regression tests.
- [x] T010 Inspect the final branch diff and confirm no application/runtime/visual files changed.
