# Feature Specification: Freebuff Agent Reference Library Expansion

**Feature Branch**: `docs/agent-reference-expansion-20261106`
**Created**: 2026-11-06
**Status**: Implementation committed to branch; automated verification pending

## Input

Expand Freebuff's existing documentation library with agent-oriented references for marketing copy work, React/Next.js implementation quality, security finding triage, SARIF processing, and security patch validation. Route every reference through the existing documentation updater and appropriate existing groups.

## User Scenarios & Testing

### User Story 1 — Marketing copy guidance is available to the right groups (Priority: P1)

As a Freebuff agent working on new or existing Lucky Pick Canada wording, I can consult dedicated copywriting or copy-editing guidance without confusing marketing copy with technical SEO.

**Independent Test**: Verify Copywriting and its support references route to Creation, Copy-Editing and its supporting references route to Polishing, and the unrelated Strapi snapshot is removed from the SEO route.

### User Story 2 — React and Next.js guidance is available for implementation and polish (Priority: P1)

As a Freebuff agent working on React/Next.js components, data fetching, bundles, or performance, I can consult Vercel's agent-oriented best-practices guide.

**Independent Test**: Verify the full Vercel agent guide is registered in the manifest and routed to Creation and Polishing.

### User Story 3 — Security reviews have stronger evidence and scan-triage guidance (Priority: P1)

As a Freebuff agent investigating security findings, processing SARIF output, or validating a security patch, I can consult the relevant Trail of Bits workflow and supporting references in Security, Deep Dive, and Testing.

**Independent Test**: Verify all required skill source IDs and Markdown supporting references are included in the manifest inventory and routed to their intended existing groups.

## Functional Requirements

- **FR-001**: The existing Corey Haines source ID MUST point to its Copywriting skill rather than the unrelated Strapi integration page.
- **FR-002**: Copywriting and supporting references MUST be routed to Creation; Copy-Editing and supporting references MUST be routed to Polishing.
- **FR-003**: Vercel's agent-oriented React/Next.js best-practices guide MUST be routed to Creation and Polishing.
- **FR-004**: Trail of Bits False Positive Check and its supporting Markdown references MUST be routed to Security and Deep Dive.
- **FR-005**: Trail of Bits SARIF Parsing and its jq query reference MUST be routed to Security and Deep Dive.
- **FR-006**: Trail of Bits Post-Patch Validation and its evidence model MUST be routed to Security and Testing.
- **FR-007**: Every configured source MUST have an approved raw upstream URL, a manifest inventory entry, and an upstream repository commit SHA pin.
- **FR-008**: The SEO group MUST NOT route the Strapi integration snapshot as a marketing-copy resource.
- **FR-009**: Existing task groups and updater workflow MUST be reused; no new task group, application dependency, or website change may be introduced.
- **FR-010**: Group guidance MUST state that upstream agent materials are subordinate to `AGENTS.md` and that tool-specific examples must be adapted to repository capabilities.

## Scope Boundaries

No website copy, UI, artwork, functionality, SEO metadata, application source, dependency, API, payment, database, deployment, secret, updater script, or workflow behavior is changed. The existing updater materializes snapshots after the manifest change reaches `main`.

## Success Criteria

- **SC-001**: All 20 new or repurposed source IDs resolve to their intended upstream skill or supporting-reference URLs.
- **SC-002**: Every source appears in the inventory and in each intended group exactly once.
- **SC-003**: All relevant existing Freebuff group files provide conditional, task-specific routing guidance without new groups.
- **SC-004**: The incorrect SEO/Strapi mapping is removed and the attribution file records the source licensing.
- **SC-005**: The existing documentation updater can discover and fetch each configured source using its current manifest-driven behavior.
