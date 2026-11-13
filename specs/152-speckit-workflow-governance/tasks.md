# Tasks: Spec Kit Workflow Governance Alignment

**Input**: `specs/152-speckit-workflow-governance/` · **Prerequisites**: `plan.md`, `spec.md`

## Phase 1 — Inspect and Plan

- [X] T001 Inspect the installed Spec Kit version and all nine command definitions in `.freebuff/cmds/`.
- [X] T002 Review the specification, plan and tasks templates in `.specify/templates/` and identify required, conditional and optional content.
- [X] T003 Review the AGENTS.md protection workflow, classifier, governance test and PR handoff rules.

## Phase 2 — Governance Update

- [X] T004 Update Section A.9 of `AGENTS.md` with the current command inventory, core-stage sequence, template-completion rules, workflow-change notification and surgical-update authorization.
- [X] T005 Update `__tests__/agent-governance-single-source.test.js` to assert the new governance wording and verify all nine command definition files remain present.
- [X] T006 Point `.specify/feature.json` to this feature directory.

## Phase 3 — Review and Verification

- [X] T007 Review the changed files and verify the PR scope is limited to AGENTS.md, its direct regression test, the Spec Kit feature pointer and task records.
- [ ] T008 Run `pnpm exec vitest run __tests__/agent-governance-single-source.test.js` and `./freebuff-verify.sh` in a shell-capable repository workspace. Record actual results; do not claim these checks passed unless executed.
