# Implementation Plan: Retire Jules Bridge

**Branch**: `chore/retire-jules-bridge-20261109`
**Date**: 2026-11-09
**Spec**: `specs/123-jules-bridge-retirement/spec.md`

## Summary
Remove only the retired Jules Bridge infrastructure and the code-scanning exception that existed specifically for that Worker. Keep the Cloudflare app, issue-to-GitHub Worker, updater scheduler, shared deployment credentials, and historical records unchanged.

## Technical Context
- Repository: `davidcollier77-code/Luckypickcanada`
- Hosting/deployment: Cloudflare; this task removes a retired standalone Worker deployment workflow.
- Existing verification: Vitest, Python unittest tests for DevSkim suppression, `./freebuff-verify.sh`, and GitHub Actions.
- Repository changes are being applied via GitHub API in this connected session; no repository shell is available here.

## Decisions
1. Delete the files under `workers/jules-bridge/` and its dedicated deployment workflow.
2. Remove the exact Worker path from the DevSkim contextual allowlist and DS173237 path gate; remove the now-unused helper and its dedicated unit test/justification.
3. Preserve the Cloudflare account ID only where it is used by other unrelated systems; do not alter shared secrets or deployment workflows.
4. Add a current Memory Bank entry documenting the retirement while retaining prior migration notes and completed Jules records as history.
5. Search for remaining active references; only adjust stale current operational guidance, not historical artifacts.

## Structure
- Delete: `workers/jules-bridge/src/index.js`
- Delete: `workers/jules-bridge/src/index.test.js`
- Delete: `workers/jules-bridge/wrangler.jsonc`
- Delete: `.github/workflows/deploy-jules-bridge.yml`
- Update: `.github/scripts/suppress_devskim_false_positives.py`
- Update: `.github/scripts/test_suppress_devskim_false_positives.py`
- Update: `.amazonq/rules/memory-bank/structure.md` only to replace the stale active folder reference `.jules/` with `.freebuff/`.
- Update: `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- Add: these Spec Kit artifacts.

## Verification Plan
- Inspect exact changed paths and diff through GitHub API.
- Search active code/configuration for `jules-bridge`, `JULES_API_KEY`, and Jules API endpoint references.
- Confirm the remaining three Worker configs/workflows are not changed.
- Run the focused Python DevSkim suppression tests and full Vitest / `./freebuff-verify.sh` through repository CI where possible.
- Report checks that cannot be run in this API-only session as NOT RUN / PENDING; do not claim execution.
