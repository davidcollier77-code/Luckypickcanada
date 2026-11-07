# Merged Remote Branch Cleanup — Audit Summary

**Date**: 2026-11-07
**Base**: `origin/main` = `6fa08ddc2941e4a96cb8f6bcaf9f855aafd1d123`
**Repository**: `davidcollier77-code/Luckypickcanada`

## Method

Every remote head was fetched with `git fetch origin '+refs/heads/*:refs/remotes/origin/*' --prune` and then
checked **individually**. A branch is "conclusively merged" only when both checks agree:

```
git merge-base --is-ancestor refs/remotes/origin/<branch> origin/main   # must succeed
git rev-list --count origin/main..refs/remotes/origin/<branch>          # must be 0
```

Because a merged tip is an ancestor of `main`, deleting such a branch cannot orphan any commit: its history
stays reachable from `main`, and the recorded tip SHA can recreate the ref if wanted.

## Baseline classification (1,623 remote heads)

| Verdict | Count |
| --- | --- |
| Heads classified individually | 1,623 |
| Ancestor of `main`, 0 unique commits (conclusively merged) | 1,330 (includes `main` and the deletion-channel probe) |
| Not reachable from `main` (retained) | 293 |
| Protected branches (GitHub `protected=true` listing) | 1 — `main` |
| Open pull requests at audit time | 1 — #1750, head `chore/devskim-report-update-42326412143` |

Every one of the 1,330 merged heads reported ancestor `yes` and unique-commit count `0`; no candidate had a
non-zero count.

## Deletion rule applied

A head was eligible for deletion only when **all** of these held:

1. it is not `main` and not the current task branch;
2. it is not the head of an open pull request;
3. it is not protected;
4. `git merge-base --is-ancestor <head> origin/main` succeeds;
5. `git rev-list --count origin/main..<head>` is `0`;
6. its name does not start with `backup/` or `protect-` (intentional restore points);
7. its tip commit is at least seven days old (possible active branch).

Eligible set after the rule: **1,252** heads.

## Deletion channel

`git push --delete` is unusable in this workspace:

```
$ GIT_TERMINAL_PROMPT=0 git push origin --delete alert-autofix-16
fatal: could not read Username for 'https://github.com': terminal prompts disabled
```

No credential helper, token environment variable or authenticated `gh` session exists. The connected GitHub
integration deletes one ref per call, so deletions were issued through it and verified against
`git ls-remote --heads origin`.

## Result of this pass

