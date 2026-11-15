---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Prerequisites

Freebuff completes repository preparation before starting the Spec Kit workflow. Use the existing branch, feature context, paths and prepared artifacts. Do not run setup, template-resolver or prerequisite scripts, and do not execute configured extension hooks during any Spec Kit stage. If required context or an artifact is missing, report exactly what is missing and stop that stage; do not rerun the preparation scripts.

## Outline
1. **Use prepared feature context**: Read `.specify/feature.json` to identify `FEATURE_DIR`. Use the existing `FEATURE_SPEC`, `IMPL_PLAN` and `BRANCH` values from the prepared context and repository files. Set `IMPL_PLAN` to `FEATURE_DIR/plan.md`. Use the existing plan file if present; otherwise, create it from `.specify/templates/plan-template.md` using file operations. Do not run `setup-plan.sh`. If the feature directory or required specification is missing, report the missing prerequisite and stop rather than rerunning setup.

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Research only material unknowns; record briefly when none require research.
   - Phase 1: Generate only task-relevant design artifacts; omit inapplicable artifacts.
   - Re-evaluate Constitution Check post-design

## Completion Report

Command ends after Phase 1 design. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Research only when needed

1. Review unresolved questions and dependencies in Technical Context.
2. Research only unknowns or technical decisions that materially affect scope,
   security, behavior, or implementation. Use the task's routed local documents
   first; do not generate research work merely to fill a template.
3. If useful research is required, create `research.md` with the decision,
   rationale, and relevant alternatives. If there are no material unknowns,
   record briefly in `plan.md` that additional research was not needed.

### Phase 1: Applicable design artifacts

Create only artifacts warranted by the selected task:

1. **`data-model.md`** — only when the task changes entities, persisted data,
   state shape, validation, or relationships. Otherwise omit it.
2. **`contracts/`** — only when an external interface or contract changes.
   Match the contract format to the actual interface; omit it for tasks with
   no external contract.
3. **`quickstart.md`** — only when a repeatable end-to-end or manual
   validation scenario materially helps. For a narrow change with direct
   automated checks, list the exact checks in `tasks.md` instead.

Do not create empty, boilerplate, or speculative artifacts. Keep all produced
artifacts short and scoped to this task. Reuse links to existing documentation
instead of copying it.

**Output:** `plan.md` plus only the applicable artifacts above.

## Key rules

- Use absolute paths for filesystem operations; use project-relative paths for references in documentation
- ERROR on gate failures or unresolved clarifications

## Done When

- [ ] Plan workflow executed and design artifacts generated
- [ ] Completion reported to user with branch, plan path, and generated artifacts
