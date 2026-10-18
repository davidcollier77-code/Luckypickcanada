# Quickstart — CI Stability Repair

## Prerequisites

- Use the repository's configured Node.js version and pnpm.
- Configure the existing Groq secret in GitHub Actions; never copy or commit the secret into logs or files.
- Run these checks from the repository root.

## Validation Commands

```bash
pnpm exec vitest run tests/workflows/robin-groq-fallback.test.ts
pnpm exec playwright test tests/visual/crystal-ball-daily-limit.spec.ts
pnpm run test
pnpm tsc --noEmit
./jules-verify.sh
pnpm run build
pnpm exec opennextjs-cloudflare build
```

Use the repository's existing Wrangler/OpenNext workflow for its configured build validation and hard 495 MB size gate. Do not deploy as part of this task.

## Expected Outcomes

- The Groq fallback model expectation matches `openai/gpt-oss-20b`.
- The Crystal Ball test observes the UI's exact exhausted-allowance message, re-enable state, and three-answer lockout.
- All required current-head CI checks pass; any provider permission, quota, timeout, or build failure remains explicitly reported.
