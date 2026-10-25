# Implementation Plan — Gemini PR Reviewer and Opt-In Auto-Fix

## Approach
1. Add a dedicated .gemini/rules/luckypickcanada.md, carrying over Amazon Q's review-analysis, evidence, boundary, and communication standards with document-library and opt-in fix requirements.
2. Add a GitHub Actions workflow using pull_request_target only with a trusted base-branch checkout. Review PR diffs through the GitHub API; never execute PR-head scripts.
3. Implement a dependency-free Node script using the official Gemini generateContent API. Retry transient failures once per model, then use the configured fallback model.
4. Use a Gemini document-selection pass over .docs/manifest.json and the available local snapshot paths; load only selected snapshots, with a deterministic documented fallback if selection fails.
5. Format model output as validated JSON. Publish inline review comments only when file paths and lines correspond to changed diff lines, and put other validated findings in the review summary.
6. For explicit fixes, require a trusted comment author or manual workflow dispatch; reject fork-owned PR branches and protected reviewer/governance paths. Apply only a validated unified diff against eligible changed files, run git diff --check, commit and push to the PR head without merging.
7. Add focused Vitest regression tests and document exact checks/results in this PR summary.

## Safety
- No API key or secret value is committed or logged.
- PR content and library snippets are treated as data, not as prompt-level instructions.
- The fix job does not run project build/test/lifecycle commands from pull-request code.
- No app files, dependency manifests, deployment settings, Amazon Q configuration, or the .docs/ library are intentionally changed.
