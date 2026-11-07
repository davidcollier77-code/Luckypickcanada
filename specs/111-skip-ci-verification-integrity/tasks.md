# Tasks: Skip-CI Verification Integrity

**Input**: Design documents from `specs/111-skip-ci-verification-integrity/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Specification and setup

- [x] T001 Read `AGENTS.md`, the Memory Bank, the selected task-group instructions and `.docs/manifest.json`; confirm no existing tool audits current-head PR verification.
- [x] T002 Confirm the failure mode with repository history (`16588a15 [skip ci] ...`) and GitHub's documented skip-run semantics for `push`/`pull_request` versus `pull_request_target`.
- [x] T003 Complete `spec.md`, the requirements checklist, `plan.md` and this ordered task list before implementation.

## Phase 2: User Story 1 — A skipped human head cannot look verified (Priority: P1)

- [x] T004 [US1] Implement `detect_skip_ci_directives` and actor classification in `.github/scripts/verify_pr_verification_status.py`.
- [x] T005 [US1] Implement `audit_verification` so runs are matched to the exact current head SHA, earlier runs are listed as ignored, and a head directive makes the result NOT VERIFIED with required checks NOT RUN.
- [x] T006 [US1] Implement the bounded current-head wait and fresh PR/commit/check-run load so the audit always describes the head at audit time.
- [x] T007 [US1] Add the `Verification Integrity` `pull_request_target` workflow in `.github/workflows/verification-integrity.yml`, without path filters and with read-only permissions.

## Phase 3: User Story 2 — Automated commits are audited the same way (Priority: P2)

- [x] T008 [US2] Detect skip directives on bot-authored commits using GitHub's actor type and `[bot]` login, and record bot/human identity in the report.
- [x] T009 [US2] Ensure an earlier skipped commit does not block a clean, fully verified current head, while remaining visible in the report.

## Phase 4: User Story 3 — Skipped, stale and conditional checks are never passes (Priority: P3)

- [x] T010 [US3] Classify completed success as PASS, failures as FAIL, incomplete runs as PENDING, and missing/stale/skipped/neutral/cancelled/null conclusions as NOT RUN.
- [x] T011 [US3] Make the newest re-run authoritative and keep conditional checks (Visual QA) reported NOT RUN without counting as a pass.
- [x] T012 [US3] Render the Markdown evidence and reserve exit code 0 for VERIFIED, 1 for NOT VERIFIED and 2 for an audit error.

## Phase 5: Verification and delivery

- [x] T013 [Testing] Add `.github/scripts/test_verify_pr_verification_status.py` covering directive variants, human and bot skips, stale checks, missing checks, failure/pending/skipped/neutral/cancelled, re-runs, conditional checks, CLI exit codes and the workflow guard.
- [x] T014 [Testing] Wire the unit suite into `freebuff-verify.sh` before the typecheck and build.
- [x] T015 [Testing] Run the unit suite, `./freebuff-verify.sh`, TypeScript and the production build; measure the build against the 495 MB cap.
  - `python3 -m unittest discover -s .github/scripts -p 'test_verify_pr_verification_status.py'`: PASS (18 tests, OK).
  - `SPEC_KIT_BASE_REF=75d61aff ./freebuff-verify.sh`: PASS on commit `f7d4525c` (Spec Kit artifacts verified, 18 integrity tests OK, TypeScript clean, production build compiled, refresh-docs 36/36, final "All verification steps passed").
  - Build: `.next` + `public` = 351,008,260 B (334.75 MiB), below the 495 MB maximum.
  - `pnpm exec vitest run __tests__/freebuff-verify.test.js`: PASS (3 tests).
  - Live `Verification Integrity` workflow execution: NOT RUN — a `pull_request_target` workflow cannot run for the pull request that adds it.
- [x] T016 Publish the canonical PR summary, leave the PR open and unmerged, and record the final diff audit.
  - PR #1768 (`freebuff/cef6175f03deca51d10d44c1` → `main`), open and unmerged; its body is the single canonical summary.
  - Final diff: 11 files in `f7d4525c` plus this evidence-only documentation update; no application, dependency, lockfile, secret, deployment, existing-workflow or `.docs/` change; `git diff --cached --check` clean.

## Dependencies

- T004 → T005 → T006; T008 depends on T004; T010 depends on T005.
- T012 depends on T005 and T010. T013–T015 prove the complete set.

## Implementation Strategy

Ship the audit core and its tests first (a complete, independently testable
slice), then the workflow that makes the audit always run. No existing workflow,
conditional, required check or branch-protection setting is modified.
