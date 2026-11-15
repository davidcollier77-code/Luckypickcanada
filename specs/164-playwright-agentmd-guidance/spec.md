# Feature Specification: Freebuff Playwright Agent Guidance

**Feature Branch**: `docs/playwright-agentmd-guidance-20261115`

**Created**: 2026-11-15

**Status**: Complete

**Input**: User request to add concise, Freebuff-only Playwright mode and CLI guidance to AGENTS.md, including a ChatGPT exclusion and permission for Freebuff to maintain setup scripts when the environment changes.

## User Scenarios & Testing

### User Story 1 - Select the correct browser-testing path (Priority: P1)

Freebuff can identify the interactive CLI launcher, the standard Playwright mode and the opt-in SwiftShader investigation mode. ChatGPT is explicitly excluded from the repository CLI and its setup scripts.

**Why this priority**: The guidance prevents accidental use of the wrong rendering mode and separates Freebuff's managed CLI environment from ChatGPT's browser workflow.

**Independent Test**: Inspect AGENTS.md and confirm all mode commands, their purposes, the ChatGPT exclusion and script-maintenance authority are explicit.

**Acceptance Scenarios**:

1. **Given** Freebuff is performing normal QA or CI testing, **When** it reads the guidance, **Then** it selects Option A.
2. **Given** Freebuff is investigating software-rendered graphics behaviour, **When** it reads the guidance, **Then** it selects Option B and understands it is not a physical-GPU performance measurement.
3. **Given** Freebuff needs an interactive browser session, **When** it reads the guidance, **Then** it uses the repository CLI launcher and maintains its setup scripts when environment changes require it.
4. **Given** ChatGPT reads the same governance file, **When** it encounters this section, **Then** it does not use, load, modify or maintain the repository Playwright CLI system or its startup scripts.

### Edge Cases

- The standard and SwiftShader commands must remain distinct; normal QA and CI must not silently switch to SwiftShader.
- A change to Freebuff's runtime or dependencies may invalidate startup scripts; Freebuff must verify and maintain only the relevant setup scripts.
- The ChatGPT exclusion applies to the repository CLI system, not to the separate browser-tool exception governing ChatGPT's browser access.

## Requirements

### Functional Requirements

- **FR-001**: AGENTS.md MUST state that the Playwright CLI guidance applies to Freebuff only and explicitly exclude ChatGPT from using, loading, modifying or maintaining the repository CLI and associated startup scripts.
- **FR-002**: AGENTS.md MUST identify the interactive CLI launcher and document Option A (standard) and Option B (SwiftShader), including their commands and purposes.
- **FR-003**: AGENTS.md MUST state that standard QA and CI continue to use Option A and that SwiftShader does not measure physical GPU performance.
- **FR-004**: AGENTS.md MUST direct Freebuff to verify and maintain relevant startup, browser-runtime and CLI setup scripts when environment, dependency or browser-runtime changes affect them.
- **FR-005**: The change MUST remain limited to governance guidance and its focused regression guard; it MUST NOT change browser scripts, test configurations, CI workflows or application behavior.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The new AGENTS.md section identifies all three browser paths: interactive CLI, standard Playwright and SwiftShader.
- **SC-002**: The ChatGPT restriction and Freebuff maintenance responsibility are explicit and unambiguous.
- **SC-003**: The governance regression suite contains assertions for each required instruction.
- **SC-004**: No browser runtime, Playwright configuration, CI workflow or application file is changed.

## Assumptions

- Existing Playwright commands and configuration names are correct and remain unchanged.
- README.md remains the detailed setup reference; AGENTS.md contains only concise operational rules.
- ChatGPT's existing browser-tool exception remains separate from Freebuff's repository CLI system.
