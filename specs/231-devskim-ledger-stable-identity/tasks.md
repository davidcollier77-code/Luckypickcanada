# Tasks: Stable DevSkim Ledger Identity

**Input**: spec.md and plan.md
**Prerequisites**: plan.md and spec.md

## Phase 1: Evidence

- [x] T001 Read Pullfrog's review on PR #2065 (`pullrequestreview-6097218187`) and reproduced its two sequences by executing the superseded `19fe6ee` script from `HEAD`.
- [x] T002 Established what finding-specific data the SARIF actually offers: DevSkim emits `charOffset`/`charLength` (UTF-16 code units) and `snippet` for located results, and omits `partialFingerprints` for rules such as DS173237. The suppression filter already validates that span against source and snippet (Spec 047), so the same contract is available to the appender.
- [x] T003 Confirmed `.github/workflows/devskim.yml` checks out the repository in `update-report` before running the script, so the source tree the scan ran on is readable at append time.

## Phase 2: Implementation

- [x] T004 Replaced the occurrence-rank identity with `("v3","content", rule, uri, message, span text, column, length, source line text)`. No absolute line and no per-scan rank participates.
- [x] T005 Added `_SourceFile`/`_SourceIndex`: workspace-only resolution, one read and one split per file per run, 2 MiB cap, UTF-16 → code-point conversion with a bisect over astral characters.
- [x] T006 Added `_validated_span()`: the absolute span is accepted only when it matches the source at the reported start line and equals the scanner's own snippet; otherwise the snippet and then the reported columns are used.
- [x] T007 Replaced the rank lookup in `append_findings()` with occurrence accounting: same recorded location first, remaining recorded occurrences for a renumber, then legacy aliases, appending only the surplus.
- [x] T008 Kept the fingerprint identity (`v2`) unchanged so fingerprinted ids never change, and kept every earlier id as an alias, including the superseded v2 shape id.
- [x] T009 Fixed the display-message extraction to use the defensive `_message_text()` helper, so a non-dict SARIF `message` cannot raise `AttributeError` in the append loop (Graphite review note).
- [x] T010 Corrected the `previous_identities()` docstring to say it lists earlier ids only and that the current primary id is checked separately (Graphite review note).

## Phase 3: Tests

- [x] T011 `__tests__/devskim-dedup.test.js` now asserts the recorded `uri:line` and id of every row, not only `newCount` and marker totals.
- [x] T012 Added the renumber case: a recorded finding stays at its recorded location and id across a one-line shift and a forty-line shift, with `newCount` 0 both times.
- [x] T013 Added the insertion case: a different same-shape finding inserted between two known ones appends exactly one row naming the inserted line, keeps both known ids, and produces no duplicate id.
- [x] T014 Added the remediation case: removing a known finding appends nothing and removes nothing; a different new finding at the same line is then appended with a new id.
- [x] T015 Added the legacy-entry case: one earlier-version line-based entry plus two different findings on that line appends the second finding and repeats cleanly, so an old entry cannot hide a new finding.
- [x] T015b Added the repeated-scan case: three identical scans (including a reordered result list) append nothing after the first.
- [x] T016 Kept the exact-duplicate and distinct-same-line cases, now with source text, and added the span-validation fallback case.
- [x] T017 Pinned the documented byte-identical-findings limitation under a test named for it.

## Phase 4: Benchmark

- [x] T018 Extended `artifacts/devskim-review-pipeline/identity_benchmark.py` with the insertion and remediation sequences and recorded the `uri:line` each append names plus `insertion_new_finding_recorded_at_expected_line` and `remediation_new_finding_recorded_at_expected_line`.

## Phase 5: Records

- [x] T019 Rewrote the Spec 231 spec, plan and tasks; added `specs/231-devskim-ledger-stable-identity/evidence/identity-benchmark.json`; pointed `RESULTS.md` at the new evidence.
- [x] T020 Updated the Memory Bank active context, technical context and progress milestone to the corrected design and its limitation.

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Script syntax | `python3 -m py_compile .github/scripts/append_devskim_findings.py` | exit 0 |
| Dedup regression suite | `node node_modules/vitest/vitest.mjs run __tests__/devskim-dedup.test.js` | 13 passed / 13 |
| Python checker suites | `cd .github/scripts && python3 -m unittest discover -s . -p 'test_*.py'` | Ran 520 tests, OK |
| Identity benchmark | `python3 artifacts/devskim-review-pipeline/identity_benchmark.py --old-scripts $HOME/agent-tmp/old-scripts --json specs/231-devskim-ledger-stable-identity/evidence/identity-benchmark.json` | exit 0 |

Benchmark against the superseded `19fe6ee` script (`before`) and this script (`after`):

| Sequence | Before | After |
| --- | --- | --- |
| Insertion (`1,2` → `1,new,2`) | appended 1 row at `src/example.ts:3` — the moved existing finding — and never recorded the new one | appended 1 row at `src/example.ts:2` — the new finding — existing ids unchanged |
| `insertion_new_finding_recorded_at_expected_line` | false | true |
| Remediation (`1,3` → `1` → `1,new`) | appended 0 at the last step; the new finding was skipped | appended 1 at `src/example.ts:2` |
| `remediation_new_finding_recorded_at_expected_line` | false | true |
| Legacy entry written by `before`, rescanned by `after` | n/a | 0 appended, 1 entry |
| Legacy entry plus a second, different finding on its line (Vitest) | n/a | 1 appended, repeat appends 0 |

## Verification boundary

- `./freebuff-verify.sh`, the production build, Playwright, OpenNext and a live DevSkim scan were not run for this change; the modified paths are build-exempt and the scanner is untouched. The PR-triggered workflows remain authoritative.
- This change is a follow-up on the open PR #2065 branch; the PR remains open, non-draft and unmerged for owner review.

## Preserved behaviour

- SARIF input, suppression filtering, Security-tab upload, workflow triggers, permissions and the append-only report contract are unchanged.
- No suppression was added, broadened or disabled, and no scan path was excluded.
