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

- [x] T011 Run the full Vitest suite, including the retirement regression test — PASS in Visual QA. The new guard is included in the full suite; no separate focused-only invocation was run.
- [x] T012 Run `./freebuff-verify.sh` — PASS. Production build size: 333,794,959 bytes (318.33 MiB), below the 495 MiB cap; OpenNext Cloudflare build and Wrangler build validation also PASS.
- [x] T013 Inspect the complete diff — PASS. Pullfrog and Oracle match their base-branch blob hashes; remaining workflows have no reviewer-script invocation; other reviewer files, secrets, application files, dependencies, `.docs/`, and historical specs are unchanged.
- [x] T014 Open PR #1736 with the verification evidence and leave it OPEN and UNMERGED.
- [ ] T015 Inspect PR-head checks and record pending, failed, blocked, or passing evidence without overstating verification.

## Completion Conditions

Implementation is complete when the exact removal set, retirement regression guard, feature pointer, and Memory Bank notes are present. Verified completion additionally requires all mandatory repository checks to pass and the final diff / PR-head checks to be reconciled.
