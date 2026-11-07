# Documentation Updater Reliability and Safety

## Task and selected groups

**Assigned task:** Improve the reliability and safety of the documentation updater (`scripts/refresh-docs.js`), covering download validation, permanent removals, broken-URL reporting, internal link/symlink repair, library reconciliation and complete-workflow verification, without changing existing automation.

**Selected task groups and reasons:**

- **`troubleshooting`** — the task fixes broken source URLs, failed downloads and broken internal links, so this group's failure-handling guidance applies.
- **`deep-dive`** — an evidence-based audit of the manifest, snapshot tree, symlinks, retry timing and scheduler configuration was required before changing the updater.
- **`testing`** — the task explicitly requires executed unit tests and a complete isolated workflow, not code inspection alone.

**Feature / branch:** `specs/103-docs-updater-integrity` on `freebuff/fffa8bcf4af337cbdf4839af`. No open PR covered this task; zero open PRs existed at the start.

## Library documents reviewed

| Library document | USED | USEFUL | Explanation |
| --- | --- | --- | --- |
| `.docs/creation/_google_eng-practices.md` | YES | YES | Read the review criteria (design, functionality, complexity, tests, readability); used to audit the final diff and verify that the change is the smallest correct one. |
| `.docs/testing/_trailofbits_skills_post-patch-validation.md` | YES | YES | Baseline-versus-patched evidence and honest evidence-level reporting shaped the isolated end-to-end test and the PR verification table. |
| `.docs/deep-dive/_debian_debian-reference.md` | NO | NO | Searched for symlink/filesystem guidance; no relevant passage was found, so it did not inform the implementation. |

No other routed library document was used. `.docs/` content was not refreshed or modified.

## What was implemented

1. **Download-integrity validation.** Every download passes `validateDocumentContent` before size accounting or any write. It rejects empty/whitespace files, NUL/binary data, undecodable characters, excessive control characters, random-character content, HTTP error pages, Cloudflare/bot challenge pages and JSON error responses. A rejected download never replaces an existing snapshot; with no existing copy nothing is written. The validator is structural only — no relevance or quality scoring.
2. **General permanent removal.** `manifest.groups` is now the updater's single allowlist. `collectRoutedLibraries` derives the routed set; `reconcileManifestIndexes` prunes non-routed `sources`, `inventory` and `githubShas` entries and deduplicates inventory; `removeStaleSnapshots` deletes snapshots and non-assigned symlinks for removed documents. The previous fixed Jules-ID list was removed. Removed documents are never fetched again because routing is the only download source.
3. **Broken URLs and failures in the PR.** The updater writes a Markdown report (`--report` / `DOCS_REFRESH_REPORT_PATH` / `$GITHUB_STEP_SUMMARY`) listing each affected document, its source URL, the error and whether an existing copy was preserved. The scheduled workflow runs the refresh with `continue-on-error`, publishes the report, includes it in the refresh PR body (or comments on an existing refresh PR when only failures changed), then fails the job. Source URLs are never guessed or rewritten.
4. **Safe link and symlink repair.** `repairDocumentationLinks` creates missing links, atomically replaces broken or incorrect symlinks, collapses identical duplicate copies, removes stale links for unassigned groups, and reports differing content without overwriting it.
5. **Library consistency.** `auditLibraryConsistency` verifies source configuration, snapshot presence, existing-snapshot validity and unowned files. `inventory` is reconciled to exactly the routed library set, and each routed library has one source entry and a resolvable snapshot in every assigned group.
6. **Preserved automation.** The three native Atlantic cron entries, Cloudflare Worker dispatch slots, concurrency, permissions, 15-second request timeout, 10 MB response limit, 180-second retry delay and retry count are unchanged.

### Files changed

- `scripts/refresh-docs.js` — validation, manifest-driven reconciliation, permanent-removal pruning, link repair, consistency audit, report generation, `--docs-dir`/`--report` options, module exports for testing.
- `scripts/test-refresh-docs.js` — validator, reconciliation, link-repair, report, retry/timezone, schedule and canonical-link regression tests, plus the end-to-end runner.
- `scripts/test-refresh-docs-e2e.js` — new isolated complete-workflow test against a copy of the real library.
- `scripts/test-support/mock-refresh-https.js` — new test-only HTTPS transport (`--require`), no production hook.
- `.github/workflows/refresh-docs.yml` — report publication, PR-body report, no-change failure comment, post-report failure step; schedule unchanged.
- `specs/103-docs-updater-integrity/spec.md`, `plan.md`, `tasks.md` — Spec Kit artifacts.
- `memory-bank/activeContext.md`, `memory-bank/progress.md`, `PR_SUMMARY.md` — task records and this report.

