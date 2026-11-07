# Implementation Plan: Faster Playwright Visual QA

**Branch**: `perf/visual-qa-speed-20261107` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Reduce the runtime of the existing Playwright visual regression checker without reducing its test coverage or changing approved screenshots.

## Summary

The last PR-head Visual QA run for 93 Playwright cases used one worker and completed in 6.1 minutes. The same job's cold `pnpm install --frozen-lockfile` took 12.5 seconds. The existing workflow already skips browser setup for documentation-only changes and caches Chromium by runner OS and Playwright version.

The implementation will retain the current visual suite and enable at most two Playwright workers in CI while retaining `fullyParallel: false`; this permits independent spec files to run concurrently but keeps each file's tests in order. It will also enable setup-node's pnpm store cache, configured after pnpm is installed. No application code, visual test, assertion, baseline, viewport, threshold, dependency version, or lockfile changes are planned.

## Technical Context

**Language/Version**: GitHub Actions YAML, TypeScript, JavaScript; Node.js 22; pnpm 10.30.3.

**Primary Dependencies**: Existing Playwright 1.64.1, `@playwright/test` 1.64.1, `playwright-chromium` 1.64.1, `actions/setup-node` pinned to its existing SHA, and `pnpm/action-setup` pinned to its existing SHA.

**Storage**: GitHub Actions cache for pnpm's global package store; existing separate Chromium browser cache remains unchanged.

**Testing**: Existing Vitest guard `__tests__/visual-qa-chromium-cache.test.js`, full Vitest, TypeScript, `./freebuff-verify.sh`, and PR-head Visual QA on GitHub Actions.

**Target Platform**: GitHub-hosted Ubuntu runner (current Visual QA workflow).

**Project Type**: Next.js application repository; task changes test-runner and CI configuration only.

**Performance Goals**: Demonstrate at least 20% reduction from the recorded 6.1-minute Playwright baseline in a comparable run, without increasing failures or flaky tests. Record actual elapsed time and discovered/executed test totals.

**Constraints**:
- Keep the full visual suite and the three Chromium projects: desktop 1440×900, mobile-390 390×844, mobile-412 412×915.
- Keep in-file test ordering, retries, screenshot settings, failure diagnostics, baselines, and snapshot thresholds unchanged.
- Continue all existing CI gates and the frozen-lockfile install.
- No app, artwork, content, dependency, or lockfile changes.
- Production build must remain below 495 MB.

## Baseline Evidence

Workflow run `42385343241`, Visual QA job `128441515953`, on PR #1761 head `e61013df84e02dc7188e8efa3e64b306e8016afc`:

- Playwright: 93 tests, one worker; 89 passed, 1 flaky, 3 skipped; elapsed time 6.1 minutes.
- Dependency installation: `pnpm install --frozen-lockfile` completed in 12.5 seconds on a cold package store.
- Chromium cache: miss on this run; the existing versioned Chromium cache was saved at job completion.
- The workflow already skips browser-specific setup for documentation-only changes and caches Chromium by OS plus Playwright version.

The 1 flaky result is retained as part of the baseline; it must not be hidden or reclassified by this change.

## Research and Decision

1. Playwright documents that test files run in parallel by default, while tests in an individual file remain in order unless `fullyParallel` or per-suite parallel mode is enabled. Its parallelism guide includes a CI example using two workers. Source: [Playwright parallelism](https://playwright.dev/docs/test-parallel).
2. Playwright's CI guide recommends one worker to prioritize stability and reproducibility. This is a real trade-off, not a blanket endorsement of parallelism. Source: [Playwright CI guidance](https://playwright.dev/docs/ci).
3. Repository inspection found no `beforeAll`, `afterAll`, `describe.serial`, or `test.describe.configure({ mode: 'parallel' })` usage in the visual tests. Tests use isolated Playwright page fixtures and test-local route stubs. The implementation therefore trials two workers at the file level, leaves tests in each file ordered, and uses the PR-head run to determine whether the extra concurrency is safe and measurably faster.
4. The current workflow runs `setup-node` before `pnpm/action-setup`, which prevents setup-node from discovering the pnpm store for its cache. The official setup-node guidance requires the package manager to be pre-installed and demonstrates `pnpm/action-setup` followed by `setup-node` with `cache: pnpm`. Source: [setup-node pnpm caching](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md#caching-packages-data).

No additional research artifact is needed; these sources and the observed run evidence are sufficient.

## Design

### Playwright worker limit

- Change only the CI worker cap from one to two in `playwright.config.ts`.
- Keep `fullyParallel: false`, so Playwright can schedule separate spec files on separate workers, but each file's own tests stay ordered.
- Keep all three projects, retries, reporters, timeouts, browser engine, test discovery and screenshot settings unchanged.
- Keep every visual test file and committed baseline unchanged.

### pnpm store cache

- Move the existing pinned pnpm setup action before the pinned Node setup action.
- Configure the existing setup-node action with `cache: pnpm` and `cache-dependency-path: pnpm-lock.yaml`.
- Keep `pnpm install --frozen-lockfile` unchanged and mandatory. A cache miss remains a normal cold install; a cache hit reuses the pnpm store without caching `node_modules`.
- Preserve the existing Chromium cache and its OS/version key exactly.

### Regression guard

Extend `__tests__/visual-qa-chromium-cache.test.js` to assert:
- CI worker cap is two.
- `fullyParallel` remains false.
- The pnpm setup step precedes setup-node.
- setup-node caches pnpm using `pnpm-lock.yaml`.
- Frozen-lockfile install remains present.

These source wiring checks supplement, not replace, the real PR-head Actions run.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains authoritative.
- **Verify before acting**: PASS — current workflow, worker configuration, visual specs, existing guard, and latest job log were inspected.
- **Implementation sequence**: PASS — specify, plan, tasks, then implementation.
- **Protect core systems**: PASS — no payment, authentication, database, application, deployment, environment, or secret changes.
- **Resource conservation**: PASS — no dependency, lockfile, or `.docs/` change.

## Project Structure

```text
playwright.config.ts                         # CI file-level worker cap
.github/workflows/visual-qa.yml              # pnpm setup-node store cache
__tests__/visual-qa-chromium-cache.test.js   # config/workflow regression guards
specs/108-playwright-qa-speed/{spec,plan,tasks}.md
specs/108-playwright-qa-speed/checklists/requirements.md
.specify/feature.json                        # active feature pointer
memory-bank/activeContext.md                 # current task state
memory-bank/progress.md                      # verified milestone
```

**Structure Decision**: Keep the task limited to the existing Playwright config, existing Visual QA workflow, its current guard test, and the required Spec Kit/Memory Bank records. Do not create a second visual test suite or duplicate workflow.

## Verification Plan

1. Run the focused workflow/config guard and full Vitest suite.
2. Run `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`.
3. Record the production build size measured by the verification gate; it must remain below 495 MB.
4. Inspect the full diff to confirm no visual test, baseline, threshold, application source, or dependency/lockfile change.
5. Observe PR-head Visual QA on the new commit. Compare the Playwright duration, discovered test total, passed/flaky/skipped counts, and pnpm cache outcome against the baseline above.
6. If two workers increase failures/flakiness or do not provide a meaningful speed gain, restore the one-worker setting or revise only after evidence. Do not claim the target before a comparable run proves it.
