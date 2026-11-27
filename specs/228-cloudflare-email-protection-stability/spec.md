# Feature Specification: Stable Cloudflare Email-Protection Links in Documentation

**Feature Branch**: `chatgpt/228-cloudflare-email-protection-stability`
**Created**: 2026-11-27
**Status**: Draft
**Input**: Owner-authorized repair of repeated documentation refresh changes caused by rotating Cloudflare email-protection URL tokens.

## User Scenarios & Testing

### User Story 1 — Keep generated documentation stable (Priority: P1)

As a maintainer of the local documentation library, I need documentation refreshes to ignore volatile Cloudflare email-protection link tokens while preserving the visible documentation text, so identical upstream content does not repeatedly create updates and pull requests.

**Why this priority**: A changing opaque URL fragment is not a meaningful documentation change. Treating it as one creates recurring PR noise and makes genuine upstream changes harder to identify.

**Independent Test**: Convert two otherwise identical HTML documentation responses whose same-origin Cloudflare email-protection links contain different hexadecimal tokens. The resulting Markdown must be identical, retain the visible link label, and retain ordinary documentation links.

**Acceptance Scenarios**:

1. **Given** an HTML documentation anchor targets the source page's same-origin `/cdn-cgi/l/email-protection#<hex-token>` endpoint, **When** HTML is converted to Markdown, **Then** its visible label is retained as text and the volatile href is omitted.
2. **Given** two otherwise identical HTML responses with different Cloudflare email-protection tokens, **When** each is converted, **Then** the resulting Markdown is byte-identical.
3. **Given** a normal relative or absolute documentation link, **When** the HTML is converted, **Then** its existing Markdown link behavior is unchanged.
4. **Given** two consecutive refreshes fetch the same documentation text with different Cloudflare tokens, **When** the updater runs, **Then** the second refresh reports the document as unchanged, leaves the snapshot byte-identical, and does not update the manifest timestamp.

## Requirements

### Functional Requirements

- **FR-001**: The HTML converter MUST recognize only a same-origin HTTPS URL whose path is exactly `/cdn-cgi/l/email-protection` and whose fragment is a non-empty hexadecimal token.
- **FR-002**: For that recognized URL only, the converter MUST preserve the anchor's visible label while omitting the volatile URL target from the generated Markdown.
- **FR-003**: The converter MUST preserve existing behavior for ordinary same-origin, cross-origin, HTTP(S), mailto and relative documentation links; it MUST NOT globally strip URL fragments or rewrite unrelated anchors.
- **FR-004**: Two otherwise identical HTML responses that differ only in a valid Cloudflare email-protection token MUST generate identical Markdown.
- **FR-005**: A full updater regression MUST prove that a second live-source fetch with a different token is reported as unchanged and does not modify the saved snapshot or manifest timestamp.
- **FR-006**: Existing HTML conversion, raw-HTML rejection, source validation, HTTP safety, UTF-8 handling, retry, snapshot preservation, manifest reconciliation and library-size protections MUST remain intact.
- **FR-007**: The configured NumPy source URL, manifest routing, inventory, upstream metadata, refresh schedule and workflow configuration MUST remain unchanged.

## Out of Scope

- Replacing or broadening configured documentation source URLs.
- Rewriting generated `.docs/` snapshots or `.docs/manifest.json` manually.
- Removing stale manifest SHA metadata that is not used for non-GitHub sources.
- Changing refresh schedules, retries, concurrency, workflow permissions or Cloudflare configuration.
- Broad normalization of arbitrary URL hashes, tracking parameters or unrelated upstream metadata.

## Success Criteria

- **SC-001**: A conversion regression using two distinct valid Cloudflare tokens produces byte-identical Markdown.
- **SC-002**: The converted result preserves the visible email-protection label and ordinary documentation links without retaining the volatile endpoint or token.
- **SC-003**: A complete two-pass updater regression reports first pass `1 updated`, second pass `0 updated / 1 unchanged`, and proves the second fetch does not change snapshot bytes or `lastUpdated`.
- **SC-004**: Existing updater unit and isolated end-to-end regressions remain wired into the Node.js 26 pull-request verification workflow.
- **SC-005**: No configured source URL, manifest index, workflow schedule or production configuration changes as part of this repair.

## Assumptions

- Cloudflare's email-protection link format uses the exact same-origin path `/cdn-cgi/l/email-protection` with an opaque hexadecimal URL fragment.
- The visible anchor text is the useful documentation content; the generated fragment is only a volatile Cloudflare transport/obfuscation token.
- Existing JSDOM conversion is the right normalization boundary; no dependency or new subsystem is required.
- The updater must continue fetching non-GitHub sources when no usable upstream commit SHA is available and must compare their normalized document content.
