# Feature Specification: Add the Three.js short LLM documentation source

**Feature Branch**: `194-threejs-llms-source`
**Created**: 2026-11-19
**Status**: Ready for implementation
**Input**: Add the separate Three.js `llms.txt` source alongside the existing `llms-full.txt`; route it to Creation and Polishing; update the manifest, Memory Bank and applicable task documentation.

## User Scenarios & Testing

### User Story 1 - Keep both Three.js documentation variants available (Priority: P1)
A repository contributor can access the concise Three.js LLM guidance without losing the existing full reference.
**Why this priority**: The short source is a distinct upstream document and must coexist with the full reference.
**Independent Test**: Inspect both source records and both canonical snapshots.
**Acceptance Scenarios**:
1. Given the existing full source, when the short source is added, then the full source URL, snapshot and routes remain unchanged.
2. Given the new source, when the manifest is loaded, then it has a unique ID and exact `https://threejs.org/docs/llms.txt` URL.

### User Story 2 - Make the short reference available in both task groups (Priority: P1)
Contributors using Creation or Polishing can retrieve the concise guidance through the normal documentation library.
**Independent Test**: Resolve both group paths and verify Polishing points to the Creation canonical snapshot.
**Acceptance Scenarios**:
1. Creation contains the canonical snapshot.
2. Polishing contains the expected relative symlink to that canonical snapshot.

## Edge Cases
- Existing full documentation must not be overwritten or renamed.
- The updater's inventory must equal the union of routed source IDs, with no duplicate IDs.
- No source may be routed without a URL source configuration.
- Documentation-only changes must not trigger application visual or performance verification requirements.

## Requirements

- **FR-001**: Register `/websites/threejs_llms_txt` with type `url` and the exact short-documentation URL.
- **FR-002**: Route the new ID to Creation and Polishing only.
- **FR-003**: Store the canonical snapshot at `.docs/creation/_websites_threejs_llms_txt.md`.
- **FR-004**: Store Polishing as a symlink to the Creation snapshot using the repository's existing pattern.
- **FR-005**: Preserve the existing `/websites/threejs` full-documentation source and snapshot unchanged.
- **FR-006**: Update relevant Memory Bank progress/context without adding governance rules to Memory Bank.
- **FR-007**: Complete the Spec Kit artifacts and document capability-limited verification accurately.

## Success Criteria
- **SC-001**: Manifest has 66 unique inventory IDs and its inventory matches all routed IDs.
- **SC-002**: Both Three.js sources remain separately addressable.
- **SC-003**: Creation and Polishing resolve to the same short-documentation content.
- **SC-004**: Existing full snapshot blob remains unchanged.
- **SC-005**: No application code, dependencies, runtime configuration or updater workflows change.
