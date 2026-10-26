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
- [x] T005 Reconcile `PR_SUMMARY.md` with current `main` content and append PR #1612's evidence without discarding the newer main summary.
- [ ] T006 Run `pnpm test`, `pnpm build`, and `./jules-verify.sh`; report actual results and confirm build output stays below the 495 MB hard limit.
- [ ] T007 Inspect exact-head GitHub Actions results, compare the final diff, and confirm PR #1612 is mergeable with `main` while remaining open and unmerged.

## Dependencies and execution order

- T001 precedes all changes.
- T002 establishes the security/schema baseline.
- T003 preserves the existing server-rendered schema.
- T004 and T005 address the confirmed syntax and branch-overlap issues.
- T006 and T007 remain pending until actual command/CI evidence is available.
