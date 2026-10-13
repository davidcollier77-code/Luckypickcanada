# Robin Review Migration

## User Stories

**US1: Setup Robin as primary reviewer**
- Replace Inori with Robin for automated PR reviews
- Configure OpenRouter as the primary API provider for Robin
- Default to the `openrouter/free` model to preserve the zero-cost setup
- Map `LLM_API_KEY` to `OPENROUTER_API_KEY`

**US2: Retain existing capabilities and remove Inori**
- Trigger reviews on PR opened, reopened, ready_for_review, and synchronize
- Handle issue_comment events properly
- Preserve Amazon Q and CodeRabbit configurations
- Remove `.github/workflows/inori-review.yml`

**US3: Allow deliberate provider/model overrides without changing the free defaults**
- Support optional repository variables `ROBIN_LLM_BASE_URL` and `ROBIN_LLM_MODEL`
- Fall back to `https://openrouter.ai/api/v1` and `openrouter/free` when those variables are unset or empty
- Keep the caller workflow free of workflow-level concurrency so unrelated issue comments cannot cancel an active review; rely on the reusable workflow's command-gated job-level concurrency
- Do not add a stale Inori comment: the current Robin workflow does not contain one
