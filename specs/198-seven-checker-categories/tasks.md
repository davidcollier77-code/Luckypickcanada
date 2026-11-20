---
description: "Tasks for the seven-category PR verification contract"
---

# Tasks: Seven Checker Categories

**Input**: Design documents from `/specs/198-seven-checker-categories/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Required by FR-013. Regression tests cover the declarations, the seven categories, status classification, current-head evidence, scope expansion, protected-file authorization, the removed browser-evidence requirement and workflow hygiene.

## Phase 1: Consolidated seven-category reporting (US1)

- [X] T001 [US1] Add `.github/scripts/pr_verification_report.py` with exactly seven categories, the four report statuses, current-head check matching, supporting QA evidence and in-place rendering.
- [X] T002 [US1] Add `.github/workflows/pr-verification-report.yml` publishing one sticky report from trusted `main`, including `workflow_run` refreshes and a non-zero gate after publication when a category is `FAILED`.
- [X] T003 [US1] Fold the changed-code review, test-quality, performance, security-alert and Visual QA summary outputs into the QA Checker and DevSkim categories, and remove the duplicate standalone comment workflows.
- [X] T004 [US1] Keep `checker_suite.py`, `review_pr_changes.py`, `verify_pr_verification_status.py` and their detailed findings as the evidence source for the report.

## Phase 2: Submitter declarations and scope rules (US1, US2)

- [X] T005 [US1] Require the exact pre-submission code quality review declaration in the QA Checker.
- [X] T006 [US1] Require the exact protected-file human authorization declaration for protected changes while keeping the separate human gate.
- [X] T007 [US1] Require the exact words `Scope changed` plus a specific explanation for scope expansion, retain the owner approval digest and remove the submitter browser-evidence requirement.
- [X] T008 [US1] Report Spec Kit stages, declared artifact evidence, task groups, Library documents and Memory Bank without claiming independent verification.

## Phase 3: Documentation and governance (US2)

- [X] T009 [US2] Rewrite `PR_SUBMISSION.md` for the seven-category contract and complete description requirements.
- [X] T010 [US2] Rewrite `.github/pull_request_template.md` so it agrees with `PR_SUBMISSION.md` and keeps the QA scope markers, JSON fields, approval commands and baseline/governance controls.
- [X] T011 [US2] Record the active feature in `.specify/feature.json` and update the Memory Bank task records.

## Phase 4: Verification (US3)

- [X] T012 [US3] Add `.github/scripts/test_pr_verification_report.py` and update `.github/scripts/test_check_qa_pr_scope.py`.
- [X] T013 [US3] Rewrite `__tests__/checker-suite-workflows.test.js` for seven-category workflow hygiene and preserved Playwright/DevSkim/build behaviour.
- [X] T014 [US3] Retarget `__tests__/qa-review-comment.test.js` to the consolidated sticky comment, including refusal of unmarked or oversized bodies.
- [X] T015 [US3] Run the checker suites, focused and full Vitest suites, the TypeScript check, the production build and the build-size measurement.

## Completion Summary

- **Total tasks**: 15
- **User Story 1**: 8 tasks
- **User Story 2**: 3 tasks
- **User Story 3**: 4 tasks
- **Independent test**: The Python suite asserts the exactly-seven-category contract, declaration matching, status classification and current-head evidence; the Vitest workflow-hygiene suite proves the existing Playwright, DevSkim, build and upsert behaviour remains intact.
