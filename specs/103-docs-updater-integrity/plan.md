# Implementation Plan: Documentation Updater Reliability and Safety

**Branch**: `freebuff/fffa8bcf4af337cbdf4839af` | **Date**: 2026-11-07 | **Spec**: `spec.md`

## Summary

Harden the existing `scripts/refresh-docs.js` updater in place. Add a structural document-integrity validator applied before any write, replace the fixed retired-ID list with a manifest-driven allowlist and reconciliation, collect broken URLs and validation failures into a PR-ready report, repair broken/duplicate snapshot links, and wire the report into the existing scheduled workflow without changing its schedule or retry timing.

## Technical Context

**Language**: Node.js 22 CommonJS script and tests; YAML workflow.

**Dependencies**: None added or changed.

**Storage**: `.docs/manifest.json`, `.docs/<group>/*.md` snapshots and symlinks.

**Testing**: `node scripts/test-refresh-docs.js` (unit + isolated end-to-end), `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`, workflow YAML parse check.

**Constraints**: Preserve the Tuesday/Friday 02:21, 06:21, 10:21 Atlantic schedule, Cloudflare Worker slots, 180-second retry delay, 15-second request timeout, 10 MB response limit, 495 MB library cap, and the 495 MB build cap.

## Constitution Check

- Smallest correct change: one updater script, its tests plus a test transport, one workflow, Spec Kit artifacts and memory records.
- Authorized scope: the task explicitly authorizes documentation-updater changes.
- Preservation: no application code, dependencies, payments, database, auth, Cloudflare Worker, schedule or deployment change.
- No subjective relevance scoring and no automatic URL rewriting.

## Phase 0: Research and Baseline

- `scripts/refresh-docs.js` refreshed every library in `manifest.groups`, skipped libraries without sources, wrote downloads without inspecting them, and failed the job before the PR step on any fetch error.
- The previous permanent-removal approach was a fixed set of Jules IDs (`RETIRED_LIBRARY_IDS`) plus fixed filenames; it did not generalize.
- `.docs` currently has 64 routed libraries, 154 routed entries, 90 secondary links and no broken links; `inventory` has 64 entries, `sources` has 64 entries and `githubShas` has 51 entries.
- All 64 canonical snapshots pass the proposed validator thresholds (minimum 565 characters, 49 readable words, word-character ratio ≥ 0.75).

## Phase 1: Design Decisions

1. **Validation** (`validateDocumentContent`): reject non-strings, empty/whitespace, NUL bytes, undecodable/replacement characters, excessive control characters, known error/challenge-page patterns, content shorter than 24 non-whitespace characters, fewer than 5 readable words, and a word-character ratio below 0.5. Applied after download and before size accounting or any write.
2. **Permanent removal**: `manifest.groups` is the single allowlist. `collectRoutedLibraries` derives the routed set; `reconcileManifestIndexes` prunes non-routed `sources`, `inventory` and `githubShas` entries and deduplicates inventory; `removeStaleSnapshots` deletes updater-managed snapshots and non-assigned symlinks. The fixed Jules list is removed.
3. **Reporting**: the updater writes a Markdown report to `--report`/`DOCS_REFRESH_REPORT_PATH` and `$GITHUB_STEP_SUMMARY`. The workflow runs the updater with `continue-on-error`, publishes the report, updates the PR body (or comments on an existing refresh PR when there are no document changes), then fails the job.
4. **Link repair**: compute each library's primary group, then create missing links, replace broken/incorrect symlinks atomically, collapse identical duplicate copies, delete stale links for unassigned groups, and report differing content instead of overwriting it.
5. **Consistency audit**: verify indexes, sources, snapshots and links; report missing sources, missing snapshots, invalid existing snapshots and unowned files.
6. **Test isolation**: `--docs-dir` selects a temporary copy of `.docs`; a `--require` HTTPS mock serves snapshot content and injected failures; `DOCS_REFRESH_RETRY_DELAY_MS` is test-only and defaults to the unchanged 180000 ms.

## Repair Increment (2026-11-07)

Independent review of PR #1748 found governance drift, false-success reporting, filename-collision risk and incomplete temp cleanup. The repair stays inside the same feature directory and updater contract.

1. **Spec Kit separation**: revert the merge of PR #1749 on this branch without rewriting history. PR #1749's commits remain in the branch history and its own PR; `specs/104-memory-bank-maintenance` is not part of PR #1748. Restore `.specify/feature.json` to `specs/103-docs-updater-integrity`.
2. **Failure state**: classify consistency issues as critical by default; only unmanaged/orphan snapshots are informational (`severity: warning`). Any `linkProblems` entry is critical. `hasCriticalFailures(report)` drives both the rendered result and `main()`'s exit code, so critical defects cannot report `SUCCESS` or exit 0 without a download failure.
3. **Filename ownership**: `findFilenameCollisions()` compares the sanitized filename of every routed and removed library ID. Colliding routed libraries are skipped (never written), and `removeStaleSnapshots()` refuses to delete a filename owned by any routed document or by more than one identifier. Collisions are reported as critical.
4. **Temp cleanup**: all cleanup checks use `lexistsSync()` and `cleanupStaleTempFiles()` removes dangling symlink entries as well as regular files. Primary and fallback temp names keep distinct suffixes; rename remains the atomic publish step.
5. **Report accuracy**: record the real baseline (64 inventory, 64 sources, 51 GitHub SHA entries) in the PR report and task artifacts.
6. **Regression tests**: add the five review scenarios plus a CLI failure-code check, then rerun the updater suite, isolated workflow, Vitest, TypeScript, repository gate, production build, Visual QA/Playwright and scheduler validation.

## Project Structure

```text
scripts/refresh-docs.js
scripts/test-refresh-docs.js
scripts/test-refresh-docs-e2e.js
scripts/test-support/mock-refresh-https.js
.github/workflows/refresh-docs.yml
specs/103-docs-updater-integrity/{spec,plan,tasks}.md
memory-bank/activeContext.md
memory-bank/progress.md
PR_SUMMARY.md
```

## Complexity Tracking

No new dependency, subsystem, route, schema, service or deployment change.
