# Evidence: Visual QA Install Timing Report

**Date**: 2026-11-15
**Branch**: `freebuff/02773acb0f15757c85d4c07d-install-timings`
**Base**: `main` at `0c03ac90` (merged PR #1915)

## Focused reporter tests

```text
$ PYTHONPATH=.github/scripts python3 -m unittest test_report_visual_qa_install_timings -v
Ran 21 tests in 0.009s
OK
```

Covered: job selection/order, whole-second durations, missing timestamps, pnpm and Chromium
hit/miss keys, hit-over-miss precedence, unknown logs, plain and zip job logs, corrupt zip,
Chromium step fallback (`skipped`/`success`/incomplete), baseline deltas, table rendering,
cold-store and unknown-state notes, JSON output, fixture errors and repository validation.

## Fixture execution (PR #1914 timings)

```text
$ python3 .github/scripts/report_visual_qa_install_timings.py --fixture-dir /tmp/qa-timings-fixture 43730539554
Visual QA dependency install timings
Repository: fixture/repository
Run: 43730539554 (attempt 2, success)  https://github.com/.../actions/runs/43730539554
Baseline: PR #1914 run 43730539554 (verification 8s, each browser shard 7s)

Job                     Install Baseline  Delta  pnpm store cache                    Chromium cache
Visual QA                    8s       8s     0s  hit (node-cache-Linux-pnpm-a1b2c3)  n/a
Visual QA (shard 1/2)        7s       7s     0s  hit (node-cache-Linux-pnpm-a1b2c3)  hit (playwright-chromium-Linux-1.64.1)
Visual QA (shard 2/2)        7s       7s     0s  hit (node-cache-Linux-pnpm-a1b2c3)  hit (playwright-chromium-Linux-1.64.1)
```

The JSON form reported the same rows plus the baseline reference
(`{"label": "PR #1914", "run_id": 43730539554, "install_seconds": {...}}`).

## Workflow structure

- `yaml.safe_load('.github/workflows/visual-qa.yml')` — parses; still exactly two
  `Install dependencies` steps, both unchanged.
- The modified `Test QA infrastructure checkers` run block passes `bash -n` and contains
  `report_visual_qa_install_timings.py` and `test_report_visual_qa_install_timings`.
- `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` — 30/30 passed, so the
  classifier and install-step guards are unaffected.

## Full suite and repository gate

```text
$ pnpm run test
Test Files  80 passed (80)
Tests       788 passed (788)

$ pnpm exec tsc --noEmit
exit 0

$ SPEC_KIT_BASE_REF=0c03ac90 ./freebuff-verify.sh
✅ Spec Kit task artifacts verified and current: .../specs/167-visual-qa-install-timings
✅ All verification steps passed.
exit 0
```

Production build after a clean `pnpm install --frozen-lockfile` and clean `.next`:
**304,966,134 bytes (290.84 MiB)**, including a 210 MiB webpack cache and a 90 MiB
`.next/standalone`; below the 495 MiB cap. An earlier measurement of 721.89 MiB was traced to a
temporary `pnpm install --force` state that had installed all 10 Sharp platform packages; the
clean lockfile install has only `linux-x64`, and the rebuilt output returned to the normal size.

## Limitations

- Live GitHub mode was not executed: this workspace's `gh` is not authenticated and the anonymous
  REST request returned HTTP 403 (rate limit), which the tool reports as a clean exit 2. The API
  shapes and log parsing are covered by fixtures; live cache keys will populate when the owner runs
  it with `GH_TOKEN` or `gh auth login`.
- The Playwright suite itself was not run; this change set touches only CI tooling and Spec Kit
  records and is classified non-rendering.
- PR-triggered checks are PENDING — they run after PR creation.
