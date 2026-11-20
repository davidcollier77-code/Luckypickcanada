# Feature Specification: Shared Graphics Toolkit Guidance

**Feature Branch**: `197-shared-graphics-toolkit-guidance`

**Created**: 2026-11-20

**Status**: Complete — implementation prepared for dedicated governance PR

**Input**: Add a permanent shared `AGENTS.md` rule directing ChatGPT and Freebuff to use the existing Graphics and audio toolkit, the centralized Resource-Readiness Hub and the Creative Workbench for future visual creation and polishing.

## User Scenarios & Testing

### User Story 1 — Consistent visual-feature integration (Priority: P1)

A developer creating or polishing a visual experience can identify the existing shared graphics systems, the recommended component integration hook, the centralized loading/readiness hub and the development Workbench without inventing parallel infrastructure.

**Why this priority**: Consistent use of the existing foundation prevents disconnected registries, renderers, runtimes and preloaders, and keeps future visual work aligned with the established architecture.

**Independent Test**: Inspect the shared section in `AGENTS.md` and confirm that both agents receive the same unambiguous references and integration direction.

**Acceptance Scenarios**:

1. **Given** ChatGPT or Freebuff starts visual creation or polishing, **When** it reads the shared governance section, **Then** it is directed to the graphics README, rendering architecture, Resource-Readiness Hub and task-relevant Creation/Polishing references.
2. **Given** a new visual experience needs integration, **When** the developer follows the guidance, **Then** it identifies `useCreativeExperience`, the shared registry/runtime and the existing Workbench.
3. **Given** the visual uses a different renderer or an existing cinematic engine, **When** it is integrated, **Then** the guidance does not force Three.js or require replacing the existing engine.
4. **Given** a visual feature already exists, **When** the guidance is applied, **Then** existing artwork, functionality, animation, sound, timing and layout remain protected unless explicitly authorized to change.

## Edge Cases

- A task does not use Three.js: the general toolkit guidance still applies, but Three.js reference documents are conditional.
- A task uses an existing WebGL/cinematic engine: preserve that engine when it remains the correct fit.
- A task needs resource preparation: extend the existing Resource-Readiness Hub rather than introducing another preloader.
- A task uses the Creative Workbench: it remains a development tool and does not replace mandatory browser or repository QA.

## Requirements

### Functional Requirements

- **FR-001**: `AGENTS.md` MUST contain a dedicated graphics-toolkit section within the 🟢 shared requirements area.
- **FR-002**: The section MUST explicitly identify `[BOTH — CHATGPT AND FREEBUFF]` so the rule applies equally to both agents.
- **FR-003**: The section MUST direct both agents to the graphics README, rendering architecture and centralized `app/lib/resource-readiness.js` hub, and prohibit a competing preloader.
- **FR-004**: The section MUST route task-relevant visual work to `.docs/creation/` and `.docs/polishing/` through `.docs/manifest.json`, with both Three.js references in both groups when Three.js is used.
- **FR-005**: The section MUST identify `useCreativeExperience`, the visual-experience registry, automatic graphics runtime and existing Creative Workbench.
- **FR-006**: The guidance MUST allow the appropriate rendering technology and preserve existing cinematic engines where appropriate; it MUST NOT mandate Three.js.
- **FR-007**: The guidance MUST preserve existing artwork, functionality, animation, sound, timing and layout unless explicitly authorized.
- **FR-008**: The existing governance regression suite MUST assert the shared classification and the essential toolkit, readiness, reference-routing and Workbench requirements.

### Key Entities

Not applicable. This is a repository-governance and developer-guidance change; it introduces no application data or runtime entity.

## Success Criteria

- **SC-001**: Both agents are explicitly covered by the green shared classification.
- **SC-002**: All required graphics, readiness, integration and Workbench references are present and point to verified repository paths.
- **SC-003**: The rule clearly prevents a second preloader and avoids mandating Three.js or replacing existing engines.
- **SC-004**: A focused regression assertion protects the section from accidental removal or reclassification.
- **SC-005**: No production application code, dependencies, assets or visitor-facing behaviour are changed.

## Assumptions

- The current Graphics and audio toolkit remains the repository's approved foundation.
- The centralized Resource-Readiness Hub remains the sole shared preparation/readiness layer.
- The Creative Workbench remains development-only and supplements, rather than replaces, required QA.
- The owner has explicitly authorized this governance update in the conversation.
