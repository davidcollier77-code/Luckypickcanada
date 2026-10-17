# Research Notes: Robin Cloudflare Workers AI Fallback

## Repository and Runtime Evidence

1. PR #1512 merged the initial Cloudflare Workers AI fallback into main. The current workflow keeps OpenRouter as Robin's primary provider and uses a second pinned Robin action for the Cloudflare endpoint; Amazon Q remains independent.
2. GitHub Actions run [#39056953803](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39056953803) showed OpenRouter free quota at zero remaining of 50. The primary review was skipped as designed. Cloudflare preflight then reported that the Free-plan latch was unset and left the fallback unconfigured; the fallback action was skipped and Robin's check failed closed.
3. That run's environment showed a non-empty, masked CLOUDFLARE_API_TOKEN secret, but CLOUDFLARE_ACCOUNT_ID and ROBIN_CLOUDFLARE_AI_FREE_TIER_CONFIRMED were empty. Presence of a masked token is not proof of token validity. The fallback cannot be runtime-verified until the account ID is supplied and the Free-plan latch is set only after the actual account billing plan has been checked.
4. The same PR's OpenNext validation run [#39056953812](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39056953812) stopped during Next.js TypeScript validation because that PR revision's workflow regression test contained malformed regular-expression syntax. The currently inspected main-branch test source is syntactically corrected; a fresh CI run is required to verify the current head.
5. Main-branch source review revealed two guard robustness issues to harden: the Cloudflare preflight required the preliminary GitHub review lookup step to have succeeded (so a transient lookup failure could suppress fallback), and the final result script used EVENT_NAME without explicitly defining it in that step while defining COMMENT_BODY twice. The follow-up removes the unnecessary outcome dependency, exports EVENT_NAME, and keeps one slash-command-safe COMMENT_BODY assignment.

## Design Decisions

- Keep the existing OpenRouter secret for primary inference and the separate Cloudflare API token for fallback. Do not rotate, print, rename, or replace secrets.
- Use Cloudflare's OpenAI-compatible account endpoint and the fixed model @cf/zai-org/glm-4.7-flash. Model configuration is separate from the main site deployment pipeline.
- Treat the repository variable ROBIN_CLOUDFLARE_AI_FREE_TIER_CONFIRMED=true as a manual safety latch only. It does not check billing status dynamically. Do not enable it until the actual Cloudflare plan is confirmed; the account-specific endpoint and token also must be configured.
- When OpenRouter's free quota is zero, skip OpenRouter inference, but still allow the independent Cloudflare fallback if the Cloudflare safety latch and credentials are configured.
- Keep a final verification step requiring a Robin-marked review authored by github-actions[bot], associated with the exact current PR head SHA and submitted since the run began. A successful action exit alone is insufficient.
- Keep Amazon Q and CodeRabbit as independent reviewers; the Robin workflow must not dispatch or accept Amazon Q's output as its own result.
- Keep inference bounded by the two-minute fallback step limit, 60-second LLM timeout, output token cap, and diff-size cap.

## Remaining Verification

- Run the targeted workflow regression test and full pnpm test suite on the new hardening branch.
- Run ./jules-verify.sh and review all current-head pull-request checks.
- Verify the updated workflow YAML and TypeScript/Vitest test compile in actual CI.
- Confirm the account ID and Free-plan latch are configured correctly before expecting the Cloudflare action to run. No source edit can substitute for that repository setting/account-plan step.
