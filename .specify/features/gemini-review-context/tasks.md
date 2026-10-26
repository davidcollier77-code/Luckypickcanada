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
- [x] T015 Verified focused reviewer tests, full Vitest, TypeScript, `./jules-verify.sh`, production build, 495 MiB size gate, OpenNext/Cloudflare and Wrangler no-deploy checks through GitHub Actions. Current measured build output: 315.74 MiB.
- [x] T016 Inspected the complete changed-file list/diff and current-head GitHub Actions; DevSkim, unit tests, TypeScript, Spec Kit verification, build/size gate, OpenNext, Wrangler, updater governance and visual regression tests passed. GitHub reports mergeable; PR remains open and unmerged.
- [ ] T017 After a naturally occurring or safely dispatched review completes, inspect its report to ensure ordinary reviews have source context and do not load irrelevant Gemini snapshots; do not claim live quality is proven without this evidence.

## Phase 5 — Finding-level fix UX

- [x] T018 Build a complete, standalone copy/paste implementation prompt for every finding in the existing collapsed review section.
- [x] T019 Add a trusted `@gemini repair one <path>:<line> -- <finding title>` command that re-reviews and only targets the exact reproduced finding; preserve `@gemini repair all` for all eligible findings.
- [x] T020 Add regression tests for standalone prompts, eligible-target visibility, command parsing/path safety, stale target rejection, and all-findings footer instructions.
- [x] T021 Update Gemini's review rules, the feature spec/plan/checklist, PR summary, and active context to describe targeted and all-findings opt-in suggestions accurately.
- [ ] T022 Verify the new code and tests on the final PR head with GitHub Actions; inspect generated review formatting and keep live-model acceptance distinct from static/unit-test coverage.

## Dependencies and execution order

- T001–T004 complete before implementation.
- T005–T008 establish default source inspection and honest limits.
- T009–T013 change relevance-based snapshot loading and test its scope.
- T018–T021 implement and test finding-level prompt/suggestion UX after the existing reviewer context changes.
- T014–T017 and T022 record evidence, perform repository verification, audit the final diff, and report remaining limits.
