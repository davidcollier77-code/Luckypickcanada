# Feature Specification: Repository Cleanup Audit

**Feature Branch**: `jules-9194309937130832358-29bf1ebc`  
**Created**: 2026-10-18  
**Status**: Audit report corrected; exhaustive local verification remains pending  
**Input**: Inspect the repository for possibly unused files, assets, and dependencies; report evidence and limitations without deleting anything.

## User Scenarios & Testing

### User Story 1 — Maintainer can prioritize possible cleanup safely (Priority: P1)

A repository maintainer needs a trustworthy inventory of resources that may be unused, with evidence and uncertainty clearly distinguished, so future cleanup does not remove assets or dependencies that the application still needs.

**Acceptance Scenarios**

1. **Given** a resource has no direct match in an available source search, **when** it appears in the report, **then** it is called a candidate rather than confirmed unused until the search method is exhaustive and appropriate.
2. **Given** a resource is referenced by a current component, route, test, configuration, or fallback chain, **when** it appears in the report, **then** it is marked as used/protected and is not recommended for removal.
3. **Given** binary, generated, dynamic, or non-indexed paths cannot be completely traced, **when** verification is incomplete, **then** the report states the limitation and no deletion is authorized.

### User Story 2 — The audit preserves repository functionality and records (Priority: P1)

A maintainer needs the audit to make no runtime or dependency changes and preserve historical review/build/governance records.

**Acceptance Scenarios**

1. **Given** the audit report is updated, **when** the final diff is reviewed, **then** all pre-existing PR Summary history remains intact and the audit section is appended.
2. **Given** audit findings suggest future deletions, **when** the task is complete, **then** those deletions remain pending separate authorization and verification.
3. **Given** build-size evidence is historical rather than freshly measured, **when** the report states the figure, **then** it is labelled as historical and not a current-head build result.

## Requirements

- **FR-001**: Findings must separate active references, unreferenced candidates, and unresolved questions.
- **FR-002**: A source-search miss alone must not justify the label “confirmed unused.”
- **FR-003**: No application source, asset, dependency, workflow, test, API route, lockfile, or runtime behavior may be changed by the audit diff.
- **FR-004**: Existing historical PR Summary records must be preserved verbatim; the audit record must be appended.
- **FR-005**: The report must identify the build-size measurement's provenance and whether it was independently rerun.
- **FR-006**: The final changed-file list must match the actual audit diff exactly.
- **FR-007**: The 495 MB hard maximum remains in force for any future build validation.

## Success Criteria

- **SC-001**: Every proposed cleanup item is supported by concrete evidence and an explicit confidence level.
- **SC-002**: All positively identified active asset/fallback references are protected from removal recommendations.
- **SC-003**: Historical PR verification records remain intact.
- **SC-004**: The audit diff contains documentation/governance records only and includes no cleanup implementation.
- **SC-005**: Unverified checks and future work are clearly recorded without claims of success.
