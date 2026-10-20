# Implementation Plan: Reliable Updater Scheduling

**Branch**: `fix/updater-scheduler-reliability-1540` | **Date**: 2026-10-20 | **Spec**: `.specify/features/035-updater-scheduler-reliability/spec.md`

## Summary

Repeated schedule history shows multi-hour delays in both existing updater workflows. Add an isolated Cloudflare Worker that checks two UTC minute triggers and maps their scheduled timestamp to the approved local `America/Halifax` times. It dispatches through GitHub's supported workflow-dispatch endpoint only when explicitly enabled.

## Technical Context

- **Runtime**: Cloudflare Workers with ECMAScript modules; Node.js 22 built-in test runner.
- **Dependencies**: Existing repository Wrangler CLI in development dependencies; no new runtime package.
- **Testing**: Worker unit tests, `./jules-verify.sh`, existing PR OpenNext/build-size workflow and Wrangler dry run.
- **Permissions**: Repository-restricted GitHub fine-grained token with Actions write; Cloudflare deployment uses the existing GitHub secret.
- **Constraints**: Existing GitHub schedules stay active in this PR; `DISPATCH_ENABLED` remains false; 495 MiB build cap; no manual production dispatch.
- **Scope**: New Worker directory, its deployment/verification workflow, task-specific Spec Kit artifacts, active feature pointer, PR Summary and Memory Bank record.

## Design

1. Define a fixed allowlist for the five existing local slots and the two workflow filenames.
1a. Reject missing or malformed `scheduledTime` values before formatting the timestamp; only finite numeric epoch milliseconds may be mapped to an approved slot.
2. Use `Intl.DateTimeFormat` with `America/Halifax` to convert `scheduledTime`; ignore non-target times before reading or using credentials.
3. Use the least required GitHub REST request and send only `{ "ref": "main" }`.
4. Call Cloudflare's documented `controller.noRetry()` for approved slots before dispatch, then make one request; an ambiguous failure must not automatically replay a dispatch that GitHub may already have accepted. Existing backup/recovery schedule slots remain the retry path.
5. Deploy only the isolated Worker, defaulting to disabled. Preserve both existing GitHub schedule configurations.
6. Keep account-specific prerequisites and the final scheduler cutover as a separate, reviewed step after deployment and secret availability have been confirmed.

## Governance / verification status

The repository's `AGENTS.md` and relevant updater/workflow source have been inspected. The local Node test suite passed 11/11 on the initial standalone implementation. The exact PR-head run of `./jules-verify.sh`, Wrangler dry run, full tests, and build-size gate must be confirmed in CI before this can be considered repository-verified. Cloudflare account configuration and live dispatch remain external gates.
