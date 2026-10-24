# Feature Specification: Reliable CodeRabbit CLI Review Reporting

**Feature Branch**: `fix/coderabbit-cli-workflow-reliability-20261024`
**Created**: 2026-10-24
**Status**: Draft
**Input**: Repair the CodeRabbit CLI GitHub Actions workflow that fails while updating its pull-request review comment on PRs #1592 and #1593, and make CLI failures diagnosable.

## User Scenarios & Testing

### User Story 1 — Publish or update the review comment (Priority: P1)

When a pull request runs the CodeRabbit CLI workflow, the author should receive one up-to-date review comment and the workflow should not fail because its comment lookup command uses incompatible options.

**Independent Test**: Run the focused workflow regression test and verify the paginated lookup no longer combines `--slurp` with `--jq`.

**Acceptance Scenarios**
1. **Given** the PR already has a CodeRabbit CLI comment, **When** the publishing step searches comments over paginated API responses, **Then** it finds the latest matching comment ID and updates it.
2. **Given** no matching comment exists, **When** publishing runs, **Then** it posts one comment without failing during lookup.

### User Story 2 — Diagnose incomplete CLI reviews (Priority: P2)

When the CLI exits unsuccessfully, the maintainer should be able to see a concise, sanitized stderr excerpt instead of only an exit code.

**Independent Test**: Inspect the regression assertions and the resulting Actions log for bounded diagnostics without credential disclosure.

**Acceptance Scenarios**
1. **Given** CodeRabbit CLI writes an error to stderr, **When** it returns a nonzero exit code, **Then** Actions logs include a bounded excerpt with credential-like values redacted.
2. **Given** stderr is empty, **When** the CLI fails, **Then** the log explicitly states that no diagnostic text was produced.
3. **Given** stderr contains text resembling a GitHub Actions workflow command, **When** the excerpt is printed, **Then** it cannot execute as a workflow command.

## Edge Cases

- The matching review comment is absent, present on a later API page, or duplicated historically.
- The CLI writes no stderr, writes long stderr output, or includes ANSI escape sequences.
- The CLI diagnostic includes the configured API key or a bearer/API-key-like token.

## Requirements

- **FR-001**: The workflow MUST paginate through comments without combining `gh api --slurp` with `--jq`.
- **FR-002**: Comment lookup MUST select the last matching CodeRabbit CLI comment ID, then update it; when none exists, the workflow MUST create a comment.
- **FR-003**: A nonzero CLI exit MUST expose useful stderr diagnostics in the Actions log.
- **FR-004**: Diagnostic output MUST redact the configured key and common bearer/API-key patterns, remove ANSI escapes, bound the number and size of lines, and neutralize lines that resemble workflow commands.
- **FR-005**: The focused regression test MUST fail if the incompatible option combination returns or diagnostic safeguards disappear.
- **FR-006**: The workflow MUST continue to mark incomplete reviews as incomplete and MUST NOT claim a clean review after a CLI failure.
- **FR-007**: When credentials and trusted instructions are available, the workflow check MUST fail after publishing diagnostics if the CLI exits unsuccessfully or the report fails its completion checks.

## Success Criteria

- **SC-001**: The comment publishing command contains no `--paginate --slurp` combination and preserves paginated selection of a matching bot comment.
- **SC-002**: The focused Vitest regression test asserts the corrected lookup and diagnostic safeguards.
- **SC-003**: When the CLI exits nonzero, the Actions log shows a bounded diagnostic excerpt or an explicit empty-stderr message without printing the configured key.
- **SC-004**: The workflow reports a successful review only when the existing completion checks succeed.
- **SC-005**: A failed/incomplete CLI review leaves the Actions check failed after its diagnostic comment is published; missing-key/bootstrap skips remain safe skips.

## Assumptions

- The existing GitHub Actions token permissions are sufficient to read issue comments and create/update the bot's comment.
- No new runtime dependency, site code change, paid-credit opt-in, or change to the CodeRabbit GitHub App settings is needed.
- Local shell execution is unavailable through this connected repository interface; CI evidence must be collected from GitHub after the PR is opened.
