# Feature Specification: Documentation HTML Normalization

**Feature Branch**: `chatgpt/175-docs-html-normalization`

**Created**: 2026-11-16

**Status**: Implemented; automated verification pending

**Input**: Owner-authorized implementation of the documentation updater HTML-normalization task.

## User Scenarios & Testing

### User Story 1 - Clean documentation snapshots (Priority: P1)

When the documentation updater retrieves a webpage instead of a Markdown or plain-text document, the saved library snapshot contains the documentation content in Markdown form rather than a rendered HTML page with navigation and page chrome.

**Why this priority**: The local `.docs/` library is consumed as Markdown by coding agents. Saving HTML under a Markdown extension makes the library unreliable and can contaminate future updates.

**Independent Test**: Mock an HTML response that advertises a same-origin Markdown alternate and confirm the updater fetches and saves the alternate. Mock an HTML page without an alternate and confirm useful semantic content is converted.

**Acceptance Scenarios**:

1. **Given** an HTML response advertising a same-origin HTTPS Markdown alternate, **When** the updater processes it, **Then** it uses the alternate response as the snapshot content.
2. **Given** an HTML response without a usable alternate, **When** its documentation content can be extracted, **Then** the updater writes Markdown containing headings, paragraphs, links, lists, code blocks and tables while omitting unrelated page chrome.
3. **Given** an ordinary Markdown or plain-text response, **When** the updater processes it, **Then** its content continues through the existing validation and write path unchanged.

### User Story 2 - Safe rejection and preservation (Priority: P1)

When an HTML page cannot be converted into usable documentation, the updater rejects the result, records the affected library and source URL, and leaves any existing good snapshot untouched.

**Why this priority**: A bad or incomplete upstream response must never replace valid local documentation.

**Independent Test**: Mock malformed, unsafe, cross-origin, error, challenge and unconvertible HTML cases and compare the existing snapshot byte-for-byte before and after the run.

**Acceptance Scenarios**:

1. **Given** an HTML page with no extractable documentation, **When** conversion fails, **Then** the raw HTML is rejected before any snapshot write.
2. **Given** an unsafe or cross-origin Markdown alternate or redirect, **When** the updater resolves it, **Then** it refuses the request and uses only a safe fallback or reports rejection.
3. **Given** a failed or invalid response and an existing snapshot, **When** the refresh completes, **Then** the existing snapshot remains byte-identical and the report explains the rejection.

### User Story 3 - Normalize legacy snapshots (Priority: P2)

When a local snapshot is already raw HTML from an earlier updater run, the next documentation refresh replaces it with normalized Markdown even when the source's pinned upstream SHA has not changed.

**Why this priority**: A corrected updater must be able to repair existing generated files on the next owner-triggered refresh, rather than incorrectly skipping them as current.

**Independent Test**: Run the updater against an isolated fixture containing an HTML snapshot and an unchanged upstream SHA; confirm the source is fetched and the snapshot is replaced by Markdown.

**Acceptance Scenarios**:

1. **Given** a legacy HTML snapshot and an unchanged upstream SHA, **When** the updater runs, **Then** it bypasses the ordinary unchanged-SHA skip and attempts normalization.
2. **Given** a legacy HTML snapshot and a failed normalization, **When** the updater runs, **Then** the previous snapshot is preserved.

### Edge Cases

- The server omits Content-Type or incorrectly labels HTML as text/plain.
- The HTML begins with a BOM or leading comments before its document declaration.
- The HTML advertises no Markdown alternate, a malformed alternate, an HTTP alternate, a credential-bearing URL or a cross-origin alternate.
- A Markdown alternate responds with HTML, an HTTP error, a challenge page, or invalid content.
- Redirects are relative, cross-origin, downgraded to HTTP or exceed the existing redirect limit.
- The page has no recognized main-content selector or contains only scripts and navigation.
- The response exceeds the existing 10 MB limit or times out.
- An existing snapshot is HTML and its upstream SHA is unchanged.
- A non-HTML Markdown or plain-text source must not be unnecessarily transformed.
- Valid Markdown may begin with an HTML block such as a centered paragraph or image followed by Markdown content; it must not be mistaken for a rendered HTML document. Standalone unconverted HTML fragments remain rejected.

## Requirements

### Functional Requirements

- **FR-001**: The updater MUST detect HTML responses using both response Content-Type and body inspection, including missing or misleading headers.
- **FR-002**: The updater MUST prefer an advertised Markdown alternate only when it is a valid same-origin HTTPS URL without embedded credentials.
- **FR-003**: When no usable alternate exists, the updater MUST convert extractable documentation content to Markdown while excluding scripts, styles, navigation and common unrelated page chrome.
- **FR-004**: The converter MUST preserve meaningful headings, paragraphs, links, lists, code blocks and tables.
- **FR-005**: The updater MUST NOT write raw HTML into a Markdown snapshot. If conversion is unsuccessful or validation fails, it MUST reject the download.
- **FR-006**: Unsafe protocols, credentials, cross-origin requests and cross-origin redirects MUST be rejected. Existing request timeout, response-size and redirect-count limits MUST remain in force.
- **FR-007**: A rejected response MUST preserve any existing snapshot and MUST be recorded in the existing refresh report with the library, source URL, reason and preservation status.
- **FR-008**: Existing raw-HTML snapshots MUST bypass the unchanged-upstream-SHA skip so the next refresh can normalize them.
- **FR-009**: Ordinary Markdown and plain-text sources, manifest source URLs, retry behaviour, link repair, atomic writes, reporting, schedule, timezone, workflow triggers and documentation-size limits MUST remain intact.
- **FR-010**: The implementation MUST NOT add a dependency when the existing project dependencies provide a safe conversion mechanism.
- **FR-011**: The updater MUST preserve valid Markdown documents that begin with a supported HTML block followed by Markdown content, while continuing to reject full HTML documents and standalone unconverted HTML fragments.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every HTML response that advertises a valid same-origin Markdown alternate is processed using that alternate when it returns valid non-HTML documentation.
- **SC-002**: Every accepted HTML response is saved as Markdown or readable plain text; no accepted `.md` snapshot begins with a raw HTML document or fragment.
- **SC-003**: Every unconvertible or invalid HTML response is rejected before write, and an existing snapshot remains byte-identical.
- **SC-004**: Legacy HTML snapshots are re-fetched even when their upstream SHA matches the stored SHA.
- **SC-005**: Markdown and plain-text source handling retains existing behaviour and all existing updater safeguards remain unchanged.
- **SC-006**: A valid Markdown document beginning with a supported HTML block is accepted without conversion, while standalone HTML fragments and full HTML documents are rejected unless successfully normalized.

## Assumptions

- The existing manifest source URL remains authoritative; the updater does not guess or rewrite it.
- An advertised Markdown alternate is trusted only when it is HTTPS and shares the source page's origin.
- The existing `jsdom` development dependency is available in the documentation refresh workflow and can parse HTML without executing embedded scripts or loading remote resources.
- The owner will manually trigger the existing documentation refresh workflow after this implementation is merged; this task does not run a live refresh.
