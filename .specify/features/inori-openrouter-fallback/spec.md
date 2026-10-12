# Inori OpenRouter Fallback Specification

## Problem
The current Inori AI review workflow relies exclusively on Groq. While Groq is fast, it sometimes encounters terminal failures where "No review batch completed successfully", leaving the PR without a review. A single Groq retry is currently implemented but if it fails, the workflow fails closed. We need a safe, free-model fallback using OpenRouter.

## Objective
Implement a narrowly scoped, independently reviewed pull request that adds OpenRouter as a final fallback for eligible Groq provider failures, while preserving the current primary Groq review workflow and its security guarantees.

## Requirements
1. **Primary Provider:** Groq must remain the primary provider.
2. **Action Version:** Keep the current pinned Inori action version (`VOD-Studio/inori@f9c3535738d04b2a087ca56b306c9041e9e396b9`).
3. **Existing Retry:** Keep the existing 60-second delay before the eligible Groq retry. Keep the existing single Groq retry.
4. **Response Contract:** Preserve the existing JSON response contract and review summary. Preserve `on_update: replace`, existing review permissions, draft handling, concurrency behavior, and review limits.
5. **Fail-Closed Guard:** Preserve the final fail-closed guard so an unsuccessful review remains a failed required check.
6. **Fallback Trigger:** Attempt OpenRouter ONLY when the final Groq result proves that no review batch was successfully published and the failure is demonstrably attributable to a recoverable provider problem (e.g., rate limit or temporary provider outage). The condition should be similar to the existing retry condition.
7. **OpenRouter Configuration:**
    - Use `secrets.OPENROUTER_API_KEY`.
    - Select an explicitly free OpenRouter model compatible with Inori.
8. **No Duplicates:** Never run a second provider if the first provider may already have published a review.
9. **Error Context:** Preserve the original error context in the GitHub Actions step summary without exposing credentials.
10. **Fail Closed:** If OpenRouter fails, or its free limits are exhausted, the job must fail closed and clearly identify the failed recovery stage.
11. **Scope:** Do not change unrelated workflows, application files, dependencies, deployment configuration, secrets, or review policies.
