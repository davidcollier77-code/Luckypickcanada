# Tasks: Merged Remote Branch Cleanup

**Input**: Design documents from `spec.md` and `plan.md`

**Prerequisites**: `spec.md` and `plan.md`

**Tests**: Verification is required by the specification (per-branch ancestry checks and post-cleanup remote comparison). No separate TDD workflow was requested.

## Phase 1: Setup and baseline

- [x] T001 Read `AGENTS.md`, `.freebuff/deep-dive.md`, `.freebuff/testing.md`, the Memory Bank, `.specify/memory/constitution.md` and `.docs/manifest.json`; select the `deep-dive` and `testing` groups.
- [x] T002 Inspect the worktree, existing Spec Kit artifacts and open pull requests; confirm no existing pull request covers this task and only PR #1750 is open.
- [x] T003 Fetch every remote head into `refs/remotes/origin` and confirm the remote head total (`git branch -r | wc -l`).

## Phase 2: User Story 1 — Conclusive merge evidence per branch (Priority: P1)

**Goal**: Classify every remote head with reproducible merge evidence.

**Independent Test**: Re-run the ancestry and unique-commit checks; every branch recorded as deletable reports ancestor `yes` and zero commits not in `main`.

- [x] T004 List protected branches through the GitHub integration and record that only `main` is protected (`artifacts/branch-cleanup/audit-summary.md`).
- [x] T005 Record every open pull request head through the GitHub integration (`artifacts/branch-cleanup/audit-summary.md`).
- [x] T006 Run a per-branch loop over all merged heads recording name, tip SHA, `merge-base --is-ancestor` result and `rev-list --count origin/main..<ref>`, and write `artifacts/branch-cleanup/deleted-branches.tsv` and `artifacts/branch-cleanup/retained-branches.tsv`.
- [x] T007 Confirm no deletable branch has a non-zero unique-commit count and that all 293 heads not reachable from `main` are retained.

## Phase 3: User Story 2 — Delete only confirmed-safe branches (Priority: P1)

**Goal**: Remove exactly the verified-safe merged heads and nothing else.

**Independent Test**: After cleanup no retained branch is missing, `main` is unchanged, and the open pull request head still exists.

- [x] T008 Confirm the deletion channel by deleting one verified merged branch through the integration and checking `git ls-remote` reports no such head (`alert-autofix-16`).
- [x] T009 Delete the verified deletion set in bounded batches through the integration, excluding `main`, the open pull request head, `backup/` and `protect-` restore points, and merged branches with a tip inside the seven-day retention window. **COMPLETE**: pass 1 removed 168 batch deletions plus one channel-probe deletion and was completed by pass 2, which removed the remaining 1,084 verified-safe heads (see T016–T022).
- [x] T010 Re-list remote heads and confirm the post-cleanup count equals the retained inventory plus `main`, that `main` still resolves, and that the open pull request head remains.

## Phase 4: User Story 3 — Auditable report (Priority: P2)

**Goal**: Leave durable evidence and one canonical summary.

**Independent Test**: The artifacts list every remote branch with a verdict, and the pull request body reports the counts and verification actually observed.

- [x] T011 Write `artifacts/branch-cleanup/audit-summary.md` with the method, commands, counts, retention reasons and post-cleanup verification results.
- [x] T012 Point `.specify/feature.json` at `specs/105-remote-branch-cleanup` and record the task in `memory-bank/activeContext.md`.

## Final Phase: Verification, audit and delivery

- [x] T013 Run `./freebuff-verify.sh`, record the exit status and measure the production build size against the 495 MB maximum. Exit `0`; `.next` 300,296,840 B + `public` 32,840,043 B = 333,136,883 B (317.7 MiB).
- [x] T014 Review the complete diff for out-of-scope changes and confirm no application, dependency, workflow, payment, database, authentication, deployment or `.docs/` change. Nine files: this feature's Spec Kit artifacts, two audit evidence files, `.specify/feature.json` and `memory-bank/activeContext.md`.
- [x] T015 Push the task branch, open the pull request with the canonical summary, and leave it open and unmerged. Branch `chore/merged-remote-branch-cleanup-20261107`; PR #1754 open and unmerged.

## Phase 5: Pass 2 — remaining verified-safe heads (2026-11-07)

**Goal**: delete exactly the 1,084 heads pass 1 recorded as `verified safe`, after independent revalidation.

**Independent Test**: The live head count drops by exactly 1,084, all 1,084 names are absent, and the 368 non-candidate retained branches still sit at their recorded tip SHAs.

- [x] T016 Extract the 1,084 rows whose reason starts `verified safe` and split them into 136 deterministic batches of 8 with their recorded tip SHAs.
- [x] T017 Revalidate every candidate against the live remote and current `origin/main` immediately before deletion: tip match, `merge-base --is-ancestor`, `rev-list --count`, not `main`/protected, not an open-PR head (#1750, #1755), not a `backup/`/`protect-` name, tip at least seven days old. Result: 1,084 valid, 0 moved, 0 skipped.
- [x] T018 Delete batches 000–135 through the connected GitHub integration, one ref per call, confirming each block's names are absent from `git ls-remote --heads origin`.
- [x] T019 Treat the 11 batches rejected by the integration quota as not deleted: re-verify them as still present with unchanged tips, then delete after the window cleared.
- [x] T020 Write `artifacts/branch-cleanup/deleted-branches-pass2.tsv` (1,084 rows) additively and append the pass-2 section to `artifacts/branch-cleanup/audit-summary.md` without rewriting the original 169 deletion records or the 1,452-row retained inventory.
- [x] T021 Record `deletion_timestamp_utc` and `api_actor` as `unavailable` for every pass-2 row because the integration returns no per-ref timestamp or actor; bound the deletion window with the revalidation and post-deletion checks instead of inferring attribution.
- [x] T022 Verify the final state at 2026-11-07T09:18:07Z: 371 live heads (`1,455 − 1,084`), `candidates_present=0`, `keep_ok=368 keep_missing=0 keep_mismatch=0`, `origin/main` still `af350ba6`, `main` and both open-PR heads present.

## Completion Conditions

- Every remote head at audit time has a recorded verdict with evidence.
- Only verified-safe branches are deleted; no retained branch is missing afterwards.
- `main` and the open pull request head still exist.
- Repository verification results and build size are reported accurately.
- The pull request stays open and unmerged.
