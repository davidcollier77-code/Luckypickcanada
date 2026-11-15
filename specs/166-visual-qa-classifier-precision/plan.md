# Implementation Plan: Visual QA Classification Precision and Playwright QA Initialization

**Feature**: `166-visual-qa-classifier-precision` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

## Selected Task Groups

- `testing` — classifier/manifest regression tests and preservation of the Playwright visual suite.
- `troubleshooting` — traced why the QA jobs download a browser before restoring the Chromium cache.
- `deep-dive` — inspected the classifier's full contract, the QA workflows and the Playwright package internals.

Read `AGENTS.md`, `PR_SUBMISSION.md`, the four Memory Bank files, `.freebuff/ci.md`, `.freebuff/testing.md`, `.freebuff/troubleshooting.md` and the two authoritative Playwright skill documents. Consulted `.docs/manifest.json` groups `testing` and `deep-dive`; the relevant reference was `/microsoft/playwright` (Playwright test parallelism/install behaviour). `.docs/` was not modified.

## Summary

Extend the fail-closed visual change classifier with three positively non-rendering classes that cannot affect production rendering: agent/Playwright skill documentation, standalone Playwright configuration files, and `package.json` changes that are proven to be test/tooling-script-only. `package.json` is never exempt by path; a new manifest comparator establishes the scripts-only case and the workflow treats any failed or unexpected comparison as rendering-affecting.

Separately, stop the QA dependency install from triggering Playwright's npm postinstall browser download. In the visual job that download happens before the version-keyed Chromium cache is restored, and the verification job never launches a browser, so both jobs pay for a browser they do not need. The explicit `playwright install --with-deps chromium` / `install-deps chromium` steps and the test commands are unchanged.

## Technical Context

**Language/Version**: GitHub Actions YAML, Bash, Node.js 26 (ESM), Vitest 5, TypeScript.

**Primary Dependencies**: Existing `@playwright/test`/`playwright`/`playwright-chromium` 1.64.1, `actions/cache@v6`, `gh` CLI. No dependency or lockfile change.

**Storage**: GitHub Actions caches (`~/.cache/ms-playwright`, pnpm store) unchanged.

**Testing**: `__tests__/visual-qa-chromium-cache.test.js` (executed classifier and comparator cases plus workflow wiring), full `pnpm run test`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`, and the production build size.

**Constraints**: 495 MiB production build cap; preserve baselines, screenshot thresholds, Playwright projects, sharding, retries, permissions and fail-closed handling; no application or visual change.

## Design

### Classifier

`.github/scripts/classify-visual-changes.sh` keeps its stdin/stdout contract and adds:

- `.agents/skills/*` — agent and Playwright skill documentation.
- `playwright.*.config.ts` and `playwright-*.config.ts` — standalone Playwright configurations not used by CI. `playwright.config.ts` is matched first and explicitly remains rendering.
- `package.json` — returns non-rendering only when `PACKAGE_JSON_SCRIPTS_ONLY` is exactly `true`.

All other rules remain, including `.md`, `specs/`, `memory-bank/`, `.docs/`, `.github/`, API routes and `__tests__` unit tests.

### Manifest comparator

`.github/scripts/package-json-scripts-only.mjs BASE HEAD` parses both manifests, compares every top-level key except `scripts` canonically (key-order independent), and then inspects the changed script names. It prints `scripts_only=true` only when every changed script name is a test/tooling name (`test`, `lint`, `format`, `typecheck`, `type-check`, `check`, `verify` and `:<name>` variants). It prints `scripts_only=false` for dependency/engine/export/package-manager/pnpm-override changes, lifecycle scripts, unknown script names and any non-scripts difference, and exits non-zero without a decision on usage, read or parse errors.

### Workflow

The `changes` job already fetches the changed-file list once. When that list contains `package.json`, it fetches the base and head manifests through the read-only contents API at the pull-request base and head SHAs, runs the comparator, and passes `PACKAGE_JSON_SCRIPTS_ONLY` to the classifier. A failed fetch, failed comparator or unexpected value emits a warning and keeps `package_json_scripts_only=false`, so the classifier requests visual QA.

`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'` is set only on the two `Install dependencies` steps. The workflow's explicit Chromium provisioning steps do not carry it, so the browser is installed once from the version-keyed cache/miss path. Verified against `playwright-core@1.64.1`: `installBrowsersForNpmInstall` returns early when that variable is set, and `playwright install` is unaffected.

### Deliberately unchanged

`playwright.config.ts`, `tests/visual/**`, committed baselines, shards, retries, timeouts, `install-deps` on a cache hit, the dev-server webServer command, permissions and concurrency are untouched. Requiring system browser dependencies remains mandatory; nothing is skipped to save time.

## Verification Plan

1. `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` — executed classifier/comparator decisions and workflow wiring.
2. `pnpm run test` — full unit suite.
3. `pnpm exec tsc --noEmit`.
4. `SPEC_KIT_BASE_REF=freebuff-base ./freebuff-verify.sh` — Spec Kit gate, governance tests, type check, production build, documentation tests; record the measured build size against 495 MiB.
5. Parse the workflow YAML, syntax-check every extracted `run` block and the comparator, and confirm the `verify` job is not gated while the `visual` job is.
6. Record results in `evidence.md`; GitHub Actions execution is PENDING — runs after PR creation.
