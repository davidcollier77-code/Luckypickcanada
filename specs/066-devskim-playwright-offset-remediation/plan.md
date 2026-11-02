# Implementation Plan: DevSkim Playwright Offset Remediation

**Branch**: `freebuff/2ace85ab2dc71e6e9586f8de` | **Date**: 2026-11-01 | **Spec**: `specs/066-devskim-playwright-offset-remediation/spec.md`

## Summary

Add one small, fail-closed offset normalization helper to the DevSkim SARIF filter, use it inside the existing validated absolute-span check, and add the two audited Playwright spec paths to the existing exact-path allowlist. Prove it against real scanner output, then reconcile the ledger and run both specs.

## Technical Context

**Language/Version**: Python 3.12 (helper and tests), TypeScript/Playwright for the specs.
**Primary Dependencies**: Python standard library only (`json`, `unittest`); no new dependency.
**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`; real `devskim analyze` SARIF replay; `pnpm exec playwright test`; `./freebuff-verify.sh`.
**Constraints**: No rule disablement, no glob allowlist, no workflow/permission change, no application source change.

## Constitution Check

- Smallest correct change: PASS — one conversion helper plus two exact allowlist entries.
- Fail closed on unverifiable spans: PASS — conversion returns `None` on any ambiguity; snippet/line/token checks unchanged.
- No security weakening: PASS — the exception still requires a `test.setTimeout(<digits>)` token inside a test path.
- Verify before claiming completion; leave the PR open and unmerged: REQUIRED.

## Phase 0 — Research (measured)

- Installed DevSkim CLI 1.0.100 locally and scanned both spec files. Six `DS172411` results for `sitewide-gold-cta.spec.ts`, four for `gold-cta.spec.ts`.
- Compared each reported `charOffset` with both candidate interpretations: UTF-16 matched all ten; code points matched only the ASCII-only file.
- Confirmed both files were absent from `KNOWN_CONTEXTUAL_SUPPRESSION_FILES`, and that the current predicate already accepts the four gold results once called directly.

## Phase 1 — Design

- Add `_code_point_offset_from_utf16_offset()` and rewrite only the offset/length validation inside `_absolute_source_span()`; every downstream check keeps operating on code-point indices.
- Keep the ASCII fast path implicit: identical conversion result, no branch needed.
- Add `tests/visual/gold-cta.spec.ts` and `tests/visual/sitewide-gold-cta.spec.ts` as exact allowlist entries.
- Extend the focused suite with real-file UTF-16 regressions, surrogate-split and wrong-offset negative controls, and an end-to-end `suppress_sarif()` replay asserting zero results for the two files while an unrelated genuine finding is retained.
- Reconcile `devskim-alerts.md` only for rows proven suppressed; run both Playwright specs and `./freebuff-verify.sh`.

## Phase 2 — Content-anchored fixture (2026-11-02 follow-up)

- Replace the stored `TIMEOUT_LINES` map with `_timeout_lines()`, which enumerates the source and matches the strict pattern `^\s*test\.setTimeout\([0-9][0-9_]*\);\s*$`. Line numbers and the reported token are derived from the match, so an unrelated copy edit above the finding cannot invalidate the fixture.
- Keep the region shape the real scanner emits (`charOffset`/`charLength` in UTF-16 units, `snippet.text = setTimeout(<digits>)`, historical one-column-early columns) so the fixture still reproduces the original defect rather than a simplified version of it.
- Add `_assert_audited_coverage_present()` so an empty discovery fails with a named message instead of passing silently.
- Add `test_audited_specs_still_exercise_utf16_divergence` so removing the astral characters cannot quietly retire the UTF-16 conversion coverage.
- Add `test_unrelated_line_removal_keeps_the_audited_fixture_working` and `test_unrelated_line_insertion_keeps_the_audited_fixture_working`: the first replays exactly this PR's one-line deletion, the second proves the offset arithmetic follows an insertion.
- Derive the replay test's "genuine finding" line as the first line that is not an audited timeout, instead of a hard-coded `17` that happened to be the emoji array.
- No change to the filter, the allowlist, the workflow, permissions, schedule, or the append-only report mechanism.
