# Tasks: Playwright Version Alignment

**Input**: Design documents from `specs/100-playwright-version-alignment/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Specify, plan, and task definition

- [x] T001 Inspect `AGENTS.md`, `.freebuff/freebuff.md`, the Memory Bank, `.docs/manifest.json`, `package.json`, `pnpm-lock.yaml`, `playwright.config.ts`, the Visual QA workflow, and the existing dependency guard.
- [x] T002 Reproduce the failure: `pnpm exec playwright --version` reports 1.63.0 while installed `@playwright/test` and `playwright-chromium` report 1.64.1, and `pnpm exec playwright test --list` aborts with "Playwright Test did not expect test() to be called here."
- [x] T003 Complete `specs/100-playwright-version-alignment/spec.md` and its quality checklist.
- [x] T004 Complete `specs/100-playwright-version-alignment/plan.md` and check it against the constitution.
- [x] T005 Complete this ordered task list before implementation.

## Phase 2: Dependency correction (User Story 1 and User Story 2)

- [x] T006 [US2] Change the `playwright` devDependency range in `package.json` from `^1.63.0` to `^1.64.1`, leaving `@playwright/test` and `playwright-chromium` unchanged.
- [x] T007 [US2] Regenerate `pnpm-lock.yaml` so the root importer and package snapshots resolve `playwright` and `playwright-core` to 1.64.1 and the 1.63.0 entries are removed.
- [x] T008 [US2] Confirm the lockfile diff touches only the Playwright importer entry and the `playwright`/`playwright-core` 1.63.0 package and snapshot entries.

## Phase 3: Regression guard (User Story 2)

- [x] T009 [US2] Add `__tests__/playwright-version-alignment.test.js` asserting one shared declared range, one shared lockfile resolution for `playwright`, `@playwright/test` and `playwright-chromium`, and no leftover Playwright version.

## Phase 4: Records

- [x] T010 Point `.specify/feature.json` at `specs/100-playwright-version-alignment`.
- [x] T011 Prepend the current task state to `memory-bank/activeContext.md` and `memory-bank/progress.md` without rewriting existing records.
- [x] T012 Update `PR_SUMMARY.md` as the single canonical report and publish it as the pull request body.

## Phase 5: Verify and report (User Story 1 and User Story 3)

- [x] T013 `pnpm exec playwright --version` reports 1.64.1.
- [x] T014 Installed `playwright`, `@playwright/test`, `playwright-chromium` and `playwright-core` all report 1.64.1; `pnpm install --frozen-lockfile` exits 0.
- [x] T015 `pnpm exec playwright test --list` completes and lists the visual suite with no registration error.
- [x] T016 `pnpm exec playwright test` passes all three projects with the committed baselines unchanged — 90 passed / 3 skipped / 0 failed, no baseline regenerated.
- [x] T017 Focused alignment guard 13/13, full `pnpm exec vitest run` 44 files / 346 tests, `pnpm exec tsc --noEmit` exit 0, and `./freebuff-verify.sh` exit 0.
- [x] T018 Production build measured at 435,036,366 B (414.88 MiB), below the 495 MB maximum.
- [x] T019 Final diff audited: no visual test, baseline, application, artwork, workflow, or unrelated dependency change.
- [ ] T020 PR-head CI evidence for Visual QA (PENDING until the pushed branch reports).

## Completion Conditions

Implementation is complete when the manifest and lockfile agree on Playwright 1.64.1, the guard exists, and the final diff contains no visual or application change. Verified completion additionally requires the discovery, visual suite, repository gates, measured build size, and PR-head CI evidence; until those exist they are reported as `PENDING`/`NOT RUN`, never as passed.
