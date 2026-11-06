# Implementation Plan: Playwright Version Alignment

**Branch**: `fix/playwright-version-alignment-20261106` | **Date**: 2026-11-06 | **Spec**: `specs/100-playwright-version-alignment/spec.md`

**Input**: Feature specification from `specs/100-playwright-version-alignment/spec.md`

## Summary

Raise the direct `playwright` devDependency from `^1.63.0` to `^1.64.1` so it matches the already-declared `@playwright/test` and `playwright-chromium` ranges, then regenerate only the affected lockfile entries. Add one focused source guard that fails if the Playwright packages drift apart again. No test, baseline, application, workflow, or configuration file changes.

## Technical Context

**Language/Version**: JSON dependency manifest, pnpm 10.30.3 lockfile, Node.js 22.x, Vitest source guard.

**Primary Dependencies**: `playwright` 1.64.1 (corrected), `@playwright/test` 1.64.1 (unchanged), `playwright-chromium` 1.64.1 (unchanged), `playwright-core` 1.64.1 (transitive).

**Storage**: Not applicable.

**Testing**: Executed discovery (`pnpm exec playwright test --list`), the existing visual regression suite, a new dependency-alignment guard, the full Vitest suite, `tsc --noEmit`, `./freebuff-verify.sh`, and the measured production build.

**Target Platform**: GitHub Actions `ubuntu-latest` for Visual QA; local Node.js for the repository gates.

**Project Type**: Next.js application repository with a Playwright visual suite.

**Performance Goals**: Not applicable beyond restoring the visual suite; no runtime behavior changes.

**Constraints**: 495 MB production build maximum; no visual baseline regeneration; no application, workflow, or unrelated dependency change.

**Scale/Scope**: Two dependency metadata files plus one guard test and task records.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains authoritative; artifacts record scope and evidence only.
- **Verify before acting**: PASS — the mismatch was reproduced locally (`playwright --version` 1.63.0, installed packages 1.63.0/1.64.1/1.64.1, discovery aborted with the reported error) before editing.
- **Implementation sequence**: PASS — specify, plan, tasks, implement in order.
- **Protect core systems**: PASS — no payment, authentication, database, Cloudflare, environment, or secret change.
- **Resource conservation**: PASS — no documentation refresh, no new third-party service, one dependency range only.

## Design

### Dependency correction

`package.json` currently declares:

- `playwright`: `^1.63.0` (resolve 1.63.0 — the CLI behind `pnpm exec playwright`, and the package the Visual QA workflow uses to install Chromium)
- `@playwright/test`: `^1.64.1` (resolve 1.64.1 — the API the specs import)
- `playwright-chromium`: `^1.64.1` (resolve 1.64.1)

The CLI (1.63.0) loads the specs, which register their tests through `@playwright/test` 1.64.1. Playwright's own error text names this exact cause: two different versions of the test runner. Correcting the single stale range makes all three resolve to 1.64.1.

### Lockfile update

`pnpm install` with the corrected range rewrites only:

- the root importer entry for `playwright` (specifier and version),
- the `playwright@1.63.0` and `playwright-core@1.63.0` package/snapshot entries, which are removed because nothing else references them.

No other package, peer range, or override changes. `pnpm install --frozen-lockfile` must then pass, proving the committed lockfile already matches the manifest.

### Regression guard

`__tests__/playwright-version-alignment.test.js` reads `package.json` and `pnpm-lock.yaml` and asserts:

1. the three direct Playwright ranges are identical,
2. the lockfile resolves all three to that same version, and
3. no other Playwright package version remains in the lockfile snapshots.

This is a source guard in the established `__tests__/dependency-management.test.js` style; it executes real parsing and fails closed on a missing or malformed entry.

### Preserved behaviour

`playwright.config.ts`, `tests/visual/**`, committed baselines, `maxDiffPixelRatio`, `.github/workflows/visual-qa.yml`, the application, artwork, and all other dependencies remain untouched.

## Project Structure

```text
package.json                                        # one range corrected
pnpm-lock.yaml                                      # affected entries only
__tests__/playwright-version-alignment.test.js      # new guard
specs/100-playwright-version-alignment/{spec,plan,tasks}.md
```

## Phase 0: Research

Additional research was not needed. The failure, both version values, and the root cause are stated by the reproduction and by Playwright's own error message; the repository's Playwright document confirms specs import `@playwright/test` and the CLI is the runner entrypoint.

## Phase 1: Design artifacts

No data model, contract, or quickstart artifact is warranted: no entity, external interface, or repeatable manual scenario changes. The exact checks are listed in `tasks.md`.
