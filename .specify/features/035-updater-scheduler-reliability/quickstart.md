# Quickstart: Updater Scheduler

1. Review the PR and wait for the scheduler tests, `./jules-verify.sh`, Wrangler dry run, and repository build-size gate to pass on the PR head.
2. After an approved merge, verify that the isolated Worker deploys with `DISPATCH_ENABLED=false`. Existing GitHub schedules must remain active.
3. Confirm at least two Cron Trigger slots are free in the Cloudflare account. Verify the account-specific fact in Cloudflare rather than assuming the published allowance is unused.
4. Create a repository-scoped fine-grained GitHub token with Actions write permission; store it as repository secret `UPDATER_DISPATCH_TOKEN`. Never place the value in source code.
5. Confirm deployment registered both Cron Triggers and the Worker secret is configured. Dispatch must still remain off.
6. Prepare a separate review for the final cutover: enable dispatch and remove only old schedule entries after all gates are met.
7. Verify the first naturally scheduled event in Cloudflare logs and GitHub Actions. Do not trigger a production update just to test.
8. On failure, disable Worker dispatch and restore the GitHub schedules before the next intended slot.
