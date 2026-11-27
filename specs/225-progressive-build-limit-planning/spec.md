# Feature Specification: Progressive Build-Size Planning

**Feature Branch**: `225-progressive-build-limit-planning`

**Created**: 2026-11-27

**Status**: Implemented — awaiting pull-request verification

**Input**: User authorization to clarify that logically coherent work may be delivered through smaller PRs as a normal planning option when useful, without changing the existing 495 MiB production build limit or its safeguards.

## User Scenarios & Testing

### User Story 1 — Plan work progressively without urgency (Priority: P1)

As a repository maintainer, I want the existing build-size guidance to recognize smaller, logically coherent PRs as an ordinary planning option, so substantial work can be delivered safely in stages without treating the build limit as an emergency or sacrificing quality.

**Why this priority**: The current 495 MiB safeguard must remain firm, while the guidance should make clear that there are practical ways to organize work before or as the limit becomes relevant.

**Independent Test**: Read the shared Production build limit section in `AGENTS.md` and confirm the new wording describes progressive PRs as optional planning flexibility, not an emergency response.

**Acceptance Scenarios**:

1. **Given** the existing production build limit is strictly below 495 MiB, **when** the shared policy is read, **then** the threshold and existing safe-stop and quality requirements remain unchanged.
2. **Given** work can be separated into coherent increments, **when** staging is helpful, **then** smaller PRs may be completed and deployed progressively within the existing limit.
3. **Given** splitting work is not helpful or does not produce coherent increments, **when** the work is planned, **then** the wording does not require splitting or create pressure to rush, abandon work or compromise functionality, security or quality.

## Edge Cases

- A proposed increment would still reach or exceed 495 MiB: the existing safe-stop and deferral rule remains in force.
- Build size cannot be measured: the existing requirement to mark it unverified and identify the required authorized verification remains in force.
- Work cannot be divided without producing incomplete or unsafe increments: do not split merely to satisfy the new wording; retain the existing safe-completion requirement.

## Requirements

### Functional Requirements

- **FR-001**: Keep the production build strictly below 495 MiB.
- **FR-002**: State that work may be divided into smaller, logically coherent PRs when helpful, enabling progressive completion and deployment while remaining within the existing build-size limit.
- **FR-003**: Describe this as a normal planning option, not a reason to rush, abandon work or compromise functionality, security or quality.
- **FR-004**: Preserve all existing safe-stop, measurement and reporting requirements.
- **FR-005**: Limit the governance wording change to the shared Production build limit section; do not change application code, dependencies, build configuration or unrelated governance.

- **FR-006**: Record the latest verified production build-size measurement with its exact byte/MiB value, source workflow/run and commit, and explicitly distinguish an existing base measurement from a build executed for this documentation-only PR.

## Success Criteria

- **SC-001**: The 495 MiB threshold is byte-for-byte unchanged.
- **SC-002**: The existing build-impact, safe-stop, quality and measurement bullets remain unchanged.
- **SC-003**: The new paragraph communicates optional progressive PR delivery without urgency.
- **SC-004**: The final change set contains only the targeted governance amendment and its required Spec Kit and Memory Bank records.
- **SC-005**: The dedicated governance PR remains open and unmerged for owner review; owner approval gates remain intact.
- **SC-006**: The PR and Memory Bank record the latest verified build-size evidence, its provenance and headroom, and state clearly that the documentation-only PR did not run a new production build.

## Build-size Evidence

- The latest successful production build-size measurement available for the current base is **426,389,100 bytes (406.64 MiB)** for combined `.next + public`, from `Validate OpenNext Repair` run #2614 (run ID `45919768945`) on PR #2048 head `7049dd547aade8ea2c4fa95a223a1a7dd7933193`.
- The 495 MiB maximum is 519,045,120 bytes, leaving 92,656,020 bytes (88.36 MiB) of measured headroom.
- The PR #2052 changed paths are build-exempt under the trusted classifier, so no new production build was run for this PR. The recorded value is the latest verified base measurement, not a PR #2052 build result.

## Assumptions

- The current shared Production build limit section is the authoritative location for this clarification.
- “Smaller PRs” means logically coherent changes that can be safely completed and deployed; it does not imply weakening build-size or quality gates.
- Existing PR automation and owner authorization controls remain authoritative.
