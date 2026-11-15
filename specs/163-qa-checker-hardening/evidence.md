# Evidence: QA Checker Hardening

**Date:** 2026-11-15

**Branch:** `freebuff/qa-checker-hardening-20261115`

**Base:** `main` at `3d26f05d`

**Feature:** `specs/163-qa-checker-hardening`

## Root cause

`.github/scripts/check_qa_pr_scope.py` read `record["previous_filename"]`
unconditionally for every GitHub changed-file record. GitHub only supplies that
field for renames and copies, so ordinary modified and added records raised
`KeyError: 'previous_filename'`. The inherited suite reproduced 24 errors out
of 65 tests. PR #1904 changes no QA scripts or workflows, and all 27 of its
files are additions or modifications with no renames, so its Visual QA and PR
Scope paths hit the same crash.

The fix reads the previous path only when it is non-empty, includes both paths
for renames/copies, rejects duplicate names, and fails closed when a rename or
copy record omits its previous path. It also rejects a record without a
filename instead of silently ignoring it.

## Changes

### Scope checker and visual impact

- `.github/scripts/check_qa_pr_scope.py`: repaired `changed_paths()`, added
  missing-filename fail-closed behavior, added optional structured
  `visual_impact`, and added an explicit reviewer warning when a non-visual
  declaration conflicts with path-based visual detection. Existing exact-path,
  changed-file-count, duplicate, baseline, governance, owner-approval and
  browser-evidence gates are unchanged.
- `.github/scripts/test_check_qa_pr_scope.py`: added modified, added, renamed,
  incomplete-rename, missing-filename, visual-impact and warning regressions.
  All three approved browser tools remain accepted.

### Changed-code review

- `.github/scripts/review_pr_changes.py`: dependency-free added-line reviewer.
  Hard findings are limited to private key blocks, recognizable provider
  tokens, and merge-conflict markers. Advisory warnings cover unsafe HTML or
  dynamic code, insecure links, hardcoded credential assignments, dependency
  entries, type/lint suppressions, debugger statements, and deprecated APIs.
  Placeholder, environment-lookup, local-URL, documentation and known-example
  patterns are suppressed. Findings are deduplicated and secret-like excerpts
  are redacted before logs or step summaries are written.
- `.github/scripts/test_review_pr_changes.py`: regression coverage for every
  rule, redaction, line mapping, deduplication, skipped binary/oversized files,
  malformed evidence, placeholders, environment lookups, local URLs and clean
  patches.
- `.github/workflows/pr-scope-verification.yml`: runs the reviewer after the
  scope check with `if: always()`, separates the two summaries, and exits
  non-zero only for hard findings or blocked evidence.

### Verification wiring

- `.github/workflows/visual-qa.yml`: removed the `freebuff-verify.sh` step and
  added a standalone `pnpm exec tsc --noEmit`. The full Vitest suite remains.
  The classifier now also runs browser QA when the PR declares
  `visual_impact.required: true`, while retaining path-based fail-closed
  classification. Playwright, Firecrawl and Browserless remain accepted
  evidence tools in the scope checker.
- `__tests__/visual-qa-chromium-cache.test.js`: asserts the new TypeScript
  step, the full unit suite, the declared-impact override, and the absence of a
  Freebuff dependency.
- `scripts/test-verify-speckit-task.sh`: only workflows that still run the
  governance gate require `SPEC_KIT_PR_AUTHOR`; Visual QA is explicitly
  checked to have no `freebuff-verify.sh` dependency.
- `.github/pull_request_template.md`: documents the optional `visual_impact`
  field and the reviewer-warning behavior.

### Test reliability

- `__tests__/daily-resonance-daily-experience.test.jsx`: pins the test clock to
  the `2026-11-14` countdown fixture. The component reads the real local date,
  so the previously hardcoded fixture failed on 2026-11-15 even though the
  persisted-result behavior was correct.

## Existing coverage retained

- DevSkim SARIF scan, suppression replay, and Security upload.
- CodeQL.
- TypeScript, the full Vitest suite, and the production build.
- Playwright visual baselines and the two required shards, gated by the
  classifier.
- Crystal Ball daily fortune, follow-up, quota/rate-limit, timeout, fallback,
  outage, preview, local-time and browser coverage.
- Protected-file/Agent MD authorization and verification-integrity auditing.
- `freebuff-verify.sh` itself and its own unit test remain in the repository;
  only the QA workflow dependency was removed.

## Verification

| Check | Result |
| --- | --- |
| `PYTHONPATH=.github/scripts python3 -m unittest test_check_qa_pr_scope test_review_pr_changes test_summarize_devskim_findings test_verify_pr_verification_status` | 99 tests passed |
| `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` | 14 tests passed |
| Crystal Ball/Oracle focused suite | 11 files, 146 tests passed |
| `pnpm run test` | 77 files, 734 tests passed |
| `pnpm exec tsc --noEmit` | exit 0 |
| `./freebuff-verify.sh` | exit 0; governance gate, type check, build and 36/36 docs tests passed |
| Production build | 348 MiB (`du -sm .next`), below the 495 MiB cap |
| Reviewer CLI clean fixture | exit 0, PASS |
| Reviewer CLI seeded provider token | exit 1, FAIL, token absent from summary and JSON |
| Reviewer self-scan of this PR's diff | 0 hard findings, 0 warnings |
| Workflow YAML parse | both workflows parsed successfully |
| `bash -n` verification scripts | exit 0 |

## Visual/browser evidence

No application, artwork, stylesheet, motion, or visual-interaction path is
changed by this PR. The Visual QA browser shards are therefore not required by
the path classifier, and no browser run is claimed. The Daily Resonance change
is a unit-test clock pin, not a rendering change.

## False-positive controls and duplication avoided

- Hard failures are limited to high-confidence secrets and merge markers.
- Generic injection, XSS, dependency and secret scanning remains with DevSkim
  and CodeQL; this reviewer does not add a broad duplicate scanner.
- Placeholder, environment-variable, documentation, local-development and
  known-example fixtures are suppressed and tested.
- Duplicate findings are collapsed by path, line, rule and excerpt.
- Secret excerpts are redacted, and the CLI test proves the token does not
  reach the report.
- The reviewer is advisory for quality and unsafe-pattern warnings; it does not
  block a PR for speculative style concerns.

## Remaining / limitations

- GitHub Actions checks for this PR are pending submission. Local checks do not
  substitute for the PR-triggered Visual QA, PR Scope and Verification
  Integrity results.
- PR Scope Verification runs its trusted base-branch checker via
  `pull_request_target`. Until this branch is merged, that check will continue
  to use `main`'s pre-fix checker; the repaired checker is exercised locally and
  by the PR-branch QA suite.
- The Visual QA workflow's browser job is not triggered by this non-rendering
  change set.
- No live AI request was made. Crystal Ball coverage remains mocked and focused.
