# Implementation Plan: Fix Updater Scheduler pnpm Cache Order

**Branch**: `fix/updater-scheduler-pnpm-setup-order-20261112` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

## Summary

The failed job shows that actions/setup-node attempts to initialize its pnpm cache before pnpm exists on PATH. Move the existing pinned pnpm/action-setup step ahead of actions/setup-node in both jobs in `.github/workflows/deploy-updater-scheduler.yml`. Keep all versions, cache settings, install commands, scheduler checks and deployment safeguards unchanged.

## Technical Context

- **Language/Version**: GitHub Actions YAML; Node.js 26.
- **Primary Dependencies**: actions/setup-node v6.5.0; pnpm/action-setup v4.0.0.
- **Storage**: GitHub Actions pnpm cache.
- **Testing**: Workflow source/order validation and GitHub Actions pull-request run.
- **Target Platform**: GitHub-hosted Ubuntu runner.
- **Project Type**: CI workflow configuration.
- **Constraints**: No package or lockfile changes; preserve existing deployment safety checks.
- **Scale/Scope**: One workflow file, two jobs.

## Constitution Check

- No protected application, payment, database, authentication, secret or Cloudflare deployment configuration is changed.
- Keep the change minimal and preserve all existing gates.
- The production build-size limit remains unaffected because application code and dependencies do not change.

## Research

The supplied job log confirms the failure occurs inside actions/setup-node: `Unable to locate executable file: pnpm`. The following Setup pnpm step is skipped because the Node setup step fails. The workflow contains the same ordering in both the pull-request verification job and main-branch deploy job.

## Project Structure

- `.github/workflows/deploy-updater-scheduler.yml`: reorder existing pnpm setup before Node cache setup.
- `specs/144-fix-updater-scheduler-pnpm-cache-order/`: task specification, plan, tasks, checklist and evidence.

## Implementation Decision

Use the existing pinned pnpm action first, then run actions/setup-node with `cache: pnpm`. This ensures the executable exists when setup-node resolves the package-manager cache. Do not remove caching or alter any later workflow steps.
