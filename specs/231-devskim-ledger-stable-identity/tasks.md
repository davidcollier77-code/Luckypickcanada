# Tasks: Line-Insensitive DevSkim Ledger Identity

**Input**: spec.md and plan.md
**Prerequisites**: plan.md and spec.md

## Phase 1: Evidence

- [x] T001 Re-read `.github/scripts/append_devskim_findings.py` and confirm the fingerprint path already ignores the line while the fingerprint-less path hashes `(rule, uri, line, message, columns, endLine)`.
- [x] T002 Confirm the duplication mechanism from Spec 230's evidence: the four DS173237 findings moved one line down in PR #2063 and each received a new line-based id.
- [x] T003 Read the existing guards: `__tests__/devskim-dedup.test.js`, `finding_identities` usage in `test_suppress_devskim_false_positives.py`, and `artifacts/devskim-review-pipeline/identity_benchmark.py`'s four scenarios, so the new identity keeps every existing expectation.

## Phase 2: Implementation

- [x] T004 Add `_shape_parts()` (rule, uri, message, start column, end column, span) and `_occurrence_indices()` to build line-free shapes and a position-ordered occurrence index per scan.
- [x] T005 Replace the fingerprint-less identity with `("v2", "shape", *shape, occurrence)` and version the fingerprint identity as `("v2", "fingerprint", rule, uri, fingerprint)`.
- [x] T006 Add `previous_identities()` covering the three ids earlier versions could write, and skip a result when its new identity or any alias is already recorded.
- [x] T007 Keep the report append-only: unchanged marker parsing, row rendering and `new_count` output; no existing entry is edited, reordered or removed.

## Phase 3: Verification

- [x] T008 `python3 -m py_compile .github/scripts/append_devskim_findings.py` → exit 0.
- [x] T009 `node node_modules/vitest/vitest.mjs run __tests__/devskim-dedup.test.js` → 10 tests passed (4 existing, 6 new).
- [x] T010 `python3 -m unittest test_summarize_devskim_findings test_suppress_devskim_false_positives` in `.github/scripts` → OK.
- [x] T011 `python3 artifacts/devskim-review-pipeline/identity_benchmark.py --old-scripts /tmp/old-scripts` against the pre-change script → distinct same-line 2/2, duplicate 1/1, repeat idempotent, legacy entry re-added 0.

## Phase 4: Records

- [x] T012 Write the Spec 231 spec, plan and tasks, and update `.specify/feature.json`.
- [x] T013 Update the Memory Bank active context, technical context and progress milestone.

## Verification boundary

- `./freebuff-verify.sh`, the production build, Playwright and the OpenNext build are not run locally; they are build-exempt or PR-triggered for this change. The scanner, workflow and suppression filter are untouched.
- This change is a follow-up on the open PR #2065 branch; the PR remains open, non-draft and unmerged for owner review.

## Preserved behaviour

- SARIF input, suppression filtering, Security-tab upload, workflow triggers, permissions and the append-only report contract are unchanged.
- No suppression was added, broadened or disabled, and no scan path was excluded.
