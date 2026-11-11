# Tasks: Mandatory Pull Request Completion

**Input**: Design documents from `specs/139-mandatory-pr-completion/`

**Prerequisites**: spec.md, plan.md

## Phase 1: Inspect and specify

- [x] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, Memory Bank files, selected task-group guidance, Spec Kit definitions/templates, the governance regression test, Protected File Changes workflow and CODEOWNERS.
- [x] T002 Define the automatic PR-completion rule, its read-only and explicit-owner exceptions, and safe blocker behavior in spec.md.
- [x] T003 Record the minimal implementation and verification approach in plan.md.

## Phase 2: Implement and align the active checker

- [x] T004 Update the PR handoff instruction in `AGENTS.md` to make PR submission mandatory for owner-authorized repository-changing tasks.
- [ ] T005 Update `__tests__/agent-governance-single-source.test.js` to assert all new mandatory-completion requirements and scope exceptions.
- [x] T006 Preserve the existing protected-file workflow, CODEOWNERS owner assignment, and detailed `PR_SUBMISSION.md` procedure without weakening them.

## Phase 3: Verify and hand off

- [ ] T007 Run the focused governance test, full Vitest suite, and `./freebuff-verify.sh`; record actual outcomes and any execution limitation.
- [ ] T008 Review the final diff and confirm no unrelated files or protected workflows changed.
- [ ] T009 Prepare the complete PR description, open one regular non-draft PR, verify its intended branch and HEAD, and leave it open and unmerged for the owner.

## Verification Status

Remote GitHub contents APIs were used to inspect and prepare the scoped files. They do not provide a repository shell, so no local Vitest, Spec Kit gate, type check or production build is claimed as run. PR-triggered checks remain pending until the PR is created.
