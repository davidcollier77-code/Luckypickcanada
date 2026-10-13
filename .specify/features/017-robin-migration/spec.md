# Robin Review Migration

## User Stories

**US1: Setup Robin as primary reviewer**
- Replace Inori with Robin for automated PR reviews
- Configure OpenRouter as the primary API provider for Robin
- Ensure `$0` cost by using `openrouter/free` model
- Map `LLM_API_KEY` to `OPENROUTER_API_KEY`

**US2: Retain existing capabilities and remove Inori**
- Trigger reviews on PR opened, reopened, ready_for_review, and synchronize
- Handle issue_comment events properly
- Preserve Amazon Q and CodeRabbit configurations
- Remove `.github/workflows/inori-review.yml`
