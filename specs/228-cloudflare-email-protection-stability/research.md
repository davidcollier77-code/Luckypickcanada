# Research: Cloudflare Email-Protection Token Stability

**Date**: 2026-11-27

## Source and reproduction evidence

- The manifest routes `/numpy/numpy` to `https://numpy.org/doc/stable/reference/arrays.ndarray.html`.
- The current snapshot contains a generated Markdown link to `https://numpy.org/cdn-cgi/l/email-protection#...`.
- Two independent reads of the configured live page returned HTML with the same size and matching content everywhere except the hexadecimal fragment on that same-origin Cloudflare email-protection anchor.
- The visible anchor text is `self@value`, which is part of the documentation. The rotating fragment is not useful documentation content.
- The converter's current `inline()` path turns every safe anchor href into a Markdown target, so the fragment becomes part of the persisted snapshot and changes between requests.

## Upstream SHA behavior

- The manifest retains a historical `githubShas` value for `/numpy/numpy`, but its source is on `numpy.org`, not `raw.githubusercontent.com`.
- `getUpstreamSha()` returns null for this source. The unchanged-SHA shortcut is therefore not used; the updater fetches the live URL and compares normalized content against the local snapshot.
- This is expected fallback behavior for non-GitHub sources. The stored historical SHA is inert and is intentionally left untouched; changing the manifest is unnecessary for this repair.

## Existing test and QA design

- `scripts/test-refresh-docs.js` imports `runRefresh()`, `convertHtmlToMarkdown()` and the existing temporary-directory helpers, so both focused converter and full two-refresh tests can be placed in the current harness.
- The standalone test runner already invokes `scripts/test-refresh-docs-e2e.js`.
- `.github/workflows/visual-qa.yml` already runs `node scripts/test-refresh-docs.js` under Node.js 26 as part of Application Verification.
- `scripts/refresh-docs.js` is explicitly protected by `.github/workflows/protected-files.yml`. The PR must carry the exact Human Authorization declaration, and the separate protected-file GitHub Environment approval remains a pre-merge requirement.
- The root `scripts/` paths are not positively classified as non-rendering by the build and visual classifiers. Existing build validation and both Playwright shards remain required; no classifier or workflow is being weakened.

## Decision

Normalize only the volatile Cloudflare email-protection target at HTML anchor serialization. Preserve the anchor's visible label as text, retain ordinary links, and add an updater regression that fetches both token variants. Do not change source URLs, manifest indexes, stale SHA metadata, generated snapshots, dependencies, schedules, workflows or Cloudflare configuration.
