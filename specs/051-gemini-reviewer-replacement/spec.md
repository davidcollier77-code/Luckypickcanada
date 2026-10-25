# Specification — Gemini PR Reviewer and Optional Fix Suggestions

## Goal
Provide an independent Gemini-powered reviewer for LuckyPickCanada with evidence-based review quality comparable to the existing Amazon Q review standards, plus an explicit, optional way to request code suggestions.

## Requirements
- Automatically review pull requests when opened, reopened, updated with commits, made ready for review, or review-requested.
- Use Gemini 3.8 Flash as the primary model and Gemini 3.6 Flash as fallback, with a bounded retry policy.
- Load and follow `.gemini/rules/luckypickcanada.md` on every review and suggestion run. Leave Amazon Q's original rule file unchanged.
- Review bugs, regressions, security, error handling, material performance, and test gaps. Publish only evidence-based findings with confidence at least 0.80.
- Select relevant local `.docs/` groups and snapshots from the manifest without an arbitrary one-group limit. Report exact snapshots consulted, whether each was materially useful, and why.
- Post one review summary with inline comments for validated changed lines. Include native GitHub suggestion blocks when a safe one-line replacement is possible.
- Support two exact pull-request comment commands: `@Gemini full review` for a full review and `@Gemini repair all` for review plus optional fix suggestions. Normal review must not change repository code. Commands are accepted only from trusted repository collaborators.
- Suggestions are limited to eligible added lines in already-changed files. The workflow never directly edits files, creates commits, or pushes generated code; the owner chooses whether to click GitHub's native Commit suggestion button.
- Use trusted base-branch workflow/script/rules. Never execute code from the PR head, modify protected paths, or merge a pull request.
- Use existing Actions secret name `GEMINI_API_KEY` without exposing its value. Add no dependencies, and do not change application runtime behavior, Amazon Q's rules, or `.docs/` snapshots.
