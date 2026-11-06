# Tasks: Conditional Visual QA with Cached Chromium

**Input**: Design documents from `specs/098-visual-qa-chromium-cache/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Specify, plan, and task definition

- [x] T001 Inspect `AGENTS.md`, `.freebuff/freebuff.md`, the Memory Bank, the current Visual QA workflow, `playwright.config.ts`, the installed Playwright version, the Spec Kit verifier, and the existing workflow guard tests.
- [x] T002 Complete `specs/098-visual-qa-chromium-cache/spec.md` and its quality checklist.
- [x] T003 Complete `specs/098-visual-qa-chromium-cache/plan.md` and check it against the constitution.
- [x] T004 Complete this ordered task list before implementation.

## Phase 2: Classifier (User Story 1 and User Story 3)

- [x] T005 [US1] Add `.github/scripts/classify-visual-changes.sh`: stdin path list to `visual_required=true|false`, documentation-only allowlist, fail-closed on empty input and unknown paths.
- [x] T006 [US3] Add the `changes` job in `.github/workflows/visual-qa.yml` that lists pull request files through `gh api` and writes `visual_required=true` on a failed listing, a failed classifier invocation, or an unexpected value.
- [x] T007 [US1] Gate the browser steps in `.github/workflows/visual-qa.yml` on `needs.changes.outputs.visual_required == 'true'`, and add `needs: changes` to the `visual` job.

## Phase 3: Cached Chromium (User Story 2)

- [x] T008 [US2] Add the Playwright version resolution step with strict semver validation.
- [x] T009 [US2] Cache `~/.cache/ms-playwright` under `playwright-chromium-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}` with no `restore-keys`.
- [x] T010 [US2] Install with `playwright install --with-deps chromium` on a cache miss and `playwright install-deps chromium` on a cache hit; install no other browser.

## Phase 4: Guard tests and records

- [x] T011 Add `__tests__/visual-qa-chromium-cache.test.js`: executed classifier decisions (visual path, documentation-only, mixed, empty, unknown type, CRLF) plus workflow wiring assertions (job output and dependency, cache key and path, cache-hit split, Chromium-only, gated baseline and regression steps, preserved ungated QA steps, Chromium-only Playwright projects).
- [x] T012 Point `.specify/feature.json` at `specs/098-visual-qa-chromium-cache`.
- [x] T013 Prepend the current task state to `memory-bank/activeContext.md` and `memory-bank/progress.md` without rewriting existing records.
- [x] T014 Update `PR_SUMMARY.md` as the single canonical report.

## Phase 5: Verify and report

- [x] T015 Focused classifier/workflow guard suite — PASS: 1 file / 11 tests, with the classifier executed against nine path lists.
- [x] T016 Full `pnpm exec vitest run` (43 files / 343 tests PASS), `pnpm exec tsc --noEmit` (exit 0), and `./freebuff-verify.sh` (exit 0). Production build `.next` 298,726,713 B + `public` 32,840,043 B = 331,566,756 B (316.2 MiB), below the 495 MB maximum.
- [x] T017 Inspect the complete diff and confirm no application, baseline, threshold, dependency, or unrelated workflow change.
- [ ] T018 GitHub Actions evidence for the three runtime paths (non-visual skip, cache hit, cache miss and version change) — requires a real pull request run on the pushed head.

## Completion Conditions

Implementation is complete when the classifier, the conditional workflow steps, the cache key, and the guard tests are present and the local gates pass. Verified completion additionally requires PR-head Visual QA evidence for the runtime cache and skip paths; until that exists those paths are reported as NOT RUN rather than passed.
