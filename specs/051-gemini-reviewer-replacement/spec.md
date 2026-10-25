# Specification — Independent Gemini PR Reviewer

## Goal
Provide a lightweight Gemini-powered PR reviewer based on Amazon Q's concise A–B–C review standards, with optional GitHub inline suggestions on explicit request.

## Requirements
- Automatically review pull requests when opened, reopened, updated with commits, made ready for review, or review-requested.
- Use only `.gemini/rules/luckypickcanada.md` as Gemini's agent instructions; do not load or follow separate repository instruction or governance files.
- Keep initial automatic reviews lightweight: load Gemini's own rules and review the changed patches without a separate document-selection model call or library-snapshot loading.
- For explicit `@gemini full review` and `@gemini repair all` requests, select the smallest relevant task group(s) using `.docs/manifest.json`.
- For every selected group, load both Gemini references: `_google-gemini_gemini-cli.md` and `_websites_ai_google_dev_gemini-api.md`.
- Consult only additional relevant technical snapshots within the selected group(s); do not load unrelated agent instructions or documents.
- Report selected groups, exact snapshots actually supplied to the model, whether each was used and materially useful, and why. Disclose missing or unloaded snapshots.
- Review bugs, regressions, security, error handling, material performance, and important test gaps. Publish actionable, evidence-based findings with confidence at least 0.80.
- Support exactly two trusted PR comment commands: `@gemini full review` for a full review and `@gemini repair all` for review plus optional fix suggestions.
- Suggestions are limited to eligible added lines in files already changed by the PR. Never write generated code directly, create commits, push code, approve, or merge a pull request.
- Use Gemini 3.8 Flash as primary and Gemini 3.6 Flash as fallback, with bounded retries and the existing `GEMINI_API_KEY` Actions secret.
- Use trusted base-branch workflow/scripts/rules. Never execute PR-head code, expose secrets, add dependencies, change application runtime behavior, modify Amazon Q's rules, or change library snapshots.
