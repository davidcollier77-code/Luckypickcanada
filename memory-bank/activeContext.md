# Active Context — QA Checker Hardening

- **Updated:** 2026-11-15
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/qa-checker-hardening-20261115`
- **Base:** `main` (`92b048e9`, including merged adaptive graphics capability foundation PR #1904)
- **Spec Kit feature:** `specs/163-qa-checker-hardening`

## Current Task

Repair the inherited PR scope checker crash and harden the QA system without
duplicating DevSkim, CodeQL, TypeScript, the unit/build suites, or Freebuff's
own verification script.

The branch now includes the latest `main`. The adaptive graphics capability
foundation from PR #1904 is retained as merged base functionality; this task
does not modify its rendering implementation, artwork, or browser/device
compatibility behavior.

## Implemented state

- `changed_paths()` now handles modified and added GitHub records without
  `previous_filename`, preserves both rename paths, and fails closed on
  incomplete rename evidence or a missing filename.
- `review_pr_changes.py` reviews added patch lines only. Private keys, provider
  tokens and merge markers are hard findings; unsafe HTML, insecure links,
  hardcoded credential-like values, dependency additions, suppressions,
  debugger statements and deprecated APIs are advisory warnings. Secret
  excerpts are redacted, placeholders and environment lookups are suppressed,
  and findings are deduplicated.
- The optional `visual_impact` declaration can require browser evidence on a
  non-visual path; a conflicting non-visual declaration is surfaced for review.
  The Visual QA classifier also honors a declared visual requirement.
- Visual QA runs the full Vitest suite and a standalone
  `pnpm exec tsc --noEmit`; it does not invoke or depend on
  `freebuff-verify.sh`. The script and its own test remain present.
- The Daily Resonance unit test pins its clock to its mocked date fixture so
  the suite does not fail when the real calendar advances.

## Verification

- QA checker Python suites: 99 tests passed.
- Visual QA workflow guard: 14 tests passed.
- Full Vitest: 77 files, 734 tests passed.
- Crystal Ball/Oracle focused suite: 11 files, 146 tests passed.
- `pnpm exec tsc --noEmit`: exit 0.
- `./freebuff-verify.sh`: exit 0, including the Spec Kit gate and 36/36 docs tests.
- Production build: 348 MiB, below the 495 MiB cap.
- Reviewer self-scan: 0 hard findings, 0 warnings; CLI redaction test passed.

These results are recorded in the implementation evidence and PR description;
they are not represented as newly rerun in this branch-reconciliation session.

## Remaining

- The PR is open for owner review. GitHub Actions must report against the
  reconciled branch head.
- PR Scope Verification is a `pull_request_target` workflow and therefore
  continues to execute the trusted checker from the default branch. Until this
  PR merges, that is the older `main` implementation, which assumes
  `previous_filename` exists on ordinary changed-file records. This branch
  fixes that defect and tests it, but does not execute PR-head code in the
  trusted workflow context or bypass the check.
- Browser runs are not required for this non-rendering change set.
