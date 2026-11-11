# Implementation Plan: Faster, More Reliable PR Checkers and Dedicated AGENTS.md Governance

**Branch**: `fix/141-pr-checker-governance-protection` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Audit the GitHub-native PR checkers, correct AGENTS.md protection, and improve reliability and runtime without removing a gate.

## Selected Task Groups

- `ci` — the task is entirely about GitHub Actions pull-request checks.
- `troubleshooting` — the fast Visual QA failures were diagnosed to a concrete governance-test parse error, not assumed.
- `testing` — every change is covered by executable regression tests.
- `security` — the AGENTS.md approval boundary and fail-closed behaviour must be preserved.
- `deep-dive` — workflow run history, local command timings and the full checker code paths were inspected before choosing changes.

Reference documents consulted: `.docs/testing/_google_eng-practices.md` (reviewable, focused change scope) and the GitHub Actions run history linked below. `.docs/` was not modified.

## Summary

1. **AGENTS.md protection**: add `.github/scripts/agents_md_protection.py`, a path-based classifier that permits a dedicated governance pull request, refuses `AGENTS.md` alongside unrelated files, refuses deletion/renames away, fails closed on missing data, and treats the base-branch `AGENTS.md` as the approved baseline. Wire it into `protected-files.yml` on a trusted base checkout while keeping the `protected-file-authorization` environment gate.
2. **Reliability**: repair the governance suite's parse error at `__tests__/agent-governance-single-source.test.js:108` (the cause of the 58 s–1 m 22 s Visual QA failures), and make Verification Integrity aggregate every Visual QA shard so one failed shard cannot look green.
3. **Performance**: remove two duplicated Visual QA steps (the two-file Vitest subset and the standalone `tsc`, both already covered), split the non-browser verification from Playwright, and run Playwright in two native shards. Add pnpm-store caching, a bounded timeout and superseded-run cancellation to Validate OpenNext Repair; add pnpm caching to the updater-scheduler verifier; bound DevSkim's runtime.

## Baseline Evidence

Recorded GitHub workflow runs:

| Workflow | Normal duration | Outlier | Evidence |
| --- | --- | --- | --- |
| Visual QA | 12 m 14 s – 14 m 55 s (success); 58 s – 1 m 22 s (failure) | 13 h 18 m 53 s on docs-refresh PR #1811 | runs 42913513116, 42937298175, 42876415445, 43080551563 |
| Validate OpenNext Repair | 1 m 44 s – 2 m 49 s | 16 m 33 s and 13 h 18 m 53 s on docs-refresh PRs #1807/#1811 | runs 43061130617, 42937298206, 43048132337 |
| DevSkim | 40 s – 1 m 20 s | 13 h 18 m 53 s on PR #1811 | runs 43080551868, 42913514249 |
| Verification Integrity | 17 s – 3 m 7 s; 10 m 13 s, 12 m 30 s while waiting | — | runs 43080551932, 42902175720, 43080551932 |
| Protected File Changes | 10 s – 56 s | — | runs 43080551961, 42854151591 |

Local measurements on the task checkout (Node 26.13.0, pnpm 10.30.3):

| Command | Result |
| --- | --- |
| `pnpm exec tsc --noEmit` | 6.4 s, exit 0 |
| `pnpm exec vitest run __tests__/crystal-ball-daily-usage.test.js __tests__/oracle-route-validation.test.js` | 1.9 s, 25 tests pass |
| `pnpm run test` | 9.9 s; 1 failed suite due to the governance-test parse error; 494 tests passed |
| `pnpm install --frozen-lockfile` (warm) | 4.3 s |
| `pnpm exec playwright test --project=desktop` | Browser launch failed: `libnspr4.so` missing in this sandbox; not a project failure |

The 12–15 minute Visual QA successes run the same unit suite, TypeScript check and production build that Validate OpenNext Repair completes in about 2–3 minutes. The remaining time is the 3-project Playwright suite (57 tests per project on the desktop project alone), which is why the browser phase is sharded and separated from the build phase.

## Design Decisions

1. **Path-based classification, never prose.** The classifier takes only changed paths and blob identities. Unknown arguments (including `--title` and `--body`) fail, so a title or description cannot authorize a change.
2. **Trusted base checkout.** `pull_request_target` checks out `github.event.pull_request.base.sha` with credentials not persisted. The workflow definition and classifier are trusted base code; the PR head is never executed.
3. **Baseline by base-branch blob.** Missing identities are indeterminate and fail closed. Merging an authorized change moves the base forward, so it becomes the new baseline and is not reported again.
4. **Dedicated support allowlist.** Only protection/tests/governance contract files plus the Spec Kit, Memory Bank and evidence records the repository requires can accompany `AGENTS.md`. Source code, dependencies, other workflows and general docs cannot.
5. **Keep the human gate.** The `protected-file-authorization` environment remains required for all protected files, including dedicated governance PRs.
6. **Split verification from browser work.** A stable `Visual QA` job keeps the full unit suite and `freebuff-verify.sh`; two `Visual QA (shard n/2)` jobs run Playwright with `--shard=n/2` and `fail-fast: false`.
7. **Aggregate shards in the audit.** Verification Integrity matches conditional checks by prefix and marks the group `FAIL`/`PENDING`/`NOT RUN` if any shard is not green, so a green sibling cannot hide a failed shard.
8. **No caching of build output.** Validate OpenNext Repair caches only the pnpm content-addressed store; `.next` and `.open-next` are still cleared, and the 495 MiB ceiling is measured on a fresh build.

## Risks and Mitigations

- **A PR could disguise an AGENTS.md edit as governance** → only exact allowed paths qualify; app code, dependencies, other workflows and general documentation are refused and named.
- **A missing API response could silently allow a change** → empty/unreadable lists and missing blob identities fail closed with exit 2.
- **A shard failure could be hidden** → the audit aggregates all shard runs and reports any non-green shard.
- **Sharding could skip a test** → `--shard` partitions the same test set; the full suite is unchanged, and both shards are required.
- **Caching could hide a clean-build failure** → only the dependency store is cached; build outputs are deleted before every build.
- **Governance test edits could weaken requirements** → existing AGENTS.md requirement assertions are preserved; only the broken syntax and the protection test are changed, and the classifier is exercised end to end.

## Verification Plan

- `python3 -m py_compile` on the new and changed Python modules.
- `python3 -m unittest discover -s .github/scripts -p 'test_agents_md_protection.py'` (25 tests).
- `python3 -m unittest discover -s .github/scripts -p 'test_verify_pr_verification_status.py'` (28 tests).
- `pnpm exec vitest run __tests__/agent-governance-single-source.test.js` (8 tests).
- Full `pnpm run test`.
- `./freebuff-verify.sh` (Spec Kit gate, TypeScript, build, refresh-docs tests).
- Measure `.next + public` against the 495 MiB cap.
- Workflow YAML review: confirm every previous step still exists or is provably duplicated by a retained step.
- GitHub-side runtime after merge is recorded as PENDING until an actual run is observed; no CI speedup is claimed from local measurements alone.
