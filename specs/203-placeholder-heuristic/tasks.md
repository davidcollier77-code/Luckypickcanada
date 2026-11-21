---
description: "Tasks for the placeholder heuristic correction"
---

# Tasks: Reject Only Real Template Markers in Governance Declarations

**Input**: Design documents from `/specs/203-placeholder-heuristic/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Required by FR-006. Regression tests cover the accepted prose case and the rejected marker cases at both the helper and Governance-category levels.

## Phase 1: Heuristic correction (US1, US2)

- [X] T001 [US1] Remove the ambiguous bare `placeholder` alternative from `PLACEHOLDER` in `.github/scripts/pr_verification_report.py`.
- [X] T002 [US1] Add the whole-value `PLACEHOLDER_ONLY` pattern for a bare marker with optional formatting, punctuation and the common `text`/`value`/`here`/`goes here` suffix.
- [X] T003 [US2] Update `_placeholder()` to strip the value, reject empty or whitespace-only text and apply both patterns.

## Phase 2: Regression coverage (US1, US2)

- [X] T004 [US1] Add helper tests proving a complete declaration sentence that mentions the fallback report is not a placeholder.
- [X] T005 [US2] Add helper tests proving bare, bold, backticked and suffixed markers, the existing instruction phrases, angle-bracket placeholders and empty values are still rejected.
- [X] T006 [US1] Add a Governance-category test proving a Memory Bank declaration containing the word passes.
- [X] T007 [US2] Add Governance-category tests proving a bare marker, `TODO` and an angle-bracket marker still fail.

## Phase 3: Verification

- [X] T008 Run the consolidated report contract suite.
- [X] T009 Run `./freebuff-verify.sh` (install, Spec Kit gate, checker suites, type check, production build, refresh-docs) and measure the production build size against the 495 MiB cap.
- [ ] T010 The GitHub-triggered report remains **PENDING — runs after PR creation**; it is not claimed as executed.

## Completion Summary

- **Total tasks**: 10
- **User Story 1**: 4 tasks
- **User Story 2**: 4 tasks
- **User Story 3**: covered by the existing unchanged report assertions
- **Independent test**: the helper tests prove both sides of the distinction; the Governance tests prove the category-level outcome.
