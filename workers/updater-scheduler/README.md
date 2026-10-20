# LuckyPickCanada Updater Scheduler

A standalone Cloudflare Worker prepared to start the existing Spec Kit and documentation update workflows at approved Atlantic local times. It does not change or deploy the Next.js application.

## Intended dispatch times

All times are in `America/Halifax`, every Tuesday and Friday:

| Local time | Workflow | Purpose |
|---|---|---|
| 1:05 AM | `.github/workflows/update-spec-kit.yml` | Primary Spec Kit update |
| 5:05 AM | `.github/workflows/update-spec-kit.yml` | Spec Kit retry opportunity |
| 2:21 AM | `.github/workflows/refresh-docs.yml` | Primary documentation refresh |
| 6:21 AM | `.github/workflows/refresh-docs.yml` | Documentation backup |
| 10:21 AM | `.github/workflows/refresh-docs.yml` | Documentation recovery |

Cloudflare Cron Triggers operate in UTC. The Worker converts each event's `scheduledTime` to `America/Halifax` and dispatches only if it matches one of these approved local slots. The UTC hour naturally moves with daylight-saving time; no fixed Atlantic offset is hard-coded. Two cron expressions, at UTC minutes 05 and 21, cover all approved local targets. Non-target events make no GitHub request.

## Safety defaults

- `DISPATCH_ENABLED = "false"` in `wrangler.toml`. Deployment alone cannot dispatch workflows.
- No token is committed. The Worker expects a Cloudflare secret named `GITHUB_TOKEN` holding a fine-grained GitHub token scoped to this repository with Actions write permission.
- Logs record the workflow/slot and HTTP status, not the token or response body.
- For an approved slot the Worker calls Cloudflare's documented `controller.noRetry()` before making the GitHub request. A network failure can happen after GitHub accepted the dispatch, so platform retries could create duplicate updater runs. The next existing scheduled backup/recovery slot is the retry opportunity.
- The existing GitHub `schedule` entries remain untouched by this PR. Do not enable Worker dispatch while those schedules remain active.

## Local checks

Requires Node.js 22 or newer; no runtime dependencies are added.

```sh
node --test workers/updater-scheduler/test/index.node-test.mjs
pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml
```

## Deployment and cutover

When this code reaches `main`, the deployment workflow publishes the Worker **with dispatch disabled** using the repository's existing `CLOUDFLARE_API_TOKEN` secret. If repository secret `UPDATER_DISPATCH_TOKEN` is present, that workflow copies it to the Worker secret through stdin; it is never echoed or added to the command line. Missing token configuration leaves the Worker unable to dispatch and does not disable the GitHub schedules.

Before enabling dispatch:

1. Confirm the Cloudflare account has at least two available Cron Trigger slots. Published Free limits list five triggers per account, but this repo cannot inspect current account usage; verify it in the dashboard.
2. Create a fine-grained GitHub token limited to `davidcollier77-code/Luckypickcanada` with Actions write permission. Store it as Actions secret `UPDATER_DISPATCH_TOKEN`; do not put it in source code or a workflow variable.
3. Confirm the Worker exists, both triggers are registered, and the secret is configured. Keep dispatch disabled during this setup.
4. Prepare a separate, reviewed cutover that enables Worker dispatch and removes only the matching `schedule` entries from the two existing workflow files, preserving `workflow_dispatch`, workflow jobs, permissions, daily guards, validations, PR handling and notifications. Do not perform cutover until deployment and secret setup have been verified.
5. Verify the first natural scheduled dispatch in Cloudflare logs and GitHub Actions. Do not trigger a production updater manually just to test.
6. If the first dispatch fails, disable Worker dispatch and restore the existing GitHub schedules before the next intended slot.

A unit test, Wrangler dry run, or deployment by itself does not prove live dispatch. This PR does not execute the cutover or turn dispatch on.

## Cost and verification limits

The Worker introduces no runtime dependency and is designed for the Cloudflare Workers Free plan. Published plan quotas indicate the two triggers and low event volume should fit, subject to confirming actual account usage. Live account quota, secret presence, deployment, and natural scheduled execution are external acceptance checks—not claims established by source tests.
