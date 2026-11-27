# Feature Specification: Keep the GSAP AI Reference Static

**Feature Branch**: `chatgpt/227-gsap-static-reference-exemption-20261127`
**Created**: 2026-11-27
**Status**: Implemented — local Node.js verification pending
**Input**: Exclude the single GSAP AI reference document from every automatic documentation refresh while keeping its existing file and manifest routing intact for agent discovery.

## User Scenarios & Testing

### User Story 1 — Preserve the GSAP reference for agents (Priority: P1)

As a repository maintainer, I need the GSAP AI reference to remain present in the documentation library and discoverable through the manifest, while the scheduled updater never fetches or overwrites it.

**Independent Test**: Run the complete updater against an isolated copy of the current documentation library with mocked HTTPS; verify that the GSAP source URL is never requested and that the snapshot bytes and manifest routing remain unchanged.

**Acceptance Scenarios**:

1. **Given** the GSAP library ID `/llmstxt/gsap_llms_txt` is routed in `polishing`, **When** the updater builds its refresh queue, **Then** that ID is excluded before any upstream SHA or source request.
2. **Given** a routed GSAP snapshot exists, **When** the updater completes, **Then** the file remains byte-identical and the `groups`, `inventory` and `sources` manifest entries remain present.
3. **Given** the updater report is generated, **When** it lists static references, **Then** it explicitly identifies the GSAP ID and explains why it was not refreshed.

### User Story 2 — Preserve normal updater reconciliation (Priority: P1)

As a maintainer, I need every other routed document to continue through the existing refresh, retry, validation, cleanup and integrity-audit paths unchanged.

**Independent Test**: Run the existing updater regression and isolated end-to-end suites; verify existing update, failure-preservation, deliberate-removal, link-repair and manifest-consistency behaviour.

**Acceptance Scenarios**:

1. **Given** any routed document not in the explicit static-reference allowlist, **When** the updater runs, **Then** its existing processing behaviour is unchanged.
2. **Given** the GSAP ID remains in the manifest, **When** reconciliation and consistency auditing run, **Then** the updater does not treat it as deliberately removed and still checks that its snapshot exists.

## Scope Boundaries

- Keep `.docs/polishing/_llmstxt_gsap_llms_txt.md` in place and do not alter its contents.
- Keep the single GSAP route in `.docs/manifest.json`; do not remove its group, inventory or source metadata.
- Do not change `AGENTS.md`, updater schedules/workflows, unrelated documentation, application code, dependencies, deployment settings or production resources.
- This change prevents future automated refreshes; it does not repair or replace the currently checked-in snapshot content.

## Functional Requirements

- **FR-001**: The updater MUST recognize `/llmstxt/gsap_llms_txt` as a static reference.
- **FR-002**: The static ID MUST be excluded from the refresh queue before upstream SHA or source requests.
- **FR-003**: The ID MUST remain in manifest routing, inventory and source configuration so discovery, reconciliation and snapshot integrity checks continue to work.
- **FR-004**: The local snapshot MUST remain untouched by the refresh operation.
- **FR-005**: The refresh report MUST show static reference IDs and their exclusion rationale separately from unchanged and failed documents.
- **FR-006**: Every non-allowlisted route MUST retain current processing behaviour.
- **FR-007**: The updater MUST NOT change manifest data, source URLs, schedules or workflow behaviour for this exclusion.

## Success Criteria

- **SC-001**: The isolated regression test records zero requests to the GSAP source URL.
- **SC-002**: The isolated regression test proves the GSAP snapshot SHA-256 is identical before and after the refresh.
- **SC-003**: The post-refresh manifest retains the GSAP `polishing`, `inventory` and `sources` entries.
- **SC-004**: The generated report identifies the static reference and rationale.
- **SC-005**: All existing updater regression and end-to-end assertions remain in place and are run in the repository's supported Node.js 26 environment.

## Assumptions

- The manifest contains one GSAP identifier: `/llmstxt/gsap_llms_txt`, routed once under `polishing`.
- The file is intended as a static technical reference for coding agents, not a continuously refreshed upstream snapshot.
- Snapshot content recovery is a separate task; this change preserves the file exactly as it currently exists.
