# Documentation Updater Reliability and Safety

## Task and selected groups

**Assigned task:** Repair PR #1748 from the independent review: restore Spec Kit task separation, make critical updater integrity defects fail, protect filename-collision ownership, harden temporary-symlink cleanup, correct the report and add regression coverage.

**Selected task groups and reasons:**

- **`troubleshooting`** — the task fixes failure states, broken links and unsafe cleanup in the updater, so this group's failure-handling guidance applies.
- **`deep-dive`** — the repair required an evidence-based audit of the branch history, manifest indexes, snapshot routing, filename ownership, atomic writes and scheduler configuration.
- **`testing`** — the task requires executed unit/E2E tests, a CLI exit-code check and complete repository verification.

**Feature / branch:** `specs/103-docs-updater-integrity` on `freebuff/fffa8bcf4af337cbdf4839af`. PR #1748 is open and unmerged.

**Governance separation:** PR #1749 (Memory Bank maintenance) had been merged into this PR's source branch, adding `specs/104-memory-bank-maintenance` and governance/memory-bank changes. The merge commit `db67ba58` was reverted with `git revert -m 1`; its commits remain in branch history and in PR #1749, and no history was rewritten or force-pushed. PR #1748 now contains only the documentation-updater task, and `.specify/feature.json` points to `specs/103-docs-updater-integrity`.

## Library documents reviewed

| Library document | USED | USEFUL | Explanation |
| --- | --- | --- | --- |
| `.docs/creation/_google_eng-practices.md` | YES | YES | Review criteria (design, functionality, complexity, tests, readability) guided the final diff audit and kept the repair to the smallest correct change. |
| `.docs/testing/_trailofbits_skills_post-patch-validation.md` | YES | YES | Baseline-versus-patched evidence and honest evidence levels shaped the regression tests and this verification report. |
| `.docs/deep-dive/_debian_debian-reference.md` | NO | NO | Searched for filesystem/symlink guidance; no relevant passage was found, so it did not inform the implementation. |

No other routed library document was used. `.docs/` content was not refreshed or modified.

## What was implemented

1. **Spec Kit separation without history loss.** Reverted the PR #1749 merge on this branch, removed `specs/104-memory-bank-maintenance` from PR #1748, preserved PR #1749's commits and pointed the feature pointer at `specs/103-docs-updater-integrity`.
2. **Critical failure state.** Consistency issues are critical by default; only unmanaged/orphan snapshots are informational (`severity: warning`). Every link problem is critical. `hasCriticalFailures(report)` drives both the report result and `main()`'s exit code, so unresolved link or consistency defects cannot report `SUCCESS` or exit 0 without a download failure.
3. **Filename-collision protection.** `findFilenameCollisions()` compares sanitized filenames across routed and removed library IDs. Colliding libraries are skipped for download and link repair, and removal refuses to delete a filename owned by a routed document or by more than one identifier. Ambiguous ownership fails safely and is reported as critical.
4. **Temporary cleanup.** All cleanup checks use `lexistsSync()`. `cleanupStaleTempFiles()` removes dangling `.tmp.symlink.*` entries as well as temp files. Primary, fallback-copy and symlink temp names use distinct suffixes; rename remains the atomic publish step.
5. **Report accuracy.** The report and this summary state the measured baseline: 64 `inventory` entries, 64 `sources` entries and 51 `githubShas` entries. They are not three identical 64-entry indexes.
6. **Regression coverage.** Added tests for critical consistency-only failure, link-only failure without downloads, removed-versus-routed filename collisions, dangling temp-symlink cleanup, preserved primary snapshots on rejected repair, and a spawned CLI exit-code check.
7. **Review follow-up.** Fixed the CURRENT-branch fallback temp path to `.tmp.copy.`, replaced remaining `existsSync` temp-symlink cleanup, removed redundant inventory pre-population, bounded the GitHub SHA response, and escaped report list text. The capacity guard was reviewed: its variable tracks freed capacity, not write success; it was renamed `capacityFreed` and left behaviorally unchanged because growth cannot create room for a deferred library.

### Files changed

- `scripts/refresh-docs.js` — critical failure state, collision ownership, safe removal/repair, `lexistsSync` cleanup, report escaping and SHA response bound.
- `scripts/test-refresh-docs.js` — five review-repair regressions plus the existing updater suite.
- `scripts/test-refresh-docs-e2e.js` — isolated complete-workflow test.
- `scripts/test-support/mock-refresh-https.js` — test-only HTTPS transport.
- `.github/workflows/refresh-docs.yml` — report publication and failure step; schedule unchanged.
- `.specify/feature.json` — points to `specs/103-docs-updater-integrity`.
- `specs/103-docs-updater-integrity/{spec,plan,tasks}.md` — Spec Kit artifacts, including the repair increment.
- `memory-bank/activeContext.md`, `memory-bank/progress.md` — task record.
- `PR_SUMMARY.md` — this report.

