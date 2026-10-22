# Implementation Plan: Safe Updater Scheduler Cutover

**Branch**: `fix/updater-scheduler-cutover-20261022` | **Date**: 2026-10-22 | **Spec**: `.specify/features/036-updater-scheduler-cutover/spec.md`

## Summary

Prepare a guarded migration away from delayed GitHub native schedule delivery without risking missed updates. This PR leaves the Worker disabled and preserves the current native schedules. A future activation step is permitted only after account quota and credential permissions are checked.

## Technical Context

- **Runtime**: Existing Cloudflare Worker and GitHub Actions workflows.
- **Dependencies**: No new runtime packages.
- **Verification**: Worker unit tests, static handoff regression test, `./jules-verify.sh`, and Wrangler dry run.
- **Credentials**: Repository secret `UPDATER_DISPATCH_TOKEN`, synchronized as Cloudflare secret `GITHUB_TOKEN`; no credential values are committed.
- **Protected scope**: Scheduler configuration and automation only. No application runtime, routes, user-facing content, or production updater job logic changes.

## Design

1. Keep the checked-in `DISPATCH_ENABLED = "false"` and leave native GitHub schedules active during preparation.
2. Keep job-level handoff guards on scheduled events in both updater workflows. The native jobs remain active unless repository variable `UPDATER_SCHEDULER_ACTIVE` is exactly `true`; manual dispatch always remains runnable.
3. For future enabled deployment, require the repository dispatch token, launch a uniquely identified no-op canary, identify that exact run, poll until terminal completion, and block deployment unless its conclusion is successful.
4. Update the PR path filter so any edits to either updater workflow invoke the scheduler verification suite.
5. Add complete Friday mapping assertions alongside the Tuesday workflow mapping checks.
6. Document the external activation prerequisites and rollback path. Keep the final activation dependent on a separate reviewed configuration change after cron quota and token permissions are verified.

## Risks and Mitigations

- **Canary request accepted but run fails/never appears**: preflight waits for the unique canary run and requires a successful terminal conclusion.
- **Premature merge**: the preparation config remains disabled and native schedules remain available.
- **Accidental schedule handoff too early**: the owner must only set `UPDATER_SCHEDULER_ACTIVE=true` after successful Worker deployment and before the next intended target.
- **Cron Trigger quota insufficient**: external gate before the activation change.
- **Lost manual recovery**: both updater workflows retain `workflow_dispatch`.

## Verification Status

Local shell execution is unavailable in this session, so local tests, `./jules-verify.sh`, and Wrangler dry run are not claimed. Current-head PR CI must provide the actual results. Cloudflare cron quota, token permissions, enabled deployment, and the first natural dispatch remain external acceptance gates.
