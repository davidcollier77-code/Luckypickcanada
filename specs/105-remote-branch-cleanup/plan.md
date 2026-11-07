# Implementation Plan: Merged Remote Branch Cleanup

**Branch**: freebuff/da1d12a5430a7af901daee1b | **Date**: 2026-11-07 | **Spec**: spec.md

**Input**: Owner-authorized branch cleanup request in the conversation.

## Summary

Classify all 1,623 remote heads against `origin/main`, keep every branch that is protected, tied to an open pull request, unmerged, an intentional restore point, or recently touched, and delete the remaining conclusively merged branches through the connected GitHub integration. Commit the complete audit evidence and leave one open, unmerged pull request.

## Technical Context

- **Language/Version**: Git 2.43.0 plumbing; Markdown audit artifacts.
- **Primary Dependencies**: None added. Deletion uses the connected GitHub integration because the workspace has no Git push credentials.
- **Storage**: Repository audit artifacts under `artifacts/branch-cleanup/`; Spec Kit artifacts under `specs/105-remote-branch-cleanup/`.
- **Testing**: Per-branch ancestry and unique-commit checks; post-cleanup remote head comparison; `./freebuff-verify.sh`.
- **Target Platform**: GitHub repository `davidcollier77-code/Luckypickcanada`.
- **Project Type**: Repository maintenance (remote ref hygiene), no application runtime change.
- **Performance Goals**: No runtime impact. The only build executed is the standard verification build.
- **Constraints**: No application, dependency, workflow, payment, database, authentication, deployment or `.docs/` change. Production build must stay under 495 MB.

## Constitution Check

- **Single source of truth**: PASS — work follows `AGENTS.md` and the selected task-group instructions only.
- **Verify before acting**: PASS — each branch is verified individually with two independent Git checks before deletion; the probe deletion was verified against the remote before any bulk action.
- **Implementation sequence**: PASS — inspect, identify, understand, plan, implement, test, double-check, report, pull request.
- **Protect core systems**: PASS — no payment, authentication, database, deployment or secret change.
- **Resource conservation**: PASS — `.docs/` untouched; no documentation refresh.
- **PR ownership**: PASS — pull request stays open and unmerged.

## Research Findings

