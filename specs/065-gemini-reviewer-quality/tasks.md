# Tasks: Gemini Reviewer Quality, Coverage, and Selected-Finding Workflow

## Inspect
- [x] Read repository governance, Memory Bank, the `deep-dive` group instructions, and the mandatory Gemini API Developer Skill.
- [x] Establish the reviewer baseline in `.github/scripts/gemini-reviewer.cjs`, `.github/scripts/gemini-autofix.cjs`, `.gemini/rules/luckypickcanada.md`, and `.github/workflows/gemini-reviewer.yml`.
- [x] Confirm the configured model identifiers and fallback order: `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`.
- [x] Verify Amazon Q's four PR #1656 findings against the code: the duplicate fetch log and the missing `.freebuff/` denylist entry were real and fixed in `038b5cf9`; the test-only `eval` is a robustness concern; the `return`/`builtin exit` construct was measured to propagate a non-zero status when executed and when sourced.

## Implement
- [x] Add severity rubric, evidence-verification guidance, mirrored path-enumeration checks, and log-message criteria to the reviewer prompts.
- [x] Calibrate the reviewer skill with the verified comparisons and the required four-part finding evidence.
- [x] Add red/yellow/additional category classification, severity ordering, and root-cause deduplication.
- [x] Render three categories with per-finding checkboxes, Select All and Clear Selection controls, and a separate informational coverage section.
- [x] Add `@gemini select all`, `@gemini select none`, and `@gemini fix selected`, and rewrite only the finding checkbox lines of the current-head review.
- [x] Add independent validation of selected findings plus deterministic path/line/duplicate rejection before suggestion generation.
- [x] Report every selected finding as fixed, rejected, or unresolved with a reason, and state how many unselected findings were untouched.
- [x] Make source-context retrieval budget-aware and disclose complete/clipped/patch-only coverage by file path and reason.
- [x] Add JSON recovery, retry classification for transient transport/parse failures, and a bounded format retry.
- [x] Bound review-body size by dropping prompts rather than findings.
- [x] Add `__tests__/gemini-reviewer-quality.test.ts` and update the workflow mode-list assertion.
- [x] Leave the model identifiers, fallback order, provider, credentials, workflow triggers, permissions, and Amazon Q untouched.

## Verify and report
- [x] Focused reviewer tests (`gemini-reviewer-quality`, `gemini-reviewer-context`, `gemini-reviewer-workflow`): PASS.
- [x] Full suite `pnpm run test`: PASS — 23 files / 170 tests.
- [x] `pnpm exec tsc --noEmit`: PASS.
- [x] `./freebuff-verify.sh`: PASS — Spec Kit gate, typecheck, Next.js production build, and refresh-docs 19/19. Build artefacts 330,129,985 bytes / 314.84 MiB, below the 495 MB cap.
- [x] Both reviewer scripts parse with `node --check`; model identifiers and fallback order are unchanged (`gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`), as are the provider, key handling, and workflow triggers.
- [x] Amazon Q files and the Gemini workflow file are untouched by this change.
- [ ] Live Gemini or GitHub replay against PR #1656: NOT RUN — this workspace has no `GEMINI_API_KEY` and no GitHub token, so no live model call, GitHub API replay, or live review publication was possible.
- [x] PR #1659 opened and left open and unmerged for owner review.
