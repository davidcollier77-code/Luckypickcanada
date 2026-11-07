# Feature Specification: Merged Remote Branch Cleanup

**Feature Branch**: freebuff/da1d12a5430a7af901daee1b
**Created**: 2026-11-07
**Status**: Pass 3 complete — 0 of 370 live heads eligible for deletion at the 2026-11-07T10:31:28Z snapshot; PR open and unmerged
**Input**: Owner-authorized task to identify remote Git branches conclusively merged into `main`, verify each candidate individually, delete only branches confirmed safe to remove, retain protected branches, branches associated with open pull requests, and branches with uncertain or active work, and report deletions and retentions with reasons.

## User Scenarios & Testing

### User Story 1 — Conclusive merge evidence per branch (Priority: P1)

As the repository owner, I want every remote branch classified with reproducible merge evidence so that any deletion decision is provable from Git history rather than assumed.

**Why this priority**: Deleting a branch is only safe when its commits are already reachable from `main`. The classification must be objective and repeatable.

**Independent Test**: Re-run the recorded ancestry and unique-commit checks against a freshly fetched `origin/main` and the recorded branch tips; every branch classified as deletable must report ancestor status `yes` and zero commits not present in `main`.

**Acceptance Scenarios**:

1. **Given** a remote branch whose tip is an ancestor of `origin/main`, **When** it is audited, **Then** it is recorded as conclusively merged with its tip SHA and a unique-commit count of zero.
2. **Given** a remote branch with at least one commit not reachable from `origin/main`, **When** it is audited, **Then** it is recorded as not merged and is retained.

### User Story 2 — Delete only confirmed-safe branches (Priority: P1)

As the repository owner, I want only verified-safe branches removed so that no unique work, protected ref, or active pull request branch is lost.

**Why this priority**: An incorrect deletion can disrupt in-flight work or a review.

**Independent Test**: After the cleanup, list remote heads again; no branch marked for retention is missing, `main` still resolves, and the open pull request head still exists.

**Acceptance Scenarios**:

1. **Given** the default branch `main` is protected, **When** cleanup runs, **Then** `main` is never deleted and its commit is unchanged.
2. **Given** an open pull request targets a branch, **When** cleanup runs, **Then** that head branch remains.
3. **Given** a branch has a unique commit, a `backup/` or `protect-` restore-point name, or a tip commit newer than the retention window, **When** cleanup runs, **Then** the branch is retained and the reason is recorded.

### User Story 3 — Auditable report of deletions and retentions (Priority: P2)

As the repository owner, I want one record naming what was deleted and what was kept, with the reason for each retention, so the cleanup can be reviewed or reversed.

**Why this priority**: A destructive operation must leave durable evidence.

**Independent Test**: The committed audit artifacts list every remote branch with its verdict, tip SHA and reason; the pull request body summarises the counts and the verification actually performed.

**Acceptance Scenarios**:

1. **Given** the cleanup is finished, **When** the artifacts are read, **Then** each deleted branch appears with its prior tip SHA.
2. **Given** a retained branch, **When** the artifacts are read, **Then** the retention reason is stated.

## Edge Cases

- A branch whose tip equals `main`'s tip has no unique commits and is safe to remove; it is still classified individually rather than by name.
- Branches created by automated agents (Jules, Bolt, Vercel Agent, patch branches) follow the same evidence rule as human branches; no name-based exception is applied.
- A branch can be an ancestor of `main` and still be someone's in-flight working branch; merged branches with a tip commit inside the retention window are kept.
- `backup/` and `protect-` branches are intentional restore points and are kept even when merged.
- A closed, unmerged pull request loses no history when its merged-by-ancestry head branch is removed; the pull request record remains.
- Deletion of an ancestor branch cannot orphan commits, because every tip remains reachable from `main`.

## Requirements

### Functional Requirements

