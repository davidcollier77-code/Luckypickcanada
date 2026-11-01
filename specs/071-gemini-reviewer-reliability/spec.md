# Feature Specification: Gemini Reviewer Reliability, Simplified Interface, and Amazon Q Replacement

Task group: `deep-dive` (cross-file investigation of the reviewer pipeline, its trigger path, and its
verified output against real repository history).

## User problem

Gemini is intended to replace Amazon Q as the repository's automated pull-request reviewer, but it is
not yet dependable:

1. **The manual Full Review trigger is not trustworthy.** On PR #1661 the owner posted the exact
   command `@gemini full review` at 2026-11-01T09:53:26Z. No new review and no error message ever
   appeared. The run was created, then died before it could report anything.
2. **The published status colours do not match reality.** A clean review with coverage gaps renders a
   yellow "REVIEW INCOMPLETE" banner while the overview text says "VERDICT: GREEN"; nothing
   distinguishes "no defects found" from "the review did not finish", and an unfinished run can look
   like a finding.
3. **The interface is not the requested one.** There are four selection/fix controls plus five text
   commands (`select all`, `select none`, `fix selected`, `repair one`, `repair all`), a separate
   single-finding repair path, and a fourth "additional" (blue) colour that the owner does not want.
4. **Findings are not yet provably dependable.** There is no measurement of Gemini's detection accuracy
   against real historical PRs, and no evidence separating confirmed defects from warnings.

## Verified root cause of the manual trigger failure (evidence, not inference)

