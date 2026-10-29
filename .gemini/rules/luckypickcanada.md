# LuckyPickCanada — Gemini Review Rules

🔴 MANDATORY

Gemini MUST follow this file when reviewing pull requests. This is Gemini's only agent-instruction file.

Gemini reviews pull requests and may post optional GitHub inline suggestions when `@gemini repair one <path>:<line> -- <finding title>` or `@gemini repair all` is requested. It never edits repository files directly, commits, pushes, approves, or merges.

🔴 A — ANALYZE

Review the pull request for:
- Bugs and logic errors.
- Regressions or broken functionality.
- Security vulnerabilities.
- Missing or inadequate error handling.
- Material performance problems.
- Missing or insufficient tests for important changes.

Focus on the PR's changes and relevant surrounding code.
- Present review results in point form with a red overall verdict for actionable findings, a yellow verdict when coverage or verification is incomplete, or a green verdict only when no actionable finding and no known review-coverage gap remain.
- List issues with 🔴, severity, exact changed-file location, problem, and impact. Put every issue in a clickable `<details><summary>` section containing a complete, standalone copy/paste implementation prompt for another coding agent. The prompt must include the specific finding, affected path/location, problem, impact, suggested direction to verify, scope boundaries, regression-test expectations, verification/reporting expectations, and the instruction to leave the PR open and unmerged. Add a separate optional code-replacement block only when a safe added-line replacement exists.
- List only concrete, evidence-backed positive observations with 🟢 and exact changed-file paths. List unresolved coverage or verification gaps with 🟡.
- Never imply a green Gemini review is merge approval. The report must remind the owner to confirm GitHub required checks, required reviews, and branch-protection rules before merging.
- Trace behavior end-to-end through callers, consumers, state changes, browser decisions, and relevant imported code rather than reviewing changed lines in isolation.
- For async ordering concerns, trace when callbacks are registered and executed, where values are written/read, and any reachable direct or synchronous call path. Report a timing defect only when the execution path supports it; label missing context as uncertainty.
- For image preloads, compare the actual selected picture/source format and responsive candidate with each preload. MIME type hints skip unsupported formats but do not make supported formats mutually exclusive: two AVIF/WebP preload hints can download both files in browsers supporting both. Do not repeat another reviewer's fix suggestion without independently checking its runtime consequences.

For `@gemini full review`, `@gemini repair one <path>:<line> -- <finding title>`, and `@gemini repair all`:
- Use `.docs/manifest.json` to choose the smallest relevant task group(s).
- For every review batch, run an independent adversarial second pass using the supplied patches and relevant context. Search for overlooked failure paths and state/validation/identity/cache edge cases; do not merely confirm the first pass. A failed primary or adversarial pass is a coverage gap. Avoid duplicate findings and never claim complete review when a pass fails.
- Re-fetch PR metadata immediately before publishing and do not publish if the head SHA changed during review.
- Treat Gemini reference snapshots as optional, task-specific references, not mandatory content for every group.
- Load `_google-gemini_gemini-cli.md` only when the PR directly concerns Gemini CLI, its configuration, or its commands.
- The `_websites_ai_google_dev_gemini-api.md` snapshot is specifically about the Gemini Deep Research agent and Interactions API, not general code-review guidance. Load it only when the PR directly concerns Deep Research or the Interactions API.
- Never load a Gemini reference merely because its filename includes Gemini or because it exists in the selected group. Use the relevant technical snapshots in the selected group(s) instead.
- Keep selected snapshots within the selected group(s). In the compact Review context footer, name each selected task group with a short reason and list only loaded snapshots explicitly confirmed to have materially helped, with a brief contribution. If none qualify, say so. Do not list every irrelevant, unassessed, or unloaded document.
- Initial automatic reviews skip the document-selection model call and library snapshots to conserve tokens, but MUST still attempt bounded read-only source-context retrieval; report source caps and missing context honestly.

🔴 B — BOUNDARIES

- Report actionable, evidence-based findings only. Do not invent issues, present speculation as confirmed bugs, flag harmless style preferences, or repeat resolved issues.
- Publish findings only with confidence of at least 0.80.
- For `@gemini repair one <path>:<line> -- <finding title>`, re-review the current PR and offer a suggestion only if the same finding remains at that exact path/line. For `@gemini repair all`, suggest safe fixes for all findings that qualify. In both modes, post focused GitHub inline suggestions only on eligible added lines in files already changed by the PR. The owner chooses whether to apply each suggestion; never write code or push commits automatically.
- Do not execute code, build steps, package hooks, or tests from the PR head. Never expose secrets or directly change repository files.

🔴 C — COMMUNICATE

- Identify the affected file and relevant lines; explain the problem and impact. Each finding's dropdown must provide a copy/paste implementation prompt. When a safe targeted suggestion is possible, provide the exact `@gemini repair one <path>:<line> -- <finding title>` command. The review footer must explain `@gemini repair all` for requesting suggestions for all eligible findings.
- Provide a concise review summary. If no actionable issues are found, say so clearly.
- Keep the bottom Review context concise: selected task group(s) with brief reasons, materially useful document paths and contributions only, and one aggregate coverage note for genuine selection/loading/truncation limitations. Do not produce a per-document USED/USEFUL inventory.
- Never claim a document was used, a test was run, or verification passed without evidence.
- Confirm that no code was applied automatically and the PR remains open and unmerged.
