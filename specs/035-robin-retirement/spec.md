# Feature Specification: Robin Retirement

## User Story
As the repository owner, I want to completely remove the Robin automated code-review system and its Groq fallback so that I can rely exclusively on CodeRabbit and Amazon Q without the overhead and complexity of Robin.

## Requirements
- Completely remove the Robin workflow (`.github/workflows/robin.yml`).
- Completely remove the Robin configuration (`.github/robin.yml`).
- Remove Robin-specific tests, such as `tests/workflows/robin-groq-fallback.test.ts`.
- Retain the `GROQ_API_KEY` for the Crystal Ball Oracle functionality (`app/api/oracle/route.js`).
- Ensure CodeRabbit and Amazon Q configurations and workflows remain untouched.
- Audit for and document any repository variables/secrets like `OPENROUTER_API_KEY`, `ROBIN_LLM_MODEL`, and `ROBIN_LLM_BASE_URL` that should be manually removed post-merge.
- Keep the historical Spec Kit and PR summary files that refer to Robin.
