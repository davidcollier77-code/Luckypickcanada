# Feature Specification: Retire Jules Bridge

**Feature Branch**: `chore/retire-jules-bridge-20261109`
**Created**: 2026-11-09
**Status**: Draft

## Goal
Remove the retired Jules Bridge integration from the repository after the owner removed the `jules-bridge` Worker from Cloudflare.

## User Story
As the repository owner, I want the retired Jules integration and its deployment path removed so GitHub no longer contains code or automation that could recreate or invoke the deleted Worker.

## Scope
- Remove the complete `workers/jules-bridge/` implementation, test, and Wrangler configuration.
- Remove `.github/workflows/deploy-jules-bridge.yml` so GitHub Actions cannot redeploy the retired Worker.
- Remove the DevSkim suppression exception and its tests that exist solely for the retired Worker.
- Update current Memory Bank context to record the retirement and preserve the historical record accurately.
- Audit active repository configuration for remaining Jules Bridge references.

## Out of Scope
- Do not change or delete `luckypickcanada-app`, `workers-issues-to-github`, or `luckypickcanada-updater-scheduler`.
- Do not modify the deployment workflows, bindings, secrets, routes, or configuration for the remaining Workers.
- Do not delete the shared `CLOUDFLARE_API_TOKEN` GitHub secret or any credentials used by other workflows.
- Do not rewrite historical Jules specifications, old PR summaries, branch history, or past verification records.
- Do not modify application behavior, dependencies, database, or production deployment.

## Acceptance Criteria
1. No Jules Bridge source, test, Wrangler configuration, or deployment workflow remains on the proposed branch.
2. The DevSkim helper and its tests contain no special-case allowance for the deleted Worker.
3. The three remaining Workers and their configuration/workflows are unchanged.
4. Historical Jules records remain intact and are clearly historical rather than active integrations.
5. Repository search and diff review show no active Jules Bridge deployment or API connection.
6. Relevant checks and all verification limitations are accurately reported.
