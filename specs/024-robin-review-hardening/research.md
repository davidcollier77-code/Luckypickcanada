# Research: Bounded Robin Review Failover

## Decision 1 — Use explicit free model IDs instead of openrouter/free

Evidence: Failed and slow runs routed to different models, including Liquid, Cohere, NVIDIA content-safety and NVIDIA Lightning. Several returned empty review data or an upstream error. OpenRouter's current model pages list Gemma 4 31B and Qwen3 Coder as zero-price free endpoints. Gemma 4 31B showed about 97.8% inference availability across the recent three-day window when researched; Qwen3 Coder's free page was currently available and describes it as code-oriented. These are current observations, not an uptime guarantee.

Decision: Primary default google/gemma-4-31b-it:free; fallback default qwen/qwen3-coder:free. Keep repository variables for explicit overrides so the owner can change models without editing the workflow.

## Decision 2 — Enforce hard limits at the workflow step boundary

Evidence: The current caller invokes a reusable workflow whose job-level timeout is 45 minutes. The calling job cannot attach arbitrary execution controls to a reusable-workflow call. Robin's OpenRouter router path clears its first-chunk timer after the initial chunk, leaving later generation insufficiently bounded in the observed logs.

Decision: Invoke the pinned Robin action directly, use llm-timeout-ms 120000, apply timeout-minutes 3 to each model action step, and apply timeout-minutes 8 to the review job.

## Decision 3 — Fail fast on missing secrets and prevent duplicate reviews

Evidence: The Dependabot-triggered run failed with the same stall error across five attempts; the log alone does not prove a missing key. The action can post a review shortly before its step gets terminated.

Decision: Verify only whether the secret exists (never print it), provide a specific Dependabot-secret hint when appropriate, and query GitHub review objects for a Robin review matching the current head SHA submitted since this run started before attempting fallback. A final recheck protects against timeout-after-post.

## References

- GitHub Actions reusable workflow constraints: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- GitHub Actions workflow timeout controls: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Robin action at pinned commit: https://github.com/antongulin/robin/tree/fc0bf915b634bf2f8b88ff1392acefdfb54e28d9
- Gemma 4 31B free endpoint: https://openrouter.ai/google/gemma-4-31b-it:free
- Qwen3 Coder free endpoint: https://openrouter.ai/qwen/qwen3-coder:free
