# Gemini reviewer: one root instruction file, no Library-document context

## Task and task group

Simplify the Gemini PR reviewer: move its standing review instructions to a single root-level
`GEMINI_REVIEWER.md` modelled on Amazon Q's three-section rules, consolidate the relevant existing
Gemini instructions there, retire `.gemini/rules/luckypickcanada.md`, and stop the reviewer from
selecting, loading or transmitting Library (`.docs/`) documentation into any review or fix prompt.

Task group: **`deep-dive`** — the work crosses the reviewer script, the autofix module, the trusted
GitHub Actions workflow, three reviewer test suites, and Spec Kit routing. It is an investigation-led
simplification of an existing cross-file pipeline, not new user-facing functionality, so `creation`,
`polishing`, `testing`, `security`, `audio` and `seo` do not apply.

## Implementation result

- **New `GEMINI_REVIEWER.md`** (root): Gemini's single authoritative review instruction file in the
  Amazon Q A–B–C shape — A ANALYZE, B BOUNDARIES, C COMMUNICATE — consolidating the existing
  Gemini-specific rules the implementation depends on (status-colour meanings, 0.80 confidence
  threshold, severity rubric, evidence/claim verification, coverage disclosure, adversarial pass,
  Fix Selected / Fix All controls, no edit/commit/push/approve/merge boundary). Per-document and
  per-snapshot instructions were deliberately dropped because that behaviour no longer exists.
- **`.github/scripts/gemini-reviewer.cjs`**: `RULE_PATH` is now `GEMINI_REVIEWER.md`; the fail-closed
  `if (!RULES) throw` check is unchanged. Removed the entire Library-document path: manifest parsing
  and its coverage gap, task-group classification, relevance-guarded Gemini reference selection,
  snapshot loading, Gemini API Developer Skill loading, document assessments, the review-context
  document report, their prompt fields, and their exports.
- **`.github/scripts/gemini-autofix.cjs`**: verification and suggestion prompts no longer accept or
  render `docs`, `docPaths` or `documentReport`; the footer no longer prints a document-library
  report.
- **`.github/workflows/gemini-reviewer.yml`**: the trusted-file integrity check now guards
  `GEMINI_REVIEWER.md` instead of the retired `.gemini/rules` directory. Permissions, triggers,
  trusted-base checkout and the failure reporter are unchanged.
- **`.gemini/rules/luckypickcanada.md`**: deleted after a repository-wide search confirmed the
  workflow and the reviewer tests were its only non-historical consumers. No compatibility shim or
  second rule copy was added.
- **Tests**: `__tests__/gemini-reviewer-workflow.test.ts` now asserts the root rule file, the new
  workflow guard, and the absence of document loading; `...-context.test.ts` and `...-trigger.test.ts`
  drop document-selection assertions and assert the new instruction loading and preserved source
  context.
- **Preserved**: changed-code and relevant-source retrieval, coverage accounting and clipped/
  unavailable disclosure, batching and patch truncation, the independent adversarial pass,
  `REVIEW_RESPONSE_SCHEMA` plus `validateReviewPayload`, the JSON recovery ladder, the three-model
  fallback chain, review formatting and red/yellow/green/neutral meanings, owner-controlled opt-in
  suggestions, workflow permissions and trusted-base execution.

## Files changed

- `GEMINI_REVIEWER.md` (new)
- `.gemini/rules/luckypickcanada.md` (deleted)
- `.github/scripts/gemini-reviewer.cjs`
- `.github/scripts/gemini-autofix.cjs`
- `.github/workflows/gemini-reviewer.yml`
- `__tests__/gemini-reviewer-context.test.ts`
- `__tests__/gemini-reviewer-workflow.test.ts`
- `__tests__/gemini-reviewer-trigger.test.ts`
- `.specify/features/gemini-review-context/{spec,plan,tasks}.md`
- `.specify/feature.json`
- `PR_SUMMARY.md`, `memory-bank/activeContext.md`

## Spec Kit stages and artifacts

Specify → Plan → Tasks → Implement, reusing the existing feature directory rather than creating a
duplicate:

- `.specify/features/gemini-review-context/spec.md` — updated requirements and acceptance scenarios
  for one instruction file and no Library context.