No application, dependency, payment, database, auth, Cloudflare Worker, deployment or `.docs` content change.

## PR review findings and dispositions

- **Amazon Q — same-millisecond temp-path collisions: CONFIRMED AND FIXED.** Distinct `.tmp.symlink.`, `.tmp.copy.` and `.tmp.primary.` suffixes are used at every site.
- **Amazon Q — `capacityProgressMade` inverted: REVIEWED, NOT CHANGED.** The flag intentionally tracks freed capacity, not write success; a larger write cannot make a deferred library fit, and treating growth as progress would risk a retry loop. Renamed to `capacityFreed` for clarity.
- **Amazon Q — unescaped report list fields: CONFIRMED AND FIXED.** List text now escapes backslashes and newlines.
- **Amazon Q — no size cap on the GitHub SHA response: CONFIRMED AND FIXED.** The response is bounded by the existing 10 MB limit and resolves `null` when exceeded.
- **Graphite — CURRENT branch still used plain `.tmp.` paths: CONFIRMED AND FIXED.** The primary write uses `.tmp.primary.` and the fallback uses `.tmp.copy.`.
- **Graphite — `existsSync` leaks dangling temp symlinks: CONFIRMED AND FIXED.** `lexistsSync()` is used for every temp-symlink cleanup.
- **Graphite — redundant pre-reconciliation inventory prefill: CONFIRMED AND FIXED.** Inventory is built directly from the routed set and compared with the captured original.
- **CodeQL — table escaping and URL-substring test assertion: FIXED on the prior review head.** Exact URL equality remains in the test.
- **DevSkim — `setTimeout` in the test-only HTTPS mock: NOT A PRODUCTION DEFECT.** No production path uses it.
- **Pullfrog** failed from exhausted Google AI Studio free-tier quota, not a code failure.

## Broken source URLs and download failures

No real library source URL was found broken and no live refresh was run. The isolated workflow injects mocked 404/500, empty, binary and error-page responses and verifies the existing snapshots remain byte-identical; the report names each document, URL, error and preservation status. No URL is rewritten.

## Verification

| Check | Command | Result |
| --- | --- | --- |
| Updater unit + complete isolated workflow | `node scripts/test-refresh-docs.js` | **PASS** — 36/36 (31 original + 5 repair regressions) |
| Full repository tests | `pnpm exec vitest run` | **PASS** — 45 files / 354 tests |
| TypeScript | `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| Repository gate | `SPEC_KIT_BASE_REF=269ea014 ./freebuff-verify.sh` | **PASS** — exit 0; bootstrap, frozen install, Spec Kit gate tests, Spec Kit gate, typecheck, build and updater tests |
| Production build size | `.next` + `public` | **PASS** — 317,059,996 B + 32,840,043 B = **349,900,039 B (333.69 MiB)** < 495 MB |
| Scheduler unit tests | `node --test workers/updater-scheduler/test/index.node-test.mjs` | **PASS** — 17/17 |
| Scheduler bundle | `pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml` | **PASS** — exit 0 |
| Workflow schedule / retry contracts | updater suite | **PASS** — three Atlantic crons, slots, 180 s retry and 15 s timeout unchanged |
| Local Playwright | `pnpm exec playwright test` | **BLOCKED** — 93 tests attempted; Chromium could not launch because the VM lacks `libnspr4.so` and other system libraries, and `playwright install-deps` cannot use sudo (`no new privileges`). This is an environment limit, not a test result. |
| PR-head Visual QA / CodeQL | GitHub Actions | **PENDING** — recorded in the PR body after the repair commit is pushed. |
| Live scheduled refresh / Cloudflare dispatch | — | **NOT RUN** — no scheduler credentials or live refresh authorization. |

**Baseline evidence:** 64 routed libraries, 154 routed entries, 90 secondary links, 64 `inventory` entries, 64 `sources` entries, 51 `githubShas` entries and zero broken links. All canonical snapshots pass the structural validator.

## Remaining issues and limitations

- Local Playwright is blocked by missing system libraries; the PR-head Visual QA workflow is the executable visual verification path.
- A live scheduled refresh and Cloudflare Worker dispatch were not run.
- The integrity validator is structural; it does not judge relevance, ownership or documentation quality.
- Unowned orphan `.md` files are informational and are not deleted, because the updater cannot prove they are library snapshots.
- PR #1749's Memory Bank work is preserved in its own commits and PR; it is intentionally not part of PR #1748 and must be re-landed separately.

**Implementation status:** COMPLETE for the assigned repair; final diff reviewed.
**Verified completion:** Local mandatory gates PASS; PR-head Visual QA/CodeQL pending at this revision.
**Delivery:** PR #1748 remains open and unmerged.
