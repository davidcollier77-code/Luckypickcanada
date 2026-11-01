# Amazon Q vs Gemini — detection-accuracy measurement

Purpose: replace the anecdotal claim "Gemini is not yet as dependable as Amazon Q" with counted,
reproducible numbers, and fix the rules before the data is collected so the result cannot be
cherry-picked afterwards.

Status: **protocol pre-registered; prospective cohort PENDING; baseline measured.**

## 1. Cohort

- **Prospective cohort (the requested measurement):** the first **ten** pull requests merged into
  `main` after this record lands. Rows are appended as each PR merges.
- **Baseline cohort (measured now, for comparison):** the most recent merged PRs that had a
  reviewed head from both tools: #1639, #1656, #1660, #1661, #1662.

### Why the prospective cohort is empty

The reviewer workflow checks out **trusted `main`**, not the PR head. Until the reviewer change
(PR #1665) merges, every live Gemini pass runs the **pre-gate** code, so a "next ten" measurement
today would measure code that is about to be replaced. Zero PRs have merged since that change was
proposed. This is a data-availability fact, not an implementation gap.

## 2. Definitions (fixed before collection)

| Term | Rule |
| --- | --- |
| **Finding** | One unique finding instance in a published review body or inline review comment. |
| **Root cause** | Findings with the same path, the same line and the same asserted defect are one root cause, counted once. |
| **Confirmed** | The defect is reproducible at the head the tool reviewed, **or** a later commit on that same PR repairs it. Evidence is a commit SHA or a reproduction, never the reviewer's own wording. |
| **False positive** | The finding asserts a defect that the code at the reviewed head does not exhibit. Style preferences and explicitly non-defect "concerns" are not counted as FP; if one is asserted as a defect, it counts. |
| **Missed** | A confirmed defect that was present at a head the tool actually reviewed, with no finding on it. |
| **Not measured** | The tool reviewed a different head than the defect existed at, or its pass failed. Recorded as `n/m`, never as a miss. |

Head alignment is mandatory: a tool is never credited with a miss for a defect introduced after the
head it reviewed, and never credited with a catch for a defect it reviewed only after a repair.

## 3. Baseline measurements

Bot identities: Amazon Q posts as `amazon-q-developer[bot]`; this repository's Gemini reviewer posts
as `github-actions[bot]`.

| PR | Head reviewed | Q findings | Q confirmed | Q FP | Gemini findings | Gemini confirmed | Gemini FP | Gemini missed | Gemini failed passes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #1639 | `c9ed5cc2` | 3 | 3 | 0 | 0 | 0 | 0 | **3** | **2** |
| #1656 | (84-file PR) | 4 | 3 (2 defects + 1 valid LOW) | 1 | 0 | 0 | 0 | **2** | 0 |
| #1661 | `d1b9d01b` | 0 (reviewed `1c7a17cb`, earlier) | — | 0 | 2 (4 instances) | 2 (1 root cause) | 0 | 0 (n/m — defect post-dates Q's head) | 0 |
| #1662 | `0ca5927a` | n/m | — | — | 1 | 1 | 0 | n/m | 0 |
| #1660 | — | 0 | — | 0 | 0 | — | 0 | n/m (no confirmed defect) | 0 |

Evidence per row:

- **#1639** — Q review `5702224017` at `c9ed5cc2`: the PR's stated security fix was not applied
  (`app/gift-email.js:141` still `Math.random()`), plus two lock-leak paths (`:289`, `:297`). All
  three repaired in `95e86bc6`. Gemini posted five reviews at the same heads, every one reporting
  **0 findings**, and two of those passes recorded `Expected double-quoted property name in JSON`
  failures — the model output was unparseable, so coverage was never real.
- **#1656** — Q's duplicate fetch-log and missing `.freebuff/` denylist findings were real and were
  fixed in `038b5cf9`; its `eval()` concern is real but test-only hygiene; its `return 1` shell
  claim was not a defect (measured: exit status 1 either way). Gemini reviewed the same 84 files
  with **0 findings**.
- **#1661** — Gemini review `5727611253` at `d1b9d01b` reported **2 findings for one root cause**: a
  stray `body {` inserted at `themes/default/default.css:113`, producing `body body`. It is real:
  commit `67cb91ce` removes exactly that line. Review `5727625987` then repeated both findings, so
  2 unique findings were published as 4 instances across 2 reviews. Q had reviewed the earlier head
  `1c7a17cb` and reported no blocking defects, so this is **not** counted as a Q miss.
- **#1662** — Gemini's single finding (`.docs/manifest.json:407`, missing trailing comma, invalid
  JSON) is real: the repaired manifest landed via #1664, and the same breakage had already stopped
  the reviewer from starting at all on #1661.
