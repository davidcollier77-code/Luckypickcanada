# Tasks: Fix Updater Scheduler pnpm Cache Order

**Input**: Design documents from `specs/144-fix-updater-scheduler-pnpm-cache-order/`

## Phase 1: Repair and Verify

- [x] T001 Reorder the pinned pnpm setup before Node.js cache setup in both jobs in `.github/workflows/deploy-updater-scheduler.yml`.
- [x] T002 Review both jobs to confirm Node.js 26, pnpm 10.30.3, pnpm cache settings, frozen-lockfile install, scheduler tests, governance checks, build-size gate, canary and deployment safeguards remain intact.
- [ ] T003 Confirm the repaired setup succeeds on a current-head GitHub Actions run and the scheduler verification commands are reached.

## Dependencies & Execution Order

- T001 is the implementation.
- T002 is the source-level regression review.
- T003 runs after PR creation in GitHub Actions; it is not claimed as passed before that run completes.