- `.specify/features/gemini-review-context/plan.md` — removal list, preserved capabilities, and
  verification plan.
- `.specify/features/gemini-review-context/tasks.md` — ordered tasks with real completion state
  (live-model acceptance remains BLOCKED).
- `.specify/feature.json` — points at this reused feature.

`specs/071-gemini-reviewer-reliability` and `specs/065-gemini-reviewer-quality` were inspected and
left unchanged: they record merged work whose results this change preserves.

The historical records `specs/051-gemini-reviewer-replacement`, `specs/065-gemini-reviewer-quality`
and `specs/071-gemini-reviewer-reliability` still name `.gemini/rules/luckypickcanada.md` because
they document work merged while that path was current. They are deliberately left unchanged as
point-in-time records; editing another feature's `spec.md`/`plan.md`/`tasks.md` would also break the
single-feature Spec Kit gate. One `Superseded references` note in the active spec records that those
mentions are historical and that `GEMINI_REVIEWER.md` is the only current path. The `.docs/`
mention of `.gemini/` describes the Gemini CLI's own configuration directory and is unrelated.

## Verification (commands actually run)

Environment: cloud Linux worktree; `pnpm@10.30.3` installed locally because it was absent; lockfile
preserved and `pnpm install --frozen-lockfile` used (no `npm ci`).

| Check | Command | Result |
| --- | --- | --- |
| Script syntax | `node --check` on both reviewer scripts | PASS |
| Focused reviewer suites | `pnpm exec vitest run` on the 3 changed reviewer suites | PASS — 3 files / 87 tests |
| Focused reviewer suites (4 files, with quality suite) | `pnpm exec vitest run` before the final comment-only edit | PASS — 4 files / 111 tests |
| Full unit suite | `pnpm exec vitest run` | PASS — 24 files / 224 tests |
| Repository gate | `./freebuff-verify.sh` (Spec Kit gate, `pnpm tsc --noEmit`, production build, refresh-docs tests) | PASS — exit 0; Spec Kit artifacts verified; refresh-docs 19/19 |
| Production build size | `du -sb .next` after the gate | PASS — 315,495,656 bytes / 300.88 MiB (< 495 MB) |
| Spec Kit gate with resolved base | `SPEC_KIT_BASE_REF=83a1c19a bash scripts/verify-speckit-task.sh` | PASS — spec, plan and tasks verified |
| Final diff audit | `git diff` of every changed file | PASS — only the intended removals/additions |
| Residual context scan | search both scripts for `.docs/`, manifest, document-assessment and document-report tokens | PASS — the only `.docs/` hit is the autofix protected-path denylist, not loading |

Note on the gate: this checkout has no `origin/main` or local `main` ref, so a bare
`scripts/verify-speckit-task.sh` sees only uncommitted changes and fails once artifacts are
committed. Run with `SPEC_KIT_BASE_REF` set to the branch point (`83a1c19a`) here; CI supplies
`GITHUB_BASE_REF` and resolves the base itself.

Not run / not verified:

- **PENDING — GitHub Actions on the PR head.** Checked only after push; no PR CI result is claimed.
- **BLOCKED — a live Gemini review.** This environment has no `GEMINI_API_KEY`, so no model call was
  made. The workflow (trusted-base code) is the confirmation path after merge.
- **NOT RUN — browser verification.** Not applicable: no application code, UI, route, asset or
  user-facing behaviour changed.

## Behaviour preserved, risks and final check

Preserved: every reviewer capability listed in the task, the Library system itself
(`.docs/manifest.json`, documentation updater, snapshots), `AGENTS.md` and Freebuff governance
(untouched), workflow permissions/triggers, Amazon Q configuration, and the whole application runtime.

Remaining risks:

- Because the workflow runs trusted base-branch code, the simplified reviewer only executes live
  after merge; until then the new context behaviour is proven by tests and code inspection only.
- Removing task-group selection also removes the "task group" line from the review footer; the
  footer no longer reports review context at all beyond models, coverage and source context.

Final diff check: the diff contains exactly the files listed above; the deleted rules file has no
remaining runtime consumer; both scripts parse and the full test suite plus repository verification
gate pass.

**USEFUL RESULT: YES**
