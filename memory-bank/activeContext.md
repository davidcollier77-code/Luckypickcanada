# Active Context — Node.js 26 Migration

- **Updated:** 2026-11-11
- **Repository:** davidcollier77-code/Luckypickcanada
- **Base branch:** main (base commit `bee5dec9`)
- **Task branch:** freebuff/261525f05a3f083e00c056f2
- **Spec Kit feature:** specs/135-nodejs-26-migration

## Current Task

Migrate the repository's declared local and CI Node.js runtime from 22 to 26, including package metadata, `.nvmrc`, GitHub Actions workflows, repository tooling, the updater-scheduler package, and the related workflow assertion. No dependency upgrades, no application or visual changes, and no deployment-path or integration changes.

## Verified Findings

- Active Node.js 22 declarations were in `package.json`, `.nvmrc`, six GitHub Actions workflows, `scripts/setup-playwright-agent.sh`, the updater-scheduler package and README, the Visual QA workflow assertion test, and the Memory Bank technical context.
- Installed tooling supports Node.js 26: Next.js 16.4.3 (`node >=20.9.0`), Wrangler 4.148.0 (`node >=22.0.0`), Playwright 1.64.1 (`node >=20`), Vitest 5.0.0 (`>=26.0.0`), Sharp 0.35.5 (`node >=20.9.0`).
- Historical `specs/` and `artifacts/` records that mention Node.js 22 are evidence of earlier tasks and are intentionally unchanged.
- Cloudflare hosting deploys through GitHub Actions and Wrangler/OpenNext; the Workers runtime is controlled by `compatibility_date` and `nodejs_compat`, which are unchanged.

## Implementation

- `package.json` declares `engines.node: "26.x"`; `.nvmrc` contains `26`.
- All six Node-configured workflows use Node.js 26 with updated step labels; pinned action SHAs, ordering, and workflow behaviour are unchanged.
- `scripts/setup-playwright-agent.sh` requires Node.js major 26; the updater-scheduler package declares `>=26` and its README states Node.js 26.
- The Visual QA workflow assertion test and `memory-bank/techContext.md` reflect Node.js 26.

## Verification Status

- **PASS:** `node --test workers/updater-scheduler/test/index.node-test.mjs` — 17/17.
- **PASS:** `pnpm exec vitest run __tests__/visual-qa-chromium-cache.test.js` — 13/13.
- **PASS:** `pnpm exec tsc --noEmit`.
- **PASS:** `bash scripts/setup-playwright-agent.sh`.
- **PASS:** `pnpm test` — 57 files, 497 tests.
- **PASS:** `./freebuff-verify.sh` — Spec Kit gate, integrity tests, type check, production build, docs tests 36/36.
- **PASS:** `pnpm exec opennextjs-cloudflare build` — worker and assets generated.
- **PASS:** `pnpm exec wrangler deploy --dry-run --config ./wrangler.jsonc` — all bindings resolved.
- **PASS:** Size guard — production 358.16 MiB after Next build (369.27 MiB after OpenNext rebuild), OpenNext 97.57 MiB, all below 495 MiB.
- **N/A:** Playwright visual regression — no rendered file changed; unit tests and both builds passed.
- **NOT RUN:** Live Neon/Stripe/Resend calls — require production credentials and create external side effects; no deployment was performed.

Evidence: `artifacts/node26-migration/verification.md`.

## Next Action

Complete the tasks in `specs/135-nodejs-26-migration/tasks.md`, record exact verification evidence, and leave any repository submission open and unmerged for owner review.
