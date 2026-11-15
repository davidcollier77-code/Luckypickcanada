# Feature Specification: R2 Revalidation Queue Deduplication

**Feature Branch**: fix/r2-revalidation-queue-deduplication

**Created**: 2026-11-15

**Status**: Approved for implementation

**Input**: Reduce redundant time-based cache revalidation dispatches that can contribute to repeated work on the same stale page.

## User Scenarios & Testing

### User Story 1 — Keep repeated visits from triggering duplicate refresh work (Priority: P1)

A visitor opens a page whose cached content is stale. The site serves the available stale response while a refresh is arranged in the background. When other visitors request the same page and content version shortly after the first refresh has been accepted, those repeat requests should not create unnecessary additional refresh dispatches.

**Why this priority**: Repeated traffic to one stale page can create avoidable background work and contention without improving what visitors receive.

**Independent Test**: Observe repeated stale requests for one unchanged page and confirm that a refresh already accepted within the short deduplication window is not dispatched again.

**Acceptance Scenarios**:

1. **Given** a stale page and a refresh request that has been accepted, **When** another request for the same page and content version arrives within the five-second window, **Then** it does not cause another refresh dispatch.
2. **Given** a page has a refresh in progress, **When** visitors continue requesting that page, **Then** the existing stale-while-revalidate visitor experience is preserved.

### User Story 2 — Do not suppress genuinely new or unaccepted refreshes (Priority: P2)

A page changes, a different page becomes stale, or a refresh dispatch cannot be accepted. Those requests must remain eligible for refresh rather than being mistaken for duplicates.

**Why this priority**: Deduplication must reduce redundant work without delaying the publication of newer content or preventing recovery after a dispatch failure.

**Independent Test**: Compare requests for different pages or content versions, and simulate a failed queue acknowledgement; confirm that the distinct or unaccepted refresh remains eligible.

**Acceptance Scenarios**:

1. **Given** a different page or a different content version, **When** it becomes stale, **Then** its refresh is not suppressed by a prior page/version request.
2. **Given** the first refresh dispatch is not acknowledged, **When** the same page/version is requested again, **Then** the retry remains eligible for dispatch.

## Edge Cases

- Multiple identical stale requests arrive close together.
- The page content changes and therefore represents a new version while the earlier deduplication entry is still valid.
- Queue dispatch fails or does not receive acknowledgement.
- A visitor request arrives after the short deduplication window expires.
- A distinct page shares a similar path prefix but is not the same page.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST avoid dispatching another refresh for the same page and content version when a prior refresh dispatch has already been accepted within the configured five-second window.
- **FR-002**: The system MUST continue to allow refresh dispatches for a different page or content version.
- **FR-003**: The system MUST NOT record a successful deduplication entry before the underlying queue acknowledges acceptance.
- **FR-004**: The system MUST preserve the current background revalidation and visitor response behavior.
- **FR-005**: The system MUST preserve the existing cache storage and queue responsibilities and MUST NOT require an additional service or paid infrastructure.

## Success Criteria

### Measurable Outcomes

- **SC-001**: For repeated requests with the same page and content version received after the first dispatch is acknowledged and within five seconds, at most one dispatch is accepted during that window.
- **SC-002**: Requests for distinct pages or content versions remain eligible for their own refresh dispatches.
- **SC-003**: A failed or unacknowledged dispatch does not prevent a subsequent identical request from being attempted.
- **SC-004**: Visitors continue to receive the existing stale-while-revalidate response behavior without a change to page content, layout, or interaction.

## Assumptions

- A five-second deduplication window is a conservative initial default for repeated stale requests.
- The deduplication identity represents the same page and content version; a genuinely changed page version must produce a distinct refresh request.
- This optimization reduces redundant queue dispatches but does not guarantee elimination of every object-storage write-rate-limit event.
