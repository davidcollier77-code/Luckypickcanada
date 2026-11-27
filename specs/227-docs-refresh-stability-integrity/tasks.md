# Tasks: Documentation Refresh Stability and Integrity

**Input**: `spec.md` and `plan.md`  
**Prerequisites**: `plan.md` and `spec.md`

## Phase 1: Inspect and establish regression cases

- [x] T001 Inspect the live manifest, current NumPy and GSAP snapshots, updater comparison/validation paths, existing unit and isolated end-to-end tests, and applicable CI/protected-file workflows.
- [x] T002 [US1] Add comparison tests showing two Cloudflare tokens for one decoded destination are equal, a different destination remains different, and malformed tokens remain opaque in `scripts/test-refresh-docs.js`.
- [x] T003 [US2] Add validation coverage for the exact plain-text verification response and ordinary prose that mentions the phrase in `scripts/test-refresh-docs.js`.
- [x] T004 [US2] Extend `scripts/test-refresh-docs-e2e.js` with a seeded known-good GSAP snapshot and a mocked HTTP 200 challenge response; assert byte-identical preservation and report details.

## Phase 2: Implement the narrow repair

- [x] T005 [US1] Add strict Cloudflare XOR/UTF-8/entity/percent decoding and comparison-only normalization in `scripts/refresh-docs.js`; preserve the original upstream content for writes.
- [x] T006 [US1] Use the shared comparison normalizer for existing and downloaded content in `scripts/refresh-docs.js`.
- [x] T007 [US2] Reject the anchored plain-text verification signature in `scripts/refresh-docs.js` before snapshot writes.
- [x] T008 [US2] Keep the already-corrupted main-branch GSAP snapshot explicitly identified in the snapshot-integrity test; do not broaden the exception to any other document.

## Phase 3: Spec Kit and context handoff

- [x] T009 Update `.specify/feature.json` and the three task-relevant Memory Bank files with the active Spec 227 result and the known existing GSAP snapshot condition.
- [x] T010 Review that the manifest, document URLs, groups, `.docs/`, retry policy, scheduler, refresh schedule, workflow files, dependencies and application code remain unchanged.

## Phase 4: Verification and submission

- [ ] T011 Run `node scripts/test-refresh-docs.js` under repository Node.js 26.x. Local execution is not available in the current ChatGPT runtime; the same suite is already wired into the Node 26 Application Verification job and is pending PR CI.
- [ ] T012 Review the exact diff and applicable QA checker requirements, then submit one regular, non-draft PR with the required protected-file authorization declaration and truthful verification status.
- [ ] T013 Inspect the post-submission seven-category report for the current full PR HEAD SHA and hand off the protected-file Environment approval to the repository owner.

## Dependencies and Execution Order

- T001 establishes live behavior and governance boundaries.
- T002–T004 add regression coverage before production-code changes.
- T005–T008 implement the two fixes and the existing-snapshot test boundary.
- T009–T010 complete task-specific context and preservation review.
- T011–T013 complete authorized verification and PR handoff.

## Verification Notes

The updater regression suite must execute under Node.js 26.x. No local Node.js 22 result will be represented as a pass. CI results remain pending until observed on the submitted PR's current head. The existing GSAP snapshot on main is intentionally not edited in this updater repair; the end-to-end test uses a synthetic good snapshot in a temporary copy to verify safe preservation.
