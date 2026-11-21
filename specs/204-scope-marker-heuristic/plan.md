# Implementation Plan: Accept Filled QA Scope Fields That Mention the Marker Word

**Branch**: `freebuff/856a686c49f64f37f6ddb027-scope-marker-heuristic` | **Date**: 2026-11-21 | **Spec**: `specs/204-scope-marker-heuristic/spec.md`

## Summary

`check_qa_pr_scope.py` repeats a regular expression containing the bare word `placeholder` in six places: the summary, feature names, file purposes, scope-expansion reasons, visual-impact reasons and the "Scope changed" explanation. Each check uses `search()` over the whole value, so a complete phrase that mentions the marker-first fallback report is rejected as unfilled. The fix keeps each field's existing instruction markers, removes the ambiguous word from the anywhere-match patterns, and adds one whole-value pattern for a bare marker.

## Technical Context

**Language/Version**: Python 3 standard library for the checker and its `unittest` suite.

**Primary Dependencies**: None. No package, service or workflow change.

**Storage**: None.

**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_check_qa_pr_scope.py'`, the consolidated report contract suite (which imports this checker), the other suites run by `./freebuff-verify.sh`, the TypeScript check and the production build.

**Target Platform**: Local verification and the trusted-base-branch PR Scope Verification job.

**Constraints**: Do not change exact-path matching, approval commands or digests, visual metadata, governance handling, browser evidence or any returned status. Do not modify `AGENTS.md`, the report checker or a protection gate. Keep the production build strictly below 495 MiB.

**Scale/Scope**: One shared helper and four field patterns in `.github/scripts/check_qa_pr_scope.py`; regression tests in `.github/scripts/test_check_qa_pr_scope.py`; one Spec Kit feature and the feature pointer.

## Constitution Check

- **Single source of truth**: PASS — no governance or submission-procedure change.
- **Verify before acting**: PASS — every bare-word call site and the existing scope tests were inspected before changing the heuristic.
- **Protect core systems**: PASS — no application, payment, authentication, database, hosting or secrets configuration changes.
- **Resource conservation**: PASS — no dependency, service or paid usage.
- **Development workflow**: PASS — spec, plan and tasks are added; the Spec Kit gate stays active.
- **QA requirements**: PASS — the checker remains fail-closed for real markers, and no rule, approval or gate is bypassed.
- **Preservation**: PASS — no visitor-facing behaviour changes.

## Project Structure

```text
.github/scripts/check_qa_pr_scope.py       # marker helper and field patterns
.github/scripts/test_check_qa_pr_scope.py  # accepted-prose and rejected-marker regressions
specs/204-scope-marker-heuristic/{spec,plan,tasks}.md
.specify/feature.json                      # active feature pointer
```

## Phase 0 — Research

The summary and scope-reason checks use `\b(todo|tbd|placeholder|fill this in)\b|<[^>]+>`. The feature check uses the same family with `name each` and `describe the`, and the purpose check uses `describe this`; both omit the angle-bracket alternative. All six calls use `search()`, so any occurrence of the ambiguous word fails. The collision is deterministic and is reproduced by a summary such as "Publish the rendered report instead of the marker-first placeholder fallback."

## Phase 1 — Design

The production change is deliberately small:

1. Add one `PLACEHOLDER_ONLY` pattern anchored to the whole value for a bare marker with optional formatting, punctuation and the common `text`, `value`, `here` or `goes here` suffix.
2. Add a shared `_placeholder_wording(value, pattern)` helper that strips the value and returns true for either the field's existing instruction pattern or the whole-value marker.
3. Remove `placeholder` from each of the six anywhere-match patterns and call the shared helper. The existing per-field instruction sets are preserved, so the change does not add new instruction rejections to fields that did not have them.
4. Use the same helper for the scope-expansion reason, visual-impact reason and "Scope changed" explanation because they share the identical bare-word bug.

A sentence-length or prose-detection rule would be harder to reason about and could accept a real template line that happens to be long. Anchoring the ambiguous word to the whole value keeps the rule deterministic: a marker-shaped field is unfilled, while a phrase that uses the word is filled. The unambiguous instruction phrases still match anywhere, so they cannot hide inside a value.

## Verification and Limitations

Local verification runs the scope checker suite, the consolidated report suite, the other suites through `./freebuff-verify.sh`, the TypeScript check, the production build and the build-size measurement. The GitHub-triggered PR Scope Verification is **PENDING — runs after PR creation**; it is not claimed as executed. No browser or visual verification applies because the change is limited to repository checker code and tests.
