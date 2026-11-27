# Tasks: Stable Cloudflare Email-Protection Links in Documentation

**Input**: [spec.md](spec.md) and [plan.md](plan.md)  
**Prerequisites**: plan.md and spec.md  
**Tests**: Explicitly required by the owner; use the existing standalone updater suite.

## Phase 1 — Preparation and baseline

- [x] T001 Read current AGENTS.md, ChatGPT startup instructions/script, manifest, task-relevant references and all four Memory Bank files.
- [x] T002 Inspect the current converter, updater comparison/write path, unit and e2e tests, mock transport, Node 26 verification workflow, visual/build classifiers and protected-file requirements.
- [x] T003 Reproduce the configured NumPy page's rotating same-origin Cloudflare email-protection token and verify the visible anchor text is stable.
- [x] T004 Complete the Spec Kit specification and plan review before defining implementation tasks.

## Phase 2 — User Story 1: Stable documentation snapshots (P1)

**Goal**: A Cloudflare token change alone cannot change generated Markdown or cause a repeated documentation update.

**Independent Test**: Convert two HTML pages that differ only in the token and run two complete updater passes. The first pass creates the snapshot; the second reports one unchanged document and preserves both snapshot bytes and manifest timestamp.

### Tests

- [x] T005 Add a focused converter regression to `scripts/test-refresh-docs.js` for distinct token values, retained visible label, absent volatile href, preserved ordinary relative links and unchanged cross-origin links.
- [x] T006 Add a two-pass updater regression to `scripts/test-refresh-docs.js` using the existing HTTPS mock and temporary documentation directory.

### Implementation

- [x] T007 Add an exact same-origin HTTPS Cloudflare email-protection URL predicate inside `convertHtmlToMarkdown()` in `scripts/refresh-docs.js`.
- [x] T008 Preserve the anchor's visible label as plain text for only the recognized volatile href; retain current behavior for all other links.

## Phase 3 — Records and review

- [x] T009 Update `.specify/feature.json` to point to Spec 228.
- [x] T010 Update Memory Bank active context, verified updater technical context and durable progress with the cause, narrowly scoped correction and verification boundary; leave stable projectBrief unchanged.
- [x] T011 Review the complete intended diff for correctness, test meaningfulness, safe URL scope, unnecessary complexity and preservation of updater safeguards.

## Phase 4 — Verification and delivery

- [ ] T012 Run `node scripts/test-refresh-docs.js` only in the supported Node.js 26 environment; do not run project scripts under the incompatible ChatGPT runtime.
- [ ] T013 Open one regular, non-draft PR against `main` with the complete submission report and exact protected-file authorization declaration.
- [ ] T014 Inspect the current-head seven-category PR report and automated Application Verification, build validation and both Visual QA shard results; leave the PR open and unmerged for the owner.

## Preserved behavior

The manifest, configured URLs, stale SHA metadata, refresh schedule, retry behavior, source validation, strict UTF-8 handling, HTTPS/same-origin redirects, challenge/raw-HTML rejection, atomic snapshot writes, static GSAP policy, 495 MiB library ceiling and existing CI/Playwright gates remain unchanged.

## Verification boundary

The local Node 26 test suite is not run under ChatGPT's incompatible runtime. No local test/build pass is claimed. The PR-triggered Node 26 suite, production build/size gate and Playwright shards remain pending until GitHub Actions reports results for the exact PR head.
