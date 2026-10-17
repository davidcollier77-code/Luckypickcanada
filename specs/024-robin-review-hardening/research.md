# Research: Robin review runtime and provider failure

## Decision — Keep OpenRouter's free router, but cap Robin itself

The initial free endpoints tested during implementation were not dependable enough to hard-code. Live PR runs showed:
- google/gemma-4-31b-it:free: HTTP 429 on every attempt.
- qwen/qwen3-coder:free and qwen/qwen3.8-27b:free: HTTP 404 stating the free variant was unavailable.
- google/gemma-4-26b-a4b-it:free: HTTP 429.
- cohere/north-mini-code:free and dots-studio/dots-3-note-preview:free: repeated empty content; the action reached its hard timeout.
- xingchen-agi/xing4.0-29b-a4b:free: HTTP 502.

Those errors establish that pinning a specific free model is fragile; the router at least has a chance to select an alternate available endpoint. The successful run #38988422706 used openrouter/free, posted Robin review #5555193756 and completed the job in about 1m52s (zero findings). This is the live-successful configuration retained.

## Root cause

- The repository previously called antongulin/robin/.github/workflows/review.yml@main. The reusable workflow set its internal job timeout to 45 minutes, and the caller cannot attach a job timeout to the reusable-workflow call.
- The caller passed llm-timeout-ms = 300000 to Robin's OpenRouter router path. In Robin v2.12.0, the router first-chunk timer is cleared after an SSE chunk arrives, so it does not bound all subsequent streamed generation. This matched the many-minute historical runs.
- Directly invoking a pinned Robin action lets GitHub Actions impose an independent step timeout regardless of provider/router behavior.

## Final bounds and safeguards

- Robin action pinned to immutable commit fc0bf915b634bf2f8b88ff1392acefdfb54e28d9.
- Default model openrouter/free, with existing model/base URL repository-variable overrides retained. A small preflight redirects model aliases that were tested unsuccessfully back to the router.
- llm-timeout-ms = 90000; action step timeout = 2 minutes; complete job timeout = 5 minutes.
- Preflight checks that OPENROUTER_API_KEY exists without printing its value; Dependabot-specific guidance is emitted if missing.
- On failure or cancellation, review lookup checks current PR head SHA, Robin signature and submitted timestamp. A final lookup avoids a false failure if a review was posted just before timeout. The lookup runs with small per-call limits.
- Robin is a non-blocking advisor and does not request changes; no website/application code is changed.

## What this does not solve

The hard cap guarantees a prompt success-or-failure result after the job starts; it does not guarantee that every free provider is available or that every successful run finds a bug. The newest live successful run had zero findings. Amazon Q's review of PR #1500 finished before Robin started, so its timing is independent for that PR. PR #1501's later CodeRabbit review does not prove an automatic handoff; no explicit fallback reviewer workflow exists in this repository.

## References

- GitHub Actions reusable workflows: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- GitHub Actions timeout controls: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Pinned Robin action inspected for retries and OpenRouter stream timeout behavior: https://github.com/antongulin/robin/tree/fc0bf915b634bf2f8b88ff1392acefdfb54e28d9
- OpenRouter free router: https://openrouter.ai/openrouter/free
