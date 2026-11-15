# Tasks: Freebuff Playwright Agent Guidance

**Input**: Design documents from `specs/164-playwright-agentmd-guidance/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Inspection

- [x] T001 Read current AGENTS.md, README.md, Playwright configurations and setup-script documentation to confirm the existing commands and responsibilities.
- [x] T002 Inspect the AGENTS.md protection workflow, classifier and governance regression tests.

## Phase 2: Governance Guidance

- [x] T003 Add the concise Freebuff-only Playwright section to AGENTS.md, including the ChatGPT exclusion, CLI launcher, Option A, Option B and script-maintenance responsibility.
- [x] T004 Extend the existing governance regression test to assert the required section and instructions.
- [x] T007 Consolidate QA-checker governance into one planning-stage source of truth and remove the duplicate generic QA summary.
- [x] T008 Require independent final review of the completed implementation and full diff against applicable checker requirements in AGENTS.md and PR_SUBMISSION.md.
- [x] T009 Add a direct-repository-owner-only exception to the post-submission hard stop; prohibit inferred permission and preserve all independent approval gates.
- [x] T010 Extend regression assertions for the consolidated QA requirements and owner-directed exception.

## Phase 3: Verification and Handoff

- [ ] T005 Run the focused governance test and applicable repository verification in a shell-capable environment; ChatGPT must not run freebuff-verify.sh.
- [x] T006 Review the changed-file scope and prepare the dedicated governance PR with local-test limitations stated accurately.
- [x] T011 Reconcile the complete PR #1908 file inventory and update the scope manifest, purposes, governance reasons and handoff to match the actual diff.
- [x] T014 Fix protected-file workflow parsing so empty previous filenames cannot shift the status field into the path field; add regression coverage and relocate the evidence record to the classifier's existing allowed evidence directory.
- [ ] T012 Obtain the separate repository-owner `/approve-governance <digest>` comment for the current PR head and scope body.
- [ ] T013 Obtain the configured `protected-file-authorization` environment approval before merge.
