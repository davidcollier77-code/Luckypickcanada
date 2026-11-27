# Tasks: Progressive Build-Size Planning

**Input**: Design documents from `specs/225-progressive-build-limit-planning/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Inspection and specification

- [X] T001 Read the current `AGENTS.md`, `.docs/manifest.json`, four Memory Bank files, Spec Kit workflow/constitution/templates and `PR_SUBMISSION.md`.
- [X] T002 Inspect the protected-file, governance-scope, seven-category report, verification-integrity and applicable PR QA workflows and scripts.
- [X] T003 Confirm the amendment is a shared-policy clarification only; retain the current 495 MiB threshold and all existing safeguards.

## Phase 2: Implementation

- [X] T004 Add the approved optional-progressive-PR wording immediately after the existing safe-stop bullet in the shared Production build limit section.
- [X] T005 Update `.specify/feature.json` to point to this feature and create the concise spec, plan and task records.
- [X] T006 Update only the relevant Memory Bank active-context and milestone records; preserve the other core files.
- [X] T007 Review the exact final text and change scope for policy consistency, accidental edits, duplicate wording and security impact.

## Phase 3: Submission and handoff

- [X] T008 Finalize the dedicated branch change set, confirm every exact path and file purpose, and prepare the required PR handoff structure.
- [ ] T009 Create one regular, non-draft governance PR against `main` and hand it to the owner open and unmerged; provide the separate protected-file authorization and governance digest requirements.
- [ ] T010 Owner review, protected-file environment authorization, governance digest approval and final automated checks.

## Verification Notes

- The policy text and final diff are reviewed against the acceptance scenarios and the protected-file path classifier.
- The repository checkout is not available in the ChatGPT execution environment, so repository-local test scripts and `./freebuff-verify.sh` cannot be executed here. PR-triggered workflows remain the verification authority.
- No production build was run for this documentation-only change; its build-size measurement remains unverified until the authorized workflow determines applicability and runs any required build.

## Dependencies and Execution Order

- T001–T003 establish the verified scope and mandatory governance requirements.
- T004–T007 produce and review the complete policy and task record.
- T008–T009 submit once and hand off the protected-file approval requirements.
- T010 remains with the repository owner and PR automation; no merge or deployment is performed by this task.
