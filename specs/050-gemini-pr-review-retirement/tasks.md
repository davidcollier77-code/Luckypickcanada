# Tasks: Retire Gemini PR-Agent Review Workflow

**Input**: Design documents from `specs/050-gemini-pr-review-retirement/`
**Prerequisites**: `spec.md`, `plan.md`

## Phase 1 — Scope and baseline

- [x] T001 Read repository governance and required project context; select `troubleshooting` as the task group.
- [x] T002 Inspect the active Gemini PR-Agent workflow, its dedicated test, package scripts, other active workflows, Oracle runtime usage, and the recent workflow run.
- [x] T003 Search for an existing branch or PR for this retirement; none was found.

## Phase 2 — Retire only the redundant reviewer

- [x] T004 Delete `.github/workflows/pr-agent.yml`.
- [x] T005 Delete `__tests__/pr-agent-workflow.test.js`.
- [x] T006 Preserve all historical reviewer specs and routed `.docs/` references.
- [x] T007 Update `memory-bank/activeContext.md` and record the exact scope in `pr_summary.md`.

## Phase 3 — Verification and reporting

- [ ] T008 Inspect the final changed-file list and verify no unrelated workflow, application, dependency, runtime secret, or deployment file changed.
- [ ] T009 Inspect current-head GitHub Actions results and record each actual conclusion.
- [ ] T010 Run `pnpm test` and `./jules-verify.sh` if repository shell access is available; otherwise mark not run, never passed.
- [ ] T011 Reconcile the canonical PR body summary with the final diff and leave the PR open and unmerged.

## Dependencies

- T001–T003 precede implementation.
- T004–T007 are the implementation sequence.
- T008–T011 follow implementation and depend on available verification evidence.