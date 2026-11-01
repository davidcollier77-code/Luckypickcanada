# Tasks: Gemini Reviewer Instruction Consolidation and Library-Context Removal

**Input**: `.specify/features/gemini-review-context/spec.md` and `plan.md`

## Phase 1 — Specify and plan

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, `.freebuff/deep-dive.md`, Memory Bank files,
  `.docs/manifest.json` routing, and the existing Spec Kit features
  (`gemini-review-context`, `gemini-review-depth`, `creation-gemini-reviewer`), plus branches and
  commits for related reviewer work.
- [x] T002 Inspect the current reviewer implementation, autofix module, workflow, and reviewer test
  suites; record every reference to the old rules path and to Library-document loading.
- [x] T003 Update `spec.md` with the single-instruction-file and no-Library-context requirements.
- [x] T004 Update `plan.md` with the removal list, preserved capabilities, and verification plan.
- [x] T005 Update this task list before implementation and point `.specify/feature.json` at this
  feature.

## Phase 2 — Instruction file consolidation

- [x] T006 Create root-level `GEMINI_REVIEWER.md` in the Amazon Q A/B/C structure, consolidating the
  Gemini-specific status, evidence, severity, coverage, adversarial, fix-control and no-change rules.
- [x] T007 Point `RULE_PATH` at `GEMINI_REVIEWER.md`, keep the fail-closed `RULES` check, and remove
  `GEMINI_API_DEV_SKILL_PATH`.
- [x] T008 Verify no other supported integration reads `.gemini/rules/luckypickcanada.md`, then
  delete it.
- [x] T009 Update the workflow trusted-file integrity check to guard `GEMINI_REVIEWER.md` instead of
  the retired directory.

## Phase 3 — Remove Library-document context

- [x] T010 Remove manifest parsing and its coverage gap from the reviewer.
- [x] T011 Remove task-group classification, document selection, snapshot loading, skill loading,
  document assessment fields, and the review-context document report, including their exports.
- [x] T012 Remove document bundle, document paths and document report from primary, adversarial and
  fix-suggestion prompts and from the fix module's parameters.
- [x] T013 Keep changed-code patches, bounded relevant-source retrieval, coverage disclosure,
  batching, adversarial pass, schema validation and JSON recovery, model chain, formatting and
  opt-in suggestions unchanged.

## Phase 4 — Tests and artifacts

- [x] T014 Update `__tests__/gemini-reviewer-workflow.test.ts` for the new rule file, workflow guard
  and absence of document loading.
- [x] T015 Update `__tests__/gemini-reviewer-context.test.ts` and `...-trigger.test.ts` to drop
  document-selection assertions and assert the new instruction loading.
- [ ] T016 Run focused reviewer tests, full `pnpm test`, `pnpm exec tsc --noEmit`, and
  `./freebuff-verify.sh`; record real results including the production build size.
- [ ] T017 Inspect the complete final diff, update `PR_SUMMARY.md` and
  `memory-bank/activeContext.md`, and leave the PR open and unmerged.
- [ ] T018 Live-model acceptance of the simplified reviewer — BLOCKED here because this environment
  has no `GEMINI_API_KEY`; the trusted-base workflow is the confirmation path.

## Dependencies and execution order

- T006–T009 (instruction source) precede T010–T013 (context removal) so the reviewer never runs
  without a standing instruction file.
- T014–T015 follow the implementation; T016–T017 record evidence; T018 must not be claimed.
