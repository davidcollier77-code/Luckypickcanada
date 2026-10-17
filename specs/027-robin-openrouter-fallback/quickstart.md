# Verification Quickstart

## Expected Behavior

- PR open/reopen/ready/synchronize: OpenRouter is primary unless its quota preflight confirms fewer than five free requests remain. If it is skipped, fails, or does not produce a qualifying review, Cloudflare Workers AI is eligible as the independent backup when its safety latch and credentials are configured.
- Authorized /review or /robin comment: same primary/fallback behavior.
- /summary and /help: preserve Robin's command handling; these commands are not code-review fallback triggers.
- Amazon Q and CodeRabbit: remain independent reviewers. Robin's workflow must not post /q review or accept Q output as Robin's result.
- OpenRouter free quota exactly zero: do not make an OpenRouter inference request; Cloudflare can still run if explicitly enabled and configured.
- Review lookup/API hiccup before fallback: must not itself suppress the fallback unless it positively finds a qualifying current-head review.
- Successful Robin action without a real review for the exact current head: fail closed.

## Required Repository Settings for Cloudflare

- Repository variable CLOUDFLARE_ACCOUNT_ID: the actual 32-character Cloudflare account ID.
- Repository secret CLOUDFLARE_API_TOKEN: a token intended for Workers AI inference with minimum required permissions.
- Repository variable ROBIN_CLOUDFLARE_AI_FREE_TIER_CONFIRMED: set to the literal string true only after manually verifying that the Cloudflare account is on the Workers Free plan.

The Free-plan variable is only a safety latch and does not verify billing automatically. Do not set it based solely on the model name or on the existence of the token. If the account is on a paid plan or billing status is uncertain, leave the latch unset.

## Verification Commands

```bash
pnpm test -- tests/workflows/robin-openrouter-fallback.test.ts
pnpm test
pnpm exec tsc --noEmit
./jules-verify.sh
```

Run these in a repository-connected runner/PR CI. Do not claim a test, governance check, production build, or 495 MiB size gate passed until its actual result is available.

## Review Evidence

Confirm two pinned Robin actions exist, the primary and fallback credentials/endpoints are distinct, the fallback is not gated by OpenRouter quota or a failed preliminary review lookup, the final script explicitly exports EVENT_NAME, only one COMMENT_BODY environment mapping exists, and the final current-head guard matches the run start time.
