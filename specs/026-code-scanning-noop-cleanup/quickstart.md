# Quickstart: Validate No-op Cleanup

Use the pull-request workflows as the execution environment because the working container could not resolve github.com for a local clone.

1. Confirm the PR diff deletes test_fix.js and changes no application source, package manifest, lockfile, workflow, secret, or deployment configuration.
2. Confirm .specify/feature.json points to specs/026-code-scanning-noop-cleanup and that this feature has non-empty spec.md, plan.md, and tasks.md files changed against main.
3. Wait for the Visual QA workflow to run the daily-quota test, full pnpm test suite, TypeScript check, and ./jules-verify.sh. The governance gate must pass and allow the build and documentation tests to proceed.
4. Inspect OpenNext/Cloudflare validation for Next.js build, worker/assets validation, Wrangler no-deploy validation, and the measured build-size cap below 495 MiB.
5. Inspect CodeQL result and alert state.
6. Retry Robin review once after code/docs update. Record service timeout honestly if the upstream router again fails to produce a response.
7. Before completion, reconcile the changed-file list with the PR diff and update tasks.md and PR_SUMMARY.md with real run IDs and outcomes.

7. Confirm `.github/workflows/robin.yml` checks the free-model quota before invoking Robin and skips the five-attempt path if fewer than five requests remain.
8. If quota is low/missing or Robin fails, verify the workflow requests Amazon Q review and accepts only a substantive review whose `commit_id` equals the current PR head SHA. The step has a bounded wait and must leave the check failed if no such review appears.
9. If Robin fails while quota remains, inspect the failure-only diagnostic. Confirm no credentials or raw response bodies are logged and review the HTTP/status and sanitized provider error fields.

10. Verify the Amazon Q fallback condition includes failed, cancelled, and skipped primary outcomes; the API-key redactor guards empty keys; and the 90-second polling deadline sits inside a 3-minute step and 7-minute job. Confirm current-head workflow evidence.


## Cold-runner timing note (2026-10-17)

The Visual QA artifact for run #39038534341 showed the browser loading the Howler chunk about 7.58 seconds after the initial document and requesting `/sounds/confetti-pop.wav` about 8.33 seconds after the document; the prior five-second readiness wait expired before that request. The homepage regression tests now wait up to 30 seconds for the explicit hydrated and sound-ready states. The three-answer daily-quota test gets a 60-second per-test budget because cold navigation took about 12.7 seconds and the three reveals each include deliberate animation phases. These waits are bounded; all behavior assertions remain required.
