# Feature Specification: Compact Agent Governance Instructions

**Feature Branch**: `207-compact-agent-governance`

**Created**: 2026-11-21

**Status**: Approved for implementation

**Input**: Owner direction to tighten `AGENTS.md`, retain all distinct requirements, and make the revised document ready for a dedicated governance pull request.

## User Scenarios & Testing

### User Story 1 — Clear, concise agent instructions (Priority: P1)

An agent can identify the requirements that apply to it without reading repeated explanations or procedures that already have an authoritative home.

**Why this priority**: `AGENTS.md` is the mandatory entry point for both agents. Excess length and duplication make important requirements harder to find and maintain.

**Independent Test**: Read the complete document and verify the shared, Freebuff-only and ChatGPT-only boundaries remain unambiguous. Confirm the document is no more than 200 lines.

**Acceptance Scenarios**:
1. **Given** an agent starts repository work, **when** it reads `AGENTS.md`, **then** it can identify its applicable sections and the mandatory full-document reading rule.
2. **Given** a procedure already has an authoritative reference, **when** an agent reaches that topic in `AGENTS.md`, **then** the document points to the reference rather than duplicating the full procedure.

### User Story 2 — No loss of repository safeguards (Priority: P1)

Both agents continue to follow all distinct security, preservation, build-size, Spec Kit, QA, Memory Bank, graphics, tool-use and approval requirements after the wording is condensed.

**Why this priority**: Reducing length must not weaken repository governance or change agent capabilities.

**Independent Test**: Governance regression tests assert the presence of the key requirements and the dedicated protected-file classifier still accepts only approved governance-support paths.

**Acceptance Scenarios**:
1. **Given** a secret is present in a diagnostic or source context, **when** an agent handles it, **then** it must not expose the value and must follow the shared containment response.
2. **Given** a task affects a repository QA checker, **when** it is specified, **then** its actual checker requirements are inspected and used in the acceptance criteria and verification plan.
3. **Given** a task requires Freebuff browser work, **when** Freebuff prepares the session, **then** it follows the existing Playwright skill, wrapper and Crawlbase-only fallback rules.
4. **Given** ChatGPT works in the repository, **when** it checks browser or execution requirements, **then** it follows the ChatGPT-specific restrictions and does not adopt Freebuff-only instructions.

### User Story 3 — Reliable reference-based procedures (Priority: P1)

An agent can follow the appropriate dedicated document for PR preparation and handoff, current task-group routing, browser setup and startup requirements without repeating those procedures in `AGENTS.md`.

**Why this priority**: The governance entry point must stay maintainable while preserving the existing authoritative workflows.

**Independent Test**: Review all links and paths in the shortened document against current repository files and ensure `PR_SUBMISSION.md`, `.docs/manifest.json`, the graphics references and Playwright references remain correctly identified.

**Acceptance Scenarios**:
1. **Given** an agent prepares a pull request, **when** it reaches the PR requirements, **then** it reads and follows `PR_SUBMISSION.md` before implementation and again before PR creation.
2. **Given** the task-group manifest changes, **when** Freebuff selects its task group, **then** the current manifest keys—not a fixed list or count—determine the available groups.

## Edge Cases

- The manifest gains or removes a task group; routing and tests must adapt without hardcoded categories or counts.
- A specialist `.freebuff/` file is not a manifest task group; it remains conditional reference material.
- A future edit risks expanding `AGENTS.md` through repeated explanation; the regression test enforces the compact size target.
- An agent cannot run a required check because of its environment restrictions; the check remains explicitly unverified for an authorized environment.
- A dedicated `AGENTS.md` PR includes only governance support, tests, feature records and Memory Bank records permitted by the existing classifier; unrelated application or dependency changes remain prohibited.

## Requirements

### Functional Requirements

- **FR-001**: `AGENTS.md` MUST require full-document reading and preserve the 🟢 BOTH, 🔵 FREEBUFF ONLY and 🟣 CHATGPT ONLY applicability rules.
- **FR-002**: The revised document MUST be concise (no more than 200 lines) and MUST retain every distinct applicable repository requirement.
- **FR-003**: Repeated or detailed procedures MUST be replaced with direct references to their current authoritative repository documents where appropriate; `PR_SUBMISSION.md` remains the single source for PR preparation and handoff.
- **FR-004**: Shared scope, preservation, protected-area, 495 MiB build, platform, cost and secret-handling requirements MUST remain explicit.
- **FR-005**: Spec Kit stages and dynamic current-tooling requirements MUST remain explicit without pinning a version or command count; Freebuff `.freebuff/cmds/` wrappers MUST remain Freebuff-only.
- **FR-006**: QA checker requirements MUST be understood before specification, and applicable checks MUST NOT be weakened or bypassed.
- **FR-007**: The four core Memory Bank files MUST still be read and health-checked; Memory Bank remains context, not governance.
- **FR-008**: Existing graphics, resource-readiness, audio and workbench guidance MUST remain discoverable, with no competing renderer, registry, runtime or preloader.
- **FR-009**: Freebuff's Playwright instructions, wrapper, troubleshooting and Crawlbase-only supported-retrieval fallback MUST remain intact.
- **FR-010**: ChatGPT's startup, browser, Freebuff-environment and repository-script restrictions MUST remain explicit and must not be weakened by shared permissions.
- **FR-011**: The governance regression test MUST protect key requirements, dynamic manifest routing, current Spec Kit command discovery, and dedicated protected-file behavior.
- **FR-012**: The change MUST NOT modify startup files, Spec Kit tooling, `.docs/manifest.json`, PR checker workflows, protected-file scripts, application code or dependencies.

## Success Criteria

- **SC-001**: The final `AGENTS.md` is at most 200 lines (current baseline: 478 lines).
- **SC-002**: All three applicability classes remain test-protected and distinct.
- **SC-003**: The core security, QA, Spec Kit, Memory Bank, build-size, graphics and agent-specific browser/execution rules remain represented.
- **SC-004**: PR procedures are referred to through `PR_SUBMISSION.md` rather than duplicated.
- **SC-005**: The existing protected-file classifier continues to allow a dedicated governance PR and reject unrelated application changes.
- **SC-006**: GitHub Actions runs the updated regression suite and protected-file workflows; the PR stays open and unmerged for owner review.

## Assumptions

- The latest merged `main` state is the base for this change.
- `PR_SUBMISSION.md`, `.docs/manifest.json`, the current Spec Kit workflow and the existing protection/verification workflows remain authoritative and are not replaced.
- The protected-file workflow, governance digest approval and GitHub Environment authorization remain separate requirements.
- Local test/build execution is unavailable in this ChatGPT environment because Node.js 26.x and pnpm 10.30.3 are not installed; GitHub Actions is the verification environment.