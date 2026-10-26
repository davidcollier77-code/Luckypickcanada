# Tasks: Gemini Default Review Coverage and Relevant Documentation

**Input**: `.specify/features/gemini-review-context/spec.md` and `plan.md`

## Phase 1 — Setup and Specification

- [x] T001 Read `AGENTS.md`, the selected deep-dive specialist and routed documents, reviewer rules/script/tests, current main state, and the already-merged Gemini reviewer context work.
- [x] T002 Update `spec.md` with automatic source-context and selective document-loading requirements.
- [x] T003 Update `plan.md` with bounded-source, reference relevance, safety, and test decisions.
- [x] T004 Update this task list before implementation.

## Phase 2 — Default source-context coverage

- [x] T005 In `.github/scripts/gemini-reviewer.cjs`, run bounded source retrieval for automatic initial review as well as full review and fix modes.
- [x] T006 Replace silent changed-source candidate slicing with named file/character limits and explicit coverage limitations; keep all available text patches in review batches.
- [x] T007 Ensure missing source, truncated source, unavailable base source, and candidate/file caps are reflected in the yellow coverage verdict and review report.
- [x] T008 Add focused regression assertions in `__tests__/gemini-reviewer-context.test.ts` for the source budget, explicit cap disclosure, and the default source-context path.

## Phase 3 — Task-relevant Gemini documents

- [x] T009 In `.github/scripts/gemini-reviewer.cjs`, make Gemini CLI and Deep Research snapshots optional rather than automatically required per selected task group.
- [x] T010 Permit the CLI snapshot only for direct Gemini CLI/configuration/command work; permit the Deep Research snapshot only for Deep Research/Interactions API work.
- [x] T011 Keep additional snapshots confined to selected groups and preserve the lightweight initial path without a document-selection model call.
- [x] T012 Update `.gemini/rules/luckypickcanada.md` so it describes the two Gemini snapshots accurately and requires task relevance.
- [x] T013 Add unit tests for ordinary tasks, direct CLI tasks, and Deep Research/Interactions API tasks; update `__tests__/gemini-reviewer-workflow.test.ts` expectations.

## Phase 4 — Verification and reporting

- [x] T014 Update the existing requirements checklist and `PR_SUMMARY.md` with exact changed files and honest pending verification.
- [ ] T015 Run focused reviewer tests, full `pnpm test`, `./jules-verify.sh`, production/TypeScript build checks as applicable; record exact outcomes.
- [ ] T016 Inspect all current-head GitHub Actions, validate mergeability, inspect the complete diff, and confirm the PR remains open and unmerged.
- [ ] T017 After a naturally occurring or safely dispatched review completes, inspect its report to ensure ordinary reviews have source context and do not load irrelevant Gemini snapshots; do not claim live quality is proven without this evidence.

## Dependencies and execution order

- T001–T004 complete before implementation.
- T005–T008 establish default source inspection and honest limits.
- T009–T013 change relevance-based snapshot loading and test its scope.
- T014–T017 record evidence, perform repository verification, audit the final diff, and report remaining limits.