No application, dependency, payment, database, auth, Cloudflare Worker, deployment or `.docs` content change.

## Broken source URLs and download failures

No **real library source URL** was found broken by this work, and no live refresh was run against the network. The complete-workflow test used a copy of the real library with deliberately injected failures, verified as follows:

| Document | URL (test fixture) | Failure | Existing document |
| --- | --- | --- | --- |
| `/debian/debian-reference` | `https://www.debian.org/doc/manuals/debian-reference/debian-reference.en.txt` (mocked 404) | `HTTP 404: Not Found`, 2 attempts | Preserved byte-identical |
| `/example/failing-new-doc` | `https://example.com/failing-new-doc.md` (fixture, mocked 500) | `HTTP 500: Internal Server Error`, 2 attempts | None — nothing written |
| `/numpy/numpy` | `https://numpy.org/doc/stable/reference/arrays.ndarray.html` (mocked empty body) | `download is empty` | Preserved byte-identical |
| `/goldfire/howler.js` | `https://raw.githubusercontent.com/goldfire/howler.js/master/README.md` (mocked binary body) | `download contains binary data (NUL bytes)` | Preserved byte-identical |
| `/websites/mdn_web_audio` | `https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API` (mocked error page) | `download is an HTTP error page` | Preserved byte-identical |

The report and workflow name the affected document, URL and error, and state that URLs were not changed automatically. No URL was rewritten.

## Verification

| Check | Command | Result |
| --- | --- | --- |
| Updater unit + complete isolated workflow | `node scripts/test-refresh-docs.js` | **PASS** — 31/31 |
| Full repository tests | `pnpm exec vitest run` | **PASS** — 45 files / 354 tests |
| TypeScript | `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| Repository gate | `./freebuff-verify.sh` | **PASS** — exit 0 (bootstrap, frozen install, Spec Kit gate tests, Spec Kit gate, typecheck, build, refresh tests) |
| Workflow YAML | `python3 -c "import yaml; yaml.safe_load(...)"` | **PASS** |
| Production build size | `.next` + `public` | **PASS** — 317,054,411 B + 32,840,043 B = **349,894,454 B (333.69 MiB)** < 495 MB (an earlier gate run measured 332,475,808 B / 317.07 MiB) |
| Final diff audit | `git status`, `git diff` | **PASS** — only the reported files changed; `.docs` content untouched |
| PR-head CI | GitHub Actions | **PENDING** — runs after this PR opens |
| Live scheduled refresh / Cloudflare dispatch | — | **NOT RUN** — no runner, scheduler credentials or network refresh in this workspace |

**Baseline evidence:** 64 routed libraries, 154 routed entries, 90 secondary links all resolving to their canonical snapshot, identical 64-entry `inventory`/`sources`/`githubShas`, and all 64 canonical snapshots pass the validator. The end-to-end run reconciles a removed document (3 indexes pruned, 1 snapshot deleted, URL never requested), repairs a broken link and a duplicate copy, preserves all good documents byte-identically, and keeps the real `.docs` hash unchanged.

## Remaining issues and limitations

- PR-head GitHub Actions has not run yet; results are pending and are not claimed as passing.
- The integrity validator is structural by design; it does not judge relevance, ownership or documentation quality.
- Unowned orphan `.md` files that no manifest entry references are reported, not deleted, because the updater cannot prove they are library snapshots.
- `.freebuff/<group>.md` prose routing files intentionally list only a subset of each manifest group, so they are not auto-edited; consistency is enforced across `manifest.groups`, indexes and the snapshot tree.
- A live scheduled refresh and Cloudflare Worker dispatch cannot be exercised from this workspace.

**Implementation status:** COMPLETE (final diff reviewed; no known in-scope defect).
**Verified completion:** Local mandatory gates PASS; `USEFUL RESULT: NO` until PR-head CI reports.
**Delivery:** One PR against `main`, left open and unmerged for review.
