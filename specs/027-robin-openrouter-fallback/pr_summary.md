# PR Summary — Robin Cloudflare Fallback Hardening

## Purpose and Scope

PR #1512 merged the initial Cloudflare Workers AI fallback for Robin. This follow-up fixes workflow-control-flow and environment issues discovered by checking the current GitHub source and failed PR checks.

- The primary reviewer remains Robin using the existing OPENROUTER_API_KEY.
- The backup remains Robin using Cloudflare Workers AI, CLOUDFLARE_API_TOKEN, the account-specific /ai/v1 endpoint, and @cf/zai-org/glm-4.7-flash.
- The fallback remains bounded and must still post a qualifying review for the exact current PR head to satisfy the code-review gate.
- Amazon Q, CodeRabbit, secret values, application runtime, dependencies, and site deployment configuration are out of scope.
- The change is being prepared on fix/robin-cloudflare-fallback-hardening-20261017; main is not modified directly.

## Findings That Prompted the Follow-up

- GitHub Actions run #39056953803 observed OpenRouter free quota at 0/50. Primary inference was skipped. Cloudflare preflight correctly remained disabled because CLOUDFLARE_ACCOUNT_ID and ROBIN_CLOUDFLARE_AI_FREE_TIER_CONFIRMED were unset; the API token secret was present only as a masked value, and its validity was not established.
- In the main-branch workflow, Cloudflare preflight depended on a successful preliminary review lookup even though the lookup is best-effort; a temporary GitHub API failure could suppress the fallback.
- The final enforcement environment defined COMMENT_BODY twice and did not explicitly bind EVENT_NAME, though the enforcement script references EVENT_NAME under set -u.
- The original PR's OpenNext validation run #39056953812 failed TypeScript validation in that PR revision's malformed test regex. Current main test content is corrected; the hardening PR needs fresh verification.

## Implemented in This Follow-up

- Cloudflare configuration preflight is no longer gated on review_guard.outcome == success. A positive review result still suppresses duplicate fallback attempts; a failed lookup no longer blocks backup eligibility.
- Final enforcement explicitly receives github.event_name.
- Removed the duplicate COMMENT_BODY assignment and kept the safer slash-command-only mapping.
- Added regression assertions for fallback eligibility after a failed preliminary lookup, the explicit event name, and exactly one COMMENT_BODY environment mapping.
- Updated the feature spec, plan, research, quickstart, task list, and task memory so they accurately describe Cloudflare rather than the superseded OpenRouter-model fallback.

## Files in the Hardening Scope

1. .github/workflows/robin.yml
2. tests/workflows/robin-openrouter-fallback.test.ts
3. specs/027-robin-openrouter-fallback/spec.md
4. specs/027-robin-openrouter-fallback/plan.md
5. specs/027-robin-openrouter-fallback/research.md
6. specs/027-robin-openrouter-fallback/quickstart.md
7. specs/027-robin-openrouter-fallback/tasks.md
8. specs/027-robin-openrouter-fallback/pr_summary.md
9. memory-bank/activeContext.md
10. memory-bank/progress.md

## Verification Status — Do Not Overstate

- Source changes and targeted regression assertions: committed on the hardening branch.
- Targeted Vitest test: pending fresh PR CI.
- Full pnpm test: pending fresh PR CI.
- ./jules-verify.sh: pending fresh PR CI.
- Next.js / OpenNext build, Cloudflare worker artifact validation, and the 495 MiB hard size check: pending current-head CI.
- End-to-end Cloudflare fallback: not yet verified; the previously observed run did not invoke inference because the required account ID and Free-plan latch were absent.

## Required Configuration Before Backup Can Run

Confirm the actual account plan, then set repository variable CLOUDFLARE_ACCOUNT_ID and repository variable ROBIN_CLOUDFLARE_AI_FREE_TIER_CONFIRMED=true only if Workers Free is confirmed. CLOUDFLARE_API_TOKEN must exist and be valid for Workers AI inference. The latch is manual; it does not dynamically validate billing. No secret values are written or changed in this PR.
