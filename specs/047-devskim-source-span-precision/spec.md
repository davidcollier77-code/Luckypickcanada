# Feature Specification: DevSkim Source-Span Precision

**Feature Branch**: `047-devskim-source-span-precision`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: Make the repository's scanner smarter so safe source patterns do not create repeated false positives, without hiding valid security findings.

## User Scenarios & Testing

### User Story 1 - Suppress only the finding that was reviewed (Priority: P1)

As the repository maintainer, I want false-positive decisions to match the scanner's exact source location as well as the reviewed source context, so a harmless pattern cannot accidentally hide a different warning nearby.

**Why this priority**: A broad false-positive filter can hide a real security issue while appearing to improve the alert count.

**Independent Test**: Feed the filter SARIF results that point at a known-safe source span and results that point to a different expression on the same line. Only the known-safe span should be filtered.

**Acceptance Scenarios**:

1. **Given** a finding whose source range identifies a reviewed callback, fixture, checksum, or test-only regex, **When** the filter evaluates it, **Then** it suppresses the finding only if the matching source span and context both qualify.
2. **Given** a different or unsafe expression on the same line as a known-safe pattern, **When** the filter evaluates the finding, **Then** the unrelated finding remains visible.
3. **Given** missing, malformed, or cross-line coordinates where the filter cannot prove the exact safe source span, **When** the filter evaluates the finding, **Then** it retains the finding for review.

### User Story 2 - Preserve validated false-positive reductions (Priority: P2)

As the repository maintainer, I want the current, source-verified false positives to remain suppressed after matching becomes more precise, so the fix reduces noise without restoring known harmless warnings.

**Why this priority**: The filter should become safer without undoing verified noise reduction or weakening DevSkim itself.

**Independent Test**: Re-run regression fixtures derived from actual DevSkim SARIF locations and confirm approved cases still match.

**Acceptance Scenarios**:

1. **Given** a real DevSkim location that points to one of the known harmless patterns, **When** the filter processes it, **Then** the existing exact justification is retained.
2. **Given** a source finding that does not match the expected pattern or location, **When** the filter processes it, **Then** the result remains in SARIF.

## Edge Cases

- The safe pattern and an unrelated suspicious expression share one source line.
- DevSkim's reported columns are one character early, while its absolute offset and snippet still identify the exact source token.
- SARIF coordinates are missing, invalid, point at another token, or span multiple lines.
- The safe pattern remains in the source but its documented justification/comment changes.
- A false-positive-looking match appears in an unapproved file or an unknown rule.
- A finding is inside a lockfile package identifier, while another weak-hash match appears elsewhere on the same line.

## Requirements

### Functional Requirements

- **FR-001**: The filter MUST continue scanning the repository; it MUST NOT disable DevSkim rules globally or exclude directories.
- **FR-002**: A contextual suppression MUST verify the reported source location against the exact reviewed token or expression, in addition to the existing rule, file, and context checks. When DevSkim supplies `charOffset` and `charLength`, the filter MUST verify that absolute span against the source text, snippet, and line range before considering column fields.
- **FR-003**: Findings with missing or invalid coordinates, an invalid absolute span, or a snippet that does not match source text MUST remain visible unless an existing non-contextual matcher independently proves the complete safe value. Column-only fallback is permitted for synthetic inputs without absolute-offset fields; production absolute-offset fields must not be silently ignored.
- **FR-004**: A known package-name false positive MUST be suppressed only when the reported range falls inside the explicitly allowlisted package identifier, not merely because that identifier occurs elsewhere on the same line.
- **FR-005**: Findings about strings, opaque timer callbacks, unknown source spans, and unrelated same-line expressions MUST remain visible.
- **FR-006**: Every behavior change MUST have positive tests for reviewed safe cases and negative tests for wrong-span, missing-coordinate, and same-line unrelated cases.
- **FR-007**: Existing exact false-positive justifications and raw SARIF preservation MUST remain intact.

## Success Criteria

- **SC-001**: Regression tests prove exact-location safe cases still qualify and unrelated or ambiguous findings do not.
- **SC-002**: The scanner continues to upload all findings that do not carry a narrowly reviewed and location-validated justification.
- **SC-003**: No global rule disablement, new dependencies, scan-path exclusions, application runtime changes, or deployment changes are introduced.
- **SC-004**: The DevSkim workflow, regression suite, and repository governance verification pass on the final PR head, or each unavailable/failed check is explicitly reported.

## Assumptions

- DevSkim SARIF source coordinates are the source of truth for each finding location.
- The existing exact file/rule/context allowlist contains previously reviewed false-positive classes; this task does not broaden that allowlist.
- Uncertain results should be retained for human review rather than suppressed.
