# Feature Specification: Safe First Deployment of Updater Secret

**Feature Branch**: fix/updater-scheduler-secret-bundling-20261022  
**Created**: 2026-10-22  
**Status**: Implementation prepared; CI and deployment verification pending

## Problem

The enabled scheduler's credential canary succeeded, but the deployment workflow failed while running Wrangler's secret-only command for GITHUB_TOKEN. Cloudflare rejected the update because the latest Worker version was not deployed. Since the step failed, the enabled Worker deployment did not run.

## User Story

As the repository maintainer, I need the dispatch credential installed as part of the scheduler's first/current Worker deployment, so a successful canary can proceed safely without a separate secret mutation requiring an already-deployed Worker version.

## Requirements

- **FR-001**: Keep the GitHub no-op dispatch canary ahead of any enabled Worker deployment.
- **FR-002**: If DISPATCH_ENABLED = "true", require UPDATER_DISPATCH_TOKEN and deploy the Worker with GITHUB_TOKEN provided through Wrangler's --secrets-file option in the same wrangler deploy operation.
- **FR-003**: Generate the secrets file at runner temporary storage with restrictive permissions, never commit it or print its content, and remove it when the step exits.
- **FR-004**: If dispatch is disabled, deploy the disabled configuration without requiring or uploading a dispatch token.
- **FR-005**: Do not modify UPDATER_SCHEDULER_ACTIVE; it is already set to true per the repository owner's confirmation.
- **FR-006**: Add a regression test that asserts the canary precedes deployment and prevents reintroduction of a separate secret-only update for GITHUB_TOKEN.
- **FR-007**: Preserve the approved schedules, worker dispatch mapping, credential canary, manual workflow dispatch, and existing application behavior.

## Success Criteria

- **SC-001**: Scheduler tests assert the deployment uses --secrets-file and does not use a secret-only update before deployment.
- **SC-002**: Current-head CI passes Node tests, ./jules-verify.sh, and Wrangler dry-run.
- **SC-003**: A main-branch deployment passes the canary and deploys the Worker with its secret in the same operation.
- **SC-004**: After deployment, the first natural scheduled dispatch is confirmed in Cloudflare logs and the corresponding GitHub Actions run; no live-dispatch success is claimed from CI alone.
