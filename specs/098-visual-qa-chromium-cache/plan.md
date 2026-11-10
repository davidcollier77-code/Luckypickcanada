# Implementation Plan: Conditional Visual QA with Cached Chromium

**Branch**: `freebuff/474320d3cde04a21a6a32a0f` | **Date**: 2026-11-06 | **Spec**: `specs/098-visual-qa-chromium-cache/spec.md`

**Input**: Feature specification from `specs/098-visual-qa-chromium-cache/spec.md`

## Summary

Add a fail-closed change classifier and split the existing Visual QA workflow into two jobs. The classifier job reads the pull request file list and decides whether rendered output can change. In the Visual QA job, every browser step (Playwright version resolution, Chromium cache restore, Chromium install, committed-baseline verification, visual regression) becomes conditional on that decision, and the browser download is cached under a runner-OS plus Playwright-version key. All unrelated quality checks keep running for every pull request.

## Technical Context

**Language/Version**: GitHub Actions YAML, Bash, Node.js 22.x, TypeScript/JavaScript tests.

**Primary Dependencies**: Existing `@playwright/test` 1.63.0 (Chromium only), `actions/cache`, `gh` CLI on `ubuntu-latest`. No dependency or lockfile change.

**Storage**: GitHub Actions cache (`~/.cache/ms-playwright`).

**Testing**: New executed classifier test plus a workflow wiring guard (`__tests__/visual-qa-chromium-cache.test.js`), full `pnpm exec vitest run`, and `./freebuff-verify.sh`.

**Target Platform**: GitHub Actions on `ubuntu-latest`.

**Project Type**: Next.js application repository with CI workflows.

**Performance Goals**: Remove the browser download from non-visual pull requests entirely, and remove it from repeat visual runs when the Playwright version and runner OS are unchanged.

**Constraints**: 495 MB production build maximum; no application, dependency, baseline, threshold, or test-assertion change; no weakening of any existing check.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains authoritative; artifacts record scope and evidence only.
- **Verify before acting**: PASS — the current workflow, Playwright config, Playwright version, existing gates, and the Spec Kit verifier were inspected before editing.
- **Implementation sequence**: PASS — specify, plan, tasks, implement in order.
- **Protect core systems**: PASS — no payment, authentication, database, Cloudflare, environment, or secret change.
- **Resource conservation**: PASS — no Context7 call, dependency change, or documentation refresh.

## Design

### Change classification

`.github/scripts/classify-visual-changes.sh` reads changed paths from stdin and prints exactly `visual_required=true|false`, with diagnostics on stderr. Only Markdown files at any depth, the `specs/`, `memory-bank/` and `.docs/` trees, `.specify/feature.json`, and supported unit-test files directly under `__tests__/` are classified as non-rendering. Browser/e2e tests, application files, assets, themes, scripts, workflows and unknown paths still require visual QA. Empty input also requires visual QA.

The new `changes` job feeds it the GitHub file listing (`gh api` on the pull request files endpoint, paginated). A failed listing, a failed or unexpected classification value, and an empty list all write `visual_required=true`, so a classification problem can only add a visual run, never remove one.

### Conditional and cached browser setup

The `visual` job gains `needs: changes`. Then:

1. `Resolve installed Playwright version` reads `pnpm exec playwright --version` and validates it against `^[0-9]+\.[0-9]+\.[0-9]+$`; an unparseable version fails the job rather than silently skipping the browser step.
2. `Restore cached Playwright Chromium` restores `~/.cache/ms-playwright` under `playwright-chromium-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}`. There are deliberately no `restore-keys`: a version change must invalidate instead of reusing a stale build.
3. On a cache miss, `playwright install --with-deps chromium` downloads the browser and its system libraries.
4. On a cache hit, `playwright install-deps chromium` installs only the OS libraries, which live outside the cache directory and are not cacheable.
5. Baseline verification and `playwright test` run only when visual QA is required.

All five steps carry `needs.changes.outputs.visual_required == 'true'`. The unrelated checks (targeted unit tests, full unit suite, standalone TypeScript check, Spec Kit gate, report upload) are unchanged and ungated.

### Preserved behaviour

`playwright.config.ts`, `tests/visual/**`, committed baselines, `maxDiffPixelRatio`, the three Chromium projects, the report artifact, the concurrency group, `fetch-depth: 0`, and the forwarded `SPEC_KIT_PR_AUTHOR` are untouched.

## Project Structure

```text
.github/workflows/visual-qa.yml            # two jobs: changes + visual; conditional browser steps
.github/scripts/classify-visual-changes.sh # new, fail-closed classifier
__tests__/visual-qa-chromium-cache.test.js # new executed classifier test + wiring guard
specs/098-visual-qa-chromium-cache/{spec,plan,tasks}.md
.specify/feature.json                      # points at feature 098
memory-bank/activeContext.md               # current task state
memory-bank/progress.md                    # recorded milestone
PR_SUMMARY.md                              # canonical PR report
```

**Structure Decision**: Keep the decision logic in one small Bash script so it can be executed in tests, instead of embedding an unexecutable inline `run:` block whose behaviour nobody can verify locally.

## Phase 0 — Research

`actions/cache` (major tag `v6` is the current release line) and Playwright's documented browser-caching pattern were checked against upstream sources. Playwright's guidance is that caching browser binaries usually is not worth it because restore time is comparable to download time and Linux OS dependencies are not cacheable; the requested task explicitly asks for caching, so the cache is added and the OS-dependency install is kept on the cache-hit path. No other research was required.

## Verification Plan

- `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` — executed classifier decisions and workflow wiring.
- `pnpm exec vitest run` — full suite.
- `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`, with the measured build size against the 495 MB maximum.
- Inspect the complete diff. The workflow cannot be executed locally (no GitHub Actions runner or `gh` pull request context), so the workflow-level cache-hit/miss and version-change behaviour is reported as validated by static wiring plus real classifier execution, and is NOT RUN in GitHub Actions until the pushed PR head reports a Visual QA run.


## Non-rendering classification extension

The classifier recognizes `.specify/feature.json`, `.github/scripts/classify-visual-changes.sh`, and direct-child `__tests__/*.test.{js,jsx,ts,tsx}` files as non-rendering paths. This allows metadata-only and unit-test-only changes to retain unit tests and repository checks without provisioning Chromium or running browser regression. The classification remains fail-closed for empty input, errors, mixed visual/non-visual changes and unrecognized paths. Browser/e2e test paths under `tests/` continue to require Playwright.
