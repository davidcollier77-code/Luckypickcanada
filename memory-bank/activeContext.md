# Active Context — Visual QA Install Timing Report

- **Updated:** 2026-11-15
- **Repository:** `davidcollier77-code/Luckypickcanada`
- **Branch:** `freebuff/02773acb0f15757c85d4c07d-install-timings`
- **Base:** `main` at `0c03ac90` (merged PR #1915)
- **Spec Kit feature:** `specs/167-visual-qa-install-timings`
- **Pull request:** pending creation from this branch as a regular, non-draft PR

## Current Task

Add one command that, given a Visual QA run ID, reports each job's `Install dependencies` duration
and delta against the PR #1914 baseline, together with the pnpm store and Chromium cache hit/miss
states, so the next rendering-capable PR can be measured without reading job logs by hand.

## Implemented State

- `.github/scripts/report_visual_qa_install_timings.py` reports the verification job and both browser
  shards, ordered verification first; durations are whole seconds and deltas use the embedded
  baseline (verification 8 s, each shard 7 s) from run `43730539554`.
- pnpm and Chromium cache states come from `@actions/cache` log lines, with the
  `Install Playwright Chromium (cache miss)` step conclusion as the exact offline fallback.
  Missing logs degrade to `unknown` rather than failing the report.
- The tool reads plain or one-entry-zip job logs, strips the Authorization header on the log
  redirect, resolves the repository from `--repo`/`GITHUB_REPOSITORY`/git origin, and never prints
  the token. `--json` emits the same data; `--fixture-dir` supports offline runs.
- The QA verification job now compiles the reporter and runs its 21 offline tests; no install,
  cache, Playwright or classifier step changed.

## Verification

- Focused reporter suite: 21/21 passed.
- Full Vitest suite: 80 files / 788 tests passed; `tsc --noEmit` exit 0.
- `SPEC_KIT_BASE_REF=0c03ac90 ./freebuff-verify.sh` exit 0; build 290.84 MiB, below the 495 MiB cap.
- Workflow YAML parses, the modified run block passes `bash -n`, and the existing classifier suite
  remains 30/30.

## Limitations

- Live API mode was not exercised in this workspace (no authenticated `gh`; anonymous request 403).
- Playwright visual tests were not run; no rendering paths changed.
- PR-triggered checks are pending until the PR is created.

## Follow-ups

- Run the report on the next genuinely visual PR with an authenticated token and record the cache
  states; expect ~0 s delta on a warm pnpm store and the removed ~681 MB download only on a miss.
