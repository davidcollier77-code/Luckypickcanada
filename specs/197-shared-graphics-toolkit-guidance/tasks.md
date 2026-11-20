---
description: "Tasks for shared graphics toolkit governance guidance"
---

# Tasks: Shared Graphics Toolkit Guidance

**Input**: Design documents from `/specs/197-shared-graphics-toolkit-guidance/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: A focused regression assertion is explicitly required by FR-008.

## Phase 1: Shared guidance (US1)

**Goal**: Both agents receive the same actionable direction for future visual-feature creation and polishing.

- [X] T001 [US1] Add the 🟢 shared graphics toolkit and Creative Workbench section to `AGENTS.md`.
- [X] T002 [US1] Add a focused assertion for the shared classification, toolkit references, centralized readiness hub, integration hook and Workbench in `__tests__/agent-governance-single-source.test.js`.
- [X] T003 [US1] Set the active Spec Kit feature pointer to `specs/197-shared-graphics-toolkit-guidance` in `.specify/feature.json`.
- [X] T004 [US1] Record the active governance task and its verification limitation in `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- [X] T005 [US1] Review the dedicated governance PR classification, exact-path scope declaration, separate owner-approval requirements and final file scope against the current repository checkers.

## Completion Summary

- **Total tasks**: 5
- **User Story 1**: 5 tasks
- **Parallel opportunities**: None; the documentation rule defines the exact regression assertion and records.
- **Independent test**: The governance test asserts that the 🟢 section exists, applies to both agents and contains the required existing toolkit references.
- **Verification limitation**: The startup preflight reports Node.js 22.16.0 and missing pnpm 10.30.3. Repository scripts are not run by ChatGPT; local test execution and build-size measurement remain unverified.
