# Implementation Plan: Governance and Refresh-Docs Guard Alignment

**Feature**: `specs/181-governance-docs-guard-alignment`

**Branch**: `freebuff/1716deb7870376472b3b3bb7-governance-docs`

**Base**: `main` at `ec4b5258`

## Summary

Repair two stale test guards that fail on `main` without exposing a product defect. The governance test
will assert the exclusion wording introduced by #1942 while keeping its CLI and maintenance assertions. The
refresh-docs test will keep validating every routed snapshot but will no longer require that a legacy HTML
fixture exists. No production code, `AGENTS.md` content, `.docs` snapshot or refresh implementation changes.

## Technical Context

- **Runtime**: Node.js test runners; Vitest + jsdom for the governance suite, standalone Node assertions for
  refresh-docs.
- **Files**: `__tests__/agent-governance-single-source.test.js`,
  `scripts/test-refresh-docs.js`, and this Spec Kit record.
- **Dependencies**: none added.
- **Constraints**: protected governance test requires owner authorization; no Cloudflare, DNS, Pages,
  Workers or account changes; build stays below 495 MiB.

## Constitution Check

- **Single source of truth**: `AGENTS.md` remains authoritative and is not edited; the test is aligned to it.
- **Verify before acting**: both failures were reproduced on `main` and traced to their assertions before
  editing.
- **Protect core systems**: no payment, authentication, database, hosting or secret path changes. The
  governance test is protected and will go through the owner authorization gate.
- **Resource conservation**: `.docs` snapshots remain read-only; no documentation refresh is run.
- **Smallest correct change**: two test-only corrections plus task-scoped Spec Kit artifacts.

## Phase 0: Research

1. #1942 (`432a2a60`) replaced “ChatGPT must not load, modify or maintain the repository Playwright CLI”
   with the current list at `AGENTS.md:419`: “ChatGPT must not use or attempt to use:”, followed by the CLI,
   startup scripts, Crawlbase, and the maintenance restriction. The test kept the removed sentence.
2. The refresh-docs failure is `assert.ok(legacyHtml > 0)` at the snapshot loop. Every routed snapshot is now
   Markdown, so the legacy branch does not run. The requirement that legacy HTML *exist* is a fixture
   assumption; the focused tests already cover HTML conversion and safe rejection.
3. Both assertions were introduced for earlier states and are not product invariants.

## Phase 1: Design

### Changes

```text
__tests__/agent-governance-single-source.test.js  # assert current exclusion heading
scripts/test-refresh-docs.js                      # drop legacy-fixture-presence requirement
specs/181-governance-docs-guard-alignment/*        # task record
.specify/feature.json                             # point at this feature
```

### Preservation

- Keep `expect(agents).toContain('The repository Playwright CLI.')`.
- Keep the “Do not spend time attempting to initialize…” assertion.
- Keep the per-snapshot `validateDocumentContent` call, missing-file assertion, legacy HTML branch and
  normalized-content validation.
- Keep `assert.ok(validated > 0)` and the total-count assertion.

## Phase 2: Verification

- Governance suite: `pnpm exec vitest run __tests__/agent-governance-single-source.test.js`.
- Refresh docs: `node scripts/test-refresh-docs.js` → 48 passed.
- Full suite: `pnpm exec vitest run` → 915 passed.
- Workflow/CI simulation: `SPEC_KIT_BASE_REF=ec4b5258 ./freebuff-verify.sh`.
- Production build size: `rm -rf .next && pnpm run build` followed by `du -sb .next public`.

## Complexity Tracking

No constitution violations.
