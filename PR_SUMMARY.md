# PR Summary — Gemini Reviewer Source Context

## Task group
**deep-dive** — this change improves a cross-cutting review pipeline spanning GitHub source retrieval, context assembly, model prompting, and documentation selection.

## Routed documentation and evidence
- `.jules/deep-dive.md` — USED: YES; USEFUL: YES — defines evidence-led investigation and task-scoped implementation.
- `.docs/deep-dive/jules_google_docs.md` — USED: YES; USEFUL: NO — required routed snapshot inspected; it describes Jules CLI behavior, not reviewer source-context implementation.
- `.docs/deep-dive/_google-gemini_gemini-cli.md` — USED: YES; USEFUL: NO — required Gemini CLI snapshot inspected; it does not materially inform this GitHub API workflow change.
- `.docs/deep-dive/_websites_ai_google_dev_gemini-api.md` — USED: YES; USEFUL: YES — consulted for Gemini API integration context; existing model request/fallback contract is preserved.
- `AGENTS.md` — USED: YES; USEFUL: YES — authoritative scope, security, Spec Kit, verification, and PR-summary requirements.

## Objective
Make Gemini reason about full changed-file source and relevant local imports, compare selected code with the PR base, and improve detection of context-dependent regressions such as the AVIF/WebP LCP preload issue identified by Amazon Q on merged PR #1610.

## Changes
- `.github/scripts/gemini-reviewer.cjs`: bounded read-only full-source retrieval at immutable PR head/base SHAs; relative-import context; context limits and honest coverage notes; end-to-end and image-preload reasoning; path/domain-based fallback task-group selection; exported pure helpers for regression tests.
- `__tests__/gemini-reviewer-context.test.ts`: import resolution, traversal protection, group selection, clipping, added-line anchors, and relevant-context tests.
- `.specify/features/gemini-review-context/`: specification, plan, tasks, requirements checklist.
- `memory-bank/activeContext.md`: record the active reviewer improvement and honest verification state.
- Existing Gemini rules, workflow permissions/triggers, auto-fix behavior, dependencies, site behavior, artwork, and Amazon Q rules are intentionally unchanged.

## Spec Kit stages
- Specify: `.specify/features/gemini-review-context/spec.md` — created.
- Plan: `.specify/features/gemini-review-context/plan.md` — created.
- Tasks: `.specify/features/gemini-review-context/tasks.md` — created.
- Implement: reviewer and tests updated; verification awaits PR-head CI.

## Verification
- Repository governance, reviewer implementation, workflow, rules, regression tests, routed deep-dive documents, and Amazon Q findings on merged PR #1610 inspected.
- JavaScript syntax compilation: PASS in the connected analysis runtime.
- Vitest, `./jules-verify.sh`, and current-head CI: pending; this API-connected session cannot run the repository shell directly.
- Live Gemini accuracy remains unverified until a suitable post-change review runs. PR #1610 is the regression reference, not a claim that the model has passed it.

## Safety
PR content is treated as untrusted text and never executed. Source retrieval is read-only. No secrets or dependencies changed.

**USEFUL RESULT: PENDING** — implementation is proposed; CI and live-model acceptance remain pending.
