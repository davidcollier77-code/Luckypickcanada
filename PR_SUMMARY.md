# Visual QA — install Chromium only when needed and reuse a cached browser

**Branch** `freebuff/474320d3cde04a21a6a32a0f` targets `main`. **Status: open and unmerged for review.**

Implementation **COMPLETE**. Every local mandatory check passes; **GitHub Actions runtime evidence for the
skip, cache-hit and version-change paths is PENDING (NOT RUN)**.

## Task and selected task groups

**Assigned task (Master Work Request #1):** Improve the existing visual QA workflow so
Playwright/Chromium is installed only when visual QA is required, and its browser installation is cached
and reused across GitHub Actions runs. Non-visual pull requests must skip browser setup entirely, visual
changes must still run the existing visual QA, the cache must key on Playwright version and operating
system, only Chromium may be installed, and an uncertain classification must run visual QA rather than
skip it.

**Selected task groups:**

- **`troubleshooting`** — the request is a diagnosis-and-repair of CI behaviour: every pull request,
  including documentation-only ones, paid for a browser download the tests could not use, and repeat runs
  re-downloaded the same build. The change diagnoses those two costs and repairs them inside the existing
  workflow.
- **`testing`** — the affected system *is* the test pipeline. The change must preserve every existing
  check and visual assertion, and the new classification logic is verified by executing it, not by
  inspecting it.

Spec Kit stages are in `specs/098-visual-qa-chromium-cache/`; `.specify/feature.json` points there. No
existing feature covered this workflow's browser handling (077 covers local sandbox browser enablement,
091 covers package-manager bootstrap, 092 covers the Dependabot governance exemption), and no branch or
open pull request covered it, so nothing was duplicated.

## Library / routed documents reviewed

| Document | USED | USEFUL | Contribution |
| --- | --- | --- | --- |
| `.docs/manifest.json` | **USED** | **YES** | Routing index: confirmed the controlled-library lists for `testing` and `troubleshooting` and that no document is mandatory. |
| `.docs/testing/_google_eng-practices.md` | NOT USED | NO | Cross-cutting review guidance only; the change is a small CI wiring change with its own executed guard. |
| `.docs/troubleshooting/_google_eng-practices.md` | NOT USED | NO | Same reason; the diagnosis came from the workflow source itself. |
| `.docs/testing/_microsoft_playwright.md` | NOT USED | NO | Browser-caching and OS-dependency behaviour was verified against Playwright's current upstream CI documentation instead, because the recommendation itself (cache or do not cache) was the decision under review. |
| `.docs/troubleshooting/_debian_debian-reference.md` | NOT USED | NO | No Linux package, filesystem or process question arose; `playwright install-deps chromium` owns the OS packages. |
| `.docs/testing/_vitest-dev_vitest.md` | NOT USED | NO | The new guard follows the repository's existing `__tests__/*.test.js` conventions. |
| `.docs/testing/_trailofbits_skills_post-patch-validation.md` | NOT USED | NO | No security remediation was validated. |

