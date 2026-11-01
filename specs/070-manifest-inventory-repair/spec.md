# Feature Specification: Restore Valid Documentation Manifest

**Feature Branch**: `fix/docs-manifest-inventory-20261101`

**Created**: 2026-11-01

**Status**: In progress

**Input**: Owner-authorized request to repair the malformed `.docs/manifest.json` that prevents trusted-base tools and tests from loading the documentation index.

## User Scenarios & Testing

### User Story 1 — Repository tools can load the manifest (Priority: P1)

As a repository maintainer, I need the documentation manifest to be valid JSON so the Gemini reviewer, tests, and documentation tooling can parse it without failing during initialization.

**Why this priority**: A syntax error prevents tools from starting before they can inspect or review the requested code.

**Independent Test**: Parse the file with Node.js `JSON.parse` and run the repository unit-test workflow that imports the manifest.

**Acceptance Scenarios**:

1. **Given** the current manifest file, **When** a JSON parser reads it, **Then** parsing succeeds.
2. **Given** the trusted `main` checkout, **When** the Gemini reviewer loads the manifest, **Then** it advances beyond manifest initialization.

### User Story 2 — Inventory matches configured task-group references (Priority: P1)

As a repository maintainer, I need the inventory to contain each configured reference exactly once so the documentation index remains complete and internally consistent.

**Why this priority**: A syntactically valid but incomplete or duplicated inventory can cause documentation refresh tracking to drift.

**Independent Test**: Compare the unique inventory entries with the union of all configured group references and assert that both sets are identical.

**Acceptance Scenarios**:

1. **Given** all configured task groups, **When** their source IDs are compared with the inventory, **Then** each distinct ID appears exactly once.
2. **Given** an existing source ID and URL, **When** the manifest is repaired, **Then** the source configuration and URL remain unchanged.

## Edge Cases

- A repeated reference must not be retained merely to make the inventory count match.
- A reference still routed in a task group must not be omitted from the inventory.
- A syntax-only repair must not alter source URLs, group routing, or documentation snapshots.

## Requirements

- **FR-001**: The manifest MUST be valid JSON.
- **FR-002**: The inventory MUST contain the exact union of all configured group references, with one occurrence per ID.
- **FR-003**: Existing group arrays and source URL configurations MUST remain unchanged.
- **FR-004**: The repair MUST NOT modify the documentation refresh script, generated snapshots, application code, dependencies, or workflow definitions.

## Success Criteria

- **SC-001**: Node.js `JSON.parse` succeeds on `.docs/manifest.json`.
- **SC-002**: The inventory contains 51 unique entries, matching all 51 unique IDs routed across the task groups.
- **SC-003**: No duplicates, missing references, or inventory-only entries remain.
- **SC-004**: The repository's manifest-consuming checks can proceed past JSON parsing.

## Assumptions

- The existing task-group and source configuration is intentional and must be preserved.
- The user's authorization is limited to this manifest repair; it does not authorize running the documentation refresh or changing its implementation.
