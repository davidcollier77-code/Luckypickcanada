---
description: "Tasks for publishing a FAILED verification report"
---

# Tasks: Publish a FAILED Report Instead of a Placeholder

**Input**: Design documents from `/specs/202-failed-report-publication/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Required by FR-005. Tests cover the renderer body on exit 1, the workflow guard and the preserved placeholder behaviour.

## Phase 1: Publication fix (US1)

- [X] T001 [US1] Exclude renderer exit 1 from the `NOT RUN` placeholder guard in `.github/workflows/pr-verification-report.yml`, so a `FAILED` category publishes the real report body.
- [X] T002 [US1] Keep the placeholder for every other non-zero status and for a missing or empty body, and leave the status gate unchanged.

## Phase 2: Regression coverage (US1, US2)

- [X] T003 [US1] Extend the CLI failure test to assert the renderer writes a marker-first body containing `**FAILED**` before returning 1.
- [X] T004 [US1] Add a workflow-contract test proving the placeholder guard excludes exit 1 and no longer uses the old any-non-zero condition.
- [X] T005 [US2] Mirror the guard assertion in `__tests__/checker-suite-workflows.test.js`.

## Phase 3: Verification

- [X] T006 Run the report and Vitest contract suites.
- [X] T007 Run `./freebuff-verify.sh` (install, Spec Kit gate, checker suites, type check, production build, refresh-docs) and measure the production build size against the 495 MiB cap.
- [ ] T008 The GitHub-triggered publication remains **PENDING — runs after PR creation**; it is not claimed as executed.

## Completion Summary

- **Total tasks**: 8
- **User Story 1**: 4 tasks
- **User Story 2**: 1 task
- **Independent test**: the renderer test proves exit 1 writes a `FAILED` body; the workflow tests prove that body is published and the placeholder still covers render errors.
