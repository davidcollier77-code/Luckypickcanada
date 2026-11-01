# Feature Specification: Conditional Gemini API Developer Skill Routing

**Feature Branch**: `freebuff/gemini-api-skill-conditional-routing-20261101`
**Created**: 2026-11-01
**Status**: In progress
**Input**: Remove the blanket requirement to consult the Gemini API Developer Skill for every coding task and PR review. Keep it available only in relevant task groups and use it only when changed work directly involves Gemini API integration.

## User Scenarios & Testing

### User Story 1 — Ordinary coding tasks avoid unrelated API instructions (Priority: P1)

As a repository owner, I want ordinary coding tasks to follow their normal task-group instructions without loading the Gemini API Developer Skill, so unrelated work is not burdened by an API-specific document.

**Independent Test**: Inspect all eight task-group instructions and manifest routing. The skill appears only in Creation, Troubleshooting, and Deep-dive as a conditional resource. The other five groups do not require or route it.

### User Story 2 — Gemini API integration work retains specialist guidance (Priority: P1)

As a repository owner, I want genuine Gemini API/SDK integration work to retain the specialist document, so relevant implementation and troubleshooting still receive technical guidance.

**Independent Test**: Changed code containing direct Gemini API/SDK integration indicators selects the skill; unrelated text or reviewer-only changes do not.

### User Story 3 — Automatic Gemini reviews do not require the skill for every PR (Priority: P1)

As a repository owner, I want the Gemini reviewer to load the API Developer Skill only for PRs that change code directly involving Gemini API integration, so ordinary PR review is not blocked by an unrelated specialist document.

**Independent Test**: Unit tests cover ordinary code, documentation-only mentions, test fixtures, direct SDK integration, and package dependency changes. Relevant API reviews fail closed with an explicit coverage gap if the skill is unavailable.

## Requirements

- **FR-001**: `AGENTS.md` and `.freebuff/freebuff.md` MUST describe the skill as conditional, not globally mandatory.
- **FR-002**: The skill MUST be routed only to Creation, Troubleshooting, and Deep-dive.
- **FR-003**: Those three group instructions MUST describe when the skill is relevant; unrelated groups MUST NOT require it.
- **FR-004**: The canonical skill snapshot MUST remain in Creation, with existing conditional links retained only in Troubleshooting and Deep-dive.
- **FR-005**: Gemini reviewer relevance MUST be determined from changed-code evidence, not PR title/body mentions alone.
- **FR-006**: Ordinary PRs MUST continue reviewing without loading or requiring the skill.
- **FR-007**: Relevant Gemini API/SDK PRs MUST receive the skill; if it is unavailable, the review/fix must not claim full API-specific coverage.
- **FR-008**: No new general-purpose developer-skill document, dependency, API migration, or application feature is in scope.

## Success Criteria

- **SC-001**: Manifest routes the skill to exactly three task groups.
- **SC-002**: No active governance or task-group instruction requires the skill for every coding task.
- **SC-003**: Reviewer unit tests prove conditional selection and ordinary-PR independence.
- **SC-004**: Existing Gemini CLI and Gemini API overview routing remain independent and conditional.
- **SC-005**: Final diff contains no unrelated application changes and no new general-purpose skill document.
