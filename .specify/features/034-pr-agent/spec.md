# AI PR Reviewer Specification

## Objective
Implement an independent AI pull-request reviewer using PR-Agent, GitHub Actions, and Google Gemini 3.8 Flash, without using a GitHub App.

## Requirements
- Trigger on PR opened, reopened, synchronize.
- Use `gemini-3.8-flash` via PR-Agent's `gemini/gemini-3.8-flash` configuration.
- Protect credentials in `GEMINI_API_KEY` GitHub Action secret.
- Preserve existing CodeRabbit and Amazon Q workflows untouched.
- Do not reintroduce Robin or its fallback.
- Provide safe diagnostics on credential/API failure.
- Ensure 15-30 PR/day capacity on free-tier without credit card.
