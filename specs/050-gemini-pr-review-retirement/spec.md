# Feature Specification: Retire Gemini PR-Agent Review Workflow

**Feature Branch**: `chore/retire-gemini-pr-agent-20261025`
**Created**: 2026-10-25
**Status**: Draft
**Input**: Retire the redundant Gemini-based automated PR review layer while retaining PR Insights, Amazon Q, and security scanning.

## User Scenarios & Testing

### User Story 1 — Remove the redundant Gemini reviewer (Priority: P1)

The repository owner wants to simplify automated reviews to PR Insights Tagger and Amazon Q while continuing to look for a stronger reviewer.

**Independent Test**: Inspect the branch tree and diff to confirm the active Gemini PR-Agent workflow and its workflow-specific unit test are removed.

**Acceptance Scenarios**
1. Given the change is merged, when GitHub evaluates a PR, then the repository no longer schedules the dedicated Gemini PR-Agent workflow.
2. Given the test suite runs, when the retired workflow-specific test is no longer present, then no remaining test imports that deleted workflow file.

### User Story 2 — Preserve unrelated application and review behavior (Priority: P1)

The owner wants to remove only the Gemini PR review automation, not Gemini functionality used by the website or other checkers.

**Independent Test**: Inspect the full diff and repository references for unrelated changes.

**Acceptance Scenarios**
1. PR Insights Tagger, Amazon Q, DevSkim, and other unrelated workflows remain unchanged.
2. The site's Oracle/Crystal Ball Gemini API functionality and its Cloudflare runtime secret remain untouched.
3. No package scripts, dependencies, lockfiles, repository permissions, deployment settings, or application files are changed.
4. Historical Spec Kit records for the previously configured reviewer remain available as history.

## Edge Cases

- The existing base-branch workflow may still run on this PR until the retirement is merged.
- The GitHub Actions secret named `GEMINI_API_KEY` may be unused by this workflow after merge, but this repository change must not read or alter secret values. Any post-merge cleanup must distinguish the GitHub Actions secret from the separate Cloudflare runtime secret used by the Oracle.
- The Gemini CLI items in `.docs/` are routed reference snapshots required by repository governance, not active code-review workflows; they must not be deleted.

## Requirements

- **FR-001**: Remove `.github/workflows/pr-agent.yml`.
- **FR-002**: Remove `__tests__/pr-agent-workflow.test.js`, which exists solely to assert the retired workflow's configuration.
- **FR-003**: Update `memory-bank/activeContext.md` to record this retirement decision and the exact scope.
- **FR-004**: Add concise task-specific Spec Kit records and a canonical evidence summary under `specs/050-gemini-pr-review-retirement/`.
- **FR-005**: Preserve PR Insights Tagger, Amazon Q, DevSkim, other workflow files, application runtime, Oracle route, Cloudflare configuration, dependencies, lockfile, and all repository secrets.
- **FR-006**: Preserve historical Spec Kit records for prior Gemini PR-Agent implementation; do not rewrite history.
- **FR-007**: Do not claim local tests or `./jules-verify.sh` ran if the connected GitHub API interface cannot execute shell commands. Inspect available CI results on the PR head.
- **FR-008**: Leave the PR open and unmerged for the repository owner.

## Success Criteria

- **SC-001**: The active Gemini PR-Agent workflow and its dedicated test are absent from the proposed branch.
- **SC-002**: The final diff contains no unrelated workflow, application, dependency, deployment, or secret changes.
- **SC-003**: PR Insights, Amazon Q, and DevSkim remain configured.
- **SC-004**: The PR body accurately records exact changes and all checks as passed, failed, pending, or not run.