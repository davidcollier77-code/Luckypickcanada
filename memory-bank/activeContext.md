# Active Context — Automatic Cloudflare Issue Resolution

- **Updated:** 2026-11-10
- **Repository:** davidcollier77-code/Luckypickcanada
- **Base branch:** main
- **Task branch:** freebuff/2720ca13a80dbbb863d410bc
- **Spec Kit feature:** specs/127-cloudflare-issue-auto-resolution
- **Pull request:** pending creation for this task

## Current Repository State
- Main at task start: `20fa45d9` (Spec Kit update #1797); the Memory Bank consolidation (#1796) and specialist skill routing (#1795) are merged.
- The only unrelated open pull request at task start was #1765, the automated DevSkim report update.
- The site Worker `luckypickcanada-app` is Wrangler-managed from `wrangler.jsonc` and deployed by `.github/workflows/deploy-open-next.yml` on pushes to main.
- The Workers Observability → GitHub issue integration consists of an occurrence-threshold issue automation, a `workers_observability_real_time_issue` notification policy, a generic webhook and the `workers-issues-to-github` bridge Worker. The bridge's source is not in this repository; only `scripts/cloudflare/workers-issues-to-github-setup.sh` documents its configuration.

## Current Task
Add automatic resolution of Cloudflare Workers Observability issues. After a fix passes the required checks and deploys successfully, the deployed Worker marks the referenced issue `resolved` using the `CLOUDFLARE_API_TOKEN` Worker secret, and only claims resolution when Cloudflare confirms the status. A failed or unconfirmed update leaves the issue unresolved and fails the deployment run with an explicit message.

## Scope and Boundaries
- Add only the resolution module, the protected resolution route, its tests, the deployed-fix reference collector and the post-deploy job in the existing deploy workflow, plus this feature's Spec Kit artifacts and Memory Bank context.
- Use a separate caller credential (`CLOUDFLARE_ISSUE_RESOLVE_TOKEN`) so the Cloudflare API token is never transmitted to the site.
- Do not modify `wrangler.jsonc`, the Workers Observability scanner, the generic webhook, GitHub issue creation, `ISSUE_DEDUPE`, the notification policy, the issue automation, the `workers-issues-to-github` bridge, or any scheduled workflow.
- Do not record any credential value in the repository.

## Verification Status
- Focused tests pass locally: route/module Vitest suite 16/16, reference-collector `node --test` 10/10.
- `pnpm tsc --noEmit`, `./freebuff-verify.sh` and the production build size measurement are recorded with the task results.
- A real Cloudflare status change requires the deployed Worker and both Worker secrets, so live confirmation is verified by the post-deploy job and current-head CI, not by local tests.
