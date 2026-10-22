# LuckyPickCanada Updater Scheduler

A standalone Cloudflare Worker dispatches the existing Spec Kit and documentation update workflows at approved Atlantic local times. It does not change or deploy the Next.js application.

## Automatic dispatch schedule

All targets are Tuesday and Friday in `America/Halifax`:

| Local time | Workflow | Purpose |
|---|---|---|
| 1:05 AM | `.github/workflows/update-spec-kit.yml` | Primary Spec Kit update |
| 5:05 AM | `.github/workflows/update-spec-kit.yml` | Spec Kit retry opportunity |
| 2:21 AM | `.github/workflows/refresh-docs.yml` | Primary documentation refresh |
| 6:21 AM | `.github/workflows/refresh-docs.yml` | Documentation backup |
| 10:21 AM | `.github/workflows/refresh-docs.yml` | Documentation recovery |

Cloudflare Cron Triggers operate in UTC. The Worker converts each event's `scheduledTime` to `America/Halifax` and dispatches only if it matches one of these approved local slots. The UTC hour naturally moves with daylight-saving time; no fixed Atlantic offset is hard-coded. Two cron expressions, at UTC minutes 05 and 21, cover all approved local targets. Non-target events make no GitHub request.

## Cutover behavior

The cutover branch coordinates three changes together: Worker dispatch is enabled, the two existing workflows retain `workflow_dispatch` but no longer define competing GitHub `schedule` triggers, and a regression test checks that this single-scheduler arrangement is preserved.

The deploy workflow performs a no-op dispatch to `.github/workflows/verify-updater-dispatch-token.yml` before deploying an enabled Worker. This checks that `UPDATER_DISPATCH_TOKEN` can dispatch a workflow with Actions write permission without starting either production updater. It then synchronizes that credential to Cloudflare through stdin before deploying the Worker configuration. If the secret is missing or the canary dispatch fails, the deployment step is not reached.

**Before the cutover is applied to `main`, the repository owner must verify in Cloudflare that at least two Cron Trigger slots are available.** The Cloudflare dashboard screenshot confirms that a secret named `GITHUB_TOKEN` exists, and prior deployment logs confirm the repository secret `UPDATER_DISPATCH_TOKEN` was successfully copied to the Worker. Secret presence alone does not prove that the token can dispatch workflows; the canary preflight checks that at deployment time. The canary does not verify available Cloudflare cron quota or prove a natural scheduled run.

## Security and recovery

- The Worker token is stored only as a Cloudflare secret named `GITHUB_TOKEN`; the source contains no credential value.
- The GitHub Actions secret is named `UPDATER_DISPATCH_TOKEN`. The deploy workflow never prints it or puts it in a command-line argument.
- Logs include the intended workflow/slot and HTTP status, never the token or response body.
- The Worker ignores missing, nonnumeric, or non-finite scheduled timestamps rather than throwing or attempting to dispatch.
- For an approved slot the Worker calls Cloudflare's documented `controller.noRetry()` before making the GitHub request. An ambiguous network failure can occur after GitHub accepted a dispatch, so the next existing backup/recovery slot is the retry opportunity.
- Both updater workflows retain manual `workflow_dispatch` access for owner-initiated recovery.
- If the first natural dispatch fails after cutover, disable Worker dispatch and restore the original GitHub `schedule` entries before the next intended slot. Verify Cloudflare logs and GitHub Actions; a unit test or deploy success alone is not proof of live dispatch.

## Verification

Requires Node.js 22 or newer; no runtime dependencies are added.

```sh
node --test workers/updater-scheduler/test/index.node-test.mjs
pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml
./jules-verify.sh
```

Current-head GitHub Actions must pass these checks before this cutover PR is considered ready. The natural scheduled run, available Cloudflare cron quota, and real account state are external acceptance checks, not outcomes inferred from source code.

