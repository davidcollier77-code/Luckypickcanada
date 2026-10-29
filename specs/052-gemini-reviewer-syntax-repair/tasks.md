# Tasks: Gemini Reviewer Startup Repair

**Input**: `specs/052-gemini-reviewer-syntax-repair/spec.md` and `plan.md`

## Phase 1: Setup

- [x] T001 Inspect the failed Actions job, trusted-base checkout, reviewer source, and existing regression test in `.github/workflows/gemini-reviewer.yml`, `.github/scripts/gemini-reviewer.cjs`, and `__tests__/gemini-reviewer-workflow.test.ts`.

## Phase 2: Foundational

- [x] T002 Confirm the current test suite includes a Node syntax check for both reviewer scripts in `__tests__/gemini-reviewer-workflow.test.ts`.

## Phase 3: User Story 1 — Restore automatic PR reviews

**Independent test**: The focused reviewer regression assertions pass and the reviewer script parses without a startup syntax error.

- [x] T003 Restore the event-specific mode guard to the early input-validation block and remove the stray guard from the prompt array in `.github/scripts/gemini-reviewer.cjs`.
- [x] T004 Add regression coverage for guard uniqueness, placement before prompt construction, and supported manual modes in `__tests__/gemini-reviewer-workflow.test.ts`.
- [x] T005 Update verified reviewer state and explicitly pending verification in `memory-bank/activeContext.md`.
- [ ] T006 Run `pnpm test -- __tests__/gemini-reviewer-workflow.test.ts`, full `pnpm test`, and `./jules-verify.sh`; record exact current-head results in the PR summary.
- [ ] T007 After the owner merges the repair PR, trigger or rerun an eligible Gemini reviewer job to verify the repaired trusted-base version proceeds beyond startup; do not merge from an agent session.

## Dependencies and execution order

- T001 and T002 establish the observed failure and existing test coverage.
- T003 and T004 implement the repair and its regression guard; T004 is in a separate file and can be reviewed independently.
- T006 depends on T003 and T004 and remains pending until current-head CI evidence is inspected.
- T007 depends on T006 and an owner-controlled merge, so it is intentionally pending.

## Implementation strategy

Ship the smallest source correction with targeted regression coverage. Use GitHub CI for actual verification because this session can inspect and author repository content through the GitHub API but has no repository shell for local commands. The PR remains open and unmerged until the owner decides.

## Phase 4: Repeated startup failure — targeted-fix no-match guard

**Independent test**: The reviewer script parses, and the no-match path returns from the async handler before loading the autofix module.

- [x] T008 Inspect Actions run #40793451382, job #123184035314, confirm the exact line-952 parse error, and trace the enclosing targeted-fix branch.
- [x] T009 Restore the missing `if (!requestedFindings.length) {` guard in `.github/scripts/gemini-reviewer.cjs` without changing fix behavior.
- [x] T010 Add regression assertions in `__tests__/gemini-reviewer-workflow.test.ts` for guard/message/module ordering.
- [ ] T011 Run the focused reviewer test, full `pnpm test`, and `./jules-verify.sh`; record exact current-head results in the PR summary.
- [ ] T012 After owner-controlled merge, confirm a fresh trusted-base reviewer run proceeds beyond startup; agents must not merge.

## Phase 5: Visual QA failure discovered during current-head verification

**Independent test**: Playwright asserts that the homepage and unrelated routes do not eagerly preload Turnstile after the PageSpeed optimization removed the critical-path preload; actual widget and server-side validation behavior remains unchanged.

- [x] T013 Inspect Visual QA run #40795500357 and confirm its three browser-project failures all came from the outdated expectation of one homepage Turnstile preload; trace the intentional removal to `.specify/features/mobile-pagespeed-optimization/plan.md`.
- [x] T014 Update `tests/visual/turnstile-loading.spec.ts` to assert no eager preload on `/` and `/about`, without changing application code or weakening Turnstile protection.
- [ ] T015 Inspect the latest PR-head Visual QA, OpenNext validation, DevSkim, and updater scheduler outcomes. Update the PR summary with actual results; never infer success from a run still pending or in progress.
