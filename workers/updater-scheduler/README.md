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

The reviewed activation configuration sets `DISPATCH_ENABLED = "true"`, matching the production flag configured in Cloudflare. The native GitHub `schedule` triggers remain defined and continue to run until the repository variable `UPDATER_SCHEDULER_ACTIVE` is deliberately set to `true` after the enabled Worker deployment and no-op canary have been verified.

The deploy workflow enforces a fail-closed credential preflight before deploying the enabled configuration. It dispatches a uniquely identified, no-op canary workflow; it then locates that exact run and waits for the run to complete successfully. If the secret is missing, the run cannot be found, or it completes unsuccessfully or times out, the Worker deployment is blocked. The canary never runs either production updater. After it succeeds, the deploy workflow creates a restrictive-permission temporary secrets file and passes it to Wrangler's --secrets-file option, so Worker code and GITHUB_TOKEN are installed in the same deployment. The temporary file is removed when the step exits. The workflow no longer attempts a separate secret update before a Worker version is deployed.

Controlled activation sequence:
1. Confirm the deployed Worker has both intended Cron Triggers. The 2026-10-22 deployment reports both trigger entries installed; re-check account quota before adding any more.
2. Use the deployment canary to prove that the existing repository secret `UPDATER_DISPATCH_TOKEN` can dispatch and read workflow-run status. Secret presence alone is not permission proof.
3. Treat deployment as blocked unless the exact canary run completes successfully and the enabled Worker deployment succeeds.
4. After the enabled Worker deployment and canary are verified, set repository variable `UPDATER_SCHEDULER_ACTIVE=true` before the next target slot. The updater jobs will then skip native schedule events but continue to accept manual `workflow_dispatch` events. Do not set this variable earlier.
5. Verify a natural Worker dispatch appears in Cloudflare logs and its matching GitHub Actions run. Tests or a successful deployment alone do not prove live scheduling.

If an enabled Worker fails after activation, reset repository variable `UPDATER_SCHEDULER_ACTIVE` to `false` (or remove it) so the GitHub scheduled jobs can run again, then redeploy the Worker with dispatch disabled and restore the previous stable setup before the next target slot.

## Security and recovery

- The Worker credential is stored only as Cloudflare secret `GITHUB_TOKEN`; no value is committed or logged.
- The repository secret is named UPDATER_DISPATCH_TOKEN. For an enabled deployment, the workflow serializes it into a mode-0600 temporary JSON secrets file, passes only the file path to Wrangler, and removes the file on exit. The secret value is not echoed, committed, or included in command arguments. Worker code and secret are deployed together to avoid a secret-only update failing when no latest Worker version is deployed.
- Logs include the intended workflow/slot and HTTP status, never the token or response body.
- The Worker ignores missing, nonnumeric, or non-finite scheduled timestamps instead of throwing or attempting to dispatch.
- For an approved slot the Worker calls Cloudflare's documented `controller.noRetry()` before dispatch. An ambiguous network failure can occur after GitHub accepted a dispatch, so automatic replay is avoided and later retry/recovery slots remain available.
- Both updater workflows retain manual `workflow_dispatch` access.

## Verification

Requires Node.js 22 or newer; no runtime dependencies are added.

```sh
node --test workers/updater-scheduler/test/index.node-test.mjs
pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml
./freebuff-verify.sh
```

Current-head GitHub Actions must pass these checks before the reviewed enabled configuration is treated as repository-verified. The checked-in configuration sets `DISPATCH_ENABLED = "true"`, but live activation still depends on a successful no-op canary and enabled Worker deployment. Cron quota, effective token permissions, the handoff variable, and a natural scheduled dispatch are external acceptance checks, not outcomes inferred from source or unit tests. The existing GitHub schedule definitions remain in place until `UPDATER_SCHEDULER_ACTIVE` is set to `true` after the enabled deployment and canary are verified.
