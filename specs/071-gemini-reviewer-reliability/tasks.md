# Tasks: Gemini Reviewer Reliability and Simplified Interface

## T001 — Confirm the root cause of the #1661 manual-trigger failure
- [x] Owner comment `@gemini full review ` at 2026-11-01T09:53:26Z on PR #1661 (GitHub API, `OWNER`).
- [x] No Gemini review or Gemini comment on #1661 after that timestamp (GitHub API).
- [x] `main` at that moment was `7dcdf469` (merge of #1662 at 09:36).
- [x] `.docs/manifest.json` at `7dcdf469` fails `JSON.parse` (line 408, column 5).
- [x] Reviewer parses the manifest at module scope (`gemini-reviewer.cjs:67`), so the throw precedes
      `main()` and its `.catch` reporter (`:1585`): silent failure, failed run, no PR output.
- [x] PR #1664 repaired exactly those characters 32 minutes later.

## T002 — Make module-load failures visible and non-fatal
- [x] `loadDocumentManifest()` returns `{ manifest, error }`; invalid JSON degrades to a disclosed
      coverage note instead of a crash.
- [x] Manifest parse error is surfaced in `coverageGaps`, so the review cannot look green.
- [x] Workflow gains an `if: failure()` step that comments the run link on the PR.

## T003 — Repair manual Full Review triggering
- [x] `parseFullReviewCommand()` accepts the command as a line in a real comment (trailing space,
      backticks/bold, quote markers, surrounding prose); only `gemini full review` matches.
- [x] Unsupported `@gemini` commands from trusted users get a visible reply naming the supported command.
- [x] `@gemini repair one`, `@gemini repair all`, `select all`, `select none`, `fix selected` removed.
- [x] Published review names `**Reviewed commit:** <sha>`; head re-fetched before publishing.

## T004 — Meaningful status colours
- [x] Red only for CRITICAL/HIGH; yellow for MEDIUM/LOW warnings; green only when the review completed
      with achieved coverage and no findings; neutral ⚪ for incomplete/failed runs naming what is unverified.
- [x] LOW merged into yellow, so exactly three colours are used and every finding stays selectable.

## T005 — Simplified interface
- [x] Two categories, one checkbox per red/yellow finding.
- [x] Exactly two fix controls: `Fix Selected`, `Fix All`. Select All / Clear Selection removed.
- [x] Footer carries the owner-specified explanation and the fenced lowercase `@gemini full review` last,
      using GitHub's native copy control. No other manual command.
- [x] Per-finding `@gemini repair one` blocks removed; implementation prompts retained.

## T006 — Suggestion safety
- [x] `applyAutoFix` re-checks the PR head immediately before posting suggestions and aborts when it moved
      or cannot be verified.
- [x] Deterministic eligibility/anchor/duplicate/path checks and independent validation retained.

## T007 — Amazon Q vs Gemini detection measurement
- [x] Pre-registered the measurement rules before collecting data: head-aligned comparison, definition of
      confirmed / false positive / missed / not-measured, duplicate instances counted separately from root
      causes, and the acceptance thresholds for the prospective cohort.
- [x] Measured the baseline from published reviews and repair commits: #1639, #1656, #1660, #1661, #1662.
      Amazon Q 7 findings (6 substantiated, 1 false positive, 5/5 defects in its reviewed heads);
      Gemini 3 published findings covering 2 confirmed defects, 0 false positives, 2 of 6 defects and 2
      failed passes, with one root cause published three times on #1661.
- [x] Corrected the earlier claim that Gemini reported 0 findings everywhere: it caught the stray
      `body {` on #1661 (`67cb91ce`) and the invalid manifest on #1662.
- [ ] Prospective cohort: append one row per merge for the first ten PRs merged after the reviewer change
      lands. Rows stay pending because the workflow reviews trusted `main`, so no PR merged since
      the change can be measured against it.

## Verify
- [ ] `node --check` on both reviewer scripts.
- [ ] Focused reviewer tests (quality, context, workflow, trigger).
- [ ] Full `pnpm test`.
- [ ] `pnpm exec tsc --noEmit`.
- [ ] `./freebuff-verify.sh` including production build measurement against the 495 MB cap.
- [ ] Live manual `@gemini full review` on the controlled test PR: run id, conclusion, published review,
      reviewed head SHA equal to the PR head.
- [ ] Fix Selected / Fix All evidence via the real parsing + selection functions on a rendered review body.
- [x] Historical comparison of Gemini findings on #1639–#1642 against the actual merged code
      (`specs/071-gemini-reviewer-reliability/detection-parity.md`); the prospective ten-PR cohort stays PENDING.
- [ ] Final diff audit; PR kept open and unmerged.

## Preserved (no change)
- Model chain `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`, provider endpoint,
  API-key handling, retry/fallback order, automatic `pull_request_target` review, Amazon Q files, native
  GitHub suggestions, owner control, application code, dependencies.


## T008 — Close the cross-function / scope detection gap
- [x] Traced every documented miss to a verified cause: head/tail clipping removed the changed band
      (#1642, #1656); PR-description claims were restated as fact (#1639); no goal-consistency,
      artifact, or benchmark-ordering instruction existed (#1642).
- [x] Corrected the #1642 record: at `d2603e29` the reviewer reported 2 real HIGH defects that Amazon Q
      never reported, so the miss was one-directional at an earlier head only.
- [x] `clipSourceWithAnchors()` keeps +/-40 lines around each changed line with a bounded head and tail;
      `collectSourceContext()` now anchors on `addedLines(file.patch)`.
- [x] `SCOPE_AND_CLAIM_GUIDANCE` added to the primary and adversarial prompts and to the reviewer rules;
      unanchorable defects are reported with `line: null` so the evidence gate discloses them.
- [x] Regression tests: anchored-middle retention, no-anchor fallback, unchanged-file pass-through,
      out-of-range anchor, guidance content, and adversarial prompt wiring (34 tests in the context suite).
- [ ] Live model replay of #1642/#1639 at their original heads (blocked: the workflow reviews trusted
      `main`; this reviewer code runs only after merge).
- [ ] Prospective ten-PR cohort rows (blocked on the same deployment prerequisite).
