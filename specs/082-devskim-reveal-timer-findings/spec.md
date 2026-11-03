# Feature Specification: DevSkim Reveal Timer False-Positive Filtering

**Feature Branch**: `freebuff/082-devskim-reveal-timer-findings`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User request: Deep-dive and fix the four open DevSkim DS172411 findings shown on GitHub Code scanning.

## User Scenarios & Testing

### User Story 1 — Keep reviewed reveal timer false positives out of security results (Priority: P1)

As the repository maintainer, I need the four reviewed reveal-related DS172411 findings removed from uploaded SARIF only when their exact source path, reported token, and safe source context match, so that the Security page focuses on genuine risks without hiding unsafe timer usage.

**Why this priority**: These four warnings relate to the just-completed Lucky Reveal experience. They interrupt security review even though their source contexts do not execute untrusted strings.

**Independent Test**: Run the actual SARIF suppression function against synthetic results with real source-span coordinates for the four exact source lines, then verify the four findings are removed while unsafe and unreviewed controls remain. The real-SARIF replay gate must verify the same behavior against scanner output.

**Acceptance Scenarios**:

1. **Given** DS172411 points to the inline arrow callback in `app/lucky-reveal-popup.js`, **When** the SARIF source span matches the exact callback call, **Then** the finding receives the existing reviewed false-positive justification and is removed from upload SARIF.
2. **Given** DS172411 points to either reviewed inline arrow callback in `app/lucky-reveal-celebration.jsx`, **When** the exact source span and callback syntax match, **Then** the finding is filtered without changing the application code.
3. **Given** DS172411 points to the exact quoted assertion in `__tests__/lucky-reveal-finish-phase2.test.js`, **When** the reported span identifies the `setTimeout` token inside that exact assertion string, **Then** the finding is filtered as test source text, not executable code.
4. **Given** a timer uses a string, an opaque callback reference, an altered test string, an unreviewed path, a wrong source span, or missing coordinates, **When** the SARIF filter runs, **Then** the finding remains visible.
5. **Given** the DevSkim workflow runs on the updated branch, **When** the real-SARIF replay gate executes, **Then** the four reviewed patterns are removed and no result outside the exact reviewed path/rule/source allowlist is removed.

### Edge Cases

- A timer callback that receives a string must remain reportable.
- A named/opaque callback reference such as `setTimeout(settle, delay)` or `setTimeout(launch, delay)` must remain reportable unless separately reviewed and authorized.
- A different timer expression in either reveal file must not inherit the reviewed exception.
- A different string assertion in the test file must remain reportable.
- Missing, inconsistent, or altered SARIF offsets/snippets must fail closed.
- New or duplicated scanner findings must not be misreported as already fixed merely because the source file is allowlisted.

## Requirements

### Functional Requirements

- **FR-001**: The filter MUST recognize only the two exact application paths for the reviewed DS172411 callback findings.
- **FR-002**: The filter MUST recognize only the exact quoted assertion pattern in the one named test file.
- **FR-003**: All four application/test findings MUST continue to require the existing source-span validation and exact `setTimeout` token start.
- **FR-004**: The new path exceptions MUST apply only to DS172411; they MUST NOT widen other DevSkim rules' path allowlists.
- **FR-005**: String callbacks, opaque callback references, unrelated paths, altered test literals, invalid coordinates, and mismatched snippets MUST remain unsuppressed.
- **FR-006**: The real-SARIF replay gate MUST include exact path, rule, and source-line patterns for the four reviewed findings.
- **FR-007**: The application source, reveal timing, audio, visuals, number generation, sharing, payment/email behavior, workflow triggers/permissions, and scan coverage MUST remain unchanged.
- **FR-008**: Suppression justifications MUST use the existing reviewed DS172411 justification; no rule disablement, severity change, global ignore, or broad directory exemption is permitted.
- **FR-009**: The final report MUST distinguish a successful scanner run from verified finding removal, and state any remaining CI or main-branch rescan status.

## Key Entities

- **SARIF finding**: A DevSkim result with rule ID, repository-relative source path, line/span coordinates, source snippet, and suppression metadata.
- **Reviewed false positive**: One of the four exact source matches above, whose code passes a callback or contains a non-executed test assertion.
- **Negative control**: An unsafe or unreviewed example that must remain in the uploaded SARIF.

## Success Criteria

- **SC-001**: The four exact reviewed findings are removed from filtered SARIF.
- **SC-002**: Unit tests prove unsafe strings, opaque callbacks, changed test literals, and unreviewed files remain.
- **SC-003**: The real-SARIF replay gate passes on current-head scanner output and confirms the raw SARIF is not modified.
- **SC-004**: No application runtime file, dependency, workflow trigger, permission, or scan exclusion is changed.
- **SC-005**: The complete PR diff and all mandatory checks are reported accurately; the PR remains open and unmerged.

## Assumptions

- The four supplied GitHub findings are the exact DS172411 results described in the user-provided screenshots.
- The reviewed source is the current main-branch content inspected for this task.
- Existing DevSkim suppression policy is intentionally conservative; the new exceptions extend only the already-audited callable-callback case and one exact test-source string.
- GitHub's append-only Markdown report is updated through its separate automated report PR; this task does not rewrite or merge that report.
