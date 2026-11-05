# Feature Specification: Dependabot Maintenance Exemption for Spec Kit Governance

**Feature Branch**: `092-dependabot-speckit-exemption`

**Created**: 2026-11-05

**Status**: Implemented

**Input**: User description (Master Work Request #1): the shared Spec Kit governance verifier rejects
legitimate Dependabot maintenance pull requests because they contain no feature-development artifacts
(`spec.md`, `plan.md`, `tasks.md`). Add the smallest safe, centrally enforced exemption for genuine
Dependabot-only maintenance changes, including GitHub Actions version updates, without weakening any other
check and without relying on the pull request title or branch name alone.

## Verified baseline (before changing anything)

- Six open Dependabot PRs (#1712–#1717) fail their Visual QA workflow runs at the same step with:
  "Spec Kit governance check: no changed task feature artifacts were found." /
  "Expected spec.md, plan.md, and tasks.md together under specs/<feature>/ or .specify/features/<feature>/." /
  "Spec Kit governance check failed; remaining verification was not run."
- Verified workflow runs: #1712 Visual QA `41952872507`, #1712 Deploy Updater Scheduler `41952872551`,
  #1713 `41952948004`, #1714 `41952991564`, #1715 `41953025616`, #1716 `41953063069`, #1717 `41953121674`.
- #1713–#1717 passed unit tests, standalone TypeScript, DevSkim and OpenNext validation before the governance
  failure; #1712 also passed DevSkim and OpenNext validation and failed its updater-scheduler workflow at the
  same gate. Playwright install, committed-baseline verification and visual regression tests were **skipped**
  as a result, so visual regression is not reported as passing for any of these PRs.
- #1712 changes only `.github/workflows/deploy-updater-scheduler.yml` and `.github/workflows/update-spec-kit.yml`
  (one `uses:` digest/comment line each): a `github_actions` version bump.
- #1713–#1717 change only `package.json` and `pnpm-lock.yaml`: `npm` version bumps.
- Every one of those PRs is a single commit authored by
  `dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>` and committed by
  `GitHub <noreply@github.com>` (web-flow), verified through the GitHub API.
- Root cause: `scripts/verify-speckit-task.sh` fails closed whenever the changed-path set produces zero
  `specs/<feature>/` or `.specify/features/<feature>/` artifact directories. Nothing in the gate recognises
  dependency-maintenance scope, so a docs artifact requirement is applied to work that never had a feature.
- The gate is invoked from `freebuff-verify.sh`, which is run by `.github/workflows/visual-qa.yml` and the
  `verify` job of `.github/workflows/deploy-updater-scheduler.yml`; neither workflow previously supplied the
  pull request author, so an author-based signal was unavailable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A genuine Dependabot bump stops failing on missing feature docs (Priority: P1)

A maintainer opens a Dependabot version-bump pull request. The governance gate recognises approved
maintenance scope, records the exemption, and lets every remaining check (unit tests, TypeScript, build,
Playwright visual regression, updater-scheduler verification) run normally.

**Why this priority**: These six PRs are the routine mechanism that keeps dependencies current; a false
governance failure blocks all of them and hides any real failure behind a documentation error.

**Independent Test**: Run the verifier against a fixture repository whose only committed change is
`package.json` + `pnpm-lock.yaml` (or one workflow file) with a Dependabot-authored, GitHub-committed commit and
the trusted author signal; it exits 0 and prints the exemption message.

**Acceptance Scenarios**:

1. **Given** a committed change set limited to `package.json` and `pnpm-lock.yaml`, Dependabot committer
   identity, and the trusted author signal, **When** the gate runs, **Then** it passes with an explicit
   maintenance-exemption message.
2. **Given** the same conditions for a single `.github/workflows/<name>.yml` change, **When** the gate runs,
   **Then** it passes with the same message.
3. **Given** an otherwise eligible change set without the trusted author signal, **When** the gate runs,
   **Then** it fails closed with the original artifact requirement.
4. **Given** the correction is in place, **When** the six PRs re-run, **Then** the governance step passes and
   the following Playwright/updater steps execute instead of being skipped.

---

### User Story 2 - The exemption cannot be exploited by a feature or mixed-scope PR (Priority: P1)

A contributor cannot use the exemption to land application, test, script, documentation or spec changes
without the required Spec Kit artifacts.

**Why this priority**: The governance gate is the only enforcement point for task artifacts; a broad exemption
would silently remove it for normal development.

**Independent Test**: Run the verifier against fixtures that mix a dependency change with an `app/` file, a
`scripts/` file, a `README.md` edit, a nested workflow path, a partial artifact set, or a hand-authored commit;
every one is rejected.

**Acceptance Scenarios**:

1. **Given** any changed path outside `package.json`, `pnpm-lock.yaml` or a one-level
   `.github/workflows/*.yml|yaml`, **When** the gate runs, **Then** it fails closed and names the offending
   path.
2. **Given** the trusted author signal but no Dependabot commit identity, **When** the gate runs, **Then** it
   fails closed.
3. **Given** a partial artifact set (for example only `spec.md`), **When** the gate runs, **Then** the normal
   single-feature completeness check fails it.
4. **Given** no comparison base, **When** an eligible scope is presented, **Then** the exemption is unavailable
   and the gate fails closed.
5. **Given** an ordinary feature PR with complete artifacts, **When** the gate runs, **Then** it passes exactly
   as before and no exemption message is printed.

### Edge Cases

- **Rebased Dependabot commits.** Dependabot recreates commits through the GitHub API, so the committer stays
  `GitHub <noreply@github.com>`; an owner hand-pushing onto a Dependabot branch produces a qualifying-identity
  mismatch and the exemption declines.
- **Dirtied checkout.** `deploy-updater-scheduler.yml` runs the Spec Kit safe-upgrade script before the gate and
  can leave tracked local modifications; scope is therefore derived from the committed diff against the base,
  not from local worktree state.
- **Nested workflow paths.** `.github/workflows/nested/action.yml` is not a one-level workflow bump and is
  rejected.
- **`SPEC_KIT_PR_AUTHOR` absent or empty** (schedule, push, local run): no exemption, original behaviour.
- **Phantom eligibility.** Title, branch name, labels and commit messages are never read by the exemption.

## Requirements *(mandatory)*

- **FR-001**: The shared verifier MUST accept a change set with no feature artifacts only when all of the
  following hold: the GitHub-reported pull request author is `dependabot[bot]`, a comparison base resolves, the
  committed change set is non-empty, every changed path is in the maintenance allowlist, and every commit in
  the change set is authored by Dependabot and committed by GitHub (`noreply@github.com`).
- **FR-002**: The exemption MUST NOT use the pull request title, branch name, labels or commit message text as
  eligibility evidence.
- **FR-003**: The exemption MUST be evaluated only when no task artifact directory changed; a partial or
  multi-feature artifact set MUST keep failing under the existing rules.
- **FR-004**: The maintenance allowlist MUST be exactly `package.json`, `pnpm-lock.yaml`, and one-level
  `.github/workflows/*.yml` / `.github/workflows/*.yaml`.
- **FR-005**: Change-set scope MUST be computed from the committed diff against the resolved base ref so
  unrelated local modifications cannot widen or narrow it.
- **FR-006**: `visual-qa.yml` and the updater-scheduler `verify` job MUST forward
  `github.event.pull_request.user.login` to the gate as `SPEC_KIT_PR_AUTHOR`.
- **FR-007**: No check may be removed, skipped, softened or replaced by inspection: security scanning, unit
  tests, TypeScript, Visual QA, Playwright visual regression, build verification, build-size ceiling and
  updater/deployment validation all keep running, and a passing governance step MUST be followed by those
  steps rather than skipping them.
- **FR-008**: Committed deterministic regression tests MUST cover legitimate Dependabot maintenance changes,
  ordinary feature changes, and changes that must not qualify.
- **FR-009**: Ineligible runs MUST remain fail-closed and MUST state why the exemption did not apply when the
  author signal was present.
- **FR-010**: The change MUST NOT alter dependency versions, `pnpm-lock.yaml` contents, application behaviour,
  visuals, payments, email, database, secrets or deployment configuration.

### Key Entities

- **`scripts/verify-speckit-task.sh`**: the central fail-closed governance verifier; owns the exemption.
- **`scripts/test-verify-speckit-task.sh`**: the deterministic shell regression suite for the verifier.
- **`SPEC_KIT_PR_AUTHOR`**: the trusted, workflow-supplied pull request author signal.
- **`COMMITTED_PATHS`**: the committed diff against the resolved base ref, used for exemption scope.

## Success Criteria *(mandatory)*

- **SC-001**: Fixtures shaped like #1712 (workflow-only) and #1713–#1717 (manifest + lockfile) pass the gate
  with the exemption message.
- **SC-002**: Fixtures for a human author, missing author signal, mixed application/script/documentation
  scope, nested workflow path, partial artifacts, hand-authored commit and missing base are all rejected.
- **SC-003**: `bash scripts/test-verify-speckit-task.sh` passes, including assertions that both workflows
  forward the pull request author.
- **SC-004**: `./freebuff-verify.sh` exits 0 on the final tree, the measured `.next + public` size stays below
  the 495 MB hard maximum, and no test or gate step is weakened.
- **SC-005**: The final diff contains only the verifier, its regression suite, the two workflow wiring edits,
  this feature's artifacts and the memory-bank context update.
- **SC-006**: PR-head CI confirms the six Dependabot PRs pass governance and that their remaining Playwright
  and updater-scheduler steps execute; this is reported only from observed runs.

## Assumptions

- The GitHub-reported pull request author, forwarded by the workflow, is the trustworthy actor input; the
  workflow file itself executes from the pull request branch, so the exemption is additionally gated by commit
  provenance and by a scope allowlist that cannot admit application code.
- `dependabot[bot]` is the only maintenance bot in scope; other bots are not exempt.
- The six Dependabot PRs re-run automatically when the correction lands on `main` (or on re-run), so their
  remaining checks are verified from GitHub Actions rather than from this workspace.


## Follow-up: Keep trusted CI author context out of synthetic fixtures

A later Dependabot-triggered Visual QA run exposed a test-isolation defect in the governance regression suite. The workflow correctly exports `SPEC_KIT_PR_AUTHOR=dependabot[bot]`, but the fixture runner inherited that value when it was supposed to test a missing author signal. The synthetic case therefore received trusted metadata it had not explicitly requested and incorrectly passed the exemption. The production exemption decision itself remains unchanged.

- **FR-011**: Each synthetic verifier invocation MUST begin with an empty `SPEC_KIT_PR_AUTHOR` value; a fixture may opt in only by explicitly supplying the value as a test argument.
- **FR-012**: The regression suite MUST simulate execution inside a Dependabot-authored workflow so the missing-author case proves that inherited workflow metadata cannot leak into fixtures.
- **SC-007**: `SPEC_KIT_PR_AUTHOR=dependabot[bot] bash scripts/test-verify-speckit-task.sh` MUST pass the full fixture suite, including rejection of the dependency-only fixture that supplies no trusted author argument.
