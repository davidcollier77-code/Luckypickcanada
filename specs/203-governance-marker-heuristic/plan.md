# Implementation Plan: Reject Only Real Template Markers in Governance Declarations

**Branch**: `freebuff/856a686c49f64f37f6ddb027-placeholder-heuristic` | **Date**: 2026-11-21 | **Spec**: `specs/203-governance-marker-heuristic/spec.md`

## Summary

`_placeholder()` uses one regular expression with `search()` over the whole declaration value. That expression includes the bare word `placeholder`, so a complete Memory Bank sentence that mentions "the marker-first placeholder fallback" is reported as unfilled and Governance fails. The fix removes the ambiguous word from the anywhere-match pattern, adds a whole-value pattern for a bare marker, and continues to reject the unambiguous template instructions.

## Technical Context

**Language/Version**: Python 3 standard library for the checker and its `unittest` suite.

**Primary Dependencies**: None. No package, service or workflow change.

**Storage**: None.

**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_pr_verification_report.py'`, the other checker suites run by `./freebuff-verify.sh`, the TypeScript check and the production build.

**Target Platform**: Local verification and the trusted-base-branch GitHub Actions report job.

**Constraints**: Do not change the governance labels, category statuses, report structure or any other category. Do not modify the QA scope checker, DevSkim, the Playwright shards or a protection gate. Keep the production build strictly below 495 MiB.

**Scale/Scope**: One helper and two regular expressions in `.github/scripts/pr_verification_report.py`; regression tests in `.github/scripts/test_pr_verification_report.py`; one Spec Kit feature and the feature pointer.

## Constitution Check

- **Single source of truth**: PASS — no governance or submission-procedure change.
- **Verify before acting**: PASS — the helper, its call sites and the existing report tests were inspected before changing the pattern.
- **Protect core systems**: PASS — no application, payment, authentication, database, hosting or secrets configuration changes.
- **Resource conservation**: PASS — no dependency, service or paid usage.
- **Development workflow**: PASS — spec, plan and tasks are added; the Spec Kit gate stays active.
- **QA requirements**: PASS — the helper remains fail-closed for real markers, and no checker is bypassed or weakened.
- **Preservation**: PASS — no visitor-facing behaviour changes.

## Project Structure

```text
.github/scripts/pr_verification_report.py       # placeholder patterns and helper
.github/scripts/test_pr_verification_report.py  # helper and Governance regressions
specs/203-governance-marker-heuristic/{spec,plan,tasks}.md
.specify/feature.json                           # active feature pointer
```

## Phase 0 — Research

`GOVERNANCE_LABELS` reads five values through `_label_value()`, which returns the complete text after the label. `_placeholder()` then applies `PLACEHOLDER.search(value)`. The current pattern includes `placeholder` in the same alternation as `todo`, `tbd` and the instruction phrases, so any occurrence fails. The collision is deterministic and was reproduced with a complete Memory Bank sentence.

## Phase 1 — Design

The production change is deliberately small:

1. Remove `placeholder` from the anywhere-match `PLACEHOLDER` pattern. The unambiguous markers remain: `TODO`, `TBD`, `fill this in`, `name each`, `describe the`, `replace with`, `list the completed`, `select the applicable` and `<...>`.
2. Add `PLACEHOLDER_ONLY`, anchored to the whole value, for a bare marker with optional bold, backticks, punctuation and the common `text`, `value`, `here` or `goes here` suffix.
3. Make the helper strip the value and reject empty or whitespace-only text before either pattern runs.

A sentence-length or prose-detection rule would be harder to reason about and could accept a real template line that happens to be long. Anchoring the ambiguous word to the whole value keeps the rule deterministic: a marker-shaped value is unfilled, while a sentence that uses the word is filled. The unambiguous instruction phrases still match anywhere, so they cannot hide inside a declaration.

## Verification and Limitations

Local verification runs the report contract suite, the other checker suites through `./freebuff-verify.sh`, the TypeScript check, the production build and the build-size measurement. The GitHub-triggered report is **PENDING — runs after PR creation**; it is not claimed as executed. No browser or visual verification applies because the change is limited to repository checker code and tests.
