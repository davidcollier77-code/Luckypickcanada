# Plan — Dependabot PR #1563 CI and scan repair

## Scope
Modify only the Gemini PR-Agent workflow and its regression test, the narrow DevSkim SARIF suppression helper and its unit tests, and this feature's Spec Kit artifacts. Preserve the Dependabot dependency versions and pnpm lockfile.

## Technical approach
1. Add a job-level condition to skip credentialed Gemini review when the PR author or event actor is Dependabot. Keep the existing secret preflight for all eligible human-authored PRs; this avoids requesting secrets in a bot-triggered context.
2. Extend the existing DS126858 suppression helper to validate a complete canonical base64 SHA-512 integrity digest and only suppress when the SARIF region's exact columns are wholly inside the digest value.
3. Add positive and negative unit tests for the valid digest, invalid digest, out-of-digest columns, and end-to-end SARIF suppression.
4. Allow the existing Visual QA workflow to continue normally once the required task artifacts are present; do not alter its tests or weaken its gates.

## Verification
- `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`
- `pnpm exec vitest run __tests__/pr-agent-workflow.test.js`
- `pnpm run test`
- `pnpm tsc --noEmit`
- `./jules-verify.sh`
- Current-head GitHub checks: DevSkim/code scanning, Visual QA including Playwright, Next.js production build and size gate, OpenNext/Cloudflare validation.

## Risks
- Dependabot PRs will not receive Gemini review from the secret-backed PR-Agent job; that job must be run for eligible human-authored PRs. This is preferable to exposing secrets or failing a required check.
- Any DevSkim match outside an explicitly validated SHA-512 integrity digest remains reportable.
