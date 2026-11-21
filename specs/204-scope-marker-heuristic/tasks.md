---
description: "Tasks for the QA scope marker heuristic correction"
---

# Tasks: Accept Filled QA Scope Fields That Mention the Marker Word

**Input**: Design documents from `/specs/204-scope-marker-heuristic/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Required by FR-006. Regression tests cover accepted prose and rejected marker-only values for the summary, feature names, file purposes, shared reasons and the "Scope changed" explanation.

## Phase 1: Heuristic correction (US1, US2)

- [X] T001 [US1] Add the whole-value `PLACEHOLDER_ONLY` pattern and the shared marker helper in `.github/scripts/check_qa_pr_scope.py`.
- [X] T002 [US1] Remove the ambiguous bare word from the summary, feature, purpose, reason and explanation patterns while preserving each field's existing instruction markers.
- [X] T003 [US1] Apply the shared helper to the summary, feature names, per-file purposes, scope-expansion reasons, visual-impact reasons and the "Scope changed" explanation.

## Phase 2: Regression coverage (US1, US2)

- [X] T004 [US1] Add tests proving a filled summary, feature name and per-file purpose that mention the marker word are accepted.
- [X] T005 [US1] Add tests proving filled scope-expansion, visual-impact and "Scope changed" explanations that mention the word are accepted.
- [X] T006 [US2] Add tests proving bare, bold and suffixed markers and the existing instruction markers are still rejected in the named fields.
- [X] T007 [US2] Add tests proving marker-only scope reasons and a marker-only "Scope changed" explanation are still rejected.

## Phase 3: Verification

- [X] T008 Run the QA scope checker suite.
- [X] T009 Run `./freebuff-verify.sh` (install, Spec Kit gate, checker suites, type check, production build, refresh-docs) and measure the production build size against the 495 MiB cap.
- [ ] T010 The GitHub-triggered PR Scope Verification remains **PENDING — runs after PR creation**; it is not claimed as executed.

## Completion Summary

- **Total tasks**: 10
- **User Story 1**: 5 tasks
- **User Story 2**: 3 tasks
- **User Story 3**: covered by the existing unchanged scope assertions
- **Independent test**: the field-level tests prove both sides of the distinction; the approval and path tests prove the surrounding rules are unchanged.