- **#1660** — neither tool posted a review comment and no repair commit followed, so there is no
  confirmed defect and nothing to score.

### Baseline totals

- **Amazon Q:** 7 findings — 6 substantiated (5 confirmed defects + 1 valid LOW), 1 false positive.
  Recall on defects present in its reviewed heads: **5 of 5**.
- **Gemini:** 3 unique findings — 3 confirmed, 0 false positives, published as 5 instances.
  Recall on defects present in its reviewed heads: **2 of 6** (missed all three #1639 findings and
  both #1656 findings, caught the #1661 CSS root cause and the #1662 JSON breakage).
- **Duplicate inflation:** #1661 published one root cause as 4 finding instances (2.0x per unique
  finding). Deduplication is part of the change under review, not yet measured live.

### What the baseline says

Gemini's two catches are both **syntactic, single-line, visible in a diff hunk** (a duplicated CSS
selector, a missing JSON comma). Both misses are **cross-function logic** (a security fix that was
never applied; a stale log inside a long script). That is a sharper and more defensible summary
than "unreliable": the pre-gate reviewer detects surface syntax and does not reliably follow values
across functions. It also is not the "0 findings everywhere" claim previously recorded — that claim
was true for #1639/#1656 only.

## 4. Prospective record — the next ten merged PRs

Fill one row per merge. Append only; never edit a recorded row.

| # | PR merged | Merged at | Head | Q findings | Q confirmed | Q FP | Gemini findings (root causes) | Gemini confirmed | Gemini FP | Gemini missed | Failed passes | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | _pending_ | | | | | | | | | | | |
| 2 | _pending_ | | | | | | | | | | | |
| 3 | _pending_ | | | | | | | | | | | |
| 4 | _pending_ | | | | | | | | | | | |
| 5 | _pending_ | | | | | | | | | | | |
| 6 | _pending_ | | | | | | | | | | | |
| 7 | _pending_ | | | | | | | | | | | |
| 8 | _pending_ | | | | | | | | | | | |
| 9 | _pending_ | | | | | | | | | | | |
| 10 | _pending_ | | | | | | | | | | | |

### Collection procedure per PR

1. `git log <merge>^2 --pretty='%h %ad %s'` on the PR branch, or the PR's commit list, to list
   every head that existed while a review was live.
2. Pull reviews: `GITHUB_LIST_REVIEWS_FOR_A_PULL_REQUEST`, then inline comments via
   `GITHUB_LIST_REVIEW_COMMENTS_ON_A_PULL_REQUEST`. Attribute by `user.login`.
3. For each finding, record `path:line`, then confirm or refute against **that** head:
   `git show <head>:<path>`. Confirm only if the asserted behaviour is present.
4. Count a miss only when a confirmed defect is present at a head the tool reviewed.
5. Count duplicate instances separately from root causes so publication noise is visible.
6. Record the PR number and head SHA in the row so any number can be re-derived later.

A row is never scored from the PR description, a bot's self-assessment, or a reviewer's own claim
that a fix was applied.

## 5. Acceptance for the change under review

The change is a genuine improvement only if, on the prospective cohort:

- Gemini **confirmed** findings ≥ 5 of the defects Amazon Q confirms, and
- Gemini **false positives** stay at or below Q's rate, and
- **failed passes** fall to 0, and
- **duplicate inflation** falls to 1.0 instance per root cause.

Until ten PRs have merged, none of those conditions is demonstrated and the reviewer must not be
described as a dependability-equal replacement for Amazon Q.
