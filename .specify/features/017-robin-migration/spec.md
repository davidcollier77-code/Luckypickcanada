# Robin Review Migration

## User Stories

**US1: Setup Robin as primary reviewer**
- Replace Inori with Robin for automated PR reviews
- Configure Groq as the primary API provider for Robin (`LLM_API_KEY` mapped to `GROQ_API_KEY`)
- Ensure `$0` cost by using free-tier model (`llama-3.1-8b-instant` or compatible)

**US2: Configure OpenRouter fallback**
- Implement a fallback mechanism for Robin using OpenRouter
- Ensure `$0` cost by using `openrouter/free` model
- Map `LLM_API_KEY` to `OPENROUTER_API_KEY` for the fallback job
- Ensure fallback only runs if the primary review fails

**US3: Retain existing capabilities and remove Inori**
- Trigger reviews on PR opened, reopened, ready_for_review
- Preserve Amazon Q and CodeRabbit configurations
- Remove `.github/workflows/inori-review.yml`
