# Feature Specification: Reduce DevSkim False-Positive Noise

**Feature Branch**: `042-devskim-noise-filtering`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: Reduce repetitive, non-actionable DevSkim results while continuing to surface genuine security concerns for review.

## User Scenarios & Testing

### User Story 1 - Review actionable security findings (Priority: P1)

As the repository maintainer, I want the automated security scan to continue identifying genuine issues while excluding only findings proven to be harmless in their exact context, so that I can focus effort on work that improves security.

**Why this priority**: Missing a real secret or unsafe execution path is materially worse than retaining a noisy warning.

**Independent Test**: Run the scanner filter against representative safe and unsafe examples and verify that only the narrowly approved harmless examples are excluded.

**Acceptance Scenarios**:

1. **Given** a finding in a documented checksum map with a complete hash value, **When** the filter validates its path, structure, and reported source span, **Then** it excludes that verified metadata false positive.
2. **Given** a secret-like value outside an approved metadata field, **When** the same filter runs, **Then** the finding remains available for review.
3. **Given** a timer callback that uses a string or an opaque callback reference, **When** the filter assesses the finding, **Then** the warning remains visible.

### User Story 2 - Avoid repeated work on known harmless patterns (Priority: P2)

As the repository maintainer, I want specifically verified, context-dependent false positives to be consistently filtered from the uploaded scan results, so that harmless patterns do not keep resurfacing as security alerts.

**Why this priority**: Repeated non-actionable warnings create unnecessary review and reporting work, while a consistent audit trail must be preserved for other findings.

**Independent Test**: Run regression tests for each allowlisted source pattern and for nearby negative examples that must not qualify.

**Acceptance Scenarios**:

1. **Given** one of the exact reviewed project patterns, **When** its complete source context still matches the approved conditions, **Then** only that matching result is excluded.
2. **Given** a source pattern that no longer matches the documented context, **When** the filter runs, **Then** it does not suppress the finding.
3. **Given** an unrelated finding, **When** the suppression filter completes, **Then** that result remains in the security scan output.

## Edge Cases

- A hash-looking value appears outside the explicitly approved checksum maps.
- A finding has missing or invalid source line/column information.
- A path uses traversal, absolute paths, or resolves outside the repository workspace.
- A timer callback is a string, or a callback reference whose behavior cannot be established from the call site.
- An inline suppression comment or explanatory context is removed or changed.
- The filter or its regression tests fail; the workflow must not silently present unfiltered results as though filtering succeeded.

## Requirements

### Functional Requirements

- **FR-001**: The scan MUST continue running across the repository and MUST NOT disable security rules globally or exclude whole directories from scanning.
- **FR-002**: The filter MUST exclude a finding only when its path, rule, source structure, and required context match a narrowly allowlisted and reviewed false-positive pattern.
- **FR-003**: Hash-looking values MUST remain reportable unless they are complete expected-length hashes in the explicitly approved checksum/metadata fields and the scanner's reported source span identifies that value.
- **FR-004**: Findings about timer usage MUST remain reportable when the call site uses a string callback or an opaque callback reference; only the reviewed callable callback and test-timeout patterns may be excluded.
- **FR-005**: Contextual exclusions for local development origins, test-only fixtures, and test source patterns MUST apply only to the audited paths and expected surrounding context.
- **FR-006**: Every new suppression MUST have an exact, reviewable justification and regression coverage for both the approved case and a case that must remain visible.
- **FR-007**: Verified false-positive results MUST be removed from the uploaded scan report only when carrying one of the filter's exact approved justifications; all other results MUST remain available in the Security tab.
- **FR-008**: If the regression tests fail, the workflow MUST make that failure visible and MUST NOT proceed as though suppression succeeded.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All regression tests for approved suppressions and their negative cases pass in CI.
- **SC-002**: The audited scan run excludes only findings matched by approved, exact suppression justifications; unrecognized findings remain in the uploaded SARIF.
- **SC-003**: No global DevSkim rule, repository directory, or scan trigger is disabled to reduce warning volume.
- **SC-004**: The production build and existing verification gates are not weakened or bypassed by the filter change.

## Assumptions

- The existing DevSkim workflow and its Security-tab upload remain the source of security scan results.
- A finding must not be labelled a false positive solely because it is inconvenient; only specific evidence about the matched source context qualifies.
- Findings already recorded in the append-only Markdown report are not automatically erased by this task. The scope is to prevent verified false positives from being reintroduced by future scans and to filter those results from the Security-tab upload.
- The repository remains on its existing package manager and CI workflow configuration.
