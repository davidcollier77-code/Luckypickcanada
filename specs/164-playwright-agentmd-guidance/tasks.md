# Tasks: Freebuff Playwright Agent Guidance

**Input**: Design documents from `specs/164-playwright-agentmd-guidance/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Inspection

- [x] T001 Read current AGENTS.md, README.md, Playwright configurations and setup-script documentation to confirm the existing commands and responsibilities.
- [x] T002 Inspect the AGENTS.md protection workflow, classifier and governance regression tests.

## Phase 2: Governance Guidance

- [x] T003 Add the concise Freebuff-only Playwright section to AGENTS.md, including the ChatGPT exclusion, CLI launcher, Option A, Option B and script-maintenance responsibility.
- [x] T004 Extend the existing governance regression test to assert the required section and instructions.

## Phase 3: Verification and Handoff

- [ ] T005 Run the focused governance test and applicable repository verification in a shell-capable environment; ChatGPT must not run freebuff-verify.sh.
- [x] T006 Review the changed-file scope and prepare the dedicated governance PR with local-test limitations stated accurately.
