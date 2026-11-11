# Active Context — PR Checker Reliability, Performance and AGENTS.md Protection

- **Updated:** 2026-11-11
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `fix/141-pr-checker-governance-protection`
- **Spec Kit feature:** `specs/141-pr-checker-reliability-and-governance-protection`
- **Pull request:** not submitted

## Current Task

Audit the GitHub-native pull-request checkers (excluding AI review bots), improve their speed
and reliability without removing any quality gate, and correct the AGENTS.md protection checker
so governance has a dedicated pull-request path.

## Evidence

- Recorded workflow durations: Visual QA 12–15 min on success and 58 s–1 m 22 s on recent
  failures; Validate OpenNext Repair 1 m 44 s–2 m 49 s; DevSkim 40 s–1 m 20 s; Verification
  Integrity 17 s–3 m 7 s with 10–12 min waits; Protected File Changes 10–56 s. The 13 h 18 m
  values recur on the same docs-refresh PR across three workflows, so they are queue/wait time.
- Local reproduction: `pnpm run test` failed on `main` head `62615d1c` because
  `__tests__/agent-governance-single-source.test.js:108` had a missing parenthesis. That parse
  error explains the fast Visual QA failures, including both "Update AGENTS.md" PRs.
- The same governance suite still asserted superseded AGENTS.md wording, so a merged governance
  update kept producing false failures. The assertions now track the approved merged baseline.
- Playwright cannot launch in this sandbox (`libnspr4.so` missing), so browser timing comes from
  the recorded workflow runs, not a local timing.

## Implementation

- Added `.github/scripts/agents_md_protection.py` and 25 regression tests: dedicated governance
  PRs are allowed; AGENTS.md alongside application code, dependencies, other workflows or general
  docs is refused and the files are named; deletion/rename-away is refused; missing data fails
  closed; the base-branch AGENTS.md is the approved baseline; no title/body argument exists.
- Wired the classifier into `protected-files.yml` on a trusted base checkout, keeping the
  `protected-file-authorization` environment gate.
- Verification Integrity now aggregates every Visual QA shard (`FAIL` if any shard failed).
- Visual QA: removed the duplicated two-file Vitest subset and standalone TypeScript step,
  split the stable verification job from Playwright, and sharded Playwright into two required
  jobs with `fail-fast: false`.
- Validate OpenNext Repair: pnpm-store cache, 20-minute timeout, superseded-run cancellation.
  Deploy Updater Scheduler verifier: pnpm-store cache. DevSkim: bounded timeouts.
- `freebuff-verify.sh` now runs the protection regression suite.

## Verification and Delivery Status

- **PASS:** `python3 -m py_compile` on the four changed/new Python modules.
- **PASS:** `python3 -m unittest discover -s .github/scripts -p 'test_agents_md_protection.py'` — 25 tests.
- **PASS:** `python3 -m unittest discover -s .github/scripts -p 'test_verify_pr_verification_status.py'` — 28 tests.
- **PASS:** `pnpm exec vitest run __tests__/agent-governance-single-source.test.js` — 8 tests.
- **PASS:** `pnpm run test` — 57 files, 503 tests.
- **PASS:** `./freebuff-verify.sh` — exit 0; documentation tests 36/36.
- **PASS:** production build `.next + public` = 405,503,226 B (386.72 MiB), below 495 MiB.
- **NOT RUN:** live Playwright (sandbox host libraries missing); CI run of the new sharded
  workflow (runs only after PR creation).
- **PENDING:** GitHub workflow runtimes after merge. No CI speedup is claimed from local timings.

## Handoff

The complete work is on the task branch. PR submission follows `PR_SUBMISSION.md`; this file is
updated only until the PR is opened.
