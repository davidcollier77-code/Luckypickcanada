# Tasks — CI Stability Repair

## Analysis
- [x] Read repository governance and select the troubleshooting task group.
- [x] Inspect PR #1518 comments and workflow/test diffs.
- [x] Check the current Groq model deprecation guidance and the actual Crystal Ball message source.
- [x] Establish that the PR's 70B interim model ID is also deprecated for developer-tier usage.

## Implementation
- [x] Replace both Groq fallback model settings with documented replacement `openai/gpt-oss-20b`.
- [x] Update the workflow regression test's expected model ID.
- [x] Raise the daily-limit Playwright test timeout to 90 seconds.
- [x] Preserve the explicit post-answer button re-enable assertion.
- [x] Match the curly apostrophe used in the actual UI text.
- [x] Add Spec Kit artifacts and update Memory Bank progress/context.
- [x] Append the troubleshooting record to `PR_SUMMARY.md` without replacing historical records.

## Verification — Pending Current-Head CI
- [ ] `pnpm exec vitest run tests/workflows/robin-groq-fallback.test.ts`
- [ ] `pnpm exec playwright test tests/visual/crystal-ball-daily-limit.spec.ts`
- [ ] Full tests, TypeScript, and `./jules-verify.sh`
- [ ] Production build, OpenNext/Cloudflare validation, Wrangler validation, and the 495 MB build-size gate.
- [ ] Inspect current-head check runs and review the complete final diff.
- [ ] Confirm the configured Groq credential can call the replacement model.

## Completion Gate

Do not report this task fully verified or merge-ready until the required current-head CI evidence is available. No local pass is claimed by this task record.
