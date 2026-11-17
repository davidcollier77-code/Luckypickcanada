# Tasks: Documentation HTML Normalization

**Input**: Design documents from `specs/175-docs-html-normalization/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`

## Phase 1: Setup and Baseline

- [X] T001 Inspect the current manifest, updater, tests, package dependencies and refresh workflow in `.docs/manifest.json`, `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js` and `.github/workflows/refresh-docs.yml`.
- [X] T002 Review the repository governance, relevant documentation references and applicable QA checker requirements in `AGENTS.md`, `.docs/manifest.json` and `.github/workflows/`.

## Phase 2: Foundational Work

- [X] T003 Confirm the existing `jsdom` dependency and document the no-new-dependency decision in `package.json`, `pnpm-lock.yaml` and `specs/175-docs-html-normalization/research.md`.
- [X] T004 Set the active Spec Kit feature pointer to this feature in `.specify/feature.json`.

## Phase 3: User Story 1 — Clean Documentation Snapshots (P1)

**Goal**: HTML responses are normalized into usable Markdown before they can reach the snapshot write path.

**Independent Test**: Mock an HTML page with a Markdown alternate and another without one; verify both return validated Markdown and ordinary Markdown/text responses remain unchanged.

- [X] T005 Add regression tests for Markdown/plain-text preservation, raw-HTML rejection, semantic HTML conversion, and same-origin Markdown alternate selection in `scripts/test-refresh-docs.js`.
- [X] T006 Capture Content-Type and final URL, detect HTML by MIME and body, prefer advertised same-origin Markdown, and convert semantic page content through the existing JSDOM dependency in `scripts/refresh-docs.js`.
- [X] T007 Preserve headings, paragraphs, links, lists, code blocks and tables while excluding scripts, styles, navigation and common page chrome in `scripts/refresh-docs.js`.
- [X] T008 Add an isolated full-refresh test that proves a legacy Next.js HTML response is replaced by its Markdown alternate without modifying the real `.docs/` tree in `scripts/test-refresh-docs-e2e.js`.

## Phase 4: User Story 2 — Safe Rejection and Preservation (P1)

**Goal**: Unsafe or unconvertible HTML cannot replace an existing documentation snapshot.

**Independent Test**: Feed unconvertible HTML and unsafe alternate/redirect targets through the mocked HTTPS transport; assert rejection and byte-identical preservation.

- [X] T009 Reject raw HTML that survives normalization before snapshot writes, preserving existing validator checks and reporting in `scripts/refresh-docs.js`.
- [X] T010 Require HTTPS without URL credentials and reject cross-origin or downgraded redirects while retaining existing timeout, size and redirect-count limits in `scripts/refresh-docs.js`.
- [X] T011 Add regression tests for missing/misleading Content-Type, unconvertible HTML, unsafe/cross-origin alternates, cross-origin redirects and HTTPS downgrade redirects in `scripts/test-refresh-docs.js`.

## Phase 5: User Story 3 — Normalize Legacy Snapshots (P2)

**Goal**: Existing raw-HTML snapshots are re-fetched even when the pinned upstream SHA has not changed.

**Independent Test**: Run the isolated updater with an HTML snapshot and an unchanged SHA; assert the source is fetched and the replacement is Markdown.

- [X] T012 Bypass the unchanged-SHA shortcut only when the existing snapshot is raw HTML in `scripts/refresh-docs.js`.
- [X] T013 Add a regression test proving an HTML snapshot is refreshed when its upstream SHA is unchanged in `scripts/test-refresh-docs.js`.

## Final Phase: Verification and Handoff

- [X] T014 Keep the manifest, generated `.docs/` snapshots, package manifests, workflow schedule, timezone, Cloudflare scheduler and application code unchanged; review the changed paths against the approved scope.
- [ ] T015 Run `node scripts/test-refresh-docs.js` and `node scripts/test-refresh-docs-e2e.js` under the repository's Node.js 26 environment. **BLOCKED in ChatGPT**: only Node.js 22.16.0 is available, and ChatGPT is prohibited from executing repository scripts.
- [ ] T016 Run the applicable Vitest suite, TypeScript check, repository gate and production build-size measurement using `package.json`, `pnpm-lock.yaml`, `freebuff-verify.sh` and the `.next/` plus `public/` build output in an authorized Node.js 26/pnpm 10.30.3 environment. **NOT RUN in ChatGPT**: project runtime mismatch and repository-script execution restriction.
- [X] T017 Prepare the complete PR handoff using `PR_SUBMISSION.md`, including changed files, source-audit limitations, checker self-review and every unexecuted verification status in the PR description.
- [ ] T018 After the implementation PR is merged, have the owner manually trigger the existing `Refresh Documentation` workflow and review its report and generated snapshots. This is intentionally not run in this implementation task.

- [X] T019 Distinguish full HTML documents and standalone HTML fragments from valid Markdown documents that begin with supported HTML blocks in `scripts/refresh-docs.js`; cover preservation and rejection in `scripts/test-refresh-docs.js`.
- [X] T020 Preserve nested headings, code blocks and definition lists inside arbitrary HTML wrappers; reduce alternate-fetch redirect allowance; escape Markdown table cell backslashes before pipes; and report failed conversion explicitly.
- [X] T021 Repair URL-normalization mock keys, guard missing source metadata, and accept safe rejection of legacy JavaScript-shell snapshots that contain no statically extractable documentation.

## Dependencies & Execution Order

- Setup and foundational tasks establish current repository context and the active Spec Kit feature.
- User Story 1 establishes format detection, source normalization and clean Markdown extraction.
- User Story 2 builds on normalization and applies safe URL handling plus fail-safe preservation.
- User Story 3 ensures pre-existing HTML snapshots are repaired despite unchanged SHA metadata.
- Final verification follows implementation. The live refresh is an owner-triggered post-merge action.

## Parallel Opportunities

- Source normalization and URL-safety tests touch the updater/test pair and must be integrated sequentially.
- The isolated end-to-end test in `scripts/test-refresh-docs-e2e.js` is a separate file and was developed independently of the unit test file.
- Repository CI checks can run independently after PR creation; ChatGPT cannot execute the restricted local scripts.

## Implementation Strategy

All three user stories were implemented as one focused updater change because they share the same download/normalization/validation path. The first story is the core MVP. Unsafe-response handling and legacy-snapshot bypass complete the safety and migration requirements. The live documentation refresh remains separate and owner-triggered after merge.

## Verification Notes

The implementation and regression fixtures are committed on the feature branch. Test execution, TypeScript, full repository verification and build measurement remain unverified because the ChatGPT environment has Node.js 22.16.0 rather than the project's Node.js 26 and is prohibited from executing repository scripts. No test or build result is claimed as passing.
