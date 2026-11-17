# Evidence: Governance and Refresh-Docs Guard Alignment

**Base**: `main` at `ec4b5258`

**Branch**: `freebuff/1716deb7870376472b3b3bb7-governance-docs`

## Root Causes

1. **Governance assertion.** `__tests__/agent-governance-single-source.test.js` asserted the historical
   sentence “ChatGPT must not load, modify or maintain the repository Playwright CLI”. #1942 (`432a2a60`)
   replaced it in `AGENTS.md` with “ChatGPT must not use or attempt to use:” followed by the CLI, startup
   scripts and Crawlbase, plus the maintenance restriction. The test was not updated with the governance
   wording, so the requirement was stale while the underlying exclusion remained present.
2. **Refresh-docs assertion.** `scripts/test-refresh-docs.js` required `legacyHtml > 0` and
   `safelyUnconvertible > 0`. Every routed snapshot is now Markdown, so the legacy branch is not exercised
   by the real library and the fixture-presence assertion failed even though every snapshot validated. The
   focused HTML conversion and rejection tests already cover that branch.

## Changes

- Aligned the governance expectation with the current exclusion heading.
- Retained the explicit CLI-entry assertion and the “Do not spend time attempting to initialize…” assertion.
- Removed only the requirement that legacy/unconvertible fixtures exist; every routed snapshot still runs
  through `validateDocumentContent`, missing snapshots still fail, and the legacy conversion branch remains.
- Added the task-scoped Spec Kit record and pointed `.specify/feature.json` at it.

## Verification

| Check | Result |
|-------|--------|
| `pnpm exec vitest run __tests__/agent-governance-single-source.test.js` | PASS — 10/10 |
| `node scripts/test-refresh-docs.js` | PASS — 48 passed, 0 failed |
| `pnpm exec vitest run` | PASS — 88 files, 865 tests |
| `SPEC_KIT_BASE_REF=ec4b5258 ./freebuff-verify.sh` | PASS — all steps |
| Production build (inside verifier) | PASS |
| Build size `du -sb .next public` | 389,182,802 bytes = 371.2 MiB (limit 495 MiB) |

## Preservation

- `AGENTS.md`, `.docs/`, `scripts/refresh-docs.js` and all production code are unchanged.
- No Cloudflare, DNS, Pages, Workers, account or secret configuration was read or changed.
- No dependency was added or upgraded.

## Remaining

- PR creation, then repository-owner approval of the protected governance change and the scope-checker
  `/approve-governance <digest>` comment. These are GitHub owner actions, not code work.
