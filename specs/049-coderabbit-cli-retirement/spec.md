# Feature Specification: Retire CodeRabbit CLI Integration

**Feature Branch**: `fix/coderabbit-cli-workflow-reliability-20261024`  
**Created**: 2026-10-24  
**Status**: Draft  
**Input**: Remove the nonfunctional CodeRabbit CLI review layer after authentication failed, while preserving the existing CodeRabbit GitHub App and unrelated review/security systems.

## User Scenarios & Testing

### User Story 1 — Remove the unusable CLI layer (Priority: P1)

The repository owner wants the CLI integration removed so failed CLI authentication no longer adds a failing or unnecessary review workflow.

**Independent Test**: Inspect the PR diff and repository tree to confirm the active CLI workflow, CLI-only test, wrapper, instructions, setup guide, and README reference are removed.

**Acceptance Scenarios**:
1. **Given** the cleanup branch is applied, **When** GitHub Actions evaluates pull requests, **Then** the repository no longer defines the CodeRabbit CLI workflow.
2. **Given** a contributor reads the README, **When** they review development instructions, **Then** it no longer advertises the removed CLI integration.

### User Story 2 — Preserve existing review and security systems (Priority: P1)

The repository owner wants the cleanup limited to the CLI, without disrupting the existing CodeRabbit GitHub App or other automated checks.

**Independent Test**: Inspect the final diff for unchanged App settings/configuration, unrelated workflows, application files, dependencies, and secrets.

**Acceptance Scenarios**:
1. **Given** the CLI layer is removed, **When** other reviewer/security workflows are inspected, **Then** their files remain unchanged.
2. **Given** the CLI key is stored as a repository secret, **When** this PR is prepared, **Then** the repository edit does not attempt to read or modify its value; the owner removes it separately in GitHub settings.

## Edge Cases

- The repository secret may be deleted before the cleanup PR is merged; the active workflow's credential preflight should treat the missing key as a safe skip.
- Historical Spec Kit records may mention the prior CLI experiment; preserve them as history rather than rewriting past records.

## Requirements

- **FR-001**: Remove `.github/workflows/coderabbit-cli-review.yml`.
- **FR-002**: Remove `__tests__/coderabbit-cli-workflow.test.js`, `scripts/coderabbit-cli-review.sh`, and `.coderabbit-cli-instructions.md`.
- **FR-003**: Remove the CLI-specific setup guide at `docs/coderabbit-cli.md` and its README section.
- **FR-004**: Preserve the existing CodeRabbit GitHub App and every unrelated workflow, scanner, application file, dependency, deployment setting, and governance file.
- **FR-005**: Do not modify or expose repository-secret values; document the owner-managed removal of `CODERABBIT_API_KEY`.
- **FR-006**: Retain historical records in `specs/048-coderabbit-cli-review-layer/`; use this feature folder to record the retirement.
- **FR-007**: Report local verification commands as not run when the repository shell is unavailable; never claim unrun checks passed.

## Success Criteria

- **SC-001**: No active workflow, test, wrapper, instruction file, guide, or README section remains for CodeRabbit CLI.
- **SC-002**: The diff does not modify CodeRabbit GitHub App settings or unrelated checks.
- **SC-003**: No dependency, application runtime, deployment, or secret changes are made.
- **SC-004**: The final PR summary lists the exact changed files and accurately reports pending verification.
