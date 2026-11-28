# Tasks: DevSkim Findings Remediation and Stable Ledger Identity

**Input**: spec.md and plan.md
**Prerequisites**: plan.md and spec.md

## Phase 1: Evidence

- [x] T001 Read the live GitHub Security state: four open code-scanning alerts (1143–1146), all DS173237, at `scripts/test-refresh-docs.js` 194, 195, 749, 768, with `main` head `4ac05274`.
- [x] T002 Confirm the rule's published pattern `[\"'][a-f0-9]{30,}[\"']` from DevSkim `rules/default/security/privacy/secrets.json`, so the trigger is the literal form rather than the token's use.
- [x] T003 Inspect `scripts/refresh-docs.js` and confirm the converter accepts any same-origin `#<hex>` email-protection fragment, so token content is irrelevant to the assertions.
- [x] T004 Establish the ledger duplication cause from git history: the same four findings moved one line down in PR #2063 and were re-appended under new identities.
- [x] T005 Read Pullfrog's review on PR #2065 (`pullrequestreview-6097218187`) and reproduce its two sequences by executing the superseded `19fe6ee` script from `HEAD`.
- [x] T006 Established what finding-specific data the SARIF actually offers: DevSkim emits `charOffset`/`charLength` (UTF-16 code units) and `snippet` for located results, and omits `partialFingerprints` for rules such as DS173237.
- [x] T007 Corrected after the second Pullfrog review: `.github/workflows/devskim.yml` does **not** guarantee the checkout matches the scan. The `update-report` job downloads the current SARIF and then checks out an existing `chore/devskim-report-update-*` branch. The identity must therefore use the SARIF only.

## Phase 2: Fixture and ledger remediation

- [x] T008 Add `syntheticLongHex(seed)` to `scripts/test-refresh-docs.js` with a comment naming DS173237.
- [x] T009 Replace all four long hex literals with generated tokens, preserving both prefixes and both test sites.
- [x] T010 Remove only the four superseded line-shift entries from `devskim-alerts.md`, leaving one entry per distinct finding.

## Phase 3: Identity implementation

- [x] T011 Replaced the occurrence-rank identity with the SARIF-only content identity `("v4","content", rule, uri, message, snippet text, column, length)`. No absolute line, absolute offset, source-file content or per-scan rank participates.
- [x] T012 Removed `_SourceFile`/`_SourceIndex` and the 2 MiB workspace read: the appender opens no source file, so a reused report branch cannot change an id. (The v3 shape that read source was withdrawn before any ledger entry was written.)
- [x] T013 Made `charOffset` irrelevant to identity: a usable, stale or absent absolute span yields the same id from the same SARIF, covered by a regression.
- [x] T014 Replaced the rank lookup in `append_findings()` with occurrence accounting: same recorded location first, remaining recorded occurrences for a renumber, then legacy aliases, appending only the surplus.
- [x] T015 Kept the fingerprint identity (`v2`) unchanged so fingerprinted ids never change, and kept every earlier id as an alias, including the superseded v2 shape id.
- [x] T016 Fixed the display-message extraction to use the defensive `_message_text()` helper, so a non-dict SARIF `message` cannot raise `AttributeError` in the append loop (Graphite review note).
- [x] T017 Corrected the `previous_identities()` docstring to say it lists earlier ids only and that the current primary id is checked separately (Graphite review note).

## Phase 4: Tests

- [x] T018 `__tests__/devskim-dedup.test.js` asserts the recorded `uri:line` and id of every row, not only `newCount` and marker totals.
- [x] T019 Renumber case: a recorded finding stays at its recorded location and id across a one-line shift and a forty-line shift, with `newCount` 0 both times.
- [x] T020 Insertion case: a different same-shape finding inserted between two known ones appends exactly one row naming the inserted line, keeps both known ids, and produces no duplicate id.
- [x] T021 Remediation case: removing a known finding appends nothing and removes nothing; a different new finding at the same line is then appended with a new id.
- [x] T022 Legacy-entry case: one earlier-version line-based entry plus two different findings on that line appends the second finding and repeats cleanly, so an old entry cannot hide a new finding.
- [x] T023 Repeated-scan case: three identical scans (including a reordered result list) append nothing after the first.
- [x] T024 Kept the exact-duplicate and distinct-same-line cases, now with source text, and replaced the span-validation case with one that requires usable and unusable absolute spans to share an id.
- [x] T025 Pinned the documented identical-findings limitation under a test named for it.
- [x] T026 Added Pullfrog's fixed-SARIF/changed-workspace regression: record a finding, then append the identical SARIF with the workspace source changed and with it absent; both append nothing and the row set is unchanged.
- [x] T027 Reproduced the second review's defect against `aed9b241`: the same SARIF appended from a changed workspace produced `first=1, second=1, entries=2`; the repaired script produces `first=1, second=0, entries=1`.
- [x] T028 Extended `identity_benchmark.py` with `workspace_changed_appended` and `workspace_changed_entries` so the same-SARIF/different-workspace sequence is recorded in the evidence JSON.
- [x] T029 Corrected every record that claimed the report job checks out the scanned commit: the script docstring, the spec, the plan and the Memory Bank.

## Phase 5: Benchmark

- [x] T030 Extended `artifacts/devskim-review-pipeline/identity_benchmark.py` with the insertion and remediation sequences and recorded the `uri:line` each append names plus `insertion_new_finding_recorded_at_expected_line` and `remediation_new_finding_recorded_at_expected_line`.

## Phase 6: Records

- [x] T031 Rewrote the spec, plan and tasks as one feature record covering both repairs; committed `specs/230-devskim-findings-remediation/evidence/identity-benchmark.json`; pointed `RESULTS.md` at the evidence and `.specify/feature.json` at this directory.
  The two former directories (`specs/230-devskim-ds173237-fixture-remediation` and `specs/231-devskim-ledger-stable-identity`) were consolidated after `verify-speckit-task.sh` rejected a PR changing two feature directories; no requirement, task or result was dropped.
- [x] T032 Updated the Memory Bank active context, technical context and progress milestone to the consolidated record and its limitation.

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Updater regression suite | `node scripts/test-refresh-docs.js` | 61 passed, 0 failed |
| DS173237 pattern | pattern applied to `scripts/test-refresh-docs.js` | 0 matches (4 before); both tokens 56 lowercase hex, distinct, prefixes preserved |
| Dedup regression suite | `node node_modules/vitest/vitest.mjs run __tests__/devskim-dedup.test.js` | 14 passed / 14 |
| Dependency-management guard | `vitest run __tests__/dependency-management.test.js` | NOT RUN for this revision; 12/12 on the earlier revision. No dependency or workflow file changed. |
| Script syntax | `python3 -m py_compile .github/scripts/append_devskim_findings.py` | exit 0 |
| Python checker suites | `cd .github/scripts && python3 -m unittest discover -s . -p 'test_*.py'` | Ran 520 tests, OK |
| Identity benchmark | `python3 artifacts/devskim-review-pipeline/identity_benchmark.py --old-scripts $HOME/agent-tmp/old-scripts --json specs/230-devskim-findings-remediation/evidence/identity-benchmark.json` | exit 0 |
| Spec Kit governance gate | `SPEC_KIT_BASE_REF=da45d91077881a147143de307b6c148b51e82b83 bash scripts/verify-speckit-task.sh` | passes with this single feature directory |
| Spec Kit gate tests | `bash scripts/test-verify-speckit-task.sh` | all tests passed |

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

- `./freebuff-verify.sh`, the production build, Playwright, OpenNext and a live DevSkim scan were not run locally for this change. The PR-triggered workflows remain authoritative; the local Spec Kit gate and the suites above were run.
- DevSkim alert closure is observable only after the next `main` scan uploads the changed source. The PR's own scan proves the file no longer yields the findings on the pull-request ref; the four `main` alerts must be confirmed fixed after merge.
- This work is on the open PR #2065 branch; the PR remains open, non-draft and unmerged for owner review.

## Preserved behaviour

- DevSkim scanner rules, scan globs, triggers, permissions, concurrency, SARIF generation, suppression filtering, Security-tab upload and the append-only report contract are unchanged.
- No suppression was added, broadened or disabled and no scan path was excluded; a future long hex literal will be reported again.
