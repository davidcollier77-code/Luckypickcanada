# Tasks: Dependabot Maintenance Exemption for Spec Kit Governance

**Input**: Design documents from `/specs/092-dependabot-speckit-exemption/`

## Phase 1: Investigation (baseline, verified)

- [x] T001 Read the failing gate: `scripts/verify-speckit-task.sh` exits non-zero when `CANDIDATE_DIRS` is empty; `freebuff-verify.sh` stops there, so the following steps never run.
- [x] T002 Confirm the reported failures and their step order from the seven supplied run IDs (#1712 Visual QA `41952872507`, #1712 Deploy Updater Scheduler `41952872551`, #1713 `41952948004`, #1714 `41952991564`, #1715 `41953025616`, #1716 `41953063069`, #1717 `41953121674`) and the common message.
- [x] T003 Confirm the real change sets through the GitHub API: #1712 → `.github/workflows/deploy-updater-scheduler.yml` + `.github/workflows/update-spec-kit.yml`; #1713–#1717 → `package.json` + `pnpm-lock.yaml`.
- [x] T004 Confirm commit provenance: every one of the six PRs is a single commit authored by `dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>` and committed by `GitHub <noreply@github.com>`.
- [x] T005 Confirm the gate's callers: `freebuff-verify.sh` → `scripts/verify-speckit-task.sh`; workflows `visual-qa.yml` and `deploy-updater-scheduler.yml` (verify job) invoke it, and neither forwarded the pull request author.
- [x] T006 Confirm the dirty-checkout hazard: `deploy-updater-scheduler.yml` runs `scripts/update-spec-kit-safely.sh` before the gate, so exemption scope must come from the committed diff only.

## Phase 2: Foundational

- [x] T007 [P] Add `COMMITTED_PATHS` / `add_committed_path` to the verifier so the committed `BASE...HEAD` diff is tracked separately from combined worktree state.
- [x] T008 [P] Add `is_dependency_maintenance_path` with the exact allowlist: `package.json`, `pnpm-lock.yaml`, one-level `.github/workflows/*.yml|yaml`.

## Phase 3: User Story 1 — legitimate Dependabot bumps pass (P1)

- [x] T009 Add `dependabot_maintenance_exemption` requiring all four independent signals: trusted author, resolved base, non-empty committed scope inside the allowlist, and Dependabot-authored/GitHub-committed history.
- [x] T010 Consult the exemption only in the `CANDIDATE_DIRS -eq 0` branch; on success print the applied exemption and the maintenance scope and exit 0.
- [x] T011 Keep the unchanged fail-closed messages, adding the precise exemption blocker when the trusted author was present but scope/provenance declined.
- [x] T012 Forward `github.event.pull_request.user.login` as `SPEC_KIT_PR_AUTHOR` in `.github/workflows/visual-qa.yml`.
- [x] T013 Forward the same variable in the `verify` job of `.github/workflows/deploy-updater-scheduler.yml`.

## Phase 4: User Story 2 — no exploitation by feature or mixed-scope PRs (P1)

- [x] T014 Keep artefact completeness authoritative: any partial or multi-feature artifact set still fails before the exemption is considered.
- [x] T015 Reject mixed scope by path allowlist, including `app/`, `scripts/`, `README.md` and nested workflow paths.
- [x] T016 Reject a change set containing any commit that is not Dependabot-authored and GitHub-committed.
- [x] T017 Reject the exemption when no comparison base resolves, preserving the existing fail-closed behaviour.

## Phase 5: Regression coverage

- [x] T018 Add `run_verify` env support plus Dependabot-shaped and human-shaped commit helpers to `scripts/test-verify-speckit-task.sh`.
- [x] T019 Add passing fixtures for an npm/pnpm bump and a GitHub Actions bump (the #1713–#1717 and #1712 shapes).
- [x] T020 Add failing fixtures for: no author signal, human author, application-source mix, script mix, documentation mix, nested workflow path, incomplete artifacts, hand-authored commit and missing comparison base.
- [x] T021 Assert the exemption message for the npm fixture so a silent pass cannot masquerade as an exemption.
- [x] T022 Assert both governance workflows forward the pull request author, so removing the wiring fails the suite.

## Phase 6: Verification

- [x] T023 `bash -n` on both modified shell scripts.
- [x] T024 `bash scripts/test-verify-speckit-task.sh` — 25/25 cases pass (10 pre-existing, 15 new).
- [x] T025 `./freebuff-verify.sh` on the final tree → PASS (exit 0: governance gate, TypeScript, production build, refresh-docs 19/19). The local workspace cache of `origin/main` predates the #1711 merge, so the run used `SPEC_KIT_BASE_REF=f36927c` (the real base commit); CI resolves its own base.
- [x] T026 Measured `.next + public` = 301,046,044 + 32,840,043 = 333,886,087 bytes (318.42 MiB), below the 495 MiB hard maximum.
- [x] T027 Full `pnpm exec vitest run` → 43 files / 432 tests PASS; `pnpm exec tsc --noEmit` runs inside the gate and exited 0.
- [x] T028 Final diff audit: 10 files — `scripts/verify-speckit-task.sh`, `scripts/test-verify-speckit-task.sh`, the two workflow wiring edits, `.specify/feature.json`, `memory-bank/activeContext.md` and the four `specs/092-*` artifacts. Nothing outside that list; no dependency, lockfile or application change.
- [x] T028a Reproduced against the real PR heads in a throwaway clone: #1712–#1717 each exit 1 with the reported message without the author signal and exit 0 with the exemption message using the corrected verifier.
- [ ] T029 PR-head CI of this PR and the post-fix re-run of #1712–#1717: PENDING (reported as pending, never as passing). Their workflows execute the gate from the base branch, so the remaining Playwright and updater-scheduler steps can only be observed after this correction reaches `main` and the runs are re-triggered.

## Phase 7: Review follow-up on PR #1718

- [x] T030 Fail closed when a commit carries no author email instead of skipping it. Two reviewers (Amazon Q, Graphite) flagged `[[ -n "$author_email" ]] || continue`, which let a commit with an unverifiable author identity satisfy the provenance requirement.
- [x] T031 Add a regression fixture for a dependency-scoped change set whose newest commit has an empty author email, plus an assertion that the reported blocker names the empty author email.
- [x] T032 Validate `run_verify` arguments in `scripts/test-verify-speckit-task.sh` so a malformed (non `KEY=VALUE`) argument fails loudly instead of being handed to `env` as the command to run.
- [x] T033 Re-verify after the follow-up: `bash scripts/test-verify-speckit-task.sh` → 25/25 PASS; `./freebuff-verify.sh` → exit 0.

## Dependencies

- T007–T008 block T009.
- T009 blocks T010–T011 and every fixture that exercises the exemption.
- T012–T013 are independent of the verifier change but are required for the exemption to apply in CI.
- T023–T028 depend on T007–T022.
- T029 depends on a pushed branch and observed GitHub Actions results.


## Phase 8: Isolate workflow metadata in regression fixtures

- [x] T034 Set `SPEC_KIT_PR_AUTHOR=dependabot[bot]` in the regression suite before fixture execution to reproduce the actual Dependabot GitHub Actions environment in `scripts/test-verify-speckit-task.sh`.
- [x] T035 Clear inherited `SPEC_KIT_PR_AUTHOR` inside `run_verify` while preserving explicit per-fixture author assignments in `scripts/test-verify-speckit-task.sh`.
- [ ] T036 Run `bash -n scripts/test-verify-speckit-task.sh` and `SPEC_KIT_PR_AUTHOR=dependabot[bot] bash scripts/test-verify-speckit-task.sh`; verify the no-author fixture fails closed and both authorized fixtures still pass.
- [ ] T037 Run `./freebuff-verify.sh`, full Vitest and build-size measurement when the complete repository environment is available; report unavailable steps honestly.
- [ ] T038 Inspect the exact diff and observe PR-head CI; leave both pull requests open and unmerged for owner review.

**Dependencies**: T034 reproduces the failure before the helper fix. T035 fixes the isolation defect. T036 verifies the targeted repair; T037–T038 are final verification and reporting.
