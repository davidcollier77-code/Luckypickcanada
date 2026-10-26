# Tasks: Secure JSON-LD Rendering and PR #1612 Repair

**Input**: `specs/055-secure-jsonld/spec.md` and `plan.md`

## Phase 1: Setup

- [x] T001 Inspect `AGENTS.md`, applicable task guidance, the PR head, current `main`, and the exact changed-file overlap before editing.

## Phase 2: Foundational

- [x] T002 Verify that `app/components/JsonLd.js` escapes angle brackets and that the FAQ schema currently matches the seven visible FAQ question-answer pairs.

## Phase 3: User Story 1 — Secure structured data

**Independent test**: Confirm server-rendered `JsonLd` usage and compare FAQ source content.

- [x] T003 Preserve the secure JSON-LD helper and keep `app/page.js` emitting FAQPage data from the server component without modifying visual behavior.

## Phase 4: User Story 2 — Restore a buildable, mergeable PR

**Independent test**: Verify valid JSX and current-main preservation, then check exact-head CI and mergeability.

- [x] T004 Fix the missing opening-tag `>` and correct the outdated comment in `app/homepage/FAQSection.js`.
- [x] T005 Reconcile `PR_SUMMARY.md` to current `main` content so newer summary evidence is preserved and the shared-file conflict clears.
- [x] T006 Remove the unused client-side `faqSchema` object from `app/homepage/FAQSection.js`; the server component remains the sole FAQ JSON-LD renderer.
- [ ] T007 Run `pnpm test`, `pnpm build`, and `./jules-verify.sh` locally if the environment permits; record exact outcomes and ensure a successful build remains below the 495 MB hard limit.
- [ ] T008 Inspect current-head GitHub Actions, audit the exact final diff, and confirm PR #1612 remains open, unmerged, and mergeable with `main`.

## Dependencies and execution order

- T001 establishes the baseline before edits.
- T002 verifies the existing security helper and matching schema data.
- T003 preserves the server-rendered JSON-LD behavior.
- T004–T006 repair the syntax and remove the now-unused client-side schema object while preserving current `main` evidence.
- T007–T008 remain pending until current-head checks and the final review provide actual evidence.
