# Implementation Plan: Robin Retirement

## Technical Strategy
- Delete `.github/workflows/robin.yml` and `.github/robin.yml`.
- Delete `tests/workflows/robin-groq-fallback.test.ts`.
- Run tests (`pnpm run test`, `pnpm tsc --noEmit`, etc.) to ensure no breaking changes in tests or builds.
- Audit the repository for remaining references to Robin, OpenRouter, and Groq fallback.
- Document obsolete repository secrets and variables to be removed manually after the PR is merged.
- Update Memory Bank to reflect the removal of Robin.

## Scope Limits
- Do not modify or remove `GROQ_API_KEY` as it is required by the Crystal Ball Oracle functionality.
- Do not modify CodeRabbit or Amazon Q integrations.
- Do not delete historical Spec Kit artifacts mentioning Robin.