1. `git branch -r --merged origin/main` reported 1,330 ancestor branches; an independent per-branch `merge-base --is-ancestor` plus `rev-list --count origin/main..<branch>` loop over all 1,330 returned ancestor `yes` and unique commits `0` for every one, so the classification is not a single-command artifact.
2. The repository branch listing with `protected=true` returned only `main`; there are no ruleset-protected feature branches.
3. Exactly one pull request is open (#1750) with head `chore/devskim-report-update-42326412143`; its tip is not an ancestor of `main`, so it is retained by both rules.
4. `git push --delete` cannot be used here: `GIT_TERMINAL_PROMPT=0 git push origin --delete alert-autofix-16` failed with `fatal: could not read Username for 'https://github.com': terminal prompts disabled`, and no credential helper, token variable or `gh` session exists. The integration's delete-ref tool succeeded on that branch and was confirmed by `git ls-remote`, so it is the deletion channel.
5. 293 heads are not reachable from `main` and therefore are not candidates.
6. Tip-age distribution of the merged set shows 74 merged branches with tips inside a seven-day window; these are treated as possibly active and retained.

## Design

### Classification rule (deletable)

A remote head is deleted only when all of the following hold:

1. it is not `main` and not the current task branch;
2. it is not the head of an open pull request;
3. it is not protected;
4. `git merge-base --is-ancestor refs/remotes/origin/<name> origin/main` succeeds;
5. `git rev-list --count origin/main..refs/remotes/origin/<name>` is `0`;
6. its name does not start with `backup/` or `protect-`;
7. its tip commit is at least seven days old.

### Retention reasons recorded

- `not merged into main` (unique work or uncertainty),
- `backup/protect restore point`,
- `tip commit <n>d old (possible active branch)`,
- protected default branch `main`,
- open pull request head (PR #1750).

### Evidence artifacts

- `artifacts/branch-cleanup/audit-summary.md` — method, commands, counts, retained inventory and post-cleanup verification.
- `artifacts/branch-cleanup/deleted-branches.tsv` — name, prior tip SHA, unique-commit count for every deleted branch.
- `artifacts/branch-cleanup/retained-branches.tsv` — name, tip SHA, ancestor status and the retention reason.

### Deletion execution

The integration deletes one ref per call, so deletions are issued in bounded batches of distinct refs. Each batch is followed by a remote listing check for the affected names, and the final `git ls-remote --heads origin` count is compared with the retained set.

## Files and Scope

- Add: `specs/105-remote-branch-cleanup/{spec.md,plan.md,tasks.md,checklists/requirements.md}`
- Add: `artifacts/branch-cleanup/{audit-summary.md,deleted-branches.tsv,retained-branches.tsv}`
- Update: `.specify/feature.json` (pointer to this feature)
- Update: `memory-bank/activeContext.md` (current task record)
- Remote state: deletion of verified merged heads only

## Verification Plan

1. Re-verify the deletable set immediately before deletion (fresh fetch, ancestry and unique-commit checks).
2. Confirm each deletion batch removed the intended refs from the remote listing.
3. Compare the resulting remote head count with the retained inventory and confirm `main` and the open pull request head still exist.
4. Run `./freebuff-verify.sh` and record the measured production build size against the 495 MB maximum.
5. Review the complete diff and state any check that did not run.

## Risks and Mitigations

- **Risk**: A merged branch is still someone's active working branch.
  - **Mitigation**: retain merged branches whose tip commit is inside the seven-day window; retain `backup/` and `protect-` restore points.
- **Risk**: A protected or open-pull-request branch is removed.
  - **Mitigation**: cross-check `protected=true` listing and all open pull requests before deletion, and re-check afterwards.
- **Risk**: Bulk deletion via one-ref calls is interrupted part-way.
  - **Mitigation**: deterministic alphabetical batching, per-batch verification, and committed evidence for every deleted tip SHA so any ref can be recreated.
- **Risk**: The open pull request cannot be pushed from this workspace.
  - **Mitigation**: use the managed Git integration for the branch push; report any failure exactly rather than claiming success.


## Follow-up Plan — Post-merge audit evidence repair (2026-11-07)

**Follow-up branch**: `docs/branch-cleanup-audit-refresh-20261107`  
**Current base**: `main` at `af350ba6d4b1dbb10eb1257211778085b1edb4eb`  
**Selected groups**: `deep-dive` (reconcile audit claims to live GitHub state and identify provenance limits) + `testing` (verify every recorded retained/deleted branch name and tip against the remote).

### Scope

Preserve the original cleanup as a point-in-time record. Add a dated post-merge verification appendix, correct the stale present-tense statement about the original main SHA, and explicitly document the unavailable per-ref deletion actor/timestamp data. Do not change the original deletion rows, delete additional branches, or alter application/runtime configuration.

### Verification method

- Paginate GitHub's live branch listing and compare all names/tip SHAs with the retained and deleted TSVs.
- Query protected branches and open PRs independently.
- Compare the original audit base with current main to establish whether its recorded ancestor relationships remain valid.
- Reconcile live counts and report exactly which checks were not repeated (including per-branch recent-tip age and the 292 unmerged unique-commit counts).
- Preserve unknown deletion actor/timestamp values as unknown; the PR merge actor is not a substitute for the actor who deleted refs.

### Delivery

Update the existing feature 105 Spec Kit artifacts and Memory Bank, add `artifacts/branch-cleanup/post-merge-verification.md`, and open one follow-up PR against `main`. Leave it open and unmerged. Record current PR-head CI and repository-gate results separately from the original cleanup verification.

## Pass 2 Continuation (2026-11-07)

**Goal**: finish the 1,084 heads that pass 1 recorded as `verified safe`, under the same safety rule.

**Baseline**: `origin/main` = `af350ba6d4b1dbb10eb1257211778085b1edb4eb`; 1,455 live heads; open PRs #1750
and #1755 (neither touched).

**Approach**:

1. Extract the candidate rows whose reason starts `verified safe` and split them deterministically into 136
   batches of 8 with their recorded tip SHAs.
2. Revalidate each candidate individually against a fresh `git ls-remote` listing and `origin/main`: tip
   match, ancestry, unique-commit count, protected/open-PR/backup-name exclusions and tip age.
3. Delete each batch through the connected GitHub integration, one ref per call, in bounded blocks.
4. After every block, confirm the block's names are absent from `git ls-remote --heads origin`.
5. On a rejected (quota) call, treat the branch as not deleted, re-verify it as still present, and retry
   after the window clears.
6. Write `deleted-branches-pass2.tsv` additively; leave `deleted-branches.tsv` (169 rows) and
   `retained-branches.tsv` (1,452 rows) untouched.
7. Verify the final state: live head count, absence of all 1,084 names, intact retained inventory, unchanged
   `main`, present open-PR heads.

**Execution constraint**: the integration rate-limits a long block with
`Too many integration calls. Try again in <n>s`. That occurred once, rejected 11 batches before execution,
and was handled as described in step 5 — no rejection was recorded as a deletion.

**Result**: 1,084 deleted and verified absent; 371 live heads remain (368 retained + `main` + #1750 head +
#1755 head); `main` unchanged.

## PR #1756 merge-conflict resolution (2026-11-07)

**Common ancestor:** `af350ba6d4b1dbb10eb1257211778085b1edb4eb`  
**Current main:** `6bd5c5da9629b48247b7049a9f8e21e53c747c82` (PR #1755 merge)  
**PR #1756 head before repair:** `01c5ee3ffc0a88dc314d418ae11b0b1892d362e7`

The PR branch was 2 commits ahead and 4 commits behind current `main`. The conflict is caused by overlapping documentation/evidence edits, not application code.

**Resolution strategy**:
1. Use current `main` as the tree baseline so PR #1755's post-merge audit work is retained.
2. Reapply PR #1756's pass-2 audit appendix, Spec Kit continuation and Memory Bank task record.
3. Preserve `deleted-branches-pass2.tsv` byte-for-byte by reusing its existing blob.
4. State explicitly that `docs/branch-cleanup-audit-refresh-20261107` was PR #1755's head at 09:18:07Z and that #1755 merged later at 09:48:26Z.
5. Create a merge commit with the PR #1756 head as first parent and current `main` as second parent, then advance the PR source branch without force.

**Evidence checks**: 1,084 TSV data rows, 136 batch IDs, 135 full batches and one final four-row batch; GitHub metadata for PR #1755 supplies the exact head branch and merge timestamp. No branch refs other than the PR source branch are changed by this resolution.
