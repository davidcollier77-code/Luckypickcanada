# Feature Specification: Gemini Reviewer Marker Initialization Repair

**Feature Branch**: `fix/gemini-marker-tdz-20261026`
**Created**: 2026-10-26
**Status**: Draft
**Input**: Repair the Gemini reviewer full-review failure caused by `ReferenceError: Cannot access 'MARKER' before initialization` in `.github/scripts/gemini-reviewer.cjs`.

## User Scenarios & Testing

### User Story 1 — Restore source clipping (Priority: P1)

As the repository owner, I need the Gemini reviewer to clip long source files without crashing so full reviews can complete and report findings instead of failing during context preparation.

**Why this priority**: The error can prevent the full review from completing and makes repeated review requests ineffective.

**Independent Test**: Run the existing focused `__tests__/gemini-reviewer-context.test.ts` regression suite, including zero and small truncation limits and preservation of the beginning and end of the source.

**Acceptance Scenarios**:

1. **Given** source content exceeds its limit, **When** `clipSource` handles a limit at or below the marker length, **Then** it returns a bounded prefix without throwing.
2. **Given** source content exceeds a usable limit, **When** `clipSource` truncates it, **Then** the result remains within the limit, keeps the source beginning and end, and includes the omission marker.
3. **Given** source content already fits the limit, **When** `clipSource` handles it, **Then** it returns the source unchanged and indicates that truncation did not occur.

## Edge Cases

- A zero-length limit must return an empty string for a truncated source.
- A small positive limit shorter than the omission marker must not cause an initialization error or exceed the requested limit.
- A source at or below the requested limit must be returned unchanged.

## Requirements

- **FR-001**: `clipSource` MUST initialize its omission marker before any branch reads the marker's length.
- **FR-002**: The clipping logic MUST preserve the current length bound and existing source-preservation behavior.
- **FR-003**: Automated regression tests MUST exercise both tiny-limit boundaries and ordinary truncation.
- **FR-004**: The repair MUST NOT change review permissions, reviewer triggers, model selection/fallbacks, application behavior, or dependencies.

## Success Criteria

- **SC-001**: The focused Gemini reviewer context test suite passes on the proposed branch.
- **SC-002**: The reviewer entrypoint parses and no longer throws the reported marker initialization error for the covered clipping boundaries.
- **SC-003**: Repository CI reports the results for the PR head; no unrun local check is claimed as passed.

## Assumptions

- The reported failure is caused by the block-scoped `MARKER` declaration appearing after the early `MARKER.length` check.
- Existing regression tests cover zero, small, and ordinary truncation limits; no new dependency is necessary.
