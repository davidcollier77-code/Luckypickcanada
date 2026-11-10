# Implementation Plan: Keep Cloudflare Workers Issues Enabled Across Deployments

**Branch**: `fix/keep-cloudflare-issues-enabled` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/131-cloudflare-workers-issues-persistence/spec.md`

## Summary

Explicitly enable Cloudflare Workers Issues in the existing Wrangler configuration while preserving existing observability logging and the existing issue-forwarding route. This is a configuration-only change; no application code, account credentials, resolver, automation, or scheduler changes are in scope.

## Technical Context

**Language/Version**: JSONC configuration; Node.js 22.x in CI

**Primary Dependencies**: Existing Wrangler 4.148.0 pin and OpenNext Cloudflare deployment

**Storage**: N/A

**Testing**: Wrangler configuration validation, existing PR CI, and post-deployment Cloudflare account-side confirmation

**Target Platform**: Existing Cloudflare Worker deployment

**Project Type**: Existing Next.js/Cloudflare application configuration

**Performance Goals**: No runtime or user-facing performance change

**Constraints**: Preserve existing observability logging and issue forwarding; do not add credentials, API keys, tokens, destinations, webhooks, automations, resolver logic, or scheduler changes

**Scale/Scope**: One setting in `wrangler.jsonc`

## Constitution Check

- Smallest change: PASS — one configuration file only.
- Preserve existing behavior: PASS — observability logging remains enabled and no forwarding workflow is changed.
- Security and credentials: PASS — no new secret or credential is introduced.
- Verification: PENDING — repository CI must validate the current PR head; live Cloudflare state can only be confirmed after deployment.

## Research

No additional research artifact was required for this narrow configuration change. The PR review records confirm the repository's Wrangler 4.148.0 pin and schema validation of `observability.issues.enabled`.

## Project Structure

### Documentation (this feature)

```text
specs/131-cloudflare-workers-issues-persistence/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code

```text
wrangler.jsonc
```

**Structure Decision**: No application source changes. The sole implementation is the existing Wrangler configuration.

## Complexity Tracking

No constitution violations.
