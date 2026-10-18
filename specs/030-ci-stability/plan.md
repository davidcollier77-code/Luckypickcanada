# Implementation Plan: CI Stability Repair

**Branch**: `fix/ci-stability-1518` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

## Root Cause

1. GitHub PR #1518 comments record a Groq API error for `llama-3.1-8b-instant` (404). The intervening change to `llama-3.3-70b-versatile` would not be a durable fix: Groq's current deprecation notice lists both model IDs as deprecated for developer-tier usage on 2026-08-16 and recommends `openai/gpt-oss-20b` as the replacement for the old 8B model. Source: https://console.groq.com/docs/deprecations
2. The Crystal Ball component's current exhausted-allowance message uses a curly apostrophe (`You’ve`), whereas the original Playwright assertion used a straight apostrophe (`You've`). The exact-text assertion could fail even when the expected UI state is correct.
3. The daily-limit test's 60-second total timeout has been insufficient in the previously reported cold-start/animated-reveal Visual QA runs. The test changes remain limited to test timing and assertions.

## Change Plan

1. Set the action model input and fallback diagnostic/preflight model variable to `openai/gpt-oss-20b`.
2. Update the workflow regression test to assert that exact model ID while retaining its provider separation and fail-closed checks.
3. Increase the daily-limit Playwright test budget to 90 seconds, give the pre-submit enabled-state check an explicit 15-second timeout, preserve the after-answer re-enable assertion, and match the curly apostrophe used by the UI.
4. Create truthful Spec Kit artifacts and update Memory Bank context/progress.
5. Let the repository's current-head GitHub Actions checks provide execution evidence. This environment does not have a local repository checkout, so no local build or test result is claimed.

## Scope and Safeguards

- Only workflow configuration, its direct regression test, the daily-limit Playwright test, Spec Kit task artifacts, Memory Bank tracking, and the canonical PR Summary are in scope.
- No app source, dependency, lockfile, secret, payment/authentication logic, user-facing behavior, or deployment configuration is changed.
- The 495 MB hard build-size limit remains in force. Existing audit measurement is historical, not a measurement of this commit.

## Verification Plan

- `pnpm exec vitest run tests/workflows/robin-groq-fallback.test.ts`
- `pnpm exec playwright test tests/visual/crystal-ball-daily-limit.spec.ts`
- `pnpm run test`
- `pnpm tsc --noEmit`
- `./jules-verify.sh`
- `pnpm run build` and configured build-size gate
- `pnpm exec opennextjs-cloudflare build` and the repository's configured Wrangler validation
- Review the full final diff and current-head workflow results before claiming completion.
