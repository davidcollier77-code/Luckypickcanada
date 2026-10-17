# Research: Bounded Robin Review Failover

## Decision 1 — Use explicit free model IDs instead of openrouter/free

Evidence: Failed and slow runs routed to different models, including Liquid, Cohere, NVIDIA content-safety and NVIDIA Lightning. Several returned empty review data or an upstream error. The first two live PR tests disproved initial choices. Gemma 4 31B returned HTTP 429 on every request and Qwen3 Coder :free returned HTTP 404 (no longer available for free); the subsequent Gemma 4 26B endpoint also returned HTTP 429. Cohere North Mini Code returned empty content twice and was cut off at the two-minute action limit. Current OpenRouter pages list Xing4.0 29B A4B and Qwen3.8 27B as free, both with structured-output JSON-schema support; measured availability fluctuates and is not an uptime guarantee.

Decision: Primary default xingchen-agi/xing4.0-29b-a4b:free; fallback default qwen/qwen3.8-27b:free. Keep repository variables for explicit overrides so the owner can change models without editing the workflow.

## Decision 2 — Enforce hard limits at the workflow step boundary

Evidence: The current caller invokes a reusable workflow whose job-level timeout is 45 minutes. The calling job cannot attach arbitrary execution controls to a reusable-workflow call. Robin's OpenRouter router path clears its first-chunk timer after the initial chunk, leaving later generation insufficiently bounded in the observed logs.

Decision: Invoke the pinned Robin action directly, use llm-timeout-ms 90000, apply timeout-minutes 2 to each model action step, and apply timeout-minutes 8 to the review job.

## Decision 3 — Fail fast on missing secrets and prevent duplicate reviews

Evidence: The Dependabot-triggered run failed with the same stall error across five attempts; the log alone does not prove a missing key. The action can post a review shortly before its step gets terminated.

Decision: Verify only whether the secret exists (never print it), provide a specific Dependabot-secret hint when appropriate, and query GitHub review objects for a Robin review matching the current head SHA submitted since this run started before attempting fallback. A final recheck protects against timeout-after-post.

## References

- GitHub Actions reusable workflow constraints: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- GitHub Actions workflow timeout controls: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Robin action at pinned commit: https://github.com/antongulin/robin/tree/fc0bf915b634bf2f8b88ff1392acefdfb54e28d9
- Gemma 4 31B free endpoint: https://openrouter.ai/google/gemma-4-26b-a4b-it:free
- Qwen3 Coder free endpoint: https://openrouter.ai/cohere/north-mini-code:free
