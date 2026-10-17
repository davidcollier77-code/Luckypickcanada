# Implementation Plan: Robin Cloudflare Workers AI Fallback

## Summary

Keep Robin's primary OpenRouter attempt and add a bounded, independent Cloudflare Workers AI fallback when no review for the current PR head is found. Amazon Q and CodeRabbit remain independent and untouched. Amazon Q's independent reviewer is outside the changed-file set.

## Technical Context

- **Language/configuration**: GitHub Actions YAML, Bash, inline Node.js quota parsing, TypeScript/Vitest regression tests.
- **Existing action**: `antongulin/robin@fc0bf915b634bf2f8b88ff1392acefdfb54e28d9`, pinned and reused for both attempts.
- **Primary credential/endpoint**: Existing `secrets.OPENROUTER_API_KEY` and `vars.ROBIN_LLM_BASE_URL`.
- **Fallback credential/endpoint**: `secrets.CLOUDFLARE_API_TOKEN`, `vars.CLOUDFLARE_ACCOUNT_ID`, and Cloudflare's OpenAI-compatible `/ai/v1` endpoint.
- **Default fallback model**: `@cf/zai-org/glm-4.7-flash`, listed as available on Cloudflare Workers Free; if it is configured as primary, a second distinct free NVIDIA model is selected. A configured fallback must be a concrete `:free` model ID, not `openrouter/free`, a known-failed model, or the primary itself.
- **Timeouts**: 60-second LLM request timeout for the fallback, 2-minute fallback step timeout, 10-minute whole-job ceiling. Existing primary remains at its current bounded settings.
- **Data flow**: Quota preflight outputs a numeric remaining count or `unknown`; the Cloudflare fallback is independent of the OpenRouter quota result.
- **Verification**: Static Vitest assertions; inspect the full changed-file set; run `pnpm test`, `./jules-verify.sh`, and check CI outputs where runner access permits. Respect the 495 MB hard build-size maximum if a build runs.
- **Constraints**: Do not rotate the key, call Q, change Q's workflow, modify application runtime or dependencies, or allow a passing check without a verifiable current-head Robin review.

## Governance / Constitution Check

- Task group: `troubleshooting`, because this repairs a failing/faulty CI reviewer fallback and its final check conditions.
- Authorization: User explicitly authorized implementing this repair; no direct change to `main`.
- Spec Kit sequence: specify → plan → tasks → implement, carried out file-driven because native slash-command dispatch is unavailable in this session.
- Security: Never print secret values. Require an explicit repository-variable confirmation of the Workers Free plan before enabling the Cloudflare fallback; use a Cloudflare API token scoped to Workers AI Read.
- Scope control: Workflow, narrow regression test, active feature artifacts, and task memory only.
- Fail-closed result: No Amazon Q fallback acceptance; no successful review result merely because a fallback action completed without a qualifying current-head Robin review.

## Implementation Steps

1. Add the feature specification and requirements-quality checklist.
2. Record researched action history and a bounded test/verification plan.
3. Add a Cloudflare Workers AI configuration preflight and keep OpenRouter quota diagnostics independent.
4. Run the pinned Robin action against Cloudflare's OpenAI-compatible endpoint only when the primary path has not yielded a current-head review and the free-plan safety latch and credentials are configured.
5. Verify the exact PR head after fallback, and run diagnostics only after the fallback has had its chance.
6. Remove Q fallback state from the final outcome enforcement.
7. Add static workflow regression coverage, update the active Spec Kit pointer and task memory, then inspect the final diff and report verification status.

## Risks & Mitigations

- **OpenRouter free quota exhausted**: Attempt Cloudflare only when its explicit free-plan latch and credentials are configured; otherwise fail closed.
- **Primary and fallback are accidentally identical**: Resolve to a distinct default free model; error if distinct selection cannot be achieved.
- **A provider review is mistaken for Robin**: Only a review authored by `github-actions[bot]` with a Robin marker, exact current-head SHA, and timestamp no earlier than this run is accepted.
- **Model/router changes over time**: Keep fallback configurable through the existing repository variable, but validate that it remains a distinct free model.
- **No local runner network**: Do not claim local tests or `./jules-verify.sh` passed; use PR CI evidence when available and report any pending checks.

## Rollback

Revert this focused PR. The existing secret and separate Amazon Q reviewer remain unchanged.
