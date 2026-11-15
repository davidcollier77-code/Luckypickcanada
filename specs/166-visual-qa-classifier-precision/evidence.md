# Evidence: Visual QA Classification Precision and Playwright QA Initialization

**Date**: 2026-11-15
**Branch**: `freebuff/02773acb0f15757c85d4c07d`
**Base**: `main` at `d4d261ca` (merged PR #1914)

## Focused classifier and comparator suite

```text
$ pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js
✓ __tests__/visual-qa-chromium-cache.test.js (30 tests)
Test Files  1 passed (1)
Tests       30 passed (30)
```

Executed cases include documentation-only changes; agent/Playwright skill documentation;
`playwright.swiftshader.config.ts` and other standalone configurations; the unchanged
`playwright.config.ts` visual path; `package.json` scripts-only, dependency, lifecycle,
unrecognised-script and fail-closed determinations; components, styles, images, fonts, theme CSS and
rendering configuration; mixed tooling/visual sets; unknown paths such as `LICENSE`,
`scripts/unknown-tool.sh` and nested manifests; empty input; and the exact merged PR #1914
changed-file set (16 paths) with its real scripts-only `package.json` change.

## Full unit suite

```text
$ pnpm run test
Test Files  80 passed (80)
Tests       788 passed (788)
```

## TypeScript

```text
$ pnpm exec tsc --noEmit
exit 0
```

## Repository verification gate

```text
$ SPEC_KIT_BASE_REF=HEAD^ ./freebuff-verify.sh
✅ Spec Kit task artifacts verified and current: .../specs/166-visual-qa-classifier-precision
--- Running Type Check ---            (exit 0)
--- Running Build Check ---           (Compiled successfully in 15.7s)
Build completed successfully
Tests complete: 36 passed, 0 failed.
✅ All verification steps passed.
exit 0
```

Production build: `.next` 308 MiB total including a 210 MiB cache; below the 495 MiB cap.

## Workflow structure

- `python3 -c yaml.safe_load(...)` — `.github/workflows/visual-qa.yml` parses; jobs are
  `changes`, `verify`, `visual`.
- Every extracted `run:` block (classify step and both dependency installs) passes `bash -n`.
- The classify step retains exactly five `visual_required=true` fallbacks (listing failure,
  classification failure, unexpected value, case label, declared visual impact).
- `verify` keeps `needs: changes` with no `visual_required` condition; only `visual` carries
  `if: needs.changes.outputs.visual_required == 'true'`.
- `pnpm exec playwright test --shard=${{ matrix.shard }}/2` and the two-shard matrix are unchanged.

## Playwright initialization evidence

Installed Playwright 1.64.1 source (`playwright-core/lib/coreBundle.js`) guards the npm postinstall
path:

```js
async function installBrowsersForNpmInstall(browsers) {
  if (getAsBooleanFromENV("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD")) {
    logPolitely("Skipping browsers download because `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` env variable is set");
    return false;
  }
```

Executed through pnpm:

```text
$ PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm rebuild playwright-chromium
node_modules/playwright-chromium install: Skipping browsers download because
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` env variable is set
```

The explicit provisioning command is unaffected by the same environment, which is why it stays on
its own step:

```text
$ PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm exec playwright install chromium --dry-run
Chrome 156.0.8078.4 (playwright chromium v1248) …
Chrome Headless Shell 156.0.8078.4 (playwright chromium-headless-shell v1248) …
FFmpeg (playwright ffmpeg v1013) …
```

Root cause fixed: the visual job ran `pnpm install --frozen-lockfile` before
`actions/cache` restored `~/.cache/ms-playwright`, so `playwright-chromium`'s postinstall downloaded
a browser into an empty cache directory and the restored cache was only usable afterwards. The
verification job installed the same browser without ever launching one.

## Limitations

- GitHub Actions execution is PENDING — it runs after PR creation. The classifier and workflow
  wiring are verified locally by execution and static checks, not by a runner.
- The Playwright visual suite itself was not run: this change set is classified non-rendering and
  the suite, projects, baselines, shards and retries are unmodified.
- The removed download is measured from the Playwright source and a local pnpm rebuild, not from a
  GitHub-hosted job's duration.
