# Feature Specification: UTF-8-Safe Documentation Refresh

**Feature Branch**: fix/docs-refresh-utf8-stream-decoding  
**Created**: 2026-11-20  
**Status**: Draft

## Goal

Ensure valid UTF-8 documentation remains valid when an HTTP response splits a multi-byte character across network chunks, while genuinely malformed UTF-8 continues to be rejected safely.

## User Scenarios & Testing

### User Story 1 — Preserve valid streamed documentation (Priority: P1)

As the documentation library maintainer, I need the scheduled updater to reconstruct complete UTF-8 responses correctly so temporary network chunk boundaries do not cause valid upstream documentation to be rejected.

**Why this priority**: False decoding failures prevent approved documentation snapshots from refreshing and create recurring, misleading rejected-download reports.

**Independent Test**: Feed the updater a valid UTF-8 response split at multiple byte positions inside a multi-byte character. The returned text must exactly match the original text and pass the existing content-integrity checks.

**Acceptance Scenarios**:

1. **Given** valid documentation containing accented characters and a four-byte Unicode character, **When** those bytes arrive across separate HTTP response chunks, **Then** the updater reconstructs the exact original text without replacement characters.
2. **Given** a response containing malformed UTF-8 bytes, **When** the updater completes the response, **Then** it rejects the response and never writes it over an existing good snapshot.
3. **Given** a response exceeding the existing 10 MB download limit, **When** its chunks are received, **Then** the updater rejects it with the existing size-limit error.
4. **Given** the existing redirect, timeout, token-sanitization, retry, manifest and scheduler behavior, **When** the decoding implementation changes, **Then** those behaviors remain unchanged.

## Requirements

### Functional Requirements

- **FR-001**: The updater MUST retain response bytes until the complete HTTP response has been received before decoding UTF-8.
- **FR-002**: The updater MUST reconstruct valid multi-byte UTF-8 characters regardless of how HTTP response chunks divide their bytes.
- **FR-003**: The updater MUST reject genuinely malformed UTF-8 rather than silently accepting corrupted text.
- **FR-004**: The updater MUST preserve the existing 10 MB download limit, HTTPS-only and same-origin redirect protections, timeout, token sanitization, retry behavior, content validation and existing-snapshot preservation.
- **FR-005**: The GitHub upstream commit-SHA response reader MUST use the same safe byte-collection and decoding approach.
- **FR-006**: Automated pull-request QA MUST execute the documentation-refresh regression suite under the repository's supported Node.js runtime.
- **FR-007**: The repair MUST NOT rewrite configured documentation source URLs, alter the manifest inventory, change the refresh schedule or change the Cloudflare scheduler.

## Out of Scope

- Replacing or broadening documentation source URLs without independent evidence that a configured URL is invalid.
- Changing the scheduled refresh cadence, retry delay, concurrency model, document inventory or group routing.
- Weakening content-integrity checks or accepting U+FFFD replacement characters.
- Changing snapshot retention, the 495 MiB documentation cap, or unrelated application code.

## Success Criteria

- **SC-001**: A valid UTF-8 response split inside a four-byte code point is returned as text exactly matching its original source.
- **SC-002**: A response with an invalid UTF-8 sequence is rejected before it can replace a snapshot.
- **SC-003**: Existing network safety limits and schedule-related regression assertions remain in the updater test suite.
- **SC-004**: The dedicated updater regression suite runs automatically in the pull-request QA workflow on Node.js 26.
- **SC-005**: No configured URL, manifest route, scheduler slot or refresh cron entry changes as part of this repair.

## Assumptions

- Node's HTTP client provides response data as Buffer chunks unless a consumer explicitly changes the stream encoding.
- The existing rejection of Unicode replacement characters is intentional data-integrity protection and must remain in place.
- The current configured source URLs remain authoritative unless a reproducible HTTP failure establishes otherwise.
- CI provides the repository-pinned Node.js 26 runtime and pnpm version for automated verification.
