# Feature Specification: Documentation Refresh Stability and Integrity

**Feature Branch**: `fix/docs-refresh-stability-integrity-20261127`
**Created**: 2026-11-27
**Status**: Implemented — pull-request verification pending
**Task groups**: `troubleshooting` (repeated source changes and rejected downloads), `deep-dive` (comparison and snapshot-integrity behavior), `testing` (unit and isolated end-to-end regression coverage).
**Input**: Owner-authorized surgical repair of `scripts/refresh-docs.js` after repeated false-positive NumPy updates and an accepted GSAP verification response.

## User Scenarios & Testing

### User Story 1 — Stable comparison of protected email links (Priority: P1)

When an upstream document contains a Cloudflare email-protection link, its ciphertext may rotate while the protected email destination remains the same. The updater must recognize that as unchanged documentation, without rewriting the original downloaded link or treating other URL changes as equivalent.

**Why this priority**: The NumPy source is fetched on every refresh because it is not a raw-GitHub source. A changing Cloudflare token currently causes the same document to be committed repeatedly.

**Independent Test**: Refresh a temporary NumPy snapshot with a second ciphertext that decodes to the same address; the report must count it as unchanged and the existing file must remain byte-identical. Then supply a token that decodes to a different address; it must count as updated and store the new upstream content verbatim.

**Acceptance Scenarios**:
1. **Given** a local document with a valid Cloudflare email-protection token, **When** the upstream token changes but decodes to the same address, **Then** the updater reports unchanged and does not rewrite the snapshot.
2. **Given** the same source, **When** the decrypted email destination changes, **Then** the updater reports updated and stores the exact upstream response, not a comparison marker.
3. **Given** a malformed or unsupported token, **When** documents are compared, **Then** that token remains unnormalized and continues to count as a genuine content difference.

### User Story 2 — Verification pages cannot replace documentation (Priority: P1)

When an upstream documentation source returns the plain-text response `Please wait while your request is being verified...`, the updater must reject it as a verification challenge rather than accept it as prose.

**Why this priority**: The GSAP snapshot was previously replaced with this 52-character response even though it is not documentation.

**Independent Test**: Serve the exact response with HTTP 200 in the isolated end-to-end workflow; the updater must reject it, preserve a seeded good snapshot byte-for-byte, identify the URL and reason in its report, and exit non-zero for the integrity failure.

**Acceptance Scenarios**:
1. **Given** a good existing snapshot, **When** the upstream source returns the verification response, **Then** the response is rejected and the existing snapshot remains byte-identical.
2. **Given** a document whose ordinary explanatory text mentions a verification message later in the body, **When** it is validated, **Then** it remains eligible documentation.
3. **Given** the already-corrupted GSAP snapshot on the current main branch, **When** the updater audits the local library, **Then** it is explicitly identified as invalid; it is not silently treated as good or overwritten by another challenge response.

## Requirements

### Functional Requirements

- **FR-001**: The updater MUST decode recognized Cloudflare `/cdn-cgi/l/email-protection#...` fragments for comparison only, using their XOR payload and HTML/percent-encoded destination.
- **FR-002**: Two recognized Cloudflare tokens MUST compare equal only when they resolve to the same email destination and the remaining document content is equivalent.
- **FR-003**: A different decoded email destination MUST remain a meaningful content change.
- **FR-004**: Invalid, unsupported or malformed Cloudflare payloads MUST remain unnormalized; failure to decode MUST NOT cause links to be discarded or treated as equivalent.
- **FR-005**: Comparison normalization MUST NOT mutate the downloaded response, write a canonical marker into the library, alter source URLs, or rewrite links in snapshots.
- **FR-006**: The exact plain-text verification response MUST be rejected as an integrity failure before it can replace or create a snapshot.
- **FR-007**: Ordinary documentation that mentions verification in its body MUST remain eligible when it does not begin with the challenge signature.
- **FR-008**: A rejected response MUST preserve an existing snapshot byte-for-byte; if no local snapshot exists, nothing is written.
- **FR-009**: The report MUST identify the affected document, source URL and rejection reason, and the refresh MUST fail rather than report success for the rejected response.
- **FR-010**: The current known-invalid GSAP snapshot MUST remain visibly invalid until replaced by a valid upstream response; tests MUST not weaken validation for other documents to accommodate it.
- **FR-011**: Preserve the existing manifest inventory, source URLs, group routing, canonical snapshot/symlink design, GitHub SHA shortcut, HTTPS and redirect restrictions, UTF-8 decoding, retry behavior, size limits, report structure, schedule, timezone and Cloudflare scheduler.

### Out of Scope

- Editing `.docs/`, `.docs/manifest.json`, the NumPy or GSAP source URLs, document inventory, groups or stored snapshots.
- Changing the GitHub SHA lookup policy, HTTP transport, retry count/delay, timeout, download/library size limits, schedule, timezone or scheduler.
- Adding dependencies, services, workflows or a new normalization framework.
- Broad URL canonicalization or changing legitimate documentation links.

## Success Criteria

- **SC-001**: The current NumPy token and a different ciphertext for the same decoded destination compare equal.
- **SC-002**: A token that decodes to a different destination compares different.
- **SC-003**: Invalid tokens remain unchanged in the comparison representation.
- **SC-004**: The plain-text GSAP verification response is rejected and cannot overwrite an existing good snapshot.
- **SC-005**: The isolated updater workflow verifies preservation, reporting and non-zero failure for the challenge response.
- **SC-006**: No manifest, source URL, group route, schedule, retry, workflow, dependency or real `.docs/` file changes in this repair.

## Assumptions

- Cloudflare's protection payload uses the first hexadecimal byte as the XOR key; the decoded payload contains the protected email destination, which may include numeric HTML entities and percent escapes.
- Only a payload that safely decodes to a single email-like address is eligible for comparison normalization.
- The existing real GSAP snapshot is already corrupted on main. It is deliberately not rewritten in this updater-code repair; a later valid upstream response can replace it, while repeated challenge responses will be rejected and reported.
