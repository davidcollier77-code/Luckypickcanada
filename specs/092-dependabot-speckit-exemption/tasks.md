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
- [x] T024 `bash scripts/test-verify-speckit-task.sh` — 23/23 cases pass (10 pre-existing, 13 new).
- [ ] T025 `./freebuff-verify.sh` on the final tree.
- [ ] T026 Measure `.next + public` against the 495 MiB hard maximum and record the number.
- [ ] T027 Full `pnpm exec vitest run` and `pnpm exec tsc --noEmit`.
- [ ] T028 Final diff audit: only the verifier, its regression suite, the two workflow wiring edits, this feature's artifacts and the memory-bank context entry.
- [ ] T029 PR-head CI: PENDING (reported as pending, never as passing). Confirm the six Dependabot PRs pass governance and that Playwright visual regression and the updater-scheduler steps actually execute.

## Dependencies

- T007–T008 block T009.
- T009 blocks T010–T011 and every fixture that exercises the exemption.
- T012–T013 are independent of the verifier change but are required for the exemption to apply in CI.
- T023–T028 depend on T007–T022.
- T029 depends on a pushed branch and observed GitHub Actions results.
