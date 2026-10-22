# Implementation Plan: Enable Cloudflare Updater Scheduler

**Branch**: `fix/updater-scheduler-activation-20261022` | **Date**: 2026-10-22 | **Spec**: `.specify/features/037-updater-scheduler-activation/spec.md`

## Summary

Change the checked-in Wrangler flag from `DISPATCH_ENABLED = "false"` to the exact string `"true"`, and update only the focused test and operational documentation to reflect the activation stage. The existing deployment workflow already fails closed behind the unique no-op canary; CI on this PR will test the config and dry-run deployment, while a successful canary is required by the post-merge production deployment.

## Technical Context

- **Runtime**: Existing Cloudflare Worker and GitHub Actions workflows.
- **Primary files**: `workers/updater-scheduler/wrangler.toml`, `workers/updater-scheduler/test/index.node-test.mjs`, and `workers/updater-scheduler/README.md`.
- **Security**: Reuse `UPDATER_DISPATCH_TOKEN`; do not rotate, echo, expose, or recreate the secret.
- **Dependencies**: No dependency or application-runtime changes.
- **Verification**: Current-head PR CI runs Node tests, `./jules-verify.sh`, and Wrangler dry run. Post-merge deployment must execute and pass the no-op canary before deploying the enabled Worker.
- **Handoff**: Keep native schedules in place until enabled deployment and canary success are verified; then set repository variable `UPDATER_SCHEDULER_ACTIVE=true` before the next scheduled target.
- **Explicit boundaries**: Do not change native schedule definitions, updater logic, credentials, cron mapping, UI, site behavior, or merge the PR.

## Constitution Check

- Single source of truth: the repository's Wrangler configuration is changed to match the requested dashboard value.
- Verify before acting: secret existence is verified; token permissions remain unverified until the canary runs.
- Protect core systems: the owner explicitly authorized the exact scheduler activation; no unrelated Cloudflare settings or secrets are changed.
- Testing: current-head CI is required. No local execution is available through the connected GitHub interface, so no local test pass is claimed.
- Security: no secret values are handled in files or logs.

## Implementation Sequence

1. Specify: document the requested activation and the external canary/handoff gates.
2. Plan: define the minimal config, regression-test, and README changes.
3. Tasks: record exact paths and verification gates.
4. Implement: change the config to exact string `"true"`; update the static config test and operational README; record evidence honestly in the PR Summary and Memory Bank.
5. Verify: use the scheduler CI job for tests, Spec Kit governance, and Wrangler dry run. Do not merge or claim production activation from PR-only checks.
6. Post-merge acceptance: deployment canary and Worker deploy must succeed; then set `UPDATER_SCHEDULER_ACTIVE=true` and verify a natural scheduled dispatch.

## Project Structure

- `.specify/features/037-updater-scheduler-activation/spec.md`
- `.specify/features/037-updater-scheduler-activation/plan.md`
- `.specify/features/037-updater-scheduler-activation/tasks.md`
- `.specify/features/037-updater-scheduler-activation/checklists/requirements.md`
- `workers/updater-scheduler/wrangler.toml`
- `workers/updater-scheduler/test/index.node-test.mjs`
- `workers/updater-scheduler/README.md`
- `PR_SUMMARY.md`
- `memory-bank/activeContext.md`

## Risks and Mitigations

- **Token lacks Actions permissions**: the unique canary must fail or time out and block enabled deployment.
- **Native/Worker overlap**: preserve native schedule definitions but switch them off only with `UPDATER_SCHEDULER_ACTIVE=true` after the enabled deployment and canary are verified.
- **Premature success claim**: distinguish PR CI, canary/deployment success, and the first natural dispatch as separate evidence gates.

## Complexity Tracking

No new packages, services, routes, or data stores are introduced.
