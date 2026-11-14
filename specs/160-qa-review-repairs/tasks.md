# Tasks: QA Review Repairs

**Input**: Design documents from `specs/160-qa-review-repairs/`

**Prerequisites**: `plan.md` and `spec.md`; `research.md` and `checklists/requirements.md` provide supporting context.

## Phase 1: Review and scope

- [X] T001 Inspect PR #1900, its four reviewer sources, the current head, original scope declaration and parent feature artifacts.
- [X] T002 Inspect the active QA workflows, scripts, regression suites and relevant reference documents before defining repairs.
- [X] T003 Classify reviewer findings as already repaired, confirmed defect, intentional design, or non-applicable suggestion.

## Phase 2: Changed-file and scope checker repairs

- [X] T004 Add regression tests for absent/null rename fields and collisions between previous/current filenames.
- [X] T005 Make `changed_paths()` handle optional `previous_filename` and detect duplicate names across both path fields.
- [X] T006 Add the explicit missing-`changed_files` guard and preserve strict integer/count validation.
- [X] T007 Add path-pattern regression coverage and make the hyphen literal in the allowed character class.
- [X] T008 Recognize AVIF screenshot baselines and add a focused classification test.
- [X] T009 Protect field-specific missing-path errors and BLOCKED-report empty-list rendering with unit tests.

## Phase 3: Evidence and reviewer-regression coverage

- [X] T010 Reject obvious browser-evidence placeholder references and clarify the non-fetching validation boundary in the PR template.
- [X] T011 Replace the pending evidence value in the positive scope-approval fixture with a concrete reference.
- [X] T012 Add raw-SARIF and filtered-SARIF malformed-input tests that assert the source filename in each error.
- [X] T013 Add a two-conditional-group verification test proving that one group's failed shards cannot alter another group's result.
- [X] T014 Preserve the existing `jq 'add // []'` fixes and verify their workflow definitions rather than introducing redundant edits.

## Phase 4: Spec Kit and delivery records

- [ ] T015 Create the feature specification, plan, research, requirements checklist and task records.
- [ ] T016 Update the active feature pointer and Memory Bank context/progress.
- [ ] T017 Review the exact final changed-file inventory and prepare the complete stacked-PR handoff.

## Phase 5: Verification and submission

- [ ] T018 Run Python syntax checks and all three focused suites where a local runtime is available; otherwise record the exact environment limitation.
- [ ] T019 Confirm no production app, image, screenshot baseline, dependency, secret or protected governance file is changed.
- [ ] T020 Submit one regular, non-draft, open and unmerged PR targeting the parent QA-infrastructure branch; stop immediately after successful handoff.
 
## Verification Record

- Python `py_compile` and all three `unittest` suites: BLOCKED — no local repository checkout or executable project runtime is available through this GitHub-only session.
- Repository startup scripts and `freebuff-verify.sh`: NOT RUN, as required by the ChatGPT-specific repository instructions.
- Playwright/browser verification: NOT APPLICABLE to this non-rendering QA-script and PR-template change; no Playwright tool is exposed through the connected Firecrawl integration.
- PR-triggered workflow checks: BLOCKED for a stacked PR while the workflows' base-branch filters still select `main`; GitHub does not run the parent PR's workflow definitions for a PR whose base is the unmerged feature branch.
