# Implementation Plan: Gemini Reviewer Reliability and Simplified Interface

## Approach

Four changes, each tied to verified evidence, with no model, provider, trigger-scope, or Amazon Q change.

### 1. Eliminate the verified silent-failure class (root cause of the #1661 trigger failure)

Evidence chain: the owner's `@gemini full review` at 2026-11-01T09:53:26Z produced no review and no
comment; `main` was `7dcdf469`; `.docs/manifest.json` at that commit did not parse; the reviewer parsed it
at module scope (line 67); the only reporter was `main().catch(...)` (line 1585), which a module-load throw
cannot reach.

- Replace the module-scope `JSON.parse` with `loadDocumentManifest()`, returning `{ manifest, error }`.
  A malformed index degrades to "optional library snapshots were not used" and is disclosed as a coverage
  note. It can no longer terminate the process.
- Keep a hard failure only for genuinely unusable reviewer rules, which produce a visible error.
- Add a workflow step `if: failure()` that posts a comment naming the run, so any future crash (including
  one before the script can speak) is reported on the PR instead of vanishing.

### 2. Make the manual trigger actually trigger

- `parseFullReviewCommand()` recognises the command as its own line in a real comment: tolerated leading
  quote markers, backticks/bold markers, normalised internal whitespace, a trailing space, or trailing
  punctuation. Only the phrase `gemini full review` is accepted.
- A trusted comment that mentions `@gemini` but matches no supported command now gets a visible reply with
  the exact supported command; the previous behaviour logged and returned, which is indistinguishable from
  a broken trigger.
- `@gemini repair one`, `@gemini repair all`, `@gemini select all`, `@gemini select none`, and
  `@gemini fix selected` are removed. `@gemini full review` is the only manual command.
- The published review states `**Reviewed commit:** <sha>` and still re-fetches the PR immediately before
  publishing, refusing to publish if the head moved.

### 3. Status colour model

`buildReviewVerdict(findings, coverageGaps, { reviewCompleted })`:

| Condition | Status |
| --- | --- |
| Any CRITICAL/HIGH finding | 🔴 `FIXES NEEDED` |
| Any MEDIUM/LOW finding | 🟡 `WARNINGS FOUND` |
| No findings, but a batch failed or coverage was incomplete | ⚪ `REVIEW INCOMPLETE — NOT VERIFIED` + what is unverified |
| No findings, complete coverage | 🟢 `REVIEW COMPLETE — NO FINDINGS` |

Green now requires completed review passes and achieved coverage; a technical incompleteness is neutral,
never red, and never green. LOW findings join MEDIUM in yellow, so exactly three colours exist and every
finding keeps its own checkbox.

### 4. Interface

- Two categories (red, yellow), each finding with an individual checkbox.
- Exactly two fix controls: `🛠️ **Fix Selected**` and `🪄 **Fix All**`. Selection (which findings are
  checked) is the only other interaction; Select All / Clear Selection are removed.
