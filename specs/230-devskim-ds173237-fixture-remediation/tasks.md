# Tasks: DevSkim DS173237 Test-Fixture Remediation

**Input**: spec.md and plan.md
**Prerequisites**: plan.md and spec.md

## Phase 1: Evidence

- [x] T001 Read the live GitHub Security state: four open code-scanning alerts (1143–1146), all DS173237, at `scripts/test-refresh-docs.js` 194, 195, 749, 768, with `main` head `4ac05274`.
- [x] T002 Confirm the rule's published pattern `["'][a-f0-9]{30,}["']` from DevSkim `rules/default/security/privacy/secrets.json`, so the trigger is the literal form rather than the token's use.
- [x] T003 Inspect `scripts/refresh-docs.js` and confirm the converter accepts any same-origin `#<hex>` email-protection fragment, so token content is irrelevant to the assertions.
- [x] T004 Establish the ledger duplication cause from git history: the same four findings moved one line down in PR #2063 and were re-appended under new identities.

## Phase 2: Implementation

- [x] T005 Add `syntheticLongHex(seed)` to `scripts/test-refresh-docs.js` with a comment naming DS173237.
- [x] T006 Replace all four long hex literals with generated tokens, preserving both prefixes and both test sites.
- [x] T007 Remove only the four superseded line-shift entries from `devskim-alerts.md`, leaving one entry per distinct finding.

## Phase 3: Verification

- [x] T008 Install dependencies from the committed lockfile with pnpm 10.30.3 (`pnpm install --frozen-lockfile`).
- [x] T009 `node scripts/test-refresh-docs.js` → 61 passed, 0 failed.
- [x] T010 Apply the DS173237 pattern to the changed file → 0 matches.
- [x] T011 `vitest run __tests__/devskim-dedup.test.js __tests__/dependency-management.test.js` → 2 files, 16 tests passed.
- [x] T012 `python3 -m unittest test_summarize_devskim_findings` and the suppression-filter suite → pass; `py_compile` the DevSkim scripts → pass.
- [x] T013 Confirm `devskim-alerts.md` lists exactly four entries and no other path references the removed literals.

## Phase 4: Records

- [x] T014 Write the Spec 230 spec, plan and tasks, and update `.specify/feature.json`.
- [x] T015 Update the Memory Bank active context, progress milestone and technical context.

## Verification boundary

- DevSkim alert closure is observable only after the next `main` scan uploads the changed source. The PR's own scan proves the file no longer yields the findings on the pull-request ref; the four `main` alerts must be confirmed fixed after merge.
- `./freebuff-verify.sh`, the production build, Playwright and the OpenNext build were not run locally; they remain PR-triggered checks. The changed test file is the only executable surface.

## Preserved behaviour

- DevSkim scanner rules, scan globs, triggers, permissions, concurrency, SARIF generation, suppression filter, Security-tab upload and append-only reporting are unchanged.
- No suppression was added, broadened or disabled; no scan path was excluded.
