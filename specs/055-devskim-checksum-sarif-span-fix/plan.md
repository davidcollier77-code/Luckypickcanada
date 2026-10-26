# Implementation Plan: Fix DevSkim Checksum SARIF Span Matching

**Branch**: `fix/devskim-checksum-sarif-span-20261026` | **Date**: 2026-10-26 | **Spec**: `specs/055-devskim-checksum-sarif-span-fix/spec.md`

## Summary

Use the existing validated absolute-source-span helper in the narrowly scoped constitution-template checksum suppression. Add an integration-style unit test based on the actual DevSkim SARIF coordinates and snippet, then remove the one stale false-positive row from the append-only Markdown report.

## Technical Context

**Language/Version**: Python 3; repository runtime version not locally verified in this API-only session.
**Primary Dependencies**: Python standard library (`json`, `pathlib`, `unittest`); no new dependencies.
**Storage**: Git-tracked suppression helper, unit tests, alert report, task evidence.
**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`; `python3 -m py_compile .github/scripts/suppress_devskim_false_positives.py .github/scripts/test_suppress_devskim_false_positives.py`; `./jules-verify.sh`; current-head GitHub Actions.
**Target Platform**: GitHub Actions DevSkim/SARIF pipeline.
**Project Type**: Security scanner helper and report.
**Performance Goals**: No material performance change; reuses existing source-span validation.
**Constraints**: Exact path/key/value/range only; fail closed on invalid or unverified spans; no unrelated workflow, scanner, source checksum, or application changes.

## Constitution Check

- Smallest correct change: PASS — reuse the existing validated source-span helper.
- Preserve security boundaries and fail closed on mismatched regions: PASS by design; regression coverage required.
- Keep the scanner source, checksum, report structure, and unrelated findings unchanged: PASS by scope.
- Verify before claiming completion and leave the PR open/unmerged: REQUIRED; current-head CI and repository verification remain pending.

## Phase 0 — Research

- Verified the scheduled DevSkim run [#40282205671](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40282205671) completed successfully; its SARIF artifact still contained one `DS173237` result for `.specify/memory/.constitution-template.json:2`.
- Inspected the raw post-filter SARIF region: `startColumn: 12`, `endColumn: 78`, `charOffset: 14`, `charLength: 66`; the quoted checksum snippet matches the exact `sha256` value in the file.
- Located the defect: `should_suppress_constitution_template_checksum()` checked the reported column range instead of using `_source_region_span_on_line()`, which already validates absolute offsets, snippet equality, line boundaries, and line contents.
- Confirmed PR #1608 removed the report row and the subsequent automated PR #1609 reintroduced it. The append-only report behavior is intentional; cleanup must be paired with fixing the filter.

## Phase 1 — Design

- Add a regression test that passes a production-shaped SARIF result through `suppress_sarif()` and asserts that only the verified checksum false positive is removed.
- Keep the columns-only mismatch unsuppressed to demonstrate the fail-closed boundary.
- Change the checksum helper to validate the actual source span through the existing helper and constrain it within the quoted digest.
- Remove only the row with marker `81298a9d79b888769be1`; leave the heading/marker and template checksum intact.
- Update active context and the canonical PR summary with evidence, exact file list, and honest verification status.
