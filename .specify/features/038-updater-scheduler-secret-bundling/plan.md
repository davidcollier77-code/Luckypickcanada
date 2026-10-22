# Implementation Plan: Updater Secret Bundled With Deployment

**Branch**: fix/updater-scheduler-secret-bundling-20261022  
**Spec**: .specify/features/038-updater-scheduler-secret-bundling/spec.md

## Decision

Use Cloudflare Wrangler's documented wrangler deploy --secrets-file support. Generate the JSON file at runtime from the repository secret in Node.js, apply mode 0600/umask 077, and remove it with an exit trap. This deploys code and secret together rather than attempting a secret-only update before an active Worker version exists.

## Scope

- Update only the scheduler deployment workflow, its focused regression test and operational README, this task's Spec Kit artifacts, PR summary, and current project context.
- Keep the GitHub no-op canary before the deployment command.
- Preserve the disabled-configuration path without secret upload.
- Leave UPDATER_SCHEDULER_ACTIVE=true unchanged.
- No new packages, credentials, application routes, or production updater logic.

## Verification

The connected GitHub interface has no repository shell, so local Node tests, ./jules-verify.sh, and Wrangler dry-run cannot be honestly reported as run here. Current-head PR CI must run those checks; post-merge deployment and first natural dispatch remain distinct live acceptance checks.
