# Tasks: DeepSource PR Smoke Test

**Input**: Design documents from `specs/051-deepsource-autofix-smoke-test/`

**Prerequisites**: `plan.md` and `spec.md`

## Phase 1: Setup and inspection

- [X] T001 Inspect `AGENTS.md`, task-group routing, repository metadata, and existing branches/PRs for a duplicate smoke test.
- [X] T002 Create branch `test/deepsource-autofix-smoke-20261025` from current `main`.
- [X] T003 Create concise Spec Kit artifacts in `specs/051-deepsource-autofix-smoke-test/` using file-driven procedural execution of the required command definitions.

## Phase 2: User Story 1 — Verify PR-level DeepSource processing (P1)

**Goal**: Open a harmless PR and inspect whether DeepSource reacts.

**Independent Test**: Check the new PR's conversation, statuses, and checks for verified DeepSource activity.

- [X] T004 Add the inert text-only marker in `DEEPSOURCE_AUTOFIX_SMOKE_TEST.txt`; do not change application or workflow files.
- [ ] T005 Open one PR against `main` and inspect the available DeepSource check/comment evidence.
- [ ] T006 Double-check the complete diff and leave the PR open and unmerged until the result is observed.

## Verification notes

- No application code is changed, so no application behavior test is appropriate for the marker itself.
- `./jules-verify.sh` and `pnpm test` cannot be run from this GitHub API-only session. Do not treat them as passed.
- The separate Autofix clone/fix action remains unverified by a plain-text PR.
