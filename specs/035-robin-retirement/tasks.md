# Tasks: Robin Retirement

## Phase 1: Removal of Robin Files
- [X] T001 Remove `.github/workflows/robin.yml`.
- [X] T002 Remove `.github/robin.yml`.
- [X] T003 Remove `tests/workflows/robin-groq-fallback.test.ts`.

## Phase 2: Audit and Memory Bank Update
- [X] T004 Audit for obsolete secrets and variables (`OPENROUTER_API_KEY`, `ROBIN_LLM_MODEL`, `ROBIN_LLM_BASE_URL`) and list them in the PR summary for manual removal.
- [X] T005 Update `memory-bank/activeContext.md` and `memory-bank/progress.md` to record the retirement of Robin.

## Phase 3: Verification
- [X] T006 Run pre-commit checks (`pnpm run test`, `pnpm tsc --noEmit`, `./jules-verify.sh`, `pnpm run build`, `pnpm exec opennextjs-cloudflare build`) to ensure system stability.
