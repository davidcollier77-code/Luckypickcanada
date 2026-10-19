# Tasks: Gemini Review Depth

**Input**: `.specify/features/gemini-review-depth/`

## Phase 1: Investigation and planning

- [x] T001 Read repository governance first, inspect the merged Gemini workflow and regression test, and verify PR-Agent configuration options against current documentation.
- [x] T002 Define the all-in-one review scope, preservation boundaries, and acceptance criteria in `spec.md` and `plan.md`.

## Phase 2: Workflow configuration and regression protection

- [x] T003 Add finding-limit, inline-finding, risk, merge-recommendation, failure-mode, and reviewer-prompt settings in `.github/workflows/pr-agent.yml`.
- [x] T004 Extend `__tests__/pr-agent-workflow.test.js` to assert the settings and the required review categories/evidence rules.
- [x] T005 Create the task-specific research, quickstart, requirements checklist, and governance summary.

## Phase 3: Verification and acceptance

- [ ] T006 Run `pnpm exec vitest run __tests__/pr-agent-workflow.test.js` on the current head and confirm it passes.
- [ ] T007 Run `pnpm run test`, `./jules-verify.sh`, and required current-head CI checks; resolve any in-scope failures.
- [ ] T008 Inspect the exact final diff and reconcile every changed file with `PR_SUMMARY.md`.
- [ ] T009 After the configuration reaches `main`, verify one naturally triggered eligible PR event posts an actual Gemini review with the deeper instructions. Do not create repeated reviews merely for testing.

## Dependencies

- T006 and T007 require a shell/CI environment with the repository checkout and installed dependencies.
- T009 depends on the reviewed workflow reaching the default branch and provider availability.
