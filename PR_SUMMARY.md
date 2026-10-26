# PR Summary — Gemini Reviewer Source Context

## Task group
**deep-dive** — this change improves a cross-cutting review pipeline spanning GitHub source retrieval, context assembly, model prompting, and documentation selection.

## Objective
Make Gemini reason about full changed-file source and relevant local imports, compare selected code with the PR base, and improve detection of context-dependent regressions such as the AVIF/WebP LCP preload issue identified by Amazon Q on merged PR #1610.

## Changes
- `.github/scripts/gemini-reviewer.cjs`: bounded read-only full-source retrieval at immutable PR head/base SHAs; relative-import context; context limits and honest coverage notes; end-to-end and image-preload reasoning; path/domain-based fallback task-group selection; exported pure helpers for regression tests.
- `__tests__/gemini-reviewer-context.test.ts`: import resolution, traversal protection, group selection, clipping, added-line anchors, and relevant-context tests.
- `.specify/features/gemini-review-context/`: specification, plan, tasks, requirements checklist.
- Existing Gemini rules, workflow permissions/triggers, auto-fix behavior, dependencies, site behavior, artwork, and Amazon Q rules are intentionally unchanged.

## Verification
- Repository files and merged PR #1610 evidence inspected through GitHub API.
- Local shell/Vitest and `./jules-verify.sh` were not available in this API-connected session; CI must provide authoritative results.
- Live Gemini accuracy remains unverified until a suitable post-change review runs. PR #1610 is the regression reference, not a claim that the model has passed it.

## Safety
PR content is treated as untrusted text and never executed. Source retrieval is read-only. No secrets or dependencies changed.

**USEFUL RESULT: PENDING** — implementation is proposed; CI and live-model acceptance remain pending.
