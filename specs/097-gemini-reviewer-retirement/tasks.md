# Tasks: Custom Gemini PR Reviewer Retirement

**Input**: Design documents from `specs/097-gemini-reviewer-retirement/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Specify, plan, and task definition

- [x] T001 Inspect repository governance, project context, current active reviewer workflow/scripts/instructions/tests, protected Pullfrog and Oracle files, current main, and existing PR/branch state.
- [x] T002 Complete `specs/097-gemini-reviewer-retirement/spec.md`.
- [x] T003 Complete `specs/097-gemini-reviewer-retirement/plan.md` and verify scope against the repository constitution.
- [x] T004 Complete this ordered task list before implementation.

## Phase 2: Remove the custom reviewer

- [x] T005 Delete only `.github/workflows/gemini-reviewer.yml`.
- [x] T006 Delete only `.github/scripts/gemini-reviewer.cjs`, `.github/scripts/gemini-autofix.cjs`, and `GEMINI_REVIEWER.md`.
- [x] T007 Delete the four exclusive `__tests__/gemini-reviewer-*.test.ts` suites.
- [x] T008 Add `__tests__/reviewer-retirement.test.ts` covering absence of active entrypoints and preservation of Pullfrog, the Oracle, and historical records.
- [x] T009 Update `.specify/feature.json` to point to `specs/097-gemini-reviewer-retirement`.
- [x] T010 Prepend the current retirement status to `memory-bank/activeContext.md` and `memory-bank/progress.md`, preserving their existing content.

## Phase 3: Verify and report

- [ ] T011 Run the focused retirement test and full Vitest suite; record actual results.
- [ ] T012 Run `./freebuff-verify.sh`; record actual result and measured build size if the gate builds production.
- [ ] T013 Inspect the complete diff and verify that Pullfrog, other reviewers, Oracle, secrets, application files, dependencies, `.docs/`, and historical specs are unchanged.
- [ ] T014 Open or update one PR with an accurate summary; leave it OPEN and UNMERGED.
- [ ] T015 Inspect PR-head checks and record pending, failed, blocked, or passing evidence without overstating verification.

## Completion Conditions

Implementation is complete when the exact removal set, retirement regression guard, feature pointer, and Memory Bank notes are present. Verified completion additionally requires all mandatory repository checks to pass and the final diff / PR-head checks to be reconciled.
