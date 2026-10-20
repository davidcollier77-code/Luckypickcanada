# Research: Reliable Updater Scheduling

## Verified evidence

- `.github/workflows/update-spec-kit.yml` contains Tuesday/Friday 1:05 AM and 5:05 AM Atlantic schedules.
- `.github/workflows/refresh-docs.yml` contains Tuesday/Friday 2:21 AM, 6:21 AM and 10:21 AM Atlantic schedules.
- Historical GitHub Actions run timestamps show repeated multi-hour differences from the configured local target times on October 13 and October 16, 2026.
- Separate task failures occurred: a Spec Kit managed command-file modification blocked the upgrade step; a documentation primary run failed at Create Pull Request. Those are not clock-format errors and this scheduling change does not silently claim to repair them.
- Cloudflare Cron Trigger expressions use UTC. Worker code can map scheduled timestamps with the IANA `America/Halifax` time zone.
- GitHub workflow dispatch requires appropriately scoped Actions write authorization.

## Hypothesis

Using Cloudflare as an independent time trigger should reduce dependence on delayed GitHub schedule events. It cannot guarantee an exact start/completion minute, and it does not repair errors inside either updater.

## Unknown / must verify before activation

- Current Cloudflare account Cron Trigger availability and plan quota.
- Whether the existing Cloudflare API token can deploy this additional Worker.
- Whether `UPDATER_DISPATCH_TOKEN` exists and has only the required repository Actions permission.
- Successful live deployment, registration of both cron expressions, and one natural scheduled dispatch.
- Whether and when to remove old GitHub schedule entries without reducing the current recovery opportunities.

## Additional retry-safety finding

The current official Cloudflare Scheduled Handler / Cron Trigger testing documentation exposes `controller.noRetry()`; the Local Explorer reports whether it was called. The Worker now calls it for each approved target slot before attempting a GitHub dispatch, because an ambiguous network failure may occur after GitHub accepted the request. A Cloudflare replay could create a second updater run. The existing next backup/recovery target is the retry path. Newly added regression tests assert that noRetry runs before fetch and is not called for non-target slots. The target resolver also rejects nonnumeric, missing, or non-finite `scheduledTime` values before formatting, preventing malformed invocations from crashing the handler.

- Reference: https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
- Local scheduled event testing reference: https://developers.cloudflare.com/workers/configuration/cron-triggers/ (Local Explorer and `noRetry` result)

## Decision

Prepare an isolated disabled-by-default Worker and tests, but leave the current GitHub schedules enabled. Treat deployment, token setup, and cutover as separate gates. Do not manually dispatch the actual production updaters as a test.
