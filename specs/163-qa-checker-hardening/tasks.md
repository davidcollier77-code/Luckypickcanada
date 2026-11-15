# Tasks: QA Checker Hardening

**Input**: Design documents from `specs/163-qa-checker-hardening/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`

## Phase 1: Specification and design

- [x] T001 Create the feature specification and acceptance criteria in `specs/163-qa-checker-hardening/spec.md`.
- [x] T002 Record the inspected checker surface, root cause, and design decisions in `specs/163-qa-checker-hardening/research.md`.
- [x] T003 Create the implementation plan in `specs/163-qa-checker-hardening/plan.md`.
- [x] T004 Create the requirements-quality checklist in `specs/163-qa-checker-hardening/checklists/requirements.md`.

## Phase 2: Shared scope-checker repair

- [x] T005 Fix `changed_paths()` in `.github/scripts/check_qa_pr_scope.py` to handle modified and added records without `previous_filename`, preserve rename/copy handling, and fail closed on incomplete rename evidence.
- [x] T006 Add explicit modified, added, renamed, incomplete-rename, and missing-filename regression cases in `.github/scripts/test_check_qa_pr_scope.py`.
- [x] T007 Add optional `visual_impact` validation and reviewer warnings in `.github/scripts/check_qa_pr_scope.py` without weakening existing browser-evidence or exact-path failures.
- [x] T008 Add visual-impact, all-tool, and non-visual-warning tests in `.github/scripts/test_check_qa_pr_scope.py`.

## Phase 3: Changed-code review

- [x] T009 Implement dependency-free added-line patch review in `.github/scripts/review_pr_changes.py` with hard findings, advisory warnings, placeholder suppression, redaction, and deduplication.
- [x] T010 Add fixtures and regression tests in `.github/scripts/test_review_pr_changes.py` for secrets, merge markers, unsafe HTML, insecure links, suppressions, debugger statements, deprecated APIs, placeholders, environment lookups, line mapping, and clean patches.
- [x] T011 Add the changed-code review to the read-only PR Scope workflow in `.github/workflows/pr-scope-verification.yml` with separate warning and hard-failure reporting.

## Phase 4: Verification wiring and preservation

- [x] T012 Replace the duplicated `freebuff-verify.sh` step with a standalone TypeScript check in `.github/workflows/visual-qa.yml`, retaining the full unit suite.
- [x] T013 Update `__tests__/visual-qa-chromium-cache.test.js` to assert the standalone TypeScript step, the full unit suite, and the absence of a `freebuff-verify.sh` QA dependency.
- [x] T014 Add `test_review_pr_changes` to the QA checker test command in `.github/workflows/visual-qa.yml`.
- [x] T015 Add the optional `visual_impact` field and warning guidance to `.github/pull_request_template.md`.
- [x] T016 Make the Visual QA classifier honor a declared `visual_impact.required: true` while retaining path-based fail-closed classification.
- [x] T017 Update `scripts/test-verify-speckit-task.sh` so only workflows that still run the governance gate require the trusted PR-author input.

## Phase 5: Task records and verification

- [x] T018 Set `.specify/feature.json` to `specs/163-qa-checker-hardening`.
- [x] T019 Pin the Daily Resonance test clock to its mocked date fixture so the suite is deterministic on later calendar days.
- [x] T020 Run the focused QA checker suites, Crystal Ball focused tests, TypeScript, unit tests, `./freebuff-verify.sh`, and the production build; record results in `specs/163-qa-checker-hardening/evidence.md`.
- [x] T021 Review the final diff and confirm no application, artwork, audio, payment, database, authentication, hosting, dependency, or lockfile changes.
- [x] T022 Update `memory-bank/activeContext.md`, `memory-bank/progress.md`, and `memory-bank/techContext.md`.
- [ ] T023 Prepare the complete PR body and submit one regular, non-draft, unmerged PR.
