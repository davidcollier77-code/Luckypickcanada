# Tasks: Stable DevSkim Ledger Identity

**Input**: spec.md and plan.md
**Prerequisites**: plan.md and spec.md

## Phase 1: Evidence

- [x] T001 Read Pullfrog's review on PR #2065 (`pullrequestreview-6097218187`) and reproduced its two sequences by executing the superseded `19fe6ee` script from `HEAD`.
- [x] T002 Established what finding-specific data the SARIF actually offers: DevSkim emits `charOffset`/`charLength` (UTF-16 code units) and `snippet` for located results, and omits `partialFingerprints` for rules such as DS173237.
- [x] T003 Corrected after the second Pullfrog review: `.github/workflows/devskim.yml` does **not** guarantee the checkout matches the scan. The `update-report` job downloads the current SARIF and then checks out an existing `chore/devskim-report-update-*` branch. The identity must therefore use the SARIF only.

## Phase 2: Implementation

- [x] T004 Replaced the occurrence-rank identity with the SARIF-only content identity `("v4","content", rule, uri, message, snippet text, column, length)`. No absolute line, absolute offset, source-file content or per-scan rank participates.
- [x] T005 Removed `_SourceFile`/`_SourceIndex` and the 2 MiB workspace read: the appender opens no source file, so a reused report branch cannot change an id. (The v3 shape that read source was withdrawn before any ledger entry was written.)
- [x] T006 Made `charOffset` irrelevant to identity: a usable, stale or absent absolute span yields the same id from the same SARIF, covered by a regression.
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
- [x] T016 Kept the exact-duplicate and distinct-same-line cases, now with source text, and replaced the span-validation case with one that requires usable and unusable absolute spans to share an id.
- [x] T017 Pinned the documented identical-findings limitation under a test named for it.
- [x] T021 Added Pullfrog's fixed-SARIF/changed-workspace regression: record a finding, then append the identical SARIF with the workspace source changed and with it absent; both append nothing and the row set is unchanged.
- [x] T022 Reproduced the second review's defect against `aed9b241`: the same SARIF appended from a changed workspace produced `first=1, second=1, entries=2`; the repaired script produces `first=1, second=0, entries=1`.
- [x] T023 Extended `identity_benchmark.py` with `workspace_changed_appended` and `workspace_changed_entries` so the same-SARIF/different-workspace sequence is recorded in the evidence JSON.
- [x] T024 Corrected every record that claimed the report job checks out the scanned commit: the script docstring, the Spec 231 spec/plan and the Memory Bank.

## Phase 4: Benchmark

- [x] T018 Extended `artifacts/devskim-review-pipeline/identity_benchmark.py` with the insertion and remediation sequences and recorded the `uri:line` each append names plus `insertion_new_finding_recorded_at_expected_line` and `remediation_new_finding_recorded_at_expected_line`.

## Phase 5: Records

- [x] T019 Rewrote the Spec 231 spec, plan and tasks; added `specs/231-devskim-ledger-stable-identity/evidence/identity-benchmark.json`; pointed `RESULTS.md` at the new evidence.
- [x] T020 Updated the Memory Bank active context, technical context and progress milestone to the corrected design and its limitation.

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Script syntax | `python3 -m py_compile .github/scripts/append_devskim_findings.py` | exit 0 |
| Dedup regression suite | `node node_modules/vitest/vitest.mjs run __tests__/devskim-dedup.test.js` | 14 passed / 14 |
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
| Same SARIF appended from a changed workspace (`aed9b241` → current) | n/a | `aed9b241`: 1 appended, 2 entries · current: 0 appended, 1 entry |

## Verification boundary

- `./freebuff-verify.sh`, the production build, Playwright, OpenNext and a live DevSkim scan were not run for this change; the modified paths are build-exempt and the scanner is untouched. The PR-triggered workflows remain authoritative.
- This change is a follow-up on the open PR #2065 branch; the PR remains open, non-draft and unmerged for owner review.

## Preserved behaviour

- SARIF input, suppression filtering, Security-tab upload, workflow triggers, permissions and the append-only report contract are unchanged.
- No suppression was added, broadened or disabled, and no scan path was excluded.
