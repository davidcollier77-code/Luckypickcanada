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
- [X] T005 Open PR [#1601](https://github.com/davidcollier77-code/Luckypickcanada/pull/1601) against `main` and inspect its check/comment evidence.
- [X] T006 Audit the full PR file list and confirm the PR remains open and unmerged; retain it for the owner to observe the pending analysis.

## Verification notes

- The PR diff has exactly five added files: one inert plain-text marker and the four task-specific Spec Kit/summary files. No application code or configuration was changed.
- PR Insights Tagger posted a summary. DeepSource's JavaScript, Python, Shell, SQL, and Secrets statuses are present and reported `Analysis in progress...` when inspected. This proves PR-level status activity has started, not that the analysis has completed.
- `./jules-verify.sh` and `pnpm test` cannot be run from this GitHub API-only session. Do not treat them as passed.
- The separate Autofix clone/fix action remains unverified by a plain-text PR.