| Item | Count |
| --- | --- |
| Remote heads at audit start | 1,623 |
| Deleted (integration, each verified absent afterwards) | 169 (1 channel probe + 168 batch) |
| Verified-safe heads not removed in this pass | 1,084 |
| Retained by rule (not merged) | 292 |
| Retained by rule (tip inside seven-day window) | 74 |
| Retained by rule (`backup/` or `protect-` restore point) | 2 |
| Retained: protected `main` | 1 |
| Retained: open pull request head (#1750) | 1 |
| Remote heads after the pass | 1,454 |

`1,084 + 292 + 74 + 2 + 1 + 1 = 1,454` — the post-pass count reconciles exactly with the recorded retentions.

### Post-pass verification

```
$ git ls-remote --heads origin | wc -l
1454
$ # retained inventory intact
retained_missing=0
main_present=1
pr1750_head_present=1
```

At the end of the original cleanup pass, `main` resolved to `6fa08ddc` and no branch recorded as retained was missing. This is a **point-in-time result from the original pass**, not the current repository state. See [post-merge verification](post-merge-verification.md) for the current `main` SHA and live inventory reconciliation.

## Why 1,084 verified-safe heads remain

Removal is one ref per API call (8 calls per tool request). The remaining 1,084 are **not** retained for a
technical reason about their history — they satisfy every rule above and are safe to remove. They remain
because the session's per-call budget was spent on the audit, evidence, verification gate and pull request.
`retained-branches.tsv` records each one with its tip SHA and that exact reason.

To finish, repeat the deletion step for the rows whose reason starts with `verified safe`:

```
git fetch origin '+refs/heads/*:refs/remotes/origin/*' --prune
# for each such branch, delete through the integration or an authenticated client:
git push origin --delete <branch>
```

## Evidence files

- `deleted-branches.tsv` — every deleted branch with its prior tip SHA and unique-commit count.
- `retained-branches.tsv` — every remaining head with tip SHA, ancestry result and retention reason.

## Verification of the repository change

```
$ ./freebuff-verify.sh
VERIFY_EXIT=0
✅ All verification steps passed.

$ du -sb .next public
.next 300,296,840 B + public 32,840,043 B = 333,136,883 B (317.7 MiB)  # < 495 MB maximum
```

## Subsequent state

Immediately after the pass the remote held 1,454 heads. Two heads appeared afterwards and are outside this
audit's deletion set: this task's own branch `chore/merged-remote-branch-cleanup-20261107` (pushed for the
pull request) and an unrelated concurrently created branch `fix/governance-regression-test-20261107`, which
was left untouched. The remote therefore held 1,456 heads at the final check, with no retained branch
missing (`retained_missing=0`).


---

## Post-merge verification — 2026-11-07

PR #1754 was merged into `main` at 07:56:56 UTC on 2026-11-07, producing `af350ba6d4b1dbb10eb1257211778085b1edb4eb`. Current `main` is 17 commits ahead of the original audit base `6fa08ddc2941e4a96cb8f6bcaf9f855aafd1d123`.

A fresh live-remote reconciliation found 1,454 unique branch names. All 1,452 entries in `retained-branches.tsv` remain present at their recorded tip SHAs (0 missing, 0 moved); all 169 names in `deleted-branches.tsv` remain absent (0 duplicates, 0 still present). The inventories contain no duplicate names or overlap. The protected-branch filter returns only `main`, and the only open PR is #1750 with head `chore/devskim-report-update-42326412143`. The live count reconciles as 1,452 retained inventory entries + `main` + the #1750 head.

The deleted inventory's header is on line 1 and the file contains 169 data rows. Its original four columns are preserved. Per-ref deletion timestamps and actors were not captured; the PR merge actor/time must not be mistaken for deletion attribution. The exact checks and limitations are recorded in `artifacts/branch-cleanup/post-merge-verification.md`.

This follow-up did not delete the 1,084 verified-safe branches that remain, recalculate every retained branch's age, or rerun `./freebuff-verify.sh`. The original build and gate results remain scoped to the original cleanup head; current follow-up PR checks must be reported separately.

## Pass 2 — the remaining verified-safe heads removed (2026-11-07)

**Task**: continue the cleanup for the 1,084 heads recorded as `verified safe` in `retained-branches.tsv`,
independently revalidating each against the live remote and the current `origin/main` immediately before
deletion.

**Baseline at pass-2 start**: `origin/main` = `af350ba6d4b1dbb10eb1257211778085b1edb4eb` (PR #1754 merge
commit); 1,455 live heads. `origin/main` was unchanged at final verification.

The numbered sections above describe pass 1 and remain the historical record. In particular, "Why 1,084
verified-safe heads remain" is superseded by this section.

### Per-branch revalidation (1,084 rows, 0 skipped)

| Check | Result |
| --- | --- |
| Live tip SHA equals the recorded inventory SHA | 1,084 / 1,084 match — 0 moved |
| `git merge-base --is-ancestor <tip> origin/main` | 1,084 / 1,084 `yes` |
| `git rev-list --count origin/main..<tip>` | 1,084 / 1,084 = `0` |
| Not `main`, and not protected | 1,084 / 1,084 pass (only `main` is protected) |
| Not the head of an open pull request | 1,084 / 1,084 pass (open: #1750, #1755) |
| Not a `backup/`, `protect-` or restore-point name | 1,084 / 1,084 pass |
| Tip at least seven days old | 1,084 / 1,084 pass (oldest tip 2026-07-16, newest 2026-07-31) |

Every candidate was an ancestor of `main` with zero unique commits, so no deletion can orphan history: each
tip remains reachable from `main`, and the recorded SHA can recreate the ref.

### Deletion execution


136 batches of 8 (the final batch holds only 4), issued through the connected GitHub integration (one
ref per call) and each confirmed against `git ls-remote --heads origin`. Deletion was performed in
these batch ranges:

- batches 000–075: 76 batches, 608 branches;
- batches 076–087, 088–099, 100–111, 112–123: issued in blocks of 96 branches (12 batches each);
- batches 124–135: the final 92 branches (11 full batches plus a final batch of 4).

One integration quota window interrupted a block: 11 batches were rejected with
`Too many integration calls` before executing. Those 88 branches were re-verified as still present with
unchanged tips, then deleted after the window cleared. A rejected call was never counted as a deletion.

### Result

| Item | Count |
| --- | --- |
| Candidates revalidated and eligible | 1,084 |
| Deleted and verified absent | 1,084 |
| Failed | 0 |
| Skipped / retained from this set | 0 |
| Live heads at pass-2 start | 1,455 |
| Live heads after pass 2 | 371 |

Reconciliation: `1,455 − 1,084 = 371`, and `371 = 368 non-candidate retained rows + main + PR #1750 head +
PR #1755 head`.

### Post-deletion verification (2026-11-07T09:18:07Z)

```
$ git ls-remote --heads origin | wc -l
371
$ # all 1,084 deleted names absent
candidates_present=0
$ # every non-candidate retained row still at its recorded tip SHA
keep_ok=368 keep_missing=0 keep_mismatch=0
$ git rev-parse origin/main
af350ba6d4b1dbb10eb1257211778085b1edb4eb
$ # protected branch and open-PR heads
main present=1
chore/devskim-report-update-42326412143 present=1
docs/branch-cleanup-audit-refresh-20261107 present=1
$ # pass-1 evidence untouched
deleted-branches_rows=169
retained-branches_rows=1452
```

At the 09:18:07Z verification instant, the listed branch `docs/branch-cleanup-audit-refresh-20261107` was the exact head branch recorded by GitHub for open PR #1755. PR #1755 merged later, at 09:48:26Z, as commit `6bd5c5da9629b48247b7049a9f8e21e53c747c82`. The branch-to-PR mapping above is historical evidence for the 09:18 snapshot, not a claim that PR #1755 remained open afterwards.

### Evidence for pass 2

`deleted-branches-pass2.tsv` records one row per branch: batch id, name, verified tip SHA, tip-match
result, ancestry result, commits not in `main`, deletion result, absence verification, and the
timestamp/actor columns.

`deletion_timestamp_utc` and `api_actor` are `unavailable` for every row. The integration returns only a
success acknowledgement with no per-call timestamp or actor, so neither is inferred. The deletion window is
bounded instead by the pass-2 pre-deletion revalidation and the post-deletion verification recorded above.
Authorization comes from the owner-issued task; the connected repository integration is the only channel
with delete permission in this workspace.

Pass-1 evidence was not rewritten: `deleted-branches.tsv` still holds the original 169 rows with the header
on line 1, `retained-branches.tsv` still holds all 1,452 rows of the original classification, and pass-2
deletions are additive evidence in a new file.

---

## Pass 3 — remaining heads re-audited (2026-11-07)

**Snapshot:** `2026-11-07T10:31:28Z` · **`origin/main`:** `4785e5e43e96e61d7543cfef5a7345333091c516` (PR #1756 merge)
**Live remote heads:** 370 (0 duplicate names) · **Protected branches:** `main` only · **Open pull requests:** 1 (#1750)

Pass 2 removed the 1,084 heads it had revalidated, so this pass started from a fresh inventory: every live head was
fetched again with `git fetch origin '+refs/heads/*:refs/remotes/origin/*' --prune` and classified individually
against the *current* `main`, not the historical audit base.

### Verdicts (all 370 heads)

| Verdict | Count | Rule |
| --- | --- | --- |
| SAFE TO DELETE | **0** | every deletion requirement satisfied |
| KEEP — protected default branch | 1 | `main` |
| KEEP — head of open PR #1750 | 1 | `chore/devskim-report-update-42326412143` @ `380e1301` |
| KEEP — backup/recovery restore point | 3 | `backup/pr-1518-before-scope-correction`, `protect-12-files`, `protect-12-files-human-authorization` |
| KEEP — merged, tip inside seven-day window | 74 | ancestor of `main`, 0 unique commits, tip 0–6 days old |
| KEEP — not an ancestor of `main` | 291 | 1–26 commits still absent from `main` |

`1 + 1 + 3 + 74 + 291 = 370` — the classification reconciles exactly with the live head count.

### Why nothing qualified for deletion

No live head satisfied all seven requirements at once:

- **76** heads are ancestors of `main` with `git rev-list --count origin/main..<head>` = `0`. Two of those are
  `protect-*` restore points; the other **74** have tip commits only 0–6 days old (oldest
  `2026-10-31T10:32:24-03:00`, newest `2026-11-07T06:45:35+00:00`) and are retained by the seven-day rule. **10** of
  them reach seven days within 24 hours and become eligible for a later pass.
- **291** heads are not reachable from `main` at all (1–26 unique commits), so deleting them would discard work.
- `main` is protected, and the single open pull request's head is retained.

No branch was deleted in this pass, so there is no deletion outcome to reconcile. **Deletions: 0. Failures: 0.**

### Reconciliation with earlier evidence

| Check | Result |
| --- | --- |
| Pass-1 `retained-branches.tsv` rows | 1,452 |
| …of those still live at the recorded tip | 368 (0 moved, 1,084 absent) |
| Absent pass-1 retained rows explained by `deleted-branches-pass2.tsv` | 1,084 / 1,084 — 0 unexplained |
| Pass-2 deletion rows still live | 0 / 1,084 |
| Pass-1 deletion rows still live | 0 / 169 |
| Pass-2 names that were never in the pass-1 retained inventory | 0 |
| Live heads absent from the pass-1 retained inventory | 2 — `main` and the PR #1750 head |

`370 = 368 retained + main + PR #1750 head`.

Two branches present at the 09:18:07Z pass-2 snapshot are gone without an explicit delete call:
`docs/branch-cleanup-audit-refresh-20261107` (PR #1755 head) and `chore/branch-cleanup-pass2-20261107` (PR #1756
head). They are absent because the repository has `delete_branch_on_merge: true` and both pull requests merged.
Neither was ever part of the pass-1 retained inventory, so no inventory row needs correcting.

### Evidence

`pass3-classification.tsv` records one row per live head: name, tip SHA, tip committer date, tip age in days,
`merge-base --is-ancestor` result, `rev-list --count origin/main..<head>`, protected/open-PR/restore-point flags,
verdict and retention reason.

The ancestor set is cross-checked independently: `git branch -r --merged origin/main` returned the same 76 non-`main`
heads, and each reported 0 unique commits, so it is not an artifact of a single command.

### Verification limits

- The paginated GitHub branch listing confirmed `main` (`4785e5e4`), the open PR head (`380e1301`) and
  `backup/pr-1518-before-scope-correction` (`56ed79fb`) at the expected SHAs. The full 370-name listing payload
  exceeded the integration response limit, so name-for-name parity rests on `git ls-remote`, which reads the same
  remote the REST API serves.
- Per-ref deletion timestamps and API actors remain unavailable for passes 1 and 2 and are still not inferred.
- No delete call was issued, so no rate limiting occurred in this pass.