- Bottom of the review: the owner-specified "Request fixes" and "Run another full review" text, then the
  literal lowercase command inside a fenced block (GitHub's native copy control), and nothing after it.
- Per-finding "request a targeted suggestion / @gemini repair one" blocks are removed; the copy/paste
  implementation prompt for another agent is retained.

### 5. Suggestion safety

- `applyAutoFix` takes `expectedHeadSha` and re-fetches the PR head immediately before `POST /reviews`.
  A moved or unverifiable head aborts with a message and posts no suggestions.
- Deterministic eligibility, anchor, duplicate, and path checks stay unchanged and still run before any
  model call; independent validation still decides fixed/rejected/unresolved.

## Files

| File | Change |
| --- | --- |
| `.github/scripts/gemini-reviewer.cjs` | manifest loader, verdict model, two categories, rendering/footer, command parsing, head line, mode list, manifest gap |
| `.github/scripts/gemini-autofix.cjs` | pre-post head revalidation |
| `.github/workflows/gemini-reviewer.yml` | failure-reporting step only |
| `.gemini/rules/luckypickcanada.md` | two-colour interface, single manual command, no repair-one/all |
| `__tests__/gemini-reviewer-*.test.ts` | updated + new trigger/interface regression coverage |
| `specs/071-gemini-reviewer-reliability/*` | Spec Kit artifacts |
| `memory-bank/activeContext.md` | active task context |

## Risks and mitigations

- **Removing text commands could strand an owner mid-thread.** Old review bodies still parse their
  `Fix all findings` / `Fix selected findings` controls, and the current-head SHA check rejects stale ones;
  the new footer documents the two controls.
- **Merging LOW into yellow changes historical rendering.** Severity is stored per finding, so old state
  re-renders consistently; no finding is lost.
- **A failure-reporting step could spam.** It runs only on failure and only when a PR number is derivable.

## Verification

`node --check` both scripts; focused and full Vitest; `tsc --noEmit`; `./freebuff-verify.sh` with production
build measurement against the 495 MB cap; a live manual `@gemini full review` on a controlled test PR with
the Actions run and published review checked for the correct head SHA. Live checkbox interaction on GitHub
is reported as owner-verified only if actually observed.


### 6. Changed-hunk source retention and scope/claim guidance

Evidence: the #1642 and #1656 misses coexisted with `Source shortened:` coverage notes, and #1639's
overview repeated the PR's claim while the code still had the old call.

- `clipSourceWithAnchors(source, limit, lineNumbers)` keeps a 20% head (imports/declarations), a window
  of +/-40 lines around every changed line, and a 15% tail, joined by an explicit omission marker and
  still bounded by the same per-file limit. With no known changed lines it defers to `clipSource`, so
  behaviour is unchanged wherever anchors are unavailable. `collectSourceContext()` passes
  `addedLines(file.patch)` as the anchors.
- New `SCOPE_AND_CLAIM_GUIDANCE`, added to both the primary and adversarial prompts and mirrored in
  `.gemini/rules/luckypickcanada.md`: PR claims are not evidence; absent claimed changes are findings;
  `line: null` is the anchor for a defect that no added line represents; mechanical goals are checked
  for survivors; scratch artifacts and unfair benchmarks are findings.
- Not added: reverse-dependency discovery (no investigated miss required it; O(repository) cost).


### 7. Structured-output enforcement and payload validation

Evidence: the deployed reviewer set `responseMimeType: application/json` but sent no `responseSchema`,
and `answer.result.findings` was passed to `normalizeFindings()` even when the key was absent, which
turns malformed-but-parseable output into an empty findings list.

- `REVIEW_RESPONSE_SCHEMA` documents the review contract (summary, findings with path/severity/title/
  problem/suggested_fix and nullable line/suggestion, positive_observations, document_assessments) and
  is sent as `generationConfig.responseSchema` on the existing endpoint with the existing model chain.
- `validateReviewPayload()` rejects a payload whose `findings` is missing, non-array, or contains an
  entry without a usable `path`. `askModel()` treats a rejection as a retryable failed pass, so the
  existing `REVIEW INCOMPLETE — NOT VERIFIED` path handles exhaustion instead of publishing a clean
  result.
- If a model returns HTTP 400 whose body mentions the schema, the same model is retried once with JSON
  MIME output only; other HTTP 400s remain non-retryable, so bounded retry behaviour is preserved.


### 8. Changed-region coverage, budget-based per-file context, separate documentation coverage

Evidence: every live review of the 7-file PR #1666 reported `0 of 7` files fully reviewed and could
never leave the neutral status. `MAX_CHANGED_SOURCE_CHARS = 6000` was applied inside the same
`Math.min()` as `floor(budget / remainingFiles)`, so on that PR (160,000 / 7 = 22,857 per file) at
least 118,000 characters of the budget were unreachable. Measured changed-region requirements at that
head: reviewer source 8,399, context test 5,589, memory-bank 10,027, detection-parity 4,538, plan
3,963, spec 4,304, tasks 4,515 — 41,335 in total (26% of the budget), two files above the old ceiling.

- `perFileSourceLimit(remainingBudget, remainingFiles, { documentation })`: clamp of
  `budget / remainingFiles` between the 1,500-character minimum and a 24,000-character maximum (4,000
  for documentation), never above the remaining budget.
- `clipSourceWithAnchors()` returns `regions: { required, supplied, complete }`. A window counts as
  supplied only when every line of it was included; regions that fit whole are supplied first; a region
  that cannot fit keeps text centred on the changed line and is reported as not supplied.
- `collectSourceContext()` records whole-file delivery (`fullSource`/`partial`) and changed-region
  completeness (`regions`) separately, and counts documentation in its own bucket outside the code
  denominator.
- `coverageGapNotes()` decides the verdict: an unsupplied changed region or a patch-only code file keeps
  the review neutral. Whole-file incompleteness and documentation coverage are disclosed as ℹ️ notes and
  do not veto a review that supplied every changed region.
- Documentation uses a 20-line window and a 4,000-character ceiling and never prevents a green verdict.
  The 160,000-character total is unchanged: the measurements do not justify raising it.
- Not claimed: better defect detection. Gemini still missed all four Amazon Q findings on the same heads.
