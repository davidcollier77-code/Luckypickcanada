# Feature Specification: Merged Remote Branch Cleanup

**Feature Branch**: freebuff/da1d12a5430a7af901daee1b
**Created**: 2026-11-07
**Status**: Draft
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