| Evidence | Source |
| --- | --- |
| Owner comment `@gemini full review ` (trailing space) at 09:53:26Z, `author_association: OWNER` | GitHub API, PR #1661 issue comment 6555763808 |
| No Gemini review or Gemini comment exists on #1661 after 09:53 | GitHub API, reviews + issue comments |
| `main` HEAD at that moment was `7dcdf469` (merge of PR #1662 at 09:36) | `git log --before=2026-11-01T09:53:00Z` |
| `.docs/manifest.json` at `7dcdf469` is **invalid JSON** (`Expected ',' or ']' after array element ... line 408 column 5`) | `git show 7dcdf469:.docs/manifest.json` + `JSON.parse` |
| The reviewer parses that file at **module scope**: `const MANIFEST = ... JSON.parse(readFileSync(...))` | `.github/scripts/gemini-reviewer.cjs:67` |
| The only error reporter is attached to `main()`: `if (require.main === module) main().catch(...)` | `.github/scripts/gemini-reviewer.cjs:1585` |
| PR #1664, merged 10:25 (**32 minutes after the command**), repaired exactly those 2 characters | `git diff --stat 7dcdf469 c8e07d26 -- .docs/manifest.json` |

The workflow fired, the comment reached the job, and the command matched. The process then threw during
module load, before `main()` existed, so the `catch` that posts "Gemini PR Reviewer stopped…" never ran.
The command produced a failed Actions run and **zero diagnostics on the PR**: a silent trigger failure.

## Desired outcome

1. A manual `@gemini full review` always either starts a genuinely new full review against the latest PR
   head or produces a visible explanation on the PR. No silent skips.
2. Status colours mean one thing each: red = confirmed critical/high findings, yellow = confirmed
   warnings, green = completed review with required coverage and no findings, and a neutral status for
   runs that are incomplete or failed, naming what stays unverified.
3. Exactly two fix controls (Fix Selected, Fix All), one checkbox per red and yellow finding, and one
   manual command with a copy control at the very bottom of the review.
4. Findings are revalidated against the current head immediately before suggestions are posted, and
   stale heads can never produce suggestions against outdated code.
5. Measured detection accuracy against historical PRs #1639–#1642, reported honestly with limitations.
6. Coverage must describe what was actually reviewed: complete changed-region coverage is reported
   separately from whole-file delivery, documentation coverage is reported separately from code
   coverage, and only a genuinely unsupplied changed region can prevent a green verdict.

## In scope

- `.github/scripts/gemini-reviewer.cjs`: verdict/status model, finding categories, rendering, command
  parsing, failure reporting, head identification, manifest resilience.
- `.github/scripts/gemini-autofix.cjs`: pre-post head revalidation.
- `.github/workflows/gemini-reviewer.yml`: a visible failure-reporting step for runs that die before the
  script can comment.
- `.gemini/rules/luckypickcanada.md`: reviewer instructions matching the two-colour interface and the
  single manual command.
- `__tests__/gemini-reviewer-*.test.ts`: regression coverage.
- Spec Kit artifacts and the PR summary.

## Out of scope (must be preserved)

- Gemini model identifiers (`gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`), provider
  endpoint, API-key handling, retry/fallback order. No model migration.
- Amazon Q configuration, workflow, and rules; the existing native GitHub suggestion mechanism; owner
  control; automatic review on `pull_request_target`.
- Application behaviour, visuals, dependencies, deployment, secrets, governance.

## Acceptance criteria

1. Only `@gemini full review` is accepted as a manual command; `@gemini repair one` and
   `@gemini repair all` are rejected, and `@gemini select all|none` / `@gemini fix selected` are gone.
2. Exactly two fix controls exist: **Fix Selected** and **Fix All**. Every red and yellow finding has its
   own checkbox; both are selectable.
3. The footer shows the literal, lowercase, copyable `@gemini full review` inside a fenced block, with the
   owner-specified explanation immediately above it, and no other manual command.
4. Red is shown only for confirmed critical/high findings; yellow only for confirmed warnings; green only
   for a completed review with no findings and no coverage gaps; incomplete/failed runs use a distinct
   neutral status naming what remains unverified.
5. A malformed `.docs/manifest.json`, or any other module-load failure, cannot stop the reviewer without
   a visible PR comment and a failed run.
6. The published review names the exact reviewed commit SHA and refuses to publish when the head moved.
7. Fix Selected acts only on checked findings; Fix All acts on every eligible finding; ineligible findings
   are rejected with a stated reason; the head is re-checked immediately before posting suggestions.
8. Regression tests cover command parsing, manual triggering, selection, Fix Selected, Fix All, stale
   heads, source coverage, finding validation, severity mapping, and suggestion safety.
9. The PR stays open and unmerged.


## Cross-function / scope detection gap (investigated 2026-11-01)

The comparison against Amazon Q (#1639, #1642, #1656) showed misses beyond interface problems. Each
miss was traced to a verified cause rather than assumed:

1. **Clipped source removed the changed region.** `clipSource()` kept the head 70% and tail 30% of a
   file. In a long component the changed hunks - and the unchanged code the PR's goal implied should
   change - sit in the dropped middle band. Both #1642 (surviving `forEach` calls near lines 754-881)
   and #1656 (stale log in a long script) are covered by this cause, and the published reviews
   disclose `Source shortened: ...` at the same time.
2. **PR claims were treated as evidence.** On #1639 the review overview restated the description's
   claim ("successfully replaces `Math.random()`") while `app/gift-email.js` still called
   `Math.random()` on an unchanged line.
3. **Nothing said to check the rest of the file against a stated mechanical goal**, to treat committed
   scratch artifacts (patch dumps, ad-hoc benchmarks, generator scripts) as findings, or to check a
   benchmark's ordering before accepting its number.

Counter-evidence in the same case: at head `d2603e29` the reviewer reported two HIGH defects on #1642
that Amazon Q never reported (missing `ctx.stroke()` in the meteor trail, duplicated path iteration and
missing stroke in the spark trail). The gap is not one-directional.

### Required behaviour

- Changed-file source must keep the regions around the changed lines, not only the file's ends.
- A claimed change that is absent from the code is a finding; when no changed line represents it, it is
  reported with `line: null` so the added-line evidence gate discloses it instead of discarding it.
- Mechanical goals are checked for survivors across the supplied full source.
- Committed scratch artifacts and unfair benchmark comparisons are reported.

### Explicitly not in scope

Reverse-dependency (caller/importer) discovery. No investigated miss was caused by missing caller
context - every one occurred inside a changed file - and a repository-wide importer scan would cost
O(repository) fetches per review. It was rejected as unjustified scope rather than silently skipped.


## Post-merge validation and JSON reliability (2026-11-01)

PR #1665 merged as `121913171a093b81e74e845719378d1a15fcbb41` at `2026-11-01T12:54:22Z`; `main` is
that merge commit and the deployed reviewer contains `clipSourceWithAnchors` and
`SCOPE_AND_CLAIM_GUIDANCE`. Validation from here on must use the trusted base-branch reviewer.

- **Live model replay of historical heads:** required to prove detection improvement, and **BLOCKED**
  in the development environment because `GEMINI_API_KEY` is unset there. The key exists only as a
  repository secret used by the workflow. No replay has been claimed.
- **JSON reliability:** the deployed code already had a bounded recovery ladder (fence strip, embedded
  object, trailing-comma repair, balanced closing of a truncated tail). Two gaps remained: no
  `responseSchema` enforcement, and a payload that parsed but lacked a `findings` array flowed into
  `normalizeFindings(undefined)` and became a zero-finding "clean" review. Both are corrected.
- **Cohort activation:** the prospective window opens after the merge commit. No PR has merged since,
  so the cohort remains 0 of 10 with no rows populated.

### JSON reliability requirements

- Enforce the documented review shape with `generationConfig.responseSchema` on the existing endpoint
  and model chain, degrading to JSON MIME output only if a provider rejects the schema with HTTP 400.
- Treat a parsed payload that fails `validateReviewPayload()` as a failed pass, never as zero findings.
- Keep every retry bounded, keep the fallback order unchanged, and never invent findings, paths, lines,
  or severities during recovery.
