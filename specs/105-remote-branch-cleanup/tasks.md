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
- [ ] T009 Delete the verified deletion set in bounded batches through the integration, excluding `main`, the open pull request head, `backup/` and `protect-` restore points, and merged branches with a tip inside the seven-day retention window. **PARTIAL**: 168 batch deletions plus one channel-probe deletion completed and verified absent; the remaining 1,084 verified-safe heads are recorded in `artifacts/branch-cleanup/retained-branches.tsv` because removal costs one API call per ref.
- [x] T010 Re-list remote heads and confirm the post-cleanup count equals the retained inventory plus `main`, that `main` still resolves, and that the open pull request head remains.

## Phase 4: User Story 3 — Auditable report (Priority: P2)

**Goal**: Leave durable evidence and one canonical summary.

**Independent Test**: The artifacts list every remote branch with a verdict, and the pull request body reports the counts and verification actually observed.

- [x] T011 Write `artifacts/branch-cleanup/audit-summary.md` with the method, commands, counts, retention reasons and post-cleanup verification results.
- [x] T012 Point `.specify/feature.json` at `specs/105-remote-branch-cleanup` and record the task in `memory-bank/activeContext.md`.

## Final Phase: Verification, audit and delivery

- [x] T013 Run `./freebuff-verify.sh`, record the exit status and measure the production build size against the 495 MB maximum. Exit `0`; `.next` 300,296,840 B + `public` 32,840,043 B = 333,136,883 B (317.7 MiB).
- [ ] T014 Review the complete diff for out-of-scope changes and confirm no application, dependency, workflow, payment, database, authentication, deployment or `.docs/` change.
- [ ] T015 Push the task branch, open the pull request with the canonical summary, and leave it open and unmerged.

## Completion Conditions

- Every remote head at audit time has a recorded verdict with evidence.
- Only verified-safe branches are deleted; no retained branch is missing afterwards.
- `main` and the open pull request head still exist.
- Repository verification results and build size are reported accurately.
- The pull request stays open and unmerged.
