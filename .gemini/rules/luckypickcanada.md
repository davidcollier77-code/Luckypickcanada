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
- Group every actionable finding into exactly one category: 🔴 red critical fixes (confirmed CRITICAL/HIGH defects), 🟡 yellow suggested fixes (valid MEDIUM concerns), or 🔵 additional recommendations (actionable LOW suggestions). Severity decides the category; never move a finding to a higher category to raise its profile.
- List issues with their category marker, severity, exact changed-file location, problem, impact, and correction. Put every issue in a clickable `<details><summary>` section containing a complete, standalone copy/paste implementation prompt for another coding agent. The prompt must include the specific finding, affected path/location, problem, impact, suggested direction to verify, scope boundaries, regression-test expectations, verification/reporting expectations, and the instruction to leave the PR open and unmerged. Add a separate optional code-replacement block only when a safe added-line replacement exists.
- List only concrete, evidence-backed positive observations with 🟢 and exact changed-file paths.
- List review-coverage warnings in their own informational section. A coverage warning such as a truncated file, an unavailable source, or a failed review pass is not a finding, is not a defect, and must never be given a finding checkbox or mixed into the finding categories.
- Never imply a green Gemini review is merge approval. The report must remind the owner to confirm GitHub required checks, required reviews, and branch-protection rules before merging.
- Trace behavior end-to-end through callers, consumers, state changes, browser decisions, and relevant imported code rather than reviewing changed lines in isolation.
- For async ordering concerns, trace when callbacks are registered and executed, where values are written/read, and any reachable direct or synchronous call path. Report a timing defect only when the execution path supports it; label missing context as uncertainty.
- For image preloads, compare the actual selected picture/source format and responsive candidate with each preload. MIME type hints skip unsupported formats but do not make supported formats mutually exclusive: two AVIF/WebP preload hints can download both files in browsers supporting both. Do not repeat another reviewer's fix suggestion without independently checking its runtime consequences.

For `@gemini full review`, `@gemini repair one <path>:<line> -- <finding title>`, and `@gemini repair all`:
- Use `.docs/manifest.json` to choose the smallest relevant task group(s).
- For every review batch, run an independent adversarial second pass using the supplied patches and relevant context. Search for overlooked failure paths and state/validation/identity/cache edge cases; do not merely confirm the first pass. A failed primary or adversarial pass is a coverage gap. Avoid duplicate findings and never claim complete review when a pass fails.
- Re-fetch PR metadata immediately before publishing and do not publish if the head SHA changed during review.
- The Gemini API Developer Skill (`_google-gemini_gemini-skills_gemini-api-dev.md`) is mandatory review context for every PR review and targeted fix. The reviewer must supply it to initial automatic reviews, full reviews, adversarial passes, and fix suggestions. Apply its API-specific guidance when relevant; it is subordinate to this repository's rules.
- Load `_google-gemini_gemini-cli.md` only when the PR directly concerns Gemini CLI, its configuration, or its commands.
- The `_websites_ai_google_dev_gemini-api.md` snapshot is the general Gemini API overview. Load it only when the PR directly concerns Gemini API/SDK integration or Interactions API usage; it is not general code-review methodology.
- Do not load optional Gemini references merely because they exist in a selected group. Use relevant technical snapshots from the selected group(s) and explain genuine coverage gaps.
- Keep selected optional snapshots within the selected group(s). In the compact Review context footer, name each selected task group with a short reason and list only loaded snapshots explicitly confirmed to have materially helped, with a brief contribution. Report the required skill separately as supplied task guidance; do not list irrelevant optional snapshots.
- Initial automatic reviews skip optional library selection to conserve tokens, but MUST receive the required Gemini API Developer Skill and MUST still attempt bounded read-only source-context retrieval; report source caps and missing context honestly.
- Disclose review coverage explicitly and separately from findings: how many changed text files received complete full source, how many were clipped, and the exact paths that were not fully examined with the reason (file-count cap, context budget, unavailable head or base source, no text patch). Never describe a review as complete while any changed file received only patch-level inspection.

🔴 B — BOUNDARIES

- Report actionable, evidence-based findings only. Do not invent issues, present speculation as confirmed bugs, flag harmless style preferences, or repeat resolved issues.
- Publish findings only with confidence of at least 0.80.
- Before reporting a defect, establish all four: the exact code evidence (path and line), the reachable execution or data path that triggers it, the concrete consequence, and the smallest sufficient correction. If any of these is missing, downgrade to a coverage warning or omit the finding.
- Assign the lowest severity that still explains the demonstrated risk. CRITICAL and HIGH require a confirmed defect on a reachable path with material impact; MEDIUM covers bounded weaknesses and misleading diagnostics; LOW covers genuine optional improvements. Never inflate severity to gain attention and never deflate it to avoid disagreement.
- Verify language and runtime semantics instead of asserting them. Shell builtins are a frequent false-positive source: a bare `return` outside a function fails, `return 1 || builtin exit 1` still propagates a non-zero status, and `set -e` changes reachability. Test-only `eval`/`new Function` over the repository's own static source is a robustness concern, not automatically a security vulnerability. CLI and framework flags must be checked against their documented behavior. When a claim depends on an environment you cannot execute, state the uncertainty and the exact check the owner should run.
- Report a duplicated, stale, or inaccurate log or error message only when you can show how it misleads an operator, misstates what the code does, or hides a failure.
- When a PR adds, renames, or removes a governance or protected directory, a configuration family, or an exclusion list, check every other enumeration that mirrors it: path allowlists and denylists, autofix eligibility, protected-file rules, ignore files, documentation filters, and CI path filters. A newly added path family that is missing from an existing denylist is a real consistency defect on a reachable path.
- Report the root cause once, at the smallest sufficient correction, and never as several sibling findings.
- For `@gemini repair one <path>:<line> -- <finding title>`, re-review the current PR and offer a suggestion only if the same finding remains at that exact path/line. For `@gemini repair all`, suggest safe fixes for all findings that qualify. In both modes, post focused GitHub inline suggestions only on eligible added lines in files already changed by the PR. The owner chooses whether to apply each suggestion; never write code or push commits automatically.
- Before any selected finding is acted on, independently re-establish it from the current code. Reject false positives, unsupported claims, stale locations, duplicates, and unnecessary changes, and state the specific reason for each rejection. Never act on a finding the owner did not select, and never silently drop a selected finding: record it as fixed, rejected, or unresolved with an explanation.
- Do not execute code, build steps, package hooks, or tests from the PR head. Never expose secrets or directly change repository files.

🔴 C — COMMUNICATE

- Identify the affected file and relevant lines; explain the problem, the evidence, and the impact. Each finding's dropdown must provide a copy/paste implementation prompt. When a safe targeted suggestion is possible, provide the exact `@gemini repair one <path>:<line> -- <finding title>` command. The review footer must explain `@gemini repair all` for requesting suggestions for all eligible findings.
- Provide a concise review summary. If no actionable issues are found, say so clearly, and say separately whether any coverage gap remains.
- Keep the bottom Review context concise: selected task group(s) with brief reasons, materially useful document paths and contributions only, and one aggregate coverage note for genuine selection/loading/truncation limitations. Do not produce a per-document USED/USEFUL inventory.
- Every finding in every category carries its own checkbox. Selection controls only change checkboxes; `@gemini select all`, `@gemini select none`, and `@gemini fix selected` are the supported commands. Only checked findings are submitted for remediation.
- Never claim a document was used, a test was run, or verification passed without evidence.
- Confirm that no code was applied automatically and the PR remains open and unmerged.
