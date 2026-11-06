# Feature Specification: Custom Gemini PR Reviewer Retirement

**Feature Branch**: `chore/retire-custom-gemini-reviewer-20261106`

**Created**: 2026-11-06

**Status**: Ready

**Input**: Owner-authorized request to completely remove the separate custom Gemini API-driven pull-request reviewer, without changing Pullfrog, other reviewers, the website Oracle, shared secrets, or historical records.

## User Scenarios & Testing

### User Story 1 — Remove the custom reviewer (Priority: P1)

The repository no longer contains or activates the custom Gemini PR-review workflow, its Node.js review and autofix scripts, its root instruction file, or its reviewer-only test suites.

**Why this priority**: The owner explicitly wants this entire redundant reviewer system gone.

**Independent Test**: Run the retirement regression test and inspect the final branch diff. The reviewer entrypoints and exclusive tests must be absent, and no workflow may invoke the removed reviewer script.

**Acceptance Scenarios**:

1. **Given** a pull request is opened or updated, **When** repository workflows are evaluated, **Then** the retired Gemini reviewer workflow cannot run.
2. **Given** a contributor searches for the retired review commands or scripts, **When** they inspect active repository files, **Then** no active custom reviewer entrypoint or instruction file remains.

### User Story 2 — Preserve all unrelated review and Gemini services (Priority: P1)

Pullfrog, every other reviewer, the site's Crystal Ball / Oracle Gemini integration, and shared credentials remain unchanged.

**Why this priority**: Removing one review system must not interrupt other review or application services.

**Independent Test**: Compare protected files against the base commit and run regression assertions confirming Pullfrog and the Oracle remain present with their existing Gemini API key wiring.

**Acceptance Scenarios**:

1. **Given** Pullfrog uses the shared `GEMINI_API_KEY` Actions secret, **When** the custom reviewer is removed, **Then** Pullfrog's workflow and secret reference remain unchanged.
2. **Given** the website Oracle reads its own Gemini runtime environment, **When** the reviewer is removed, **Then** its application source and Cloudflare runtime configuration remain untouched.
3. **Given** other reviewer systems exist, **When** this task is completed, **Then** their files, workflows, and settings have no changes in the retirement diff.

### User Story 3 — Retain historical records (Priority: P2)

Historical Gemini reviewer specifications, past retirement records, and Gemini CLI/API reference snapshots remain available for context.

**Independent Test**: Verify the existing historical Spec Kit records and routed CLI documentation remain present and unchanged.

**Acceptance Scenarios**:

1. **Given** earlier Gemini reviewer implementation records exist, **When** the active reviewer is retired, **Then** those historical records are retained.
2. **Given** Gemini CLI documentation is part of the shared reference library, **When** the reviewer is retired, **Then** those snapshots and `.docs/manifest.json` remain unchanged.

## Edge Cases

- The same Actions secret name is referenced by Pullfrog; it must not be deleted or changed.
- The site Oracle uses a separate runtime environment variable of the same name; it must not be altered.
- Historical records may contain old workflow/script names; those references are historical evidence, not active integrations, and must remain.
- Any additional active dependency discovered outside the confirmed reviewer-owned files must be assessed before removal; unrelated files must not be changed to eliminate historical mentions.

## Requirements

### Functional Requirements

- **FR-001**: Remove `.github/workflows/gemini-reviewer.yml`.
- **FR-002**: Remove `.github/scripts/gemini-reviewer.cjs` and `.github/scripts/gemini-autofix.cjs`.
- **FR-003**: Remove root-level `GEMINI_REVIEWER.md`.
- **FR-004**: Remove the four test suites dedicated exclusively to the retired reviewer.
- **FR-005**: Add a focused retirement regression test proving the active entrypoints are absent and Pullfrog / Oracle / historical references remain.
- **FR-006**: Leave Pullfrog, other reviewers, application code, dependencies, secrets, environment configuration, and deployment settings unchanged.
- **FR-007**: Retain historical Spec Kit records, Gemini CLI/API reference snapshots, `.docs/manifest.json`, and existing prior retirement records.
- **FR-008**: Update the current feature pointer and Memory Bank with the retirement status without rewriting historical records.

### Key Entities

- **Custom Gemini PR Reviewer**: The independent GitHub Actions workflow and its exclusive Node.js review, suggestion, instruction, and test files.
- **Protected integrations**: Pullfrog and the site's Crystal Ball / Oracle Gemini runtime.
- **Historical records**: Existing specifications, plans, tasks, progress notes, and routed reference snapshots.

## Success Criteria

- **SC-001**: No active custom Gemini reviewer workflow, script, instruction file, or exclusive reviewer test remains.
- **SC-002**: The retirement regression test passes and no remaining workflow invokes the removed reviewer script.
- **SC-003**: Pullfrog's workflow and `GEMINI_API_KEY` reference remain byte-for-byte unchanged.
- **SC-004**: `functions/api/oracle.js` and its `GEMINI_API_KEY` reference remain byte-for-byte unchanged.
- **SC-005**: No other reviewer, application, dependency, secret, environment, deployment, or `.docs/` file is modified.
- **SC-006**: Historical Gemini reviewer / PR-Agent records and Gemini CLI references remain present.
- **SC-007**: The final pull request remains open and unmerged.
