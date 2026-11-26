# Evidence: DevSkim Backlog Remediation

**Date**: 2026-11-26
**Branch**: `freebuff/devskim-backlog-remediation-219`
**Base**: `main` at `aeb087f462042eb4a15eb53524dc788026222dab`

## Real default-branch SARIF

Source: DevSkim workflow artifact for `main` (raw SARIF), 3,545 results.

### Baseline (unmodified filter)

```text
$ PYTHONPATH=.github/scripts python3 .github/scripts/suppress_devskim_false_positives.py
Suppressed 3123 verified false positives in SARIF.
remaining: 422
  421  DS162092
    1  DS172411
```

This reproduces the live Security-tab count exactly.

### Updated filter, matching source

The filter's own source file was restored to its `aeb087f` content for this run so the scanner's self-test spans still match; the new filter code was imported from a separate directory.

```text
$ PYTHONPATH=/tmp/ds219/newmod python3 /tmp/ds219/newmod/suppress_devskim_false_positives.py
Suppressed 3545 verified false positives in SARIF.
remaining after filter: 0
```

### Real-SARIF replay gate

```text
$ PYTHONPATH=/tmp/ds219/newmod python3 /tmp/ds219/newmod/verify_devskim_sarif_replay.py <raw.sarif>
  ...
  second pass: no suppressions remained
OK: no audited false positive survived the filter; the raw SARIF is unchanged.
replay_status=0
```

## Focused test suites

| Suite | Command | Result |
| --- | --- | --- |
| DevSkim suppression | `PYTHONPATH=.github/scripts python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` | **115 tests OK** |
| Report contract | `PYTHONPATH=.github/scripts python3 -m unittest test_pr_verification_report` | **102 tests OK** |
| Workflow contract (Vitest) | `pnpm exec vitest run __tests__/checker-suite-workflows.test.js` | **14 tests passed** |

## Negative controls proven by the suite

- A loopback origin in production application code is retained.
- Markdown, non-JSON, `..`-containing, non-evidence and non-numeric feature paths are rejected before source inspection.
- A non-loopback URL, a bare loopback address that is not a URL, and malformed JSON are retained.
- A different `setTimeout` statement in the meter scene is retained.
- A loopback finding in the meter file is retained (the timer allowlist does not widen DS162092).

## Alert inventory

| Category | Count | Detail |
| --- | --- | --- |
| Open alerts before | 422 | page 422 = #713, page 423 empty |
| DS162092 | 421 | 13 Spec 217 evidence JSON files, 11 with loopback values |
| DS172411 | 1 | `app/lib/lucky-meter/meter-scene.js:1116` |
| Severity | 422 × `note` | no high, critical or medium |
| Created | 422 at `2026-11-24T23:48:05Z` | one Spec 217 pull-request scan batch |

## Build applicability

The change set is limited to `.github/`, `specs/`, `memory-bank/` and `__tests__/`, all of which the repository classifier marks build-exempt. The production build should therefore be reported as **NOT RUN — not applicable** with the classifier reason. This record does not substitute for the automated classifier result.

## Limitations

- The 422 alerts remain open until this branch merges and the next default-branch DevSkim scan uploads the filtered SARIF. Post-merge closure cannot be verified from this branch.
- The SARIF used locally was generated from `aeb087f`; it is the current `main` head at the start of this task.
- No physical-device, browser or visual verification applies to this change.
- `./freebuff-verify.sh` is not available in this environment.
