# Feature Specification: Startup Readiness Verification

**Feature Branch**: `128-startup-readiness-verification`
**Created**: 2026-11-10
**Status**: Draft

**Input**: Owner-authorized request to add a startup verification script for repository governance and project-context files, then append it to the existing Freebuff startup command without removing existing setup.

## User Scenarios & Testing

### User Story 1 — Detect missing startup context (Priority: P1)

When a Freebuff workspace starts, the repository verifies that required governance, Memory Bank, and document-index files are present and readable before work begins.

**Independent Test**: Run the script with all required files present, then repeat with a required file missing or empty.

**Acceptance Scenarios**:
1. Given all required files exist and are readable, when the script runs, then it exits successfully.
2. Given a required file is missing, unreadable, or empty, when the script runs, then it exits non-zero and identifies the affected path.
3. Given the document manifest contains invalid JSON or an invalid required structure, when the script runs, then it exits non-zero with a useful error.

### User Story 2 — Preserve agent initialization governance (Priority: P1)

The startup check confirms that AGENTS.md still directs the agent to read all four Memory Bank files and consult the document manifest, while making clear that file availability is not proof that the model has loaded the content.

**Independent Test**: Run the script and inspect its checks and output against the current AGENTS.md initialization section.

**Acceptance Scenarios**:
1. Given AGENTS.md contains the four-file initialization instruction and manifest instruction, when the script runs, then those governance references are validated.
2. Given the script succeeds, when the agent starts task work, then it still reads all four Memory Bank files and the manifest as instructed by AGENTS.md.

## Edge Cases

- A file exists but is empty or unreadable.
- The manifest parses as JSON but has the wrong top-level structure.
- The script is invoked from outside the repository root.
- The pnpm bootstrap or Playwright CLI check fails before this script is reached.
- Startup output is not automatically injected into model context; the script must not claim otherwise.

## Requirements

- **FR-001**: The script MUST locate the repository root relative to its own path.
- **FR-002**: It MUST verify AGENTS.md, all four Memory Bank files, and .docs/manifest.json exist, are readable, and are non-empty.
- **FR-003**: It MUST verify AGENTS.md references each Memory Bank path and .docs/manifest.json.
- **FR-004**: It MUST validate .docs/manifest.json as JSON with an object-valued sources property and array-valued inventory property.
- **FR-005**: It MUST fail non-zero with a specific diagnostic when a check fails.
- **FR-006**: It MUST state that it checks availability, not model-context loading; AGENTS.md remains responsible for directing the agent to read content.
- **FR-007**: The existing pnpm bootstrap, frozen-lockfile install, and Playwright CLI help command MUST remain unchanged and run before the new script.
- **FR-008**: No application code, UI, assets, dependencies, workflows, integrations, deployment settings, database data, or .docs content may change.
- **FR-009**: The owner updates the external Freebuff startup setting only after this script is merged.

## Success Criteria

- **SC-001**: A complete checkout passes the startup verification script.
- **SC-002**: Missing, empty, unreadable, or malformed inputs cause a clear non-zero failure.
- **SC-003**: The current AGENTS.md initialization instructions are validated.
- **SC-004**: The existing startup command is preserved byte-for-byte as its prefix, with only the script invocation appended.
- **SC-005**: The final change is script/Spec Kit-only and does not alter application behavior.

## Assumptions

- Node.js is available because the existing pnpm bootstrap already requires it.
- The manifest currently contains sources and inventory collections.
- Freebuff's startup setting is external to the repository and must be updated by the owner after merge.
