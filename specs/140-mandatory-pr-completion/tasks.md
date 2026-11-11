# Tasks: Mandatory Pull Request Completion

**Input**: Design documents from `specs/140-mandatory-pr-completion/`

**Prerequisites**: spec.md, plan.md

## Phase 1: Inspect and specify

- [x] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, Memory Bank files, selected task-group guidance, Spec Kit definitions/templates, the governance regression test, Protected File Changes workflow and CODEOWNERS.
- [x] T002 Define the automatic PR-completion rule, its read-only and explicit-owner exceptions, and safe blocker behavior in spec.md.
- [x] T003 Record the minimal implementation and verification approach in plan.md.

## Phase 2: Implement and align the active checker

- [x] T004 Update the PR handoff instruction in `AGENTS.md` to make PR submission mandatory for owner-authorized repository-changing tasks.
- [x] T005 Update `__tests__/agent-governance-single-source.test.js` to assert all new mandatory-completion requirements and scope exceptions.
- [x] T006 Preserve the existing protected-file workflow, CODEOWNERS owner assignment, and detailed `PR_SUBMISSION.md` procedure without weakening them.

## Phase 3: Verify and hand off

- [ ] T007 Run the focused governance test, full Vitest suite, and `./freebuff-verify.sh`; record actual outcomes and any execution limitation.
- [x] T008 Review the remote final diff and confirm no unrelated files or protected workflows changed.
- [x] T009 Prepare the complete PR description and handoff details before submission.

## Verification Status

The complete final diff was reviewed through GitHub's compare and commit APIs. The protected-file workflow, CODEOWNERS, and PR_SUBMISSION.md are unchanged. A local clone attempt failed because this environment cannot resolve github.com; therefore the focused test, full Vitest suite, Spec Kit shell gate, type check and production build could not be executed here. None is claimed as passed. PR-triggered checks are pending after PR creation.
