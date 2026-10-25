# Implementation Plan — Gemini PR Reviewer and Optional Fix Suggestions

## Approach
1. Add `.gemini/rules/luckypickcanada.md` as a separate file based on Amazon Q's review-analysis, evidence, boundaries, and communication standards. Preserve the existing Amazon Q rules unchanged.
2. Add a GitHub Actions workflow that uses `pull_request_target` only with trusted base-branch workflow/scripts and never executes code from the pull-request branch.
3. Use a dependency-free Node script and Gemini `generateContent` API. Retry transient errors once per model before falling back to Gemini 3.6 Flash.
4. Use Gemini to select relevant local `.docs/` snapshots based on `.docs/manifest.json`. Accept any number of groups as needed and apply a deterministic path/group fallback if selection fails.
5. Validate the model's JSON output, only comment on exact changed file paths, and attach inline comments only to added lines. Report documents actually loaded, useful/not useful, and reasons.
6. For explicit fix requests, generate GitHub inline suggestion blocks only for eligible added lines in changed files. The owner must click GitHub's native Commit suggestion button to apply a chosen change. No model-generated code is directly committed or pushed.
7. Add focused tests for workflow configuration, rules, model fallback, path restrictions, and JavaScript syntax. Record what CI verifies and what cannot be run in this API-only session.

## Safety
- Do not print or commit secret values.
- Treat PR contents and document snippets as untrusted data.
- Use the minimum token permissions needed to read diffs and post reviews/comments; do not persist checkout credentials.
- Do not edit protected files, application APIs, authentication/security/payment/database/deployment paths, dependencies, Amazon Q rules, or `.docs/` snapshots.
- Never merge a pull request. The workflow never executes PR-head code and never writes generated code to a branch.
