# Implementation Plan: Updater Scheduler Cutover

**Branch**: `fix/updater-scheduler-cutover-20261022` | **Date**: 2026-10-22 | **Spec**: `.specify/features/036-updater-scheduler-cutover/spec.md`

## Summary

Complete the prepared migration by making the Cloudflare Worker the sole automatic dispatcher for the Spec Kit and documentation refresh workflows. Preserve the five Atlantic local targets and owner-initiated manual dispatch. The PR must not be merged until the account's available Cron Trigger quota is checked.

## Technical Context

- **Runtime**: Existing Cloudflare Worker and GitHub Actions workflows.
- **Dependencies**: No new runtime packages.
- **Verification**: Worker unit tests, static cutover regression test, `./jules-verify.sh`, and Wrangler dry run through PR CI.
- **Credentials**: Existing repository secret `UPDATER_DISPATCH_TOKEN`, synchronized as Cloudflare secret `GITHUB_TOKEN`; no token value is committed.
- **Protected scope**: Scheduler configuration, automation, and deployment. No website runtime, application routes, user-facing content, or production updater job logic changes.

## Design

1. In one coordinated change, set the proposed Worker configuration to enabled and remove only the native `schedule` blocks from the two target workflows, retaining `workflow_dispatch`.
2. Add a static regression test preventing either workflow from reintroducing a competing automatic schedule while the Worker is enabled.
3. Add a no-op manual-only canary workflow. On main-branch deployment, require `UPDATER_DISPATCH_TOKEN` and dispatch the canary before syncing the secret or deploying the active Worker. A failed canary must stop deployment.
4. Synchronize the token through standard input before Worker deployment. Never echo the token or include it in command arguments.
5. Update the scheduler documentation and task-specific governance artifacts without touching unrelated documentation snapshots or application files.
6. Keep the pull request in draft for owner review. The owner must verify two available Cloudflare Cron Trigger slots and confirm the token permission assignment before applying the cutover. After activation, verify the first natural dispatch and keep the documented rollback ready.

## Risks and Mitigations

- **Token secret missing or lacks Actions write**: preflight fails before Worker deployment.
- **Cron Trigger quota exhausted**: external pre-merge gate; this repository cannot establish live account quota from source.
- **Duplicate dispatches**: remove both existing workflow schedule blocks in the same cutover PR.
- **Loss of manual recovery**: both workflows retain `workflow_dispatch`.
- **Uncertain execution after network failure**: Worker `controller.noRetry()` behavior stays unchanged; next scheduled retry/recovery slot remains the fallback.

## Verification Status

Source-level modifications are committed on the feature branch. Local shell execution is unavailable in this connected session, so no local unit test, `./jules-verify.sh`, or Wrangler dry-run result is claimed. PR CI must provide current-head verification. Live Cloudflare quota and first natural dispatch remain external acceptance gates.
