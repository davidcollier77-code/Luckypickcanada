# Tasks: Use Prepared Context in Spec Kit Stages

**Input**: `specs/167-speckit-prepared-context/` · **Prerequisites**: `spec.md`, `plan.md`

**Tests**: No application tests are required for this Markdown-only change. Review the complete diff and rely on automatic PR checks for repository validation.

**Organization**: Tasks are grouped by the two user stories and the final review.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel when files do not overlap
- **[Story]**: User story associated with the task
- Exact repository paths are included in each task

## Phase 1: Prepared Context and Stage Instructions

**Purpose**: Remove duplicate preparation and hook execution while preserving the core stage workflow.

- [X] T001 [US1] Replace pre-execution hook processing in `.freebuff/cmds/speckit.specify.md` with instructions to use Freebuff's prepared branch and feature context.
- [X] T002 [US1] Remove the template-resolver invocation from `.freebuff/cmds/speckit.specify.md` and use available prepared template content or repository template files.
- [X] T003 [US1] Replace the setup-script invocation in `.freebuff/cmds/speckit.plan.md` with use of the existing feature pointer, specification and plan template.
- [X] T004 [US1] Replace the setup-script invocation in `.freebuff/cmds/speckit.tasks.md` with use of existing design documents and task-template files.
- [X] T005 [US1] Replace the prerequisite-script invocation in `.freebuff/cmds/speckit.implement.md` with direct use of the prepared feature artifacts.
- [X] T006 [US1] Remove pre-stage and post-stage extension-hook dispatch procedures from all four core command definitions.

## Phase 2: Preserve Stage Responsibilities

**Purpose**: Confirm the four stages still perform their required work.

- [X] T007 [US2] Preserve specification generation, template structure, quality validation and checklist responsibilities in `.freebuff/cmds/speckit.specify.md`.
- [X] T008 [US2] Preserve technical planning, constitution checks, research and design artifacts in `.freebuff/cmds/speckit.plan.md`.
- [X] T009 [US2] Preserve dependency-ordered, user-story-based task generation and task formatting in `.freebuff/cmds/speckit.tasks.md`.
- [X] T010 [US2] Preserve implementation ordering, checklist review and completion validation in `.freebuff/cmds/speckit.implement.md`.

## Phase 3: Review and Handoff

- [X] T011 Review all four updated command definitions for remaining setup-script, resolver, prerequisite-script or hook-dispatch instructions.
- [X] T012 Confirm the complete branch diff contains only the four core command definitions and these three required Spec Kit feature artifacts; confirm `AGENTS.md` is unchanged.
- [ ] T013 Record unavailable local script-based checks accurately and submit the complete PR with PR-triggered checks marked pending.

## Dependencies & Execution Order

- Phase 1 establishes the prepared-context behavior.
- Phase 2 verifies the original responsibilities remain intact.
- Phase 3 completes the scope review and PR handoff.

## Parallel Opportunities

- T003, T004 and T005 affect separate command files and can be reviewed independently.
- T007 through T010 affect separate command files and can be reviewed independently.

## Implementation Strategy

Complete the four focused command-definition changes, verify the preserved stage requirements, review the complete diff, then submit one PR. Do not change `AGENTS.md` or other repository instructions.
