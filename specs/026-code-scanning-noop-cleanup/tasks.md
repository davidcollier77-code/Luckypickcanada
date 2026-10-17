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

- [ ] T008 Run the targeted quota test, full unit suite, TypeScript check, and ./jules-verify.sh in the Visual QA workflow; record run ID and outcomes in PR_SUMMARY.md.
- [ ] T009 Verify the production/OpenNext/Cloudflare build and measured output remains below the 495 MiB cap; record run ID and measured size in PR_SUMMARY.md.
- [ ] T010 Inspect CodeQL on the final head and record the code-scanning alert status.
- [ ] T011 Retry the Robin review after the cleanup commit; record either a completed review or the exact external timeout without weakening the check.
- [ ] T012 Audit the final PR diff against this file list and mark only actually completed tasks [x] in tasks.md.
