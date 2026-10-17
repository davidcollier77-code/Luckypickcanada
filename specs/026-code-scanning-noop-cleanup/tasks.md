# Tasks: Remove the No-op Code-scanning Debug Artifact

**Input**: specs/026-code-scanning-noop-cleanup/spec.md and plan.md

**Prerequisites**: plan.md and spec.md  
**Tests**: Existing repository checks are required to verify the cleanup and governance fix.

## Phase 1: Setup and verified analysis

**Purpose**: Confirm the source of the alert and the failed gate.

- [x] T001 Inspect PR #1510 diff, test_fix.js content, package.json, Spec Kit verifier, and failed Visual QA/Robin workflow logs in PR_SUMMARY.md.
- [x] T002 Identify the verified Visual QA failure: stale active Spec Kit feature pointer and unchanged specs/025-crystal-ball-audio-daily-limit/spec.md.

## Phase 2: Specify and plan

**Purpose**: Create task-specific artifacts used by the repository verification gate.

- [x] T003 Create specs/026-code-scanning-noop-cleanup/spec.md and its checked requirements checklist.
- [x] T004 Create specs/026-code-scanning-noop-cleanup/plan.md, research.md, and quickstart.md with the verified cause, boundaries, and checks.
- [x] T005 Point .specify/feature.json at specs/026-code-scanning-noop-cleanup and create this tasks.md.

## Phase 3: User Story 1 — Remove the inert debugging artifact (P1)

**Goal**: Remove dead debugging code and preserve application behavior.

**Independent Test**: The PR no longer contains test_fix.js, and application tests/builds remain green.

- [x] T006 [US1] Delete the inert root-level test_fix.js file from the repository.
- [x] T007 [US1] Update PR_SUMMARY.md and Memory Bank records for this task without changing application code or CI policy.

## Phase 4: Validate and report

**Purpose**: Run actual remote verification; never infer a pass from inspection.

- [x] T008 Run the targeted quota test, full unit suite, TypeScript check, ./jules-verify.sh, and Playwright suite in .github/workflows/visual-qa.yml; record run #39036393317 and real outcomes in PR_SUMMARY.md.
- [x] T009 Verify the production/OpenNext/Cloudflare build in .github/workflows/validate-open-next-repair.yml and measured output below the 495 MiB cap; record run #39036393128 and exact size in PR_SUMMARY.md.
- [x] T010 Inspect the updated-head CodeQL analyses in run #39036390039 and record that all analyzers pass while the alert dashboard state cannot be queried through the connected API.
- [x] T011 Retry Robin review through .github/workflows/robin.yml, inspect its two failed attempts and pinned Robin v2.12.0 pre-first-chunk error handling, and record the unresolved/masked provider outcome in PR_SUMMARY.md without weakening the reviewer gate.
- [x] T012 Audit the live PR file inventory and reconcile all 11 changed paths exactly once in PR_SUMMARY.md.
