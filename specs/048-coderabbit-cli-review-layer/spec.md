# Feature Specification: Independent CodeRabbit CLI Review Layer

**Feature Branch**: `chore/coderabbit-cli-review-layer-20261024`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User request to add CodeRabbit CLI as an optional second review layer, preserving existing GitHub App and scanners, with separate CLI-specific review instructions rather than importing the repository's AGENTS.md governance.

## User Scenarios & Testing

### User Story 1 — Run an independent local review (Priority: P1)

As the repository maintainer, I want a repeatable local command that runs CodeRabbit CLI with a dedicated LuckyPickCanada instruction file so I can inspect important changes before opening a pull request without changing the existing GitHub App configuration.

**Why this priority**: This is the requested capability and the primary outcome.

**Independent Test**: In a clone with CodeRabbit CLI installed and authenticated, invoke the wrapper on a worktree containing a known change and confirm the CLI receives the dedicated instruction file and reviews only the selected local changes.

**Acceptance Scenarios**:

1. **Given** the CLI is installed and authenticated, **When** the maintainer invokes the wrapper with review flags, **Then** it runs `cr review` with the explicit CLI-only instructions file and forwards the flags.
2. **Given** the CLI is not installed, **When** the wrapper is invoked, **Then** it exits clearly with a setup hint instead of failing cryptically.
3. **Given** an unrelated file or a high-risk code path is changed, **When** CodeRabbit reviews the diff, **Then** its independent instructions prioritize actionable correctness, security, data-integrity and regression findings.

### Edge Cases

- Invoking the wrapper outside a Git worktree.
- Missing CLI instruction file.
- CodeRabbit CLI is missing or not authenticated.
- The CLI account's included-review limit is exhausted.
- New CLI versions alter supported flags or local-review behavior.
- A review finds no issue; this must not be described as proof of defect-free code.

## Requirements

- **FR-001**: The setup MUST provide a dedicated local CLI instruction file and explicitly pass it to `cr review`.
- **FR-002**: The instruction file MUST define independent review priorities for application/API code, security workflows, tests, dependencies, and Workers.
- **FR-003**: The setup MUST NOT change `AGENTS.md`, add `.coderabbit.yaml` / `.coderabbit.yml` / `.coderabbit.config.ts`, or configure automatic GitHub App behavior.
- **FR-004**: The setup MUST leave current scanners, workflows, dependencies, application behavior, and deployment configuration unchanged.
- **FR-005**: The wrapper MUST fail with clear guidance when it is outside a worktree, missing its instruction file, or cannot find `cr`.
- **FR-006**: Documentation MUST explain local installation, interactive authentication, readiness/quota checks, a pre-commit review, a branch comparison, and structured agent output.
- **FR-007**: Documentation MUST NOT promise a fixed free-review quota; it MUST direct the maintainer to `cr usage` to inspect account-specific included reviews.
- **FR-008**: Any unverified check, CLI installation, authentication step, or live review MUST be reported as pending rather than claimed as passed.

## Success Criteria

- **SC-001**: One documented local command uses the explicit CLI-only instruction file for reviews.
- **SC-002**: No automatic GitHub workflow or existing CodeRabbit GitHub App configuration is altered.
- **SC-003**: The wrapper gives clear setup errors for missing prerequisites.
- **SC-004**: The repository PR review and CI verify the final file set; local installation/authentication and a first live review are recorded separately because they require the maintainer's computer/account.

## Assumptions

- The user will install and authenticate the CLI on the machine where the repository is cloned.
- CodeRabbit CLI availability and included review quota depend on the installed version and account/plan.
- The new layer is opt-in and on-demand, not a required CI check.
