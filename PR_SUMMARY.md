# PR Summary — Gemini Reviewer Context and Evidence-Led Regression Reasoning

## Task group
**deep-dive** — improves a cross-cutting review pipeline spanning read-only GitHub source retrieval, context assembly, model prompting, task-group selection, and regression tests.

## Routed documentation and evidence
- `.jules/deep-dive.md` — USED: YES; USEFUL: YES — requires evidence-led investigation and task-scoped implementation.
- `.docs/deep-dive/jules_google_docs.md` — USED: YES; USEFUL: NO — inspected as required; Jules CLI material does not change this implementation.
- `.docs/deep-dive/_google-gemini_gemini-cli.md` — USED: YES; USEFUL: NO — inspected as required; no material guidance for GitHub API source retrieval or the reviewed findings.
- `.docs/deep-dive/_websites_ai_google_dev_gemini-api.md` — USED: YES; USEFUL: YES — relevant to preserving the existing Gemini API request/fallback contract.
- `AGENTS.md` and `.gemini/rules/luckypickcanada.md` — USED: YES; USEFUL: YES — repository governance and reviewer behavior constraints.
- [MDN preload documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload) — USED: YES; USEFUL: YES — verifies that browsers supporting both AVIF and WebP can preload both typed resources even if a picture ultimately selects only one.

## Objective
Help Gemini detect context-dependent regressions by reading bounded, immutable-commit source context and reasoning about actual runtime behavior, using Amazon Q's PR #1610 review as a case study without blindly copying a suggested fix.

## Changes
- `.github/scripts/gemini-reviewer.cjs`: bounded read-only source retrieval at immutable PR head/base SHAs; relative-import context; honest budget/coverage limits; fallback import probing capped at 12 API reads when the tree index is unavailable; path/domain-based task-group selection; explicit reasoning for asynchronous callback order, reads/writes, direct synchronous call paths, and typed image-preload behavior.
- Fixed a malformed `clipSource` marker string in the previous candidate commit that made the reviewer JavaScript fail to parse.
- `.gemini/rules/luckypickcanada.md`: concise evidence-led cross-file, control-flow, and browser format-selection guidance. It requires independent verification of other reviewers' suggestions.
- `__tests__/gemini-reviewer-context.test.ts`: regression tests assert the async-ordering and non-mutually-exclusive image-preload guidance, in addition to import resolution, traversal protection, group selection, clipping, line anchors, and relevant context.
- `.specify/features/gemini-review-context/`: updated specification, plan, tasks, and requirements checklist.
- `PR_SUMMARY.md` and `memory-bank/activeContext.md`: updated evidence and current task status.

## Findings that informed the improvement
- **Verified from Amazon Q's PR #1610 review:** a WebP-only preload did not align with the AVIF-first `picture` source selected by AVIF-capable browsers.
- **Additional browser-semantic check:** the proposed dual typed preload strategy is not automatically safe. MDN explicitly notes that browsers supporting both AVIF and WebP can preload both resources while using only one in the `picture`, wasting bandwidth. The reviewer prompt now requires checking this cost rather than automatically recommending both preloads.
- **Control-flow lesson:** Q also examined a nested `requestAnimationFrame` ordering and correctly treated it as a path-verification question, not a confirmed defect. The reviewer now must trace callback scheduling and reachable direct/synchronous call paths before declaring a race.
- **API-budget lesson:** Q flagged that failed repository-tree lookup could cause repeated speculative import-path fetches. Fallback source retrieval now has a hard, tested 12-request probe budget and reports when that cap is reached.

## Spec Kit stages
- Specify: existing `.specify/features/gemini-review-context/spec.md` updated in place.
- Plan: existing `.specify/features/gemini-review-context/plan.md` updated in place.
- Tasks: existing `.specify/features/gemini-review-context/tasks.md` and `checklists/requirements.md` updated in place.
- Implement: reviewer prompt, Gemini rules, syntax repair, and regression tests updated in place. This connected GitHub API session uses file-driven procedural edits; it cannot invoke the repository shell or native Spec Kit commands.

## Verification
- **JavaScript syntax compilation:** PASS — the updated `.github/scripts/gemini-reviewer.cjs` compiles with the connected analysis runtime's syntax parser.
- **Vitest and `./jules-verify.sh`: PENDING** — repository shell execution is unavailable through this GitHub API session; do not treat these as passed.
- **Current-head CI:** pending until the pushed commit's checks are inspected.
- **Live Gemini behavior:** pending. Prompt-level unit assertions do not prove that the model catches a real regression.
- **Build-size measurement:** not applicable; no app build inputs or application code changed.

## Scope and safety
Read-only source retrieval remains bounded to immutable PR commit SHAs. PR source is treated as untrusted input and never executed. Workflow permissions/triggers, opt-in suggestion behavior, model fallback order, dependencies, application runtime, visuals, and Amazon Q rules are unchanged. No secrets were read or modified.

**USEFUL RESULT: PENDING** — the reviewer guidance and regression assertions are prepared; CI, repository verification, and live-model acceptance remain unverified.
