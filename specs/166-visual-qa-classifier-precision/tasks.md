# Tasks: Visual QA Classification Precision and Playwright QA Initialization

**Feature**: `166-visual-qa-classifier-precision`
**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Investigation

- [x] T001 Inspect `.github/workflows/visual-qa.yml`, `.github/scripts/classify-visual-changes.sh` and `__tests__/visual-qa-chromium-cache.test.js` in full.
- [x] T002 Inspect the existing Visual QA specifications (`098`, `109`, `147`, `158`, `163`) and the spec/plan/tasks of merged PR #1914.
- [x] T003 Record the exact changed-file set of merged PR #1914 from Git history and its scripts-only `package.json` diff.
- [x] T004 Trace the QA jobs' Playwright initialization and confirm where the duplicate browser download occurs.

## Phase 2: Classifier and comparator

- [x] T005 Add agent/Playwright skill documentation and standalone Playwright configuration as positively non-rendering classes while keeping `playwright.config.ts` visual.
- [x] T006 Add the fail-closed `package-json-scripts-only.mjs` comparator with canonical manifest comparison and a test/tooling script allowlist.
- [x] T007 Gate the classifier's `package.json` decision on `PACKAGE_JSON_SCRIPTS_ONLY=true` only.

## Phase 3: Workflow

- [x] T008 Fetch base/head `package.json` in the `changes` job and pass the comparator result to the classifier.
- [x] T009 Fail closed with warnings on a failed fetch, failed comparator or unexpected value.
- [x] T010 Skip Playwright's npm postinstall browser download in both QA dependency installs without changing explicit Chromium provisioning.
- [x] T011 Preserve the always-on `verify` job, gated `visual` job, permissions, concurrency, baselines and test commands.

## Phase 4: Regression coverage

- [x] T012 Cover documentation-only, agent/Playwright documentation, standalone configuration, scripts-only and dependency `package.json`, components, styles, images, fonts, mixed, unknown and fail-closed cases.
- [x] T013 Add the merged PR #1914 changed-file regression case using the real manifest comparator.
- [x] T014 Cover comparator rejection of dependency, lifecycle, unrecognised-script and non-scripts changes plus invalid input.
- [x] T015 Cover the new workflow wiring, including both install steps and the unchanged explicit browser steps.

## Phase 5: Verification and records

- [x] T016 Run the focused classifier suite.
- [x] T017 Run the full unit suite, TypeScript and `./freebuff-verify.sh`; record the production build size.
- [x] T018 Parse the workflow YAML and syntax-check the extracted shell blocks.
- [x] T019 Update `.specify/feature.json`, Memory Bank and `evidence.md`.
- [ ] T020 Review the complete diff, prepare the PR body and open one regular, non-draft, unmerged PR.
