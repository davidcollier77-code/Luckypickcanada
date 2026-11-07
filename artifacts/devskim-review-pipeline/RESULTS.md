# DevSkim PR review pipeline — before/after evidence

All numbers below come from running the committed harnesses in this directory against the
repository's real allowlisted files. `before` runs the modules as they were at the start of the
task (a snapshot of `HEAD`), `after` runs the working-tree modules. Both runs use the same fixture,
the same machine and the same repeats.

## Reproduction

```bash
# snapshot the pre-change modules
mkdir -p /tmp/old-scripts
for f in suppress_devskim_false_positives.py verify_devskim_sarif_replay.py append_devskim_findings.py; do
  git show <base-sha>:.github/scripts/$f > /tmp/old-scripts/$f
done

python3 artifacts/devskim-review-pipeline/benchmark.py --label before --scripts /tmp/old-scripts --json artifacts/devskim-review-pipeline/before.json
python3 artifacts/devskim-review-pipeline/benchmark.py --label after  --json artifacts/devskim-review-pipeline/after.json
python3 artifacts/devskim-review-pipeline/replay_benchmark.py --label before --scripts /tmp/old-scripts --json artifacts/devskim-review-pipeline/replay-before.json
python3 artifacts/devskim-review-pipeline/replay_benchmark.py --label after  --json artifacts/devskim-review-pipeline/replay-after.json
python3 artifacts/devskim-review-pipeline/identity_benchmark.py --old-scripts /tmp/old-scripts --json artifacts/devskim-review-pipeline/identity-before-after.json
```

## 1. False-positive filter (`benchmark.py`)

| Findings | Before ms | After ms | Speedup | Reads before → after | JSON parses before → after | Suppressed | Filtered results |
|---------:|----------:|---------:|--------:|---------------------:|---------------------------:|-----------:|-----------------:|
| 85 | 139.58 | 21.28 | 6.6× | 45 → 3 | 26 → 2 | 45 = 45 | 40 |
| 110 | 249.91 | 28.59 | 8.7× | 70 → 3 | 51 → 2 | 70 = 70 | 40 |
| 160 | 458.86 | 45.46 | 10.1× | 120 → 3 | 101 → 2 | 120 = 120 | 40 |
| 260 | 872.01 | 81.72 | 10.7× | 220 → 3 | 201 → 2 | 220 = 220 | 40 |
| 460 | 1716.31 | 141.90 | 12.1× | 420 → 3 | 401 → 2 | 420 = 420 | 40 |

The filtered-SARIF SHA-256 is `50558a30bcaf9502a3c61fec9ba6d2a27dbf92fdea570c9a55c61ed036ee0636`
for **both** versions at every size, so no suppression decision changed.

## 2. Replay gate (`replay_benchmark.py`)

Nine findings: one real audited finding from each of the eight reviewed families (Playwright test
timeout, reveal timer, celebration confetti wave, celebration `startTimer`, reveal test source
assertion, share-image object-URL revoke, Playwright local origin, committed local probe origin)
plus one finding outside every allowlist.

| | Before | After |
|---|---|---|
| Runtime | 37.58 ms | 21.06 ms |
| Audited families removed | 8 | 8 |
| Families reported absent | 0 | 0 |
| Surviving non-allowlisted findings | 1 | 1 |
| Verdict | pass | pass |

## 3. Report identity (`identity_benchmark.py`)

| Scenario | Before | After |
|---|---|---|
| Two distinct findings on one line, no fingerprint | 1 entry (**one hidden**) | 2 entries |
| Identical finding twice | 1 entry | 1 entry |
| Same SARIF appended twice | 0 on the second run | 0 on the second run |
| Report already holding an earlier-scheme entry | n/a | 0 appended (1 entry) |

## 4. Unit suite

`python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`
→ 87 tests, OK (78 pre-existing + 9 new regression tests).

## Limits

- Timings are single-machine Python measurements, not GitHub Actions job durations; the workflow
  runtime includes checkout, scanning and SARIF upload that this harness does not model.
- The replay fixture is constructed from real audited source lines rather than a fresh DevSkim run,
  so it proves the checker's decisions on those lines, not a new scanner discovery.
