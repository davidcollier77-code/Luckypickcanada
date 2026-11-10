# Tasks: Memory Bank Consolidation

**Input**: Design documents from specs/126-memory-bank-consolidation/

**Prerequisites**: plan.md and spec.md.

## Phase 1: Inspect and specify
- [x] T001 Read AGENTS.md first and inspect the current main branch and existing work.
- [x] T002 Read memory-bank/projectBrief.md, memory-bank/activeContext.md, memory-bank/techContext.md and memory-bank/progress.md; record their baseline line counts.
- [x] T003 Read .specify/memory/constitution.md, the four .freebuff/cmds/speckit.*.md definitions, the .specify/templates files and .docs/manifest.json; confirm no applicable task group or extension hooks.
- [x] T004 Create and validate the feature specification in specs/126-memory-bank-consolidation/spec.md.

## Phase 2: Plan and task breakdown
- [x] T005 Create the implementation plan in specs/126-memory-bank-consolidation/plan.md.
- [x] T006 Create this dependency-ordered task list in specs/126-memory-bank-consolidation/tasks.md.

## Phase 3: Consolidate the Memory Bank
- [x] T007 Rewrite memory-bank/projectBrief.md as a concise, stable product and platform brief.
- [x] T008 Replace the historical task transcript in memory-bank/activeContext.md with verified current repository state and this task's scope.
- [x] T009 Rewrite memory-bank/techContext.md with verified stack, architecture and technical constraints; correct the 495 MiB build-cap description.
- [x] T010 Consolidate memory-bank/progress.md into significant dated milestones and remove repetitive PR/CI task logs.

## Phase 4: Update initialization and verify
- [x] T011 Change only the project-context initialization instruction in AGENTS.md to name all four Memory Bank files.
- [x] T012 Verify line counts for the four memory-bank/*.md files, the four-file initialization instruction in AGENTS.md, the build-cap note in memory-bank/techContext.md, the milestone count in memory-bank/progress.md and PR #1796 using GitHub source inspection.
- [ ] T013 Run ./freebuff-verify.sh and git diff --check from the repository root; confirm current-head CI for PR #1796. Local shell checks are BLOCKED in this GitHub API-only session; CI evidence is pending.

## Dependencies & Execution Order
- T001–T004 establish source facts and specification.
- T005–T006 establish plan and executable tasks before implementation.
- T007–T010 are independent documentation rewrites.
- T011 follows the Memory Bank rewrite and changes only one AGENTS.md instruction.
- T012 is the final verification gate.

## Implementation Strategy
Complete the documentation rewrite as one cohesive, documentation-only PR. Preserve GitHub as the detailed historical record. Do not alter application runtime, workflows, integrations, deployment configuration or .docs.
