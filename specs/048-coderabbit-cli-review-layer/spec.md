# Feature Specification: Independent CodeRabbit CLI Review Layer

**Feature Branch**: `chore/coderabbit-cli-review-layer-20261024`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User requested an additional automatic CodeRabbit CLI review layer for GitHub pull requests because the maintainer has no computer, while preserving the existing CodeRabbit GitHub App and all current scanners and checks. An optional local wrapper may remain for developers who do have a computer.

## User Scenarios & Testing

### User Story 1 — Automatic PR review without a local computer (Priority: P1)

As the repository maintainer, I want GitHub Actions to run an independent CodeRabbit CLI review on pull requests to `main` and put the result in the PR conversation so the extra review works without requiring me to run terminal commands.

**Acceptance scenarios**

1. Given a pull request targets `main` and the secret is configured, when it is opened, reopened, synchronized, or marked ready for review, then a CodeRabbit CLI review is attempted.
2. Given a CLI review completes, when the workflow publishes results, then it creates or updates one stable review comment and distinguishes findings from a completed clean review.
3. Given CLI output is missing, malformed, incomplete, or the command fails, when the workflow publishes its result, then it identifies the review as incomplete and never implies that no findings means the review succeeded.
4. Given `CODERABBIT_API_KEY` is absent or unavailable, when the workflow starts, then it warns and skips before checking out PR content.
5. Given a PR is changed to alter its own review instructions, when the workflow runs, then the CLI instructions are sourced from the base commit, not the proposed PR revision.
6. Given included CodeRabbit CLI allowance is unavailable, when the CLI review is rate-limited, then the workflow does not opt into paid over-limit credits.

### User Story 2 — Keep a deliberate local review option (Priority: P2)

As a developer with a local clone, I want an optional wrapper that explicitly supplies LuckyPickCanada-specific review guidance and accepts standard CLI review flags.

**Acceptance scenarios**

1. Given the CLI is installed, when the wrapper is invoked inside a Git worktree, then it runs `cr review` with the dedicated instructions file and forwards the requested flags.
2. Given the CLI is missing or the command is invoked outside a Git worktree, then the wrapper returns a clear setup error.
3. Given code changes are reviewed, then findings focus on actionable correctness, security, integrity, regression, and performance risks rather than broad style changes.

## Edge Cases

- The API key is missing, invalid, unavailable to a fork PR, or lacks CodeRabbit CLI seat access.
- The included review allowance is exhausted or the service rate-limits the review.
- A CLI run emits findings but later reports failure, incomplete coverage, malformed output, or unreviewed files.
- A PR gets new commits while a previous review is running; the older run should be cancelled where GitHub Actions concurrency allows.
- A PR changes its own reviewer instruction file; the base revision must remain authoritative for that run.
- A PR has no diff changes for the CLI comparison.
- Repeated PR updates should edit the existing bot comment rather than create an accumulating thread of duplicate comments.
- CLI flags or output fields change in future versions.

## Requirements

- **FR-001**: Provide a dedicated `.coderabbit-cli-instructions.md` instruction file and explicitly pass it to the CLI.
- **FR-002**: Instructions define review priorities for application/API code, security workflows, tests, dependencies, and Cloudflare Workers.
- **FR-003**: Do not modify `AGENTS.md`, existing CodeRabbit GitHub App settings, or the existing CodeRabbit/DevSkim/CodeQL/PR Agent workflows. Do not add conventional `.coderabbit.yaml`, `.coderabbit.yml`, or `.coderabbit.config.ts` configuration files.
- **FR-004**: Add one separate GitHub Actions workflow for CLI review on PR events targeting `main`; do not alter application code, dependencies, deployments, or other security scanners.
- **FR-005**: The workflow MUST check the key before checkout, skip clearly when unavailable, use instructions copied from the PR base commit, and never expose secret values.
- **FR-006**: The workflow MUST create or update one recognizable PR comment and identify incomplete reviews honestly. It MUST NOT edit source, push commits, approve, or merge PRs.
- **FR-007**: The workflow MUST NOT pass `--use-credits`; it must not opt in to paid over-limit review credits.
- **FR-008**: Documentation MUST explain Agentic API key prerequisites, safe GitHub secret setup from a browser, local optional usage, and account-specific quota limits without promising fixed free usage.
- **FR-009**: The local wrapper MUST fail with clear guidance when outside a worktree, missing its instruction file, or unable to find the CLI.
- **FR-010**: Any unrun test, unavailable secret, unauthenticated CLI, or unverified live review MUST be reported as pending rather than passed.
- **FR-011**: A regression test MUST guard key workflow events, preflight order, least-privilege permissions, pinned tooling, stable-comment behavior, and non-use of paid credits.

## Success Criteria

- **SC-001**: A PR event can trigger the added CodeRabbit CLI workflow without requiring the maintainer to use a computer or terminal.
- **SC-002**: Existing GitHub App reviews and scanners remain intact; the new workflow stays independent and advisory.
- **SC-003**: Missing or unavailable secrets cause a clear safe skip before checkout, not a misleading clean review.
- **SC-004**: Completed CLI findings are posted through one updated PR comment, with failure/incomplete results clearly labeled.
- **SC-005**: Paid over-limit review credits are not explicitly enabled by the workflow.
- **SC-006**: The local wrapper and optional documentation remain usable for other developers.
- **SC-007**: Full repository checks and a real review run are reported only after actual evidence is available.

## Assumptions and Limitations

- The official CodeRabbit headless CLI flow requires an Agentic API key from an organization where the user has an assigned seat. The existing GitHub App installation alone is not that credential.
- Availability and review allowance depend on the user's CodeRabbit account/plan. No fixed free quota is assumed.
- The secret must be added by a repository administrator; the repository connection cannot create or retrieve its value.
- The workflow runs only after its workflow file is merged into `main`. Pull-request events from forks cannot access repository secrets and will be skipped.
- The workflow is an advisory reviewer; it does not replace CI, required tests, security scans, or human review.
