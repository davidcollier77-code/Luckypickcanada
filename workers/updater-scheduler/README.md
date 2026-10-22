# LuckyPickCanada Updater Scheduler

A standalone Cloudflare Worker prepared to dispatch the existing Spec Kit and documentation refresh workflows at approved Atlantic local times. It does not change or deploy the Next.js application.

## Intended dispatch schedule

All targets are Tuesday and Friday in `America/Halifax`:

| Local time | Workflow | Purpose |
|---|---|---|
| 1:05 AM | `.github/workflows/update-spec-kit.yml` | Primary Spec Kit update |
| 5:05 AM | `.github/workflows/update-spec-kit.yml` | Spec Kit retry opportunity |
| 2:21 AM | `.github/workflows/refresh-docs.yml` | Primary documentation refresh |
| 6:21 AM | `.github/workflows/refresh-docs.yml` | Documentation backup |
| 10:21 AM | `.github/workflows/refresh-docs.yml` | Documentation recovery |

Cloudflare Cron Triggers operate in UTC. The Worker converts each event's `scheduledTime` to `America/Halifax` and dispatches only if it matches one of these approved local slots. The UTC hour naturally moves with daylight-saving time; no fixed Atlantic offset is hard-coded. Two cron expressions, at UTC minutes 05 and 21, cover all approved local targets. Non-target events make no GitHub request.

## Safe staged cutover

The checked-in default remains `DISPATCH_ENABLED = "false"`. This preparation change deliberately leaves both existing GitHub `schedule` triggers in place, so the currently working automatic schedules remain available while external prerequisites are checked.

The deploy workflow includes a fail-closed credential preflight for a future enabled configuration. It dispatches a uniquely identified, no-op canary workflow; it then locates that exact run and waits for the run to complete successfully. If the secret is missing, the run cannot be found, or it completes unsuccessfully or times out, the Worker deployment is blocked. The canary never runs either production updater.

Before a separate activation change:
1. Confirm the Cloudflare account has at least two available Cron Trigger slots.
2. Confirm the repository secret `UPDATER_DISPATCH_TOKEN` holds a fine-grained token scoped to this repository with Actions read/write permission.
3. Confirm the deployed Worker has the expected cron triggers and the canary preflight succeeds.
4. In the reviewed activation change, enable Worker dispatch while preserving the existing schedules temporarily. Once the Worker deployment is verified and before the next target slot, set repository variable `UPDATER_SCHEDULER_ACTIVE=true`; the updater jobs will then skip native schedule events but continue to accept manual `workflow_dispatch` events. Do not set this variable before an enabled Worker deployment is verified.
5. Verify a natural Worker dispatch appears in Cloudflare logs and its matching GitHub Actions run. Tests or a successful deployment alone do not prove live scheduling.

If an enabled Worker fails after activation, reset repository variable `UPDATER_SCHEDULER_ACTIVE` to `false` (or remove it) so the GitHub scheduled jobs can run again, then redeploy the Worker with dispatch disabled and restore the previous stable setup before the next target slot.

## Security and recovery

- The Worker credential is stored only as Cloudflare secret `GITHUB_TOKEN`; no value is committed or logged.
- The repository secret is named `UPDATER_DISPATCH_TOKEN`. The deploy workflow sends it to Wrangler through standard input and does not echo it or place it in command arguments.
- Logs include the intended workflow/slot and HTTP status, never the token or response body.
- The Worker ignores missing, nonnumeric, or non-finite scheduled timestamps instead of throwing or attempting to dispatch.
- For an approved slot the Worker calls Cloudflare's documented `controller.noRetry()` before dispatch. An ambiguous network failure can occur after GitHub accepted a dispatch, so automatic replay is avoided and later retry/recovery slots remain available.
- Both updater workflows retain manual `workflow_dispatch` access.

## Verification

Requires Node.js 22 or newer; no runtime dependencies are added.

```sh
node --test workers/updater-scheduler/test/index.node-test.mjs
pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml
./jules-verify.sh
```

Current-head GitHub Actions must pass these checks before this preparation PR is treated as repository-verified. Cron quota, exact live secret state, production deployment, and a natural scheduled dispatch are external acceptance checks, not outcomes inferred from source or unit tests. The current branch does not enable Worker dispatch or disable the existing GitHub schedules.