Repository documents that did materially inform the work: `AGENTS.md`, `.freebuff/freebuff.md`,
`.freebuff/testing.md`, `.freebuff/troubleshooting.md`, `.freebuff/ci.md` (pnpm pin policy that must be
preserved), `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `.github/workflows/visual-qa.yml`,
`playwright.config.ts`, `scripts/verify-speckit-task.sh` and `scripts/test-verify-speckit-task.sh`.
Upstream sources consulted: Playwright *Continuous Integration → Caching browsers* (states that caching
browser binaries is normally not recommended, that Linux OS dependencies are not cacheable, and that any
browser cache should be keyed against the Playwright version) and the `actions/cache` release line.
The `github-actions-docs` skill was not invoked; workflow syntax was validated by parsing the file.

## What was actually implemented

1. **Fail-closed change classifier** — new `.github/scripts/classify-visual-changes.sh`. Reads changed
   repository-relative paths from stdin and prints exactly `visual_required=true|false`. Only Markdown
   files at any depth and the `specs/`, `memory-bank/` and `.docs/` trees are documentation-only.
   Everything else — including unrecognised file types such as `scripts/*.sh` or `LICENSE` — and empty
   input all request visual QA, so an unclassifiable change can only add a visual run, never remove one.
2. **Classification job** — new `changes` job in `.github/workflows/visual-qa.yml`. It checks out the
   repository, lists the pull request's files with `gh api --paginate`, and writes
   `visual_required=true` (with a `::warning::`) if the listing fails, the classifier fails, or the
   classifier returns an unexpected value. The result is published as a job output and the step summary.
3. **Conditional browser setup** — the `visual` job now `needs: changes`, and the Playwright version
   resolution, cache restore, Chromium install, committed-baseline verification and visual regression
   steps all carry `if: needs.changes.outputs.visual_required == 'true'`. Non-visual pull requests still
   run the targeted unit tests, the full unit suite, the standalone TypeScript check, the Spec Kit
   governance gate and the report upload.
4. **Cached Chromium** — `actions/cache@v6` restores `~/.cache/ms-playwright` under
   `playwright-chromium-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}`, with no
   `restore-keys` so a version change invalidates instead of reusing a stale build. A cache miss runs
   `pnpm exec playwright install --with-deps chromium`; a cache hit runs only
   `pnpm exec playwright install-deps chromium`, because the OS libraries live outside the cached
   directory. The version step parses `pnpm exec playwright --version`, requires `x.y.z`, and fails the
   job on an unparseable value. Only Chromium is ever installed.
5. **Executed guard** — new `__tests__/visual-qa-chromium-cache.test.js`: nine real classifier inputs
   (visual path, documentation paths, mixed set, empty input, unknown types, CRLF) plus workflow wiring
   assertions (job output and dependency, cache key and path, no `restore-keys`, cache-hit split,
   Chromium-only installs, gated baseline/regression steps, preserved ungated QA steps, three
   Chromium-only Playwright projects).

## Files changed

- `.github/workflows/visual-qa.yml` — `changes` job, `needs: changes`, gated Playwright steps, cache.
- `.github/scripts/classify-visual-changes.sh` — **new**, executable, fail-closed classifier.
- `__tests__/visual-qa-chromium-cache.test.js` — **new**, 11 executed/wiring tests.
- `specs/098-visual-qa-chromium-cache/{spec,plan,tasks}.md` and `checklists/requirements.md` — **new**.
- `.specify/feature.json` — points at feature 098.
- `memory-bank/activeContext.md`, `memory-bank/progress.md` — current task state prepended.
- `PR_SUMMARY.md` — this report.

## Verification (commands actually run)

| Check | Result |
| --- | --- |
| `bash -n .github/scripts/classify-visual-changes.sh` | **PASS** — exit 0 |
| Classifier smoke: docs-only list, `app/page.js`, empty input | **PASS** — `false`, `true`, `true` |
| Python YAML parse of `.github/workflows/visual-qa.yml` | **PASS** — jobs `changes`, `visual`; output `visual_required` present |
| `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` | **PASS** — 1 file / 11 tests |
| `pnpm exec vitest run` | **PASS** — 43 files / 343 tests |
| `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| `./freebuff-verify.sh` | **PASS** — exit 0 (bootstrap, frozen install, Spec Kit gate tests, Spec Kit artifact gate for `specs/098-visual-qa-chromium-cache`, typecheck, production build, refresh-docs 19/19) |
| Production build size | **PASS** — `.next` 298,726,713 B + `public` 32,840,043 B = **331,566,756 B (316.2 MiB)**, below the 495 MB maximum |
| GitHub Actions runtime: non-visual skip, cache hit, cache miss, Playwright version change | **NOT RUN** — this workspace has no Actions runner and no pull request context, so the workflow cannot be executed here |

### What the runtime evidence must still show

1. A documentation-only pull request runs `changes` with `visual_required=false` and every browser step
   is skipped while the unit/TypeScript/Spec Kit steps still run.
2. A second visual pull request at the same Playwright version reports a cache hit and installs no
   browser binary (log shows `install-deps chromium` only).
3. A Playwright version bump reports a cache miss and downloads one matching Chromium build.

**No timing improvement is claimed.** Playwright's own guidance is that restoring a browser cache costs
about as much as downloading the browser, so the measurable benefit here is confined to removing the
download from documentation-only runs and from repeat visual runs; that has not been measured on a
runner in this session, and it is reported as unmeasured rather than as an improvement.

## Behaviour preserved

`playwright.config.ts` (three Chromium projects, `maxDiffPixelRatio`, `snapshotPathTemplate`, webServer),
`tests/visual/**`, every committed baseline, the concurrency group, `fetch-depth: 0`, the forwarded
`SPEC_KIT_PR_AUTHOR`, the targeted unit tests, the full unit suite, the TypeScript check, the Spec Kit
gate and the Playwright report upload are unchanged. No application, dependency, lockfile, payment,
email, database, authentication, Cloudflare, environment or secret change.

## Remaining issues / limitations

- Documentation-only is a deliberately conservative allowlist; a pull request that changes only a
  workflow or a script still runs visual QA, which is the safe direction the task asked for.
- `actions/cache@v6` floats on its major tag, matching the existing `actions/upload-artifact@v7.0.2`
  convention in this workflow; a commit-SHA pin was not used because a verified SHA could not be obtained
  in this session.
- Each Playwright version and OS keeps its own cache entry, which counts against the repository's cache
  storage allowance until GitHub evicts it.
- Playwright still needs one correct cache miss per version; a corrupted cache would surface as a browser
  launch failure, not a silent skip.

**USEFUL RESULT: NO** — the implementation is complete and every local gate passes, but the task requires
demonstrated visual and non-visual pull request paths including cache hits, misses and version changes,
and those require a GitHub Actions run on this head. They are NOT RUN here, so verified completion is not
claimed.