- **FR-001**: The audit MUST fetch every remote head and compare each against the current `origin/main`.
- **FR-002**: A branch MUST be classified as conclusively merged only when `git merge-base --is-ancestor <branch> origin/main` succeeds and `git rev-list --count origin/main..<branch>` is `0`.
- **FR-003**: The audit MUST record each branch's tip SHA, ancestor status and unique-commit count before any deletion.
- **FR-004**: `main` MUST be retained as the protected default branch and MUST NOT be deleted.
- **FR-005**: Every branch that is the head of an open pull request at audit time MUST be retained.
- **FR-006**: Branches not reachable from `main` MUST be retained as unmerged or uncertain work.
- **FR-007**: Merged branches whose tip commit falls inside the retention window MUST be retained as possibly active.
- **FR-008**: `backup/` and `protect-` prefixed branches MUST be retained as intentional restore points.
- **FR-009**: Only branches satisfying the deletable rule MUST be deleted, and each deletion MUST be verified against the remote afterwards.
- **FR-010**: The work MUST produce committed audit artifacts naming every deleted branch and every retained branch with its reason.
- **FR-011**: No application code, dependency, workflow, payment, database, authentication, deployment or `.docs/` content may change.
- **FR-012**: The pull request for this task MUST remain open and unmerged.

## Success Criteria

- **SC-001**: Every remote branch at audit time has exactly one recorded verdict with evidence (1,623 heads classified).
- **SC-002**: The number of remote heads after cleanup equals the number of retained heads plus the default branch, and no retained branch is missing.
- **SC-003**: `main` resolves to the same commit before and after cleanup.
- **SC-004**: The open pull request head still exists after cleanup.
- **SC-005**: Repository verification passes and the measured production build stays below the 495 MB maximum.
- **SC-006**: The pull request remains open and unmerged.

## Assumptions

