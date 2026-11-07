# Tasks: Documentation Updater Reliability and Safety

**Input**: Design documents from `specs/103-docs-updater-integrity/`

**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Baseline and Governance

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, Memory Bank, `.docs/manifest.json`, `.freebuff/testing.md` and `.freebuff/deep-dive.md`.
- [x] T002 Inspect `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, `.github/workflows/refresh-docs.yml` and the Cloudflare updater scheduler; verify the existing schedule and retry settings.
- [x] T003 Audit the current library: 64 routed libraries, 154 routed entries, 90 secondary links, 64 `inventory` entries, 64 `sources` entries, 51 `githubShas` entries, zero broken links; measure validator thresholds against all canonical snapshots.
- [x] T004 Confirm no open pull request already covers this task.

## Phase 2: Updater Implementation

- [x] T005 Add `validateDocumentContent` and apply it to every download before size accounting or writes; preserve existing snapshots on rejection and report rejected downloads.
- [x] T006 Replace the fixed retired-ID cleanup with manifest-driven `collectRoutedLibraries`, `reconcileManifestIndexes` and `removeStaleSnapshots`; make inventory equal the routed set.
- [x] T007 Record download failures, validation rejections, removed indexes/snapshots, link repairs and consistency issues in a Markdown report (`--report` / `DOCS_REFRESH_REPORT_PATH` / step summary).
- [x] T008 Add `repairDocumentationLinks` for missing, broken, incorrect, stale and duplicate links; report differing duplicate content and never overwrite it.
- [x] T009 Add `auditLibraryConsistency` for sources, snapshots, links and unowned files; preserve all existing automation timing and timezone settings.

## Phase 3: Workflow Reporting

- [x] T010 Run the refresh step with `continue-on-error`, publish the report to the step summary, include it in the refresh PR body, comment on an existing refresh PR when only failures changed, and fail the job afterwards.
- [x] T011 Keep the three native Atlantic cron entries, concurrency, permissions, Cloudflare scheduler slots and 180-second retry delay unchanged.

## Phase 4: Tests and Verification

- [x] T012 Add validator, reconciliation, link-repair, report, retry/timezone and schedule-preservation unit tests; add a canonical-link regression check.
- [x] T013 Add `scripts/test-refresh-docs-e2e.js` and the test-only HTTPS transport: copy the real library, inject a removed document, a failing new source, a broken link and a duplicate copy, then run the complete updater.
- [x] T014 Run `node scripts/test-refresh-docs.js`: 36 passed, 0 failed (31 original + 5 review-repair regressions).
- [x] T015 Run `pnpm exec vitest run` (45 files / 354 tests), `pnpm exec tsc --noEmit` (exit 0), `SPEC_KIT_BASE_REF=269ea014 ./freebuff-verify.sh` (exit 0), and record the measured production build size: 349,900,039 B (333.69 MiB) < 495 MB. Re-ran after the repair increment.
- [x] T016 Inspect the complete final diff, update `PR_SUMMARY.md`, commit, push, open one PR against `main` and leave it open and unmerged. **PR #1748**, open and unmerged.
- [x] T017 Review the PR feedback, fix confirmed defects, and re-verify: `writeDocumentationLink`/`runRefresh` temp-path suffixes are now collision-safe, report table cells escape backslashes, and the escaping regression assertion passes.

## Dependencies

T001–T004 establish the baseline. T005–T009 implement the updater. T010–T011 wire reporting without changing automation. T012–T014 test. T015–T016 verify and deliver.

## Phase 5: Review Repair Increment (2026-11-07)

- [x] T018 Restore Spec Kit task separation: revert the PR #1749 merge on this branch without force-push or discarding commits, remove `specs/104-memory-bank-maintenance` from PR #1748 and point `.specify/feature.json` at `specs/103-docs-updater-integrity`.
- [x] T019 Make critical consistency and link-problem failures force a `FAILED` report and non-zero exit, while keeping unmanaged orphan snapshots informational.
- [x] T020 Detect routed/removed filename collisions, never delete or overwrite a routed snapshot, and fail safely without writing when ownership is ambiguous.
- [x] T021 Use `lexistsSync()` for temporary-symlink cleanup, including dangling symlinks, while preserving atomic rename repair.
- [x] T022 Add regression tests for consistency-only failures, link-only failures, removed-versus-routed collisions, dangling temp-symlink cleanup and rejected-repair snapshot preservation.
- [ ] T023 Re-run updater unit/E2E tests, Vitest, TypeScript, `./freebuff-verify.sh`, the production build with measured size, Visual QA/Playwright and scheduler validation.
- [ ] T024 Audit the final diff, correct the report to 64/64/51 index counts, update the PR body and leave PR #1748 open and unmerged.

## Implementation Strategy

One cohesive updater-hardening increment with no application, dependency, scheduler or deployment change.
