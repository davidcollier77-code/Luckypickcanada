# Tasks: Faster Playwright Visual QA

**Input**: Design documents from `specs/108-playwright-qa-speed/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Specification and setup

**Purpose**: Complete the required task definition before changing the checker.

- [x] T001 Inspect `AGENTS.md`, Memory Bank, selected task-group instructions, `.docs/manifest.json`, the existing Visual QA workflow/configuration, guard test, and latest comparable Actions run.
- [x] T002 Complete `specs/108-playwright-qa-speed/spec.md` and the requirements checklist.
- [x] T003 Complete `specs/108-playwright-qa-speed/plan.md` using actual baseline timing and relevant official guidance.
- [x] T004 Complete this ordered task list before implementation.

## Phase 2: User Story 1 — Faster, safe visual execution (Priority: P1)

**Goal**: Let independent visual spec files use two CI workers without enabling parallel execution inside a file.

**Independent Test**: The config guard asserts two CI workers and `fullyParallel: false`; the PR-head run discovers the same test cases and finishes faster without increased flakiness.

- [x] T005 [US1] Extend `__tests__/visual-qa-chromium-cache.test.js` to guard the two-worker CI limit and preserve `fullyParallel: false`.
- [x] T006 [US1] Set the CI worker limit to two in `playwright.config.ts`; preserve all projects, retries, screenshot options, test discovery, baselines, and assertions.
- [ ] T007 [US1] Verify the worker-setting guard passes in the full Vitest suite and inspect the exact Playwright configuration diff.

## Phase 3: User Story 2 — Reuse pnpm package data (Priority: P2)

**Goal**: Restore pnpm's global package store from Actions cache before the unchanged frozen-lockfile installation.

**Independent Test**: The workflow guard verifies action order and pnpm cache inputs; the PR-head run reports a cache hit or miss while the frozen-lockfile command still executes.

- [x] T008 [US2] Extend `__tests__/visual-qa-chromium-cache.test.js` to require pnpm setup before setup-node, `cache: pnpm`, `cache-dependency-path: pnpm-lock.yaml`, and the unchanged frozen-lockfile install.
- [x] T009 [US2] Reorder the existing pinned setup actions and enable setup-node pnpm caching in `.github/workflows/visual-qa.yml`; preserve the Chromium cache and all other QA steps.
- [ ] T010 [US2] Verify the workflow/cache guard passes in the full Vitest suite and review the final workflow diff.

## Phase 4: Verification and report

**Purpose**: Prove that the optimizations work and that no existing coverage was removed.

- [ ] T011 Run the full Vitest suite, `pnpm exec tsc --noEmit`, and `./freebuff-verify.sh`; record actual outcomes and measured production build size.
- [ ] T012 Inspect the complete final diff and confirm no visual specs, screenshots, baselines, thresholds, application code, package manifest, or lockfile changed.
- [ ] T013 Record PR-head Visual QA duration, discovered/passed/flaky/skipped counts, and pnpm cache outcome; compare with the recorded 6.1-minute / 93-case baseline.
- [ ] T014 Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with verified results, update this task list, and point `.specify/feature.json` at feature 108.
- [x] T015 Publish one evidence-based PR summary and leave the PR open and unmerged.

## Dependencies and execution order

- Phase 1 is complete.
- T005 must precede T006; T008 must precede T009.
- T007 and T010 can be checked only after their corresponding changes are implemented.
- Phase 4 follows both implementation stories.
- The PR-head Actions run is required to prove real runtime performance and CI cache behavior.

## Completion conditions

- All 93 baseline test cases remain discoverable, with the same three project skip variants and unchanged assertions/baselines.
- The full required repository gates pass and the production build remains under 495 MB.
- The new Playwright run demonstrates the actual timing and stability outcome; otherwise the worker change is reverted or adjusted and no improvement is claimed.
- The PR remains open and unmerged.
