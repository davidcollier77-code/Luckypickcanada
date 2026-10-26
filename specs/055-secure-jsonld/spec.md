# Feature Specification: Secure JSON-LD Rendering and PR #1612 Repair

**Feature Branch**: `jules-5660530544535426768-bb6cf813`  
**Created**: 2026-10-26  
**Status**: In Progress  
**Input**: Complete the secure JSON-LD injection PR, correct the remaining JSX syntax error, and resolve branch conflicts without losing newer work on `main`.

## User Scenarios & Testing

### User Story 1 — Secure structured data (Priority: P1)

As a site visitor or search crawler, I need JSON-LD structured data to be safely serialized and present in the server-rendered response so metadata is available without executing client-side UI code and cannot break out of its script element.

**Independent Test**: Inspect the server component and JSON-LD helper; run the repository tests and production build; verify that FAQPage questions and answers match the visible FAQ.

**Acceptance Scenarios**:

1. **Given** the website schema or FAQ schema is rendered, **When** the HTML response is generated, **Then** the structured data is emitted by server-rendered components through the reusable safe JSON-LD helper.
2. **Given** JSON data contains angle brackets, **When** the helper serializes it, **Then** the serialized string escapes those characters before it is passed to `dangerouslySetInnerHTML`.
3. **Given** the FAQ schema is emitted, **When** its seven question-answer pairs are compared with the FAQ accordion data, **Then** the current question text and answers match.

### User Story 2 — Restore a buildable, mergeable PR (Priority: P1)

As the repository owner, I need the PR branch to contain syntactically valid JSX and preserve newer changes from `main), so the security change can be reviewed without unrelated work being lost.

**Independent Test**: Check the edited JSX structure, compare the PR branch to current `main`, and verify the PR remains open and unmerged while current-head checks run.

**Acceptance Scenarios**:

1. **Given** the FAQ section's opening tag is rendered, **When** its JSX is parsed, **Then** the `<section>` start tag is properly closed before child elements.
2. **Given** `main` advanced after the original branch point, **When** the overlapping summary file is reconciled, **Then** the current `main` summary content is preserved and the PR's scope remains visible in the PR summary.
3. **Given** verification has not run or has failed, **When** the PR summary is updated, **Then** it clearly reports the pending or failed check and does not claim success.

## Edge Cases

- JSON-LD strings contain `<`, `>`, or a script-closing sequence.
- A source change duplicates FAQ content between the server page and client accordion.
- `main` and the topic branch both changed `PR_SUMMARY.md`.
- CI cannot be started or local commands are unavailable; the result must stay explicitly pending.

## Requirements

- **FR-001**: Structured data MUST be injected through `app/components/JsonLd.js`, which escapes `<` and `>` before injection.
- **FR-002**: Website and FAQ structured data MUST remain server-rendered.
- **FR-003**: The FAQ schema MUST match the question-and-answer content rendered in `app/homepage/FAQSection.js`.
- **FR-004**: The JSX in `app/homepage/FAQSection.js` MUST be syntactically valid.
- **FR-005**: Reconciliation with current `main` MUST preserve newer unrelated changes and MUST NOT merge the PR.
- **FR-006**: Verification reporting MUST distinguish executed checks from pending or unavailable checks.

## Success Criteria

- **SC-001**: The focused and repository-wide tests pass on the current PR head.
- **SC-002**: The production build and `./jules-verify.sh` pass on the current PR head, with build size below the 495 MB hard limit.
- **SC-003**: The current PR head is mergeable with `main`, or any remaining conflict is identified with evidence.
- **SC-004**: PR #1612 remains open and unmerged for repository-owner review.

## Assumptions

- The missing closing `>` in the FAQ section was introduced on the PR branch; the current `main` version includes it.
- The reported `MARKER` reviewer failure has since been fixed on `main`; preserve that newer fix during branch reconciliation rather than reimplementing it here.
- The branch divergence is large enough that file-by-file preservation is required; do not overwrite current `main` state with a stale whole-file snapshot.
