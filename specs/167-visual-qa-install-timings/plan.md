# Implementation Plan: Visual QA Install Timing Report

**Feature**: `167-visual-qa-install-timings` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

## Selected Task Groups

- `testing` — offline unit tests and fixture execution.
- `ci` — GitHub Actions job/log inspection and cache-state interpretation.
- `troubleshooting` — explaining why warm installs show no Playwright download.

Consulted `.docs/testing/_microsoft_playwright.md` for Playwright install behaviour and `.docs/manifest.json` groups `testing`/`deep-dive`. The GitHub Actions log format and cache messages were verified from the recorded job API data and the workflow's cache steps; `.docs/` was not modified.

## Summary

Add `.github/scripts/report_visual_qa_install_timings.py`, a dependency-free Python reporter that takes a Visual QA run ID and prints the `Install dependencies` duration of every Visual QA job next to the PR #1914 baseline (8 s verification, 7 s per browser shard). It also reports pnpm and Chromium cache states, reading `@actions/cache` log lines and falling back to the Chromium cache-miss step conclusion.

The script supports `--json`, resolves the repository from `--repo`, `GITHUB_REPOSITORY` or the git origin, reads the token from `GH_TOKEN`/`GITHUB_TOKEN` or `gh auth token`, and never prints it. Job-log downloads follow GitHub's redirect with the Authorization header stripped when the host changes.

Offline fixtures (`--fixture-dir` with `run.json`, `jobs.json`, `logs/<job-id>.txt`) make the tool and its tests independent of network access. The QA verification job compiles the script and runs `test_report_visual_qa_install_timings`.

## Technical Context

**Language/Version**: Python 3 standard library; GitHub REST API v2022-11-28.

**Primary Dependencies**: none added. `actions/cache` and `setup-node` provide the log messages; `gh` is optional for local authentication.

**Storage**: none. Read-only API access only.

**Testing**: `.github/scripts/test_report_visual_qa_install_timings.py` (unittest, 21 tests), QA `py_compile`/unittest step.

**Constraints**: No dependency or lockfile change; no workflow behaviour change beyond running the new test; no token exposure; baseline timings documented from run 43730539554.

## Design

### Selection and timing

Jobs are filtered by the `Visual QA` name prefix and presence of an `Install dependencies` step, which excludes `Detect visual changes`. Ordering is verification job first, then shards by number. Durations use whole seconds from `started_at`/`completed_at`; missing timestamps yield no duration rather than zero.

### Cache states

- pnpm: parse `Cache restored from key:` / `Cache not found for input keys:` from the job log; keys starting with `node-cache-` (or containing `pnpm`) belong to the pnpm store.
- Chromium: the `Install Playwright Chromium (cache miss)` step is `skipped` on a cache hit and `success` on a miss, so the state is exact without logs. Log keys starting with `playwright-chromium-` supply the key.
- Verification job: no Chromium cache step, so the state is `n/a`.

### Failure behaviour

- API or fixture errors exit 2 with a clear message.
- Log absence leaves the pnpm state `unknown` and does not fail the report.
- Corrupt zip logs raise a report error.
- A cold pnpm store emits the comparison warning.

### Deliberately unchanged

No Visual QA job, install command, cache key, Playwright provisioning, test command, baseline or classifier is modified. The workflow only gains the compile/test entries for the new script and test.

## Verification Plan

1. `python3 -m py_compile` both new files.
2. `PYTHONPATH=.github/scripts python3 -m unittest test_report_visual_qa_install_timings -v` — 21 offline tests.
3. Exercise fixture mode to show the comparison table and JSON.
4. `pnpm run test`, `pnpm exec tsc --noEmit`, `SPEC_KIT_BASE_REF=<main> ./freebuff-verify.sh` — existing gates and build size.
5. Record results and limitations in `evidence.md`.
