# Active Context — Visual QA Classification Precision

- **Updated:** 2026-11-15
- **Repository:** `davidcollier77-code/Luckypickcanada`
- **Branch:** `freebuff/02773acb0f15757c85d4c07d`
- **Base:** `main`
- **Spec Kit feature:** `specs/166-visual-qa-classifier-precision`
- **Pull request:** opened from this branch as a regular, non-draft PR; left open and unmerged

## Current Task

Correct the Visual QA change classifier so Chromium/Playwright screenshot comparisons run only
when a pull request can change the website's rendered appearance, and remove a redundant
Playwright browser download from the QA jobs. Fail-closed handling, the always-on verification
job, the Playwright suite, shards and committed baselines are preserved.

## Implemented State

- `classify-visual-changes.sh` now recognises agent/Playwright skill documentation
  (`.agents/skills/*`) and standalone Playwright configurations (`playwright.*.config.ts`,
  `playwright-*.config.ts`) as non-rendering. `playwright.config.ts`, frontend code, components,
  styles, theme CSS, images, fonts, rendering configuration, visual/e2e tests and unknown paths
  still require visual QA.
- `package.json` is never exempt by path. `.github/scripts/package-json-scripts-only.mjs` compares
  the base and head manifests canonically and reports `scripts_only=true` only when every changed
  script name is a test/tooling command (`test`, `lint`, `format`, `typecheck`, `type-check`,
  `check`, `verify` and `:<name>` variants). Dependencies, engines, exports, package-manager and
  pnpm-override changes, lifecycle scripts, unknown script names and invalid input keep visual QA.
- The `changes` job fetches base/head `package.json` only when the PR touches it, passes
  `PACKAGE_JSON_SCRIPTS_ONLY` to the classifier, and warns plus keeps visual QA on a failed fetch,
  failed comparison or unexpected value.
- QA dependency installation sets `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` in both the verification and
  visual jobs. The visual job was paying for playwright-chromium's postinstall download before
  restoring its version-keyed Chromium cache; the verification job never launches a browser. The
  explicit `playwright install --with-deps chromium` / `install-deps chromium` steps, browser
  version and test commands are unchanged.
- `__tests__/visual-qa-chromium-cache.test.js` now executes the classifier and comparator across
  documentation, agent tooling, standalone configuration, scripts-only, dependency, lifecycle,
  frontend/style/asset, mixed, unknown, empty/failed and merged PR #1914 cases, plus the new
  workflow wiring.

## Verification

- Focused suite: `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` — 30/30.
- Workflow YAML parses; every extracted `run` block and the comparator pass syntax checks; the
  classify step keeps exactly five fail-closed `visual_required=true` fallbacks.
- Full suite, TypeScript, `./freebuff-verify.sh`, build size and the final PR handoff are recorded
  in `specs/166-visual-qa-classifier-precision/evidence.md`.

## Limitations

- GitHub Actions execution is PENDING — it runs after PR creation. The postinstall skip is verified
  against the installed `playwright-core@1.64.1` source, not a GitHub-hosted runner.
- The visual suite itself was not run for this task; it is not modified and not required for a
  non-rendering change set.

## Follow-ups

- Observe the PR's Visual QA run: the classifier should report `visual_required=false`, the
  verification job should pass, and the browser shards should be skipped.
- Measure the QA install step duration on a later visual PR to quantify the removed browser download.
