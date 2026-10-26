# PR Summary — Gemini Default Review Coverage and Relevant Documentation

## Task group
**deep-dive** — this is a cross-cutting review-pipeline change involving immutable-source retrieval, context budgets, document selection, model prompting, and regression tests.

## Objective and changes
- **Automatic reviews now attempt bounded source context:** `.github/scripts/gemini-reviewer.cjs` calls `collectSourceContext(pr, files)` for initial reviews as well as explicit full reviews and repair-all runs. The initial review still avoids the extra document-selection model call and library snapshot loading.
- **Explicit source limits:** the current limits are 22 changed text files, up to 3,600 characters per changed source file, 100,000 total source-context characters, 7 related import files, and 12 fallback import probes. Missing/truncated/unavailable source and exhausted limits are reported as coverage gaps; all available text patches remain in review batches.
- **Removed-file source is included:** for deleted text files the reviewer fetches source from the immutable base SHA; renamed files use `previous_filename` for base comparison when supplied.
- **Gemini reference snapshots are optional:** the CLI reference is only eligible for direct Gemini CLI/configuration/command tasks. The `_websites_ai_google_dev_gemini-api.md` snapshot is specifically about the Gemini Deep Research agent and Interactions API, and is only eligible for those tasks. A document-routing task cannot self-trigger these references merely by discussing them.
- **Task-specific technical docs remain constrained:** the explicit full-review/repair-all selector still chooses relevant task groups; other library snapshots remain confined to the selected groups. The initial automatic review loads no `.docs` snapshots to conserve tokens.
- **Regression tests added/updated:** `__tests__/gemini-reviewer-context.test.ts` covers file/character limits, preservation of review batches, removed-source candidates, and task-relevance rules. `__tests__/gemini-reviewer-workflow.test.ts` checks initial source-context invocation and optional document behavior.
- **Gemini-only rules updated:** `.gemini/rules/luckypickcanada.md` now explains when each of the two reference snapshots is actually relevant.

## Independent review follow-up
- **Document relevance routing:** adjusted the document-routing branch to restrict special-case handling to the two known Gemini reference types, allowing other future reference types to fall through to their own checks rather than being silently rejected by the special-case branch.
- **Source budget priority:** current/head source files are now placed ahead of deleted files for the bounded source-context slots. Deleted-file source is still retrieved at the base SHA when within the budget, and deleted-file patches remain available to the review batches.
- **API-key guard ordering:** verified in the current source that the `GEMINI_API_KEY` guard runs before changed-file/source-context retrieval; added a regression assertion to keep that order.
- These are follow-ups to Amazon Q's independent comments. The API-key ordering claim did not match the current source order, but the explicit test now guards the behavior.

## Routed documentation and references
- `AGENTS.md`, `.jules/jules.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, and `.specify/memory/constitution.md` — USED: YES; USEFUL: YES — governance, existing task context, sequencing, and boundaries.
- `.jules/deep-dive.md` — USED: YES; USEFUL: YES — selects evidence-led implementation for the cross-cutting reviewer pipeline.
- `.docs/deep-dive/jules_google_docs.md` — USED: YES; USEFUL: NO — inspected as required by the selected group; unrelated to reviewer source retrieval.
- `.docs/deep-dive/_google-gemini_gemini-cli.md` — USED: YES; USEFUL: YES — confirmed this snapshot contains CLI tips/commands rather than general code-review guidance; it should only load for direct CLI tasks.
- `.docs/deep-dive/_websites_ai_google_dev_gemini-api.md` — USED: YES; USEFUL: YES — confirmed this snapshot is the Gemini Deep Research agent/Interactions API documentation, not a generic code-review guide.
- `.docs/manifest.json` — USED: YES; USEFUL: YES — task-group routing and selected-group boundaries.
- `.gemini/rules/luckypickcanada.md`, `.github/workflows/gemini-reviewer.yml`, reviewer and regression-test sources — USED: YES; USEFUL: YES — preserve model, trusted workflow, permissions, and optional-suggestion behavior.
- `.docs/` snapshots were not changed. No Context7 calls or dependency changes were made.

## Spec Kit stages
- **Specify:** updated `.specify/features/gemini-review-context/spec.md`.
- **Plan:** updated `.specify/features/gemini-review-context/plan.md`.
- **Tasks:** updated `.specify/features/gemini-review-context/tasks.md`.
- **Implement:** updated the existing reviewer script, Gemini-only rules, and regression tests.
- **Execution method:** file-driven procedural edits through the GitHub repository API; native Spec Kit command dispatch and local repository shell access are unavailable in this session. `.specify/extensions.yml` was not found, so no extension hooks were present to execute.

## Verification status
- **Source inspection:** PASS — source collection now executes in initial mode; source caps and missing context generate limitations; removed source is read from the base; both document references have explicit relevance guards.
- **Regression tests added:** YES, but **not yet run in this session**.
- **Focused/full Vitest, TypeScript/build, and `./jules-verify.sh`: PENDING** — local shell execution is unavailable; current-head GitHub Actions must provide evidence.
- **Live-model acceptance: PENDING** — CI/static assertions alone do not prove real-world review quality. A completed review still needs to be inspected to confirm ordinary reviews include source context without irrelevant snapshots.
- **Build-size measurement:** not applicable; no app runtime/build inputs changed.
- **Current result: PARTIAL** — implementation is committed on the topic branch; verification and a live-review check remain pending.

## Boundaries
No application runtime behavior, Gemini model order, API request mechanism, workflow permissions, dependencies, Amazon Q rules, secrets, or deployment behavior were changed. PR must remain open and unmerged.

**USEFUL RESULT: PENDING** — the reviewer changes are implemented; final usefulness depends on passing current-head checks and inspecting actual review behavior.
