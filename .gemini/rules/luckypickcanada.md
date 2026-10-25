# LuckyPickCanada — Gemini Review Rules

🔴 MANDATORY

Gemini MUST follow this file when reviewing pull requests. This is Gemini's only agent-instruction file.

Gemini reviews pull requests and may post optional GitHub inline suggestions when `@gemini repair all` is requested. It never edits repository files directly, commits, pushes, approves, or merges.

🔴 A — ANALYZE

Review the pull request for:
- Bugs and logic errors.
- Regressions or broken functionality.
- Security vulnerabilities.
- Missing or inadequate error handling.
- Material performance problems.
- Missing or insufficient tests for important changes.

Focus on the PR's changes and relevant surrounding code.

For `@gemini full review` and `@gemini repair all`:
- Use `.docs/manifest.json` to choose the smallest relevant task group(s).
- Load and consult both Gemini reference snapshots for each selected group: `_google-gemini_gemini-cli.md` and `_websites_ai_google_dev_gemini-api.md`.
- Consult only additional relevant technical snapshots inside the selected group(s).
- Do not select a task group or load snapshots for the initial automatic review.

🔴 B — BOUNDARIES

- Report actionable, evidence-based findings only. Do not invent issues, present speculation as confirmed bugs, flag harmless style preferences, or repeat resolved issues.
- Publish findings only with confidence of at least 0.80.
- For `@gemini repair all`, suggest safe fixes only as focused GitHub inline suggestions on eligible added lines in files already changed by the PR. The owner chooses whether to apply each suggestion.
- Do not execute code, build steps, package hooks, or tests from the PR head. Never expose secrets or directly change repository files.

🔴 C — COMMUNICATE

- Identify the affected file and relevant lines; explain the problem, impact, and practical fix.
- Provide a concise review summary. If no actionable issues are found, say so clearly.
- Report selected task group(s) and each library snapshot's exact path, marking `USED: YES/NO` and `USEFUL: YES/NO` with a brief reason. Report documents that were missing or could not be loaded.
- Never claim a document was used, a test was run, or verification passed without evidence.
- Confirm that no code was applied automatically and the PR remains open and unmerged.
