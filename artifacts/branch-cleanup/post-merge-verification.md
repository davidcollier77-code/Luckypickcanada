# Branch Cleanup — Post-Merge Verification

**Verification date:** 2026-11-07  
**Repository:** `davidcollier77-code/Luckypickcanada`  
**Current branch base:** `main`  
**Current main SHA:** `af350ba6d4b1dbb10eb1257211778085b1edb4eb`  
**Original audit base:** `6fa08ddc2941e4a96cb8f6bcaf9f855aafd1d123`

## Why this follow-up exists

The original audit was written against `6fa08ddc`. PR #1754 was subsequently merged into `main` at `af350ba6` on 2026-11-07 at **07:56:56 UTC**. The original values remain valid as historical snapshots, but wording that presents the earlier `main` SHA and branch count as current needed clarification.

This follow-up does not repeat or alter the original branch deletions. It refreshes the present-state evidence and records the audit-trail limitation.

## Live repository state

- `main` is `af350ba6d4b1dbb10eb1257211778085b1edb4eb`.
- GitHub compare reports the original audit base `6fa08ddc2941e4a96cb8f6bcaf9f855aafd1d123` is an ancestor of current `main`, which is **17 commits ahead and 0 behind** that base.
- The live branch listing returned **1,454 unique remote branch names** across 15 pages.
- The only protected branch returned by GitHub's protected-branch filter is `main`.
- The only open pull request is **#1750**, whose head is `chore/devskim-report-update-42326412143`.

## Artifact-to-remote reconciliation

| Check | Result |
|---|---:|
| Rows in `retained-branches.tsv` | 1,452 |
| Duplicate retained branch names | 0 |
| Retained branches missing from the live remote | 0 |
| Retained branch tips different from recorded SHAs | 0 |
| Rows in `deleted-branches.tsv` | 169 |
| Duplicate deleted branch names | 0 |
| Deleted branch names present on the live remote | 0 |
| Duplicate names between deleted and retained inventories | 0 |
| Deleted TSV header | Correct, first line |
| Live remote branch names | 1,454 |

The live branch count reconciles exactly: **1,452 inventory rows + protected `main` + the open PR #1750 head = 1,454**.

The 1,452 retained records break down as follows:

| Recorded reason | Count |
|---|---:|
| Verified safe (ancestor of the original audit base, zero unique commits), not removed in the original pass | 1,084 |
| Not merged into the original audit base | 292 |
| Tip inside the original seven-day retention window | 74 |
| `backup/` or `protect-` restore point | 2 |
| **Total** | **1,452** |

All 1,452 retained branch names still exist at their recorded tip SHAs. The original audit base is an ancestor of current `main`, so the 1,084 previously verified-safe tips remain reachable from current `main`; they were not deleted by this follow-up. The original deletion TSV contains 169 unique branch names, each recorded with zero commits not present in the original base, and none of those names is present on the live remote. The original audit summary records the per-head ancestry check; current `main` being a descendant of that original base preserves that reachability.

The 292 branches recorded as unmerged, 74 recent branches and 2 restore points were retained. This follow-up confirmed their names and tip SHAs still match the live remote; it did not rerun a per-branch age calculation or recalculate every unique-commit count for those retained categories. Any later deletion pass must recheck current ancestry, unique commits, protection, open-PR references, branch-tip SHA and tip age immediately before each deletion.

## Deletion audit-trail limitation

The original `deleted-branches.tsv` records branch name, prior tip SHA, unique-commit count and verdict. It does **not** record a per-branch deletion timestamp, the API actor, or batch boundary.

Those values were not captured in the original artifact. The current branch listing proves absence, not when or by whom a branch was deleted. The PR API records that PR #1754 was merged by `davidcollier77-code` at 07:56:56 UTC; that is the PR merge actor and time, **not** evidence of who deleted any of the 169 refs or when. No deletion actor or timestamp is inferred here. Recovering them would require retained GitHub audit-log or integration-event records for the individual delete-ref calls.

The original four-column TSV schema and the corrected first-line header are intentionally preserved. The missing deletion metadata is documented here rather than filled with invented values or a misleading PR merge timestamp.

## Scope and remaining work

- This is an audit-artifact and Spec Kit documentation repair only.
- No branches were deleted or recreated during this follow-up.
- No application code, dependency, workflow, payment, database, authentication, deployment or `.docs/` content was changed.
- **1,084 verified-safe branches remain on the remote**, as in the original partial cleanup. This follow-up does not authorize deleting them.
- The original build measurement (333,136,883 bytes / 317.7 MiB) and `./freebuff-verify.sh` result apply to the original cleanup head only. They are not claimed as new verification for this follow-up branch.
- Current PR-head repository verification and CI are tracked in the follow-up PR; pending checks are not treated as passed.
