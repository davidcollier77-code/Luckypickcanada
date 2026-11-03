# Implementation Plan: Updater Scheduler GitHub `User-Agent` and Dispatch Diagnostics

**Feature**: `specs/083-updater-scheduler-dispatch-user-agent`
**Branch**: `freebuff/78319e5dc4e17636cb62dc2a`

## Technical context

- Runtime: Cloudflare Worker, ES module, no dependencies, no build step; Node 22 `node:test` suite.
- Files: `workers/updater-scheduler/src/index.mjs`, `workers/updater-scheduler/test/index.node-test.mjs`,
  `workers/updater-scheduler/README.md`.
- Deployment stays with `.github/workflows/deploy-updater-scheduler.yml` (canary, then
  `wrangler deploy --secrets-file`); it is not modified.

## Design

1. **Single header.** `GITHUB_USER_AGENT` is exported and used as the fixed `User-Agent` on the
   dispatch request. Rationale: GitHub requires a product token, Workers `fetch` supplies none, and a
   constant is testable and reviewable. Nothing else in the request changes.
2. **`GitHubDispatchError`.** A non-2xx response throws a typed error carrying `githubStatus`,
   `githubBody`, `githubHeaders` while keeping the existing message text
   (`GitHub workflow dispatch failed with HTTP <status>`), so current callers and log searches still
   work.
3. **Sanitisation before storage.** `sanitizeDiagnosticBody` replaces the configured token, `Bearer`
   values, `gh[pousr]_…`/`github_pat_…` strings with `[redacted]`, collapses whitespace and truncates
   at 500 characters plus a `…[truncated]` marker. The raw body never leaves the function.
4. **Header allowlist.** `selectDiagnosticHeaders` reads only `content-type`, `retry-after`,
   `x-github-request-id`, `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`, so a
   `set-cookie` or any unrelated header cannot reach the log.
5. **Logging.** The failure entry adds the three fields only when present; a configuration error still
   logs `error` alone. Success path unchanged: status only, no body read.

This reproduces the diagnostic behaviour deployed by Agent Lee (`githubStatus`, `githubBody`,
`githubHeaders`, sanitized body, selected response headers) from the stated requirements, because that
implementation is not present in this repository or any local branch (`git log --all -S'githubHeaders'`
finds nothing). The checked-in source is therefore the single reviewable version.

## Alternatives rejected

- Adding a `User-Agent` only inside the deploy workflow: the header must be on the Worker request, not
  on the deploy job.
- Logging the full body/headers: leaks token echoes and cookies; unnecessary for diagnosis.
- Retrying or disabling `noRetry()`: does not address a deterministic 403 and risks duplicate updates.
- Reusing feature 035/036 artifacts: those cover scheduler reliability and the safe cutover; this is a
  distinct post-cutover defect with its own acceptance tests, so a new cycle is correct and no existing
  artifact is duplicated.

## Risks

- If the observed 403 is a credential or rate-limit rejection rather than the missing header, the header
  alone will not restore dispatch. The new diagnostics make that distinguishable in one log line.
- The body cap could truncate a long GitHub explanation; 500 characters covers GitHub's documented
  error messages, and the marker makes truncation explicit.

## Verification

`node --test workers/updater-scheduler/test/index.node-test.mjs`, `pnpm exec wrangler deploy --dry-run
--config workers/updater-scheduler/wrangler.toml`, `./freebuff-verify.sh` (Spec Kit gate, typecheck,
production build, refresh-docs tests), build-size measurement, final diff audit, and the PR's
`Verify updater scheduler` job.
