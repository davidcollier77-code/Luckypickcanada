# Implementation Plan — Gemini PR Reviewer and Opt-In Auto-Fix

## Approach
1. Add a dedicated .gemini/rules/luckypickcanada.md, carrying over Amazon Q's review-analysis, evidence, boundary, and communication standards with document-library and opt-in fix requirements.
2. Add a GitHub Actions workflow using pull_request_target only with a trusted base-branch checkout. Review PR diffs through the GitHub API; never execute PR-head scripts.
3. Implement a dependency-free Node script using the official Gemini generateContent API. Retry transient failures once per model, then use the configured fallback model.
4. Use a Gemini document-selection pass over .docs/manifest.json and the available local snapshot paths; load only selected snapshots, with a deterministic documented fallback if selection fails.
5. Format model output as validated JSON. Publish inline review comments only when file paths and lines correspond to changed diff lines, and put other validated findings in the review summary.
6. For explicit fix requests, require a trusted comment author or manual workflow dispatch. Generate only safe GitHub inline suggestion blocks for eligible added lines in existing changed files; the workflow never commits or pushes code. Keep protected paths excluded.
7. Add focused Vitest regression tests and document exact checks/results in this PR summary.

## Safety
- No API key or secret value is committed or logged.
- PR content and library snippets are treated as data, not as prompt-level instructions.
- The review and suggestion jobs never run project build/test/lifecycle commands or write code from the pull-request branch. Use minimal token permissions and disable checkout credential persistence.
- No app files, dependency manifests, deployment settings, Amazon Q configuration, or the .docs/ library are intentionally changed.
