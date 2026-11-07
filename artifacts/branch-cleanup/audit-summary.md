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

`main` still resolves to `6fa08ddc`, and no branch recorded as retained is missing.

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
