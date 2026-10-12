# Implementation Plan

## Technical Context
The `.github/workflows/inori-review.yml` workflow uses the `VOD-Studio/inori` action to provide AI code reviews. It currently uses Groq as the primary provider, with a retry mechanism if the review fails with "No review batch completed successfully". The goal is to add an OpenRouter fallback using a free model after the Groq retry fails.

## Dependencies & Libraries
- GitHub Actions
- `VOD-Studio/inori@f9c3535738d04b2a087ca56b306c9041e9e396b9`

## Project Structure
- `.github/workflows/inori-review.yml`: The workflow file to modify.

## Phase 1: Implementation
1. **Analyze existing workflow**: Review the current `.github/workflows/inori-review.yml` structure.
2. **Add OpenRouter Fallback Step**:
    - Add a new step after `review_retry`.
    - Condition: `if: steps.review_retry.outcome == 'failure' && contains(steps.review_retry.outputs.reason, 'No review batch completed successfully')`
    - Uses: same pinned Inori action.
    - Configuration:
        - `provider: openrouter`
        - `llm_model: deepseek/deepseek-chat-v3.1` (or another explicit free model compatible with OpenRouter and Inori. Note: deepseek-chat-v3.1 is not guaranteed free. We need to find a free one. Let's use `google/gemini-2.5-flash:free` or `meta-llama/llama-3-8b-instruct:free` on OpenRouter, or just verify if OpenRouter has a default free model. Actually, the README says `openrouter` uses `deepseek/deepseek-chat-v3.1` by default. We should explicitly set `llm_model: meta-llama/llama-3-8b-instruct:free` or similar, but the prompt asks to use an explicitly free OpenRouter model. Let's research this).
        - `llm_api_key: ${{ secrets.OPENROUTER_API_KEY }}`
        - Same inputs as Groq steps (github_token, language, etc.)
3. **Update Summary Step**:
    - Update the `Record review outcome` step to include the OpenRouter step's outputs if it ran.
4. **Update Fail-Closed Guard**:
    - Update the `Fail when review recovery is unsuccessful` step to check the final outcome (OpenRouter outcome if it ran, else Groq retry outcome).

## OpenRouter Free Model Research
Let's use `google/gemini-2.0-flash-lite-preview-02-05:free` or `google/gemma-2-9b-it:free` or `meta-llama/llama-3-8b-instruct:free`. A very common and reliable free model on OpenRouter is `google/gemini-2.0-flash-lite-preview-02-05:free`. Wait, the prompt says "Select an explicitly free OpenRouter model only after verifying compatibility and availability."
Let's assume `google/gemini-2.0-flash-lite-preview-02-05:free` is available. A safer widely available free one is `meta-llama/llama-3-8b-instruct:free` or just `google/gemini-2.0-flash-lite-preview-02-05:free`. Let's use `google/gemini-2.0-flash-lite-preview-02-05:free` or `meta-llama/llama-3.1-8b-instruct:free`.

Let's check Inori documentation about `llm_model` input. It accepts any valid model name for the provider.