- Only one branch is protected (`main`), as reported by the repository branch listing at audit time.
- One pull request is open at audit time (#1750), so only its head branch is retained on that ground.
- A seven-day retention window is a reasonable margin for recently touched merged branches that could still be active.
- The connected GitHub integration may delete refs; the local checkout has no Git push credentials, so deletion is performed through that integration rather than `git push`.
- Tip SHAs recorded in the audit artifacts are sufficient to restore any deleted ref from `main`'s history if the owner wants it back.


## Follow-up — Post-merge evidence maintenance (2026-11-07)

### User Story 4 — Keep branch-cleanup evidence accurate after merge (Priority: P1)

As the repository owner, I want the audit to distinguish its original point-in-time findings from current repository state, so a later reader can verify retained and deleted refs without mistaking historical SHAs or counts for live values.

**Independent Test**: Compare the branch inventory artifacts with the live remote, confirm current protected branches and open PR heads, and verify that all recorded retained tips still match and every recorded deleted name remains absent.

**Acceptance Scenarios**:

1. **Given** the original audit base has advanced, **When** the audit is refreshed, **Then** the original counts and SHAs remain identified as historical and a dated current-state section records the new base.
2. **Given** retained and deleted branch inventories exist, **When** the live remote is checked, **Then** duplicate, missing, moved and still-present deleted refs are counted explicitly.
3. **Given** deletion timestamps and actors were not captured, **When** audit-trail gaps are documented, **Then** those fields are marked unavailable and are never inferred from the later PR merge event.
4. **Given** verified-safe branches were intentionally not deleted, **When** the follow-up report is published, **Then** those branches remain untouched unless separately authorized.

### Additional follow-up requirements

- **FR-011**: The audit summary MUST label original branch counts and base SHAs as point-in-time evidence whenever the base advances.
- **FR-012**: A post-merge verification artifact MUST record the current main SHA, live branch count, protected branch list, open PR heads, inventory reconciliation and verification limits.
- **FR-013**: Missing per-ref deletion timestamps or actor identities MUST be explicitly described as not captured; no actor or timestamp may be fabricated or inferred from PR metadata.
- **FR-014**: The original deleted-branch TSV column order and recorded tip evidence MUST be preserved for compatibility.
- **FR-015**: A documentation-only audit refresh MUST NOT delete or recreate any remote branch.

## Pass 2 Continuation (2026-11-07)

The first pass removed 169 heads and deliberately stopped with 1,084 heads still classified `verified safe`.
The owner then authorized completing that set. The requirements below extend the specification without
changing the rule that only independently verified branches are deleted.

### Requirements added

- **FR-013**: Every branch in the 1,084-row candidate set MUST be revalidated individually against the live
  remote and the current `origin/main` immediately before its deletion; the historical classification alone
  MUST NOT be treated as evidence.
- **FR-014**: A candidate whose live tip SHA no longer equals its recorded inventory SHA MUST NOT be deleted
  and MUST be reported for investigation.
- **FR-015**: Each pass-2 deletion MUST be recorded with its batch id, branch name, verified tip SHA,
  verification results and deletion result, in a file that does not overwrite the original 169 deletion
  records.
- **FR-016**: Deletion timestamps and API actors MUST be recorded when the integration provides reliable
  evidence, and otherwise explicitly marked unavailable; attribution MUST NOT be invented.
- **FR-017**: No branch outside the 1,084-row inventory may be deleted, and PR #1754 and PR #1755 MUST NOT be
  modified.

### Success criteria added

- **SC-007**: All 1,084 candidates are deleted and independently verified absent, the live head count drops
  by exactly 1,084, and no retained branch name or tip SHA changes.

### Outcome

All 1,084 candidates were revalidated (0 moved, 0 skipped) and deleted; the live head count fell from 1,455
to 371, with the 368 non-candidate retained branches, `main` and both open-PR heads intact. See
`artifacts/branch-cleanup/audit-summary.md` ("Pass 2") and `artifacts/branch-cleanup/deleted-branches-pass2.tsv`.

## PR #1756 merge-conflict resolution (2026-11-07)

PR #1756 was created from `af350ba6d4b1dbb10eb1257211778085b1edb4eb`. PR #1755 subsequently merged into `main` at `6bd5c5da9629b48247b7049a9f8e21e53c747c82`, changing files also edited by PR #1756. The resolution preserves both the post-merge audit update and the pass-2 evidence without rewriting either TSV inventory.

- **FR-018**: The merged PR evidence MUST identify `docs/branch-cleanup-audit-refresh-20261107` as PR #1755's head branch at the 09:18:07Z pass-2 snapshot, and record the later 09:48:26Z merge as a subsequent event.
- **FR-019**: Conflict resolution MUST preserve the original pass-1 evidence, PR #1755's post-merge audit additions, and the complete pass-2 deletion evidence.
- **SC-008**: The updated PR branch contains current `main` as a merge parent, retains all 1,084 pass-2 rows, and remains open and unmerged pending latest-head verification.

## Pass 3 — remaining heads re-audited (2026-11-07)

The owner requested a further cleanup pass over the heads remaining after pass 2. Pass 3 re-inventoried every live head
instead of reusing earlier counts or classifications.

### Requirements added

- **FR-020**: Every live remote head MUST be re-fetched and reclassified against the current `origin/main` before any
  decision; a historical classification MUST NOT be treated as evidence.
- **FR-021**: A head MUST be deleted only when all seven requirements hold simultaneously; a head failing any one of
  them MUST be retained with that failing reason recorded.
- **FR-022**: Protected branches, open-pull-request heads, `backup/`/`protect-` restore points and heads whose tip
  commit is younger than seven days MUST be retained even when they are conclusively merged.
- **FR-023**: The pass MUST reconcile the live inventory with `retained-branches.tsv`, `deleted-branches.tsv` and
  `deleted-branches-pass2.tsv`, explaining every difference.
- **FR-024**: When no head satisfies every requirement, the pass MUST record zero deletions and MUST NOT delete a head
  merely to demonstrate activity.

### Success criteria added

- **SC-009**: Each of the 370 heads present at the 2026-11-07T10:31:28Z snapshot has exactly one recorded verdict, and
  the verdict counts reconcile with the live head count.
- **SC-010**: No head is deleted in pass 3 unless it satisfies all seven requirements at revalidation time.
- **SC-011**: `main` is unchanged and the open pull request head remains present after the pass.

### Outcome

370 heads classified: 0 SAFE TO DELETE, 370 KEEP (`main`, the PR #1750 head, 3 restore points, 74 merged heads inside
the seven-day window, 291 heads with unique commits). No branch was deleted. See
`artifacts/branch-cleanup/pass3-classification.tsv` and the "Pass 3" section of `audit-summary.md`.
