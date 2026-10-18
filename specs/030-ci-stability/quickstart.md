# Quickstart — CI Stability Repair

Use repository Node.js/pnpm from the root. Do not expose secrets or deploy.

```bash
pnpm exec vitest run tests/workflows/robin-groq-fallback.test.ts
pnpm exec playwright test tests/visual/crystal-ball-daily-limit.spec.ts
pnpm run test
pnpm tsc --noEmit
./jules-verify.sh
pnpm run build
pnpm exec opennextjs-cloudflare build
```

GitHub Actions also performs Wrangler validation and enforces the hard 495 MiB size gate. All results must be verified on the final commit, including a Groq fallback attempt when the primary reviewer fails.
