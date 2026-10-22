# Dependabot PR #1563 CI and scan repair

## Goal
Make the dependency-update PR's checks accurately reflect the evidence and complete the required validation without weakening repository security.

## User stories
### P1 — Secure review behavior
For a Dependabot-authored pull request, the credentialed Gemini PR-Agent job is skipped because GitHub does not provide repository secrets to Dependabot-triggered runs. For a human-authored pull request, the existing missing-secret preflight remains fail-closed and the key is never logged.

### P1 — Accurate weak-hash scanning
A DevSkim DS126858 finding is filtered only when the reported columns fall entirely inside a canonical, base64-encoded 64-byte SHA-512 package-integrity digest in pnpm-lock.yaml. Existing exact dependency-name suppressions remain unchanged; actual hash algorithm use, malformed digests, missing columns, and findings outside a valid digest are not suppressed.

### P1 — Verifiable dependency repair
Keep the Next.js, Sentry, DOMPurify, React, and lockfile updates intact. Complete repository task artifacts so the Spec Kit gate can run and Visual QA can proceed beyond the governance step.

## Constraints
- Do not print, expose, or change secrets.
- Do not bypass the Spec Kit verifier.
- Do not disable DevSkim, code scanning, unit tests, TypeScript, or Playwright.
- Keep production build output below 495 MiB.
- Do not merge the pull request.
