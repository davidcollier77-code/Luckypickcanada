# Specification — Gemini PR Reviewer and Optional Fix Suggestions

## Goal
Provide an independent Gemini-powered reviewer for LuckyPickCanada with evidence-based review quality comparable to Amazon Q, plus an explicit, optional way to request focused code suggestions.

## Requirements
- Automatically review pull requests when opened, reopened, updated with commits, made ready for review, or review-requested.
- Load and follow Gemini's own instructions at `.gemini/rules/luckypickcanada.md` and trusted base-branch `AGENTS.md` on every run. Keep Amazon Q's rules unchanged.
- Keep the initial automatic review lightweight: do not make a separate Gemini call just to select documents.
- For explicit `@gemini full review` and `@gemini repair all` requests, select relevant task group(s) from `.docs/manifest.json`. For every selected group, load both Gemini references: `_google-gemini_gemini-cli.md` and `_websites_ai_google_dev_gemini-api.md`.
- For explicit requests, consult additional relevant local `.docs/` snapshots when useful; exclude Jules-specific documents and do not introduce Jules or Spec Kit workflow into Gemini's process.
- Report selected group(s) and exact snapshots actually loaded, whether each was materially useful, and why. Disclose snapshots that were missing or could not be loaded.
- Review bugs, regressions, security, error handling, material performance, and important test gaps. Publish only actionable, evidence-based findings with confidence at least 0.80.
- Support exactly two trusted PR comment commands: `@gemini full review` for a full review and `@gemini repair all` for review plus optional fix suggestions.
- Suggestions are limited to eligible added lines in already-changed files. Never write generated code directly, create commits, push code, approve, or merge a pull request.
- Use Gemini 3.8 Flash as the primary model and Gemini 3.6 Flash as fallback, with bounded retry behavior and the existing `GEMINI_API_KEY` Actions secret.
- Use trusted base-branch workflow/scripts/rules. Never execute code from the PR head, expose secrets, modify protected paths, add dependencies, change app runtime behavior, or modify Amazon Q's rules or `.docs/` snapshots.
