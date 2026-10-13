# Implementation Plan

## Technical Context
- **Tech Stack**: GitHub Actions, Robin
- **Target Files**: `.github/workflows/robin.yml`, `.github/robin.yml` (optional config), remove `.github/workflows/inori-review.yml`

## Phases
1. **Setup**: Create configuration for Robin, remove Inori.
2. **Review Workflow**: Implement Robin workflow with OpenRouter (`openrouter/free`) as the default, correctly handling PR and issue_comment events.
3. **Review follow-up**: Allow optional repository variables `ROBIN_LLM_BASE_URL` and `ROBIN_LLM_MODEL` to override the endpoint/model while retaining safe defaults; remove wrapper-level concurrency so the reusable workflow can filter slash commands before enforcing job-level concurrency.
