# Feature Specification: Agent Integration and QA Guidance

**Feature Branch**: [docs/agent-integration-qa-guidance-20261109]

**Created**: 2026-11-09

**Status**: Ready for review

**Input**: Owner-authorized update to the authoritative repository agent instructions with the seven current integrations, Playwright/Browserless guidance, accurate PR gatekeeper descriptions and strict 495 MiB build-size limit.

## User Scenarios & Testing

### User Story 1 - Agent selects the correct connected tool (Priority: P1)

A coding agent reads the repository instructions and identifies which connected tools are available, what each is intended to do, and which services are not production storage.

**Why this priority**: Prevents agents from invoking retired or unavailable services and prevents accidental use of tooling platforms as production storage.

**Independent Test**: Review the integration section and verify it lists the seven owner-confirmed integrations and distinguishes the local Playwright CLI from connected integrations.

**Acceptance Scenarios**:
1. Given an agent reads the connected integrations section, when it selects a tool, then the seven current integrations are listed without obsolete Neon or Browserbase entries.
2. Given an agent reads the Supabase or Turso entries, when it plans a production storage change, then the instructions explicitly prohibit treating either as production storage.
3. Given an agent needs browser automation, when it reads the Playwright guidance, then it understands Playwright CLI is local and Browserless is a separate connected remote-browser service.

### User Story 2 - Agent applies the correct QA gates (Priority: P1)

An agent distinguishes workflow-triggered checks, conditional checks and human authorization requirements without inventing branch-protection rules.

**Why this priority**: Prevents false claims that a conditional check is always required or that an unverified setting is configured.

**Independent Test**: Compare the QA contract descriptions with checked-in GitHub workflow triggers and conditions.

**Acceptance Scenarios**:
1. Given a pull request changes documentation only, when the visual classifier identifies it as documentation-only, then browser visual-regression steps may be skipped while other Visual QA workflow checks still run.
2. Given a pull request changes a protected path, when the protected-file workflow detects it, then human authorization is required before merge.
3. Given a PR check has not run for the current HEAD, when Verification Integrity evaluates it, then it is not reported as passed.

### User Story 3 - Agent protects the production build-size limit (Priority: P1)

An agent plans and scopes work so the production build remains below the hard size limit.

**Why this priority**: Protects the existing Cloudflare Pages build constraint and avoids a release-blocking build.

**Independent Test**: Review the build-size instructions and confirm the exact 495 MiB threshold and split-PR direction.

**Acceptance Scenarios**:
1. Given a proposed change is expected to bring the build to 495 MiB or more, when the agent plans the work, then it splits the work into independently reviewable PRs rather than exceeding or raising the cap.
2. Given a measured build reaches or exceeds 495 MiB, when the agent verifies the build, then it stops and reports the measured size.

### Edge Cases
- A workflow may trigger on every PR while its browser-only steps remain conditional.
- A workflow trigger does not prove that its check is a branch-protection-required status.
- The GitHub integration may lack permission to read branch-protection configuration.
- Supabase and Turso may be useful connected tools without being approved for production application storage.
- A Playwright CLI launch failure must be distinguished from a product defect; Browserless may provide a remote browser.

## Requirements

### Functional Requirements
- FR-001: The authoritative integration list MUST contain Browserless, Crawlbase, Firecrawl, GitHub, Penpot, Supabase and Turso.
- FR-002: The instructions MUST identify Playwright CLI as a project-local CLI tool, not a connected integration.
- FR-003: Playwright MUST remain the primary CLI and Playwright Test path; Browserless MUST be available for direct browser tasks and as a remote-browser fallback.
- FR-004: The instructions MUST remove obsolete Browserbase and Neon tool guidance without changing the production application's database configuration.
- FR-005: Supabase and Turso MUST be explicitly excluded as production application storage/database providers.
- FR-006: The QA contract MUST describe DevSkim, OpenNext validation, Visual QA, Verification Integrity, Protected File Authorization and path-conditional updater-scheduler validation according to their checked-in workflow conditions.
- FR-007: The QA contract MUST distinguish repository workflow checks, GitHub Code Scanning analysis, external AI review apps and branch-protection-required statuses, and state when branch-protection settings cannot be verified.
- FR-008: The Playwright instructions MUST summarize the eight existing capability areas without duplicating the full skill reference.
- FR-009: The build-size rule MUST state that production build output remains strictly below 495 MiB and work likely to exceed the cap is split into independently reviewable PRs.
- FR-010: Existing governance, Spec Kit, Memory Bank, documentation-library, updater and deployment instructions MUST remain intact.

## Success Criteria
- SC-001: The authoritative integration list contains exactly seven owner-confirmed connected integrations.
- SC-002: No Neon or Browserbase tool/integration instructions remain in AGENTS.md.
- SC-003: All five named PR workflow gates are described without claiming unverified branch-protection requirements.
- SC-004: The build-size instruction states the exact 495 MiB cap and split-PR behavior.
- SC-005: Existing unrelated governance and scheduled workflows are unchanged.

## Assumptions
- The owner's latest integration inventory is authoritative for which services Freebuff can use.
- Supabase and Turso are connected tooling only; neither is approved for Lucky Pick Canada's production storage.
- The site's existing production database and application configuration are outside this task and remain unchanged.
- The connected GitHub API session permits repository reads and writes but does not provide a repository shell or branch-protection administration access.
