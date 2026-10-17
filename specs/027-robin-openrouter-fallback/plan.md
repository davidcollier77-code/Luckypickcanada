# Implementation Plan: Robin Cloudflare Workers AI Fallback

## Summary

Keep Robin's pinned OpenRouter primary and add a bounded Cloudflare Workers AI fallback if there is no qualifying Robin review for the current pull-request head. Amazon Q and CodeRabbit remain independent reviewers.

## Technical Context

- **Workflow**: .github/workflows/robin.yml, GitHub Actions YAML, Bash, and inline Node.js for quota parsing.
- **Review action**: antongulin/robin@fc0bf915b634bf2f8b88ff1392acefdfb54e28d9, pinned and reused for the primary and backup attempts.
- **Primary provider**: existing secrets.OPENROUTER_API_KEY and vars.ROBIN_LLM_BASE_URL (defaulting to https://openrouter.ai/api/v1).
- **Fallback provider**: secrets.CLOUDFLARE_API_TOKEN, vars.CLOUDFLARE_ACCOUNT_ID, and Cloudflare's OpenAI-compatible /ai/v1 endpoint.
- **Fallback model**: fixed @cf/zai-org/glm-4.7-flash; no paid model override or OpenRouter router alias is used as the Cloudflare model.
- **Resource limits**: fallback step capped at 2 minutes, LLM timeout at 60 seconds, output capped at 2048 tokens, and diff capped at 50,000 characters. The whole job has a 10-minute timeout.
- **Failover eligibility**: zero OpenRouter free quota skips OpenRouter inference but does not block Cloudflare. The Cloudflare attempt requires the account ID, token, and ROBIN_CLOUDFLARE_AI_FREE_TIER_CONFIRMED=true.
- **Safety note**: the Free-plan variable is a manual latch, not live verification of account billing. Confirm the account's actual plan before setting it; leave it unset otherwise.
- **Result verification**: a successful code-review outcome requires a Robin-marked GitHub review by github-actions[bot] for the exact current PR head and submitted no earlier than the run's recorded start.
- **Verification**: targeted Vitest test, full pnpm test, ./jules-verify.sh, current-head PR checks, and build size below 495 MiB where build checks run. Do not claim any check passed until its real result is available.

## Governance / Scope

- **Task group**: troubleshooting; this repairs an unreliable CI reviewer fallback and final result enforcement.
- **Authorization**: the repository owner asked for Cloudflare Workers AI as Robin's backup and authorized hardening of this in-scope setup.
- **Change boundary**: workflow, focused regression test, and task-specific Spec Kit/Memory Bank artifacts. No direct push to main, app runtime changes, dependency updates, secret rotation/value changes, Amazon Q changes, or website deployment configuration changes.
- **Credential hygiene**: workflow logs may report presence/configuration only; never print token values.

## Implementation Steps

1. Keep the primary OpenRouter flow and add Cloudflare configuration preflight plus a bounded second Robin action.
2. Skip primary inference when OpenRouter quota is confirmed exhausted, but keep the Cloudflare path eligible when its explicit safety gate is satisfied.
3. Make a transient failure in the pre-fallback GitHub review lookup non-blocking for the backup attempt; only a positive exact-head review match suppresses failover.
4. Explicitly pass github.event_name into the final enforcement script and securely extract legitimate commands to a single sanitized comment-body environment mapping.
5. Keep the final exact-head verification and fail closed when no qualifying Robin review exists.
6. Add regression assertions for provider separation, cost-safety latch, timeout caps, fallback eligibility, event-name environment, and duplicate comment-body mapping.
7. Run the targeted/full tests, required governance verification, and CI; keep verification tasks open until current-head results are confirmed.

## Main Risks and Mitigations

- **OpenRouter quota is zero**: no primary inference is attempted; Cloudflare can still run if explicitly enabled and configured.
- **GitHub review lookup briefly fails**: the backup remains eligible unless the lookup positively confirms a review was posted.
- **Paid usage risk**: do not infer that the account is free from model naming or token presence. The repository variable is a manual latch; confirm billing plan separately.
- **Fallback action claims success but posts no review**: the final gate checks the exact current PR head and run timestamp rather than trusting the action exit code.
- **Provider/config values unavailable**: report the setup blocker and fail the review check rather than green-lighting an unreviewed PR.
- **No local network/test runner**: rely on actual PR CI, do not claim local results, and report remaining pending checks.

## Rollback

Revert the focused hardening PR. Existing OpenRouter secrets, Cloudflare token values, Amazon Q's independent workflow, application runtime, and site deployment configuration remain unchanged.
