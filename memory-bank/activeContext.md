# Active Context — QA checker effectiveness and reliability

- **Updated:** 2026-11-16
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** freebuff/qa-checker-effectiveness
- **Base:** main at 4bfec5969d9872e01257f8591ff30292ce3c280a
- **Spec Kit feature:** specs/171-qa-checker-effectiveness
- **Pull request:** #1925 (open, unmerged)
- **Evaluation vehicle:** Lucky Meter PR #1924, head 6eb2ae7e, application fix push 2d487227

## Current Task

Improve the accuracy, usefulness, reliability and efficiency of the repository's
QA checkers, using the PR #1924 review and fix cycle as the evaluation.

## Implemented State

- Changed-code reviewer findings now carry a `confirmed`/`potential`
  classification beside severity and confidence, collapse by path, line and rule,
  and report how many duplicates were collapsed.
- Four new advisory rules: `focused-test`, `await-in-for-each`,
  `empty-catch-block`, and `unused-import` (fully added, non-documentation files
  only; the `React` default import is excluded).
- The Markdown report shows classification, confirmed count and duplicate count.
- Every finding carries a concrete suggested fix, rendered as "Suggested fix",
  and the report is published as one sticky pull request comment that is
  updated in place instead of posted once per run.
- The report suggests Playwright visual verification only when rendering paths
  changed and performance measurement only for performance-sensitive paths; it
  states plainly that no browser verification is suggested for documentation,
  tooling, CI or unit-test-only changes, mirroring the Visual QA classifier.
- `.github/scripts/verify-playwright-cache.sh` validates a restored Playwright
  cache; the Visual QA job installs Chromium when the cache has no executable and
  keeps the system-dependency install and both shards when it does.
- Classifier regression coverage now executes performance paths and ambiguous
  application code; no classifier rule was loosened.
- PR #1924 carries the one confirmed application fix from the review cycle: the
  medallion and ornament renderers rebuild their WebGL resources and re-announce
  readiness after a context restore.

## Verification

- QA checker suites: 155 tests passed.
- `pnpm exec vitest run`: 80 files / 793 tests passed.
- `pnpm exec tsc --noEmit`: exit 0.
- `./freebuff-verify.sh`: exit 0 (Spec Kit gate, governance suites, type check,
  production build, docs tests).
- Production build (`.next` + `public`): 340,039,798 bytes = 324.29 MiB, below the
  495 MiB cap.
- PR #1924: 82 files / 805 tests and a clean type check on the fix commit.

## Limitations

- Playwright visual regression was not executed locally (no GPU or browser on this
  runner); committed baselines, both shards and all three projects are unchanged.
- The new rules are line-oriented, so a multi-line empty catch or multi-line
  import can be missed and is never guessed.
- External reviewers remain advisory and unchanged; Graphite skipped PR #1924 for
  size and Pullfrog failed on provider quota.
- The six Visual QA annotations on PR #1924 shard 2/2 were not retrievable through
  the connected tools.
