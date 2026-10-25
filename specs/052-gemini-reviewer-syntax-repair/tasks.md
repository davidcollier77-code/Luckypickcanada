# Tasks: Gemini Reviewer Startup Repair

**Input**: `specs/052-gemini-reviewer-syntax-repair/spec.md` and `plan.md`

## Phase 1: Setup

- [x] T001 Inspect the failed Actions job, trusted-base checkout, reviewer source, and existing regression test in `.github/workflows/gemini-reviewer.yml`, `.github/scripts/gemini-reviewer.cjs`, and `__tests__/gemini-reviewer-workflow.test.ts`.

## Phase 2: Foundational

- [x] T002 Confirm the current test suite includes a Node syntax check for both reviewer scripts in `__tests__/gemini-reviewer-workflow.test.ts`.

## Phase 3: User Story 1 — Restore automatic PR reviews

**Independent test**: The focused reviewer regression assertions pass and the reviewer script parses without a startup syntax error.

- [x] T003 [US1] Restore the event-specific mode guard to the early input-validation block and remove the stray guard from the prompt array in `.github/scripts/gemini-reviewer.cjs`.
- [x] T004 [P] [US1] Add regression coverage for guard uniqueness, placement before prompt construction, and supported manual modes in `__tests__/gemini-reviewer-workflow.test.ts`.
- [x] T005 [US1] Update verified reviewer state and explicitly pending verification in `memory-bank/activeContext.md`.
- [ ] T006 [US1] Run `pnpm test -- __tests__/gemini-reviewer-workflow.test.ts`, full `pnpm test`, and `./jules-verify.sh`; record exact current-head results in the PR Summary.
- [ ] T007 [US1] After the owner merges the repair PR, trigger or rerun an eligible Gemini reviewer job to verify the repaired trusted-base version proceeds beyond startup; do not merge from an agent session.

## Dependencies and execution order

- T001 and T002 establish the observed failure and existing test coverage.
- T003 and T004 implement the repair and its regression guard; T004 is in a separate file and can be reviewed independently.
- T006 depends on T003 and T004 and remains pending until CI evidence is available.
- T007 depends on T006 and an owner-controlled merge, so it is intentionally pending.

## Implementation strategy

Ship the smallest source correction with targeted regression coverage. Use GitHub CI for actual verification because this session can inspect and author repository content through the GitHub API but has no repository shell for local commands. The PR remains open and unmerged until the owner decides.