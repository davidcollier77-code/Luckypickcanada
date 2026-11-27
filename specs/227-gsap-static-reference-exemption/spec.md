# Feature Specification: Keep the GSAP AI Reference Static

**Feature Branch**: `chatgpt/227-gsap-static-reference-exemption-20261127`
**Created**: 2026-11-27
**Status**: Implementation complete — current-head CI verification pending
**Input**: Restore the corrupted GSAP Timeline reference from its exact official upstream page, retain the single static-reference updater exclusion, and keep the existing manifest routing intact for agent discovery.

## User Scenarios & Testing

### User Story 1 — Preserve the GSAP reference for agents (Priority: P1)

As a repository maintainer, I need the GSAP Timeline documentation to be genuine, usable Markdown, discoverable through the manifest, and protected from automatic upstream overwrites.

**Independent Test**: Run the complete updater against an isolated copy of the current documentation library with mocked HTTPS; verify that the GSAP source URL is never requested and that the snapshot bytes and manifest routing remain unchanged.

**Acceptance Scenarios**:

1. **Given** the GSAP library ID `/llmstxt/gsap_llms_txt` is routed in `polishing`, **When** the updater builds its refresh queue, **Then** that ID is excluded before any upstream SHA or source request.
2. **Given** a restored GSAP snapshot exists, **When** the updater completes, **Then** the file remains byte-identical and the `groups`, `inventory` and `sources` manifest entries remain present.
4. **Given** the snapshot previously contained a Cloudflare verification response, **When** the recovery is applied, **Then** it contains the official GSAP Timeline documentation as readable Markdown, not a challenge page.
3. **Given** the updater report is generated, **When** it lists static references, **Then** it explicitly identifies the GSAP ID and explains why it was not refreshed.

### User Story 2 — Preserve normal updater reconciliation (Priority: P1)

As a maintainer, I need every other routed document to continue through the existing refresh, retry, validation, cleanup and integrity-audit paths unchanged.

**Independent Test**: Run the existing updater regression and isolated end-to-end suites; verify existing update, failure-preservation, deliberate-removal, link-repair and manifest-consistency behaviour.

**Acceptance Scenarios**:

1. **Given** any routed document not in the explicit static-reference allowlist, **When** the updater runs, **Then** its existing processing behaviour is unchanged.
2. **Given** the GSAP ID remains in the manifest, **When** reconciliation and consistency auditing run, **Then** the updater does not treat it as deliberately removed and still checks that its snapshot exists.

## Scope Boundaries

- Restore `.docs/polishing/_llmstxt_gsap_llms_txt.md` from the official page configured by the existing manifest source: `https://gsap.com/docs/v3/GSAP/Timeline`.
- Keep the restored snapshot static; the updater exclusion must prevent automatic fetches or overwrites.
- Keep the single GSAP route in `.docs/manifest.json`; do not remove its group, inventory or source metadata.
- Do not change `AGENTS.md`, updater schedules/workflows, unrelated documentation, application code, dependencies, deployment settings or production resources.
- This change prevents future automated refreshes; it does not repair or replace the currently checked-in snapshot content.

## Functional Requirements

- **FR-001**: The updater MUST recognize `/llmstxt/gsap_llms_txt` as a static reference.
- **FR-002**: The static ID MUST be excluded from the refresh queue before upstream SHA or source requests.
- **FR-003**: The ID MUST remain in manifest routing, inventory and source configuration so discovery, reconciliation and snapshot integrity checks continue to work.
- **FR-004**: The restored local snapshot MUST remain untouched by the refresh operation and contain usable official GSAP Timeline documentation.
- **FR-005**: The refresh report MUST show static reference IDs and their exclusion rationale separately from unchanged and failed documents.
- **FR-006**: Every non-allowlisted route MUST retain current processing behaviour.
- **FR-007**: The updater MUST NOT change manifest data, source URLs, schedules or workflow behaviour for this exclusion.
- **FR-008**: The checked-in snapshot MUST be restored from the exact official GSAP Timeline source already configured in the manifest.
- **FR-009**: The restored snapshot MUST contain readable Markdown covering Timeline sequencing, position parameters, special properties, defaults, nesting, properties and methods; it MUST NOT contain a Cloudflare challenge or raw HTML response.

## Success Criteria

- **SC-001**: The isolated regression test records zero requests to the GSAP source URL.
- **SC-002**: The isolated regression test proves the GSAP snapshot SHA-256 is identical before and after the refresh.
- **SC-003**: The post-refresh manifest retains the GSAP `polishing`, `inventory` and `sources` entries.
- **SC-004**: The generated report identifies the static reference and rationale.
- **SC-005**: All existing updater regression and end-to-end assertions remain in place and are run in the repository's supported Node.js 26 environment.
- **SC-006**: The restored file matches the manifest's official source URL and contains the expected Timeline sections and API reference tables.
- **SC-007**: The restored snapshot contains no Cloudflare verification/challenge response and no raw HTML document wrapper.

## Assumptions

- The manifest contains one GSAP identifier: `/llmstxt/gsap_llms_txt`, routed once under `polishing`.
- The file is intended as a static technical reference for coding agents, not a continuously refreshed upstream snapshot.
- The snapshot was recovered from the exact source URL already present in the manifest; no alternate GSAP source or new manifest entry was introduced.
