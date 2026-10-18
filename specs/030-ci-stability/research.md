# Research — CI Stability Repair

**Date**: 2026-10-18

## Confirmed Findings

### Groq model lifecycle

The current official Groq deprecation page lists `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` as deprecated for developer-tier usage with an August 16, 2026 shutdown date. It lists `openai/gpt-oss-20b` as the recommended replacement for `llama-3.1-8b-instant`. The model change therefore uses that documented replacement rather than preserving the now-deprecated 70B interim value.

Source: [Groq model deprecation documentation](https://console.groq.com/docs/deprecations) (consulted 2026-10-18).

### Crystal Ball exact-text assertion

The current `app/components/CrystalBall/CrystalBall.tsx` source emits `You’ve used all {dailyQuota.limit} questions for today. Come back after the daily reset.` with a curly apostrophe. The prior Playwright test used a straight apostrophe and exact text matching; these strings are not equal.

### Test budget

PR #1518's existing review discussion and its historical PR Summary describe slow cold navigation and animated reveals in this Playwright flow. The 90-second budget is a test-only tolerance increase; it does not change the daily allowance implementation.

## Limitations

- The active Groq credential's actual per-project model permissions cannot be inspected through this repository-only context. Current official documentation supports the replacement model for the developer tier, but the workflow run must still verify the configured credential can call it.
- No local command was run during this correction because no local repository checkout is available. GitHub Actions is the required execution evidence.
- No application bundle measurement was run for this workflow/test-only change. The size gate must run in CI.
