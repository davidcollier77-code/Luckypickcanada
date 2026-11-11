# Node.js 26 Migration — Verification Evidence

**Date:** 2026-11-11
**Runtime:** Node.js v26.13.0, pnpm 10.30.3
**Task:** `specs/135-nodejs-26-migration/`

## Declared runtime

| Location | Result |
|---|---|
| `package.json#engines.node` | `26.x` |
| `.nvmrc` | `26` |
| GitHub Actions `setup-node` steps (6 workflows) | `26` / `26.x` |
| `scripts/setup-playwright-agent.sh` | requires major 26 |
| `workers/updater-scheduler/package.json` | `>=26` |

`pnpm install --frozen-lockfile` completed with no unsupported-engine warning. `pnpm-lock.yaml` is unchanged.

## Checks

| Check | Command | Result |
|---|---|---|
| Updater scheduler tests | `node --test workers/updater-scheduler/test/index.node-test.mjs` | PASS — 17/17 |
| Workflow/tooling guard | `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` | PASS — 13/13 |
| TypeScript | `pnpm exec tsc --noEmit` | PASS |
| Playwright setup guard | `bash scripts/setup-playwright-agent.sh` | PASS — Playwright 1.64.1, CLI available |
| Full unit suite | `pnpm test` | PASS — 57 files, 497 tests |
| Repository verification | `./freebuff-verify.sh` | PASS — Spec Kit gate, integrity tests, type check, build, docs tests 36/36 |
| Cloudflare/OpenNext build | `pnpm exec opennextjs-cloudflare build` | PASS — `.open-next/worker.js` and `.open-next/assets` present |
| Wrangler deploy validation | `pnpm exec wrangler deploy --dry-run --config ./wrangler.jsonc` | PASS — 300 asset files, all bindings resolved |
| Production size guard | `.next` + `public` | PASS — 375,557,278 bytes (358.16 MiB) |
| Production size after OpenNext rebuild | `.next` + `public` | PASS — 369.27 MiB |
| OpenNext output size | `.open-next` | 102,312,112 bytes (97.57 MiB) |
| Hard cap | 495 MiB (519,045,120 bytes) | PASS — every measurement is strictly below |

## Build notes

- The production build completed under Node.js 26.13.0.
- Node emitted `[DEP0205] DeprecationWarning: module.register()` once during the Next.js build. It is a runtime deprecation warning from the existing dependency tree, not a build failure; fixing it would require a dependency upgrade, which this task explicitly excludes.
- Existing CSS optimization warnings about generated Tailwind `:is()` selectors are unchanged and non-fatal.
- No Playwright visual run was performed: no application, theme, asset, or other rendered file changed, so rendered output cannot differ. The full unit suite and both builds passed.

## Integrations

No integration configuration changed. Cloudflare bindings (`NEXT_CACHE_DO_QUEUE`, `LUCKYPICK_KV`, `NEXT_TAG_CACHE_D1`, `NEXT_INC_CACHE_R2_BUCKET`, `WORKER_SELF_REFERENCE`, `ASSETS`, `GIFT_FROM_EMAIL`), the Neon `DATABASE_URL`/`POSTGRES_URL` secret boundary, Stripe, Resend, and Turnstile code/config are untouched. Wrangler dry-run resolved the Cloudflare bindings. Live Neon/Stripe/Resend calls were not made because they require production credentials and would create external side effects; no deployment was performed.
