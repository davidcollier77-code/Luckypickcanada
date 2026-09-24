# Active Context

## Current Work
- 2026-09-24: Audited the repository and implemented the Gemini Code Agent / GitHub Actions integration to allow Gemini to operate as a PR-based coding/review agent.
- Verified that there were no existing Gemini Code Agent workflows, and that the existing `functions/api/oracle.js` usage of the `GEMINI_API_KEY` operates independently of the GitHub Actions environment.
- Added `.github/workflows/gemini-code-agent.yml` using the official `google-github-actions/run-gemini-cli@v1` action.
- Added `.gemini/` to `.gitignore` to prevent committing agent artifacts.
- The workflow supports on-demand collaboration via `@gemini-cli` mentions in issue comments and pull request review comments.

## Next Steps
- Await approval of the Gemini Code Agent integration PR.

## Completed Work
- Completed implementation of the Gemini Code Agent GitHub Action workflow.
- Pre-commit verifications (YAML linting, build verification) have passed.
