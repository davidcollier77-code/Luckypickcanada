## 2026-09-26 — OpenNext Publish Hang Repair

- Branch: `fix/cloudflare-deploy-bypass-open-next-cache-populate`
- Base: current `main` at `3f944de4c2a6736cb88a6feb06375f5e43507231`.
- Verified the latest post-#1264 deployment workflow run `36230678014` built the Next.js app and OpenNext worker successfully, verified the worker/assets outputs, and then remained in progress at the Cloudflare publish step.
- Verified the publish step introduced by PR #1264 invokes `opennextjs-cloudflare deploy`, which enters remote R2 incremental-cache population before deployment.
- Upstream OpenNext Cloudflare issue #1273 documents the same silent `populateCache` hang and its supported escape hatch: set `OPEN_NEXT_DEPLOY=true` when invoking `wrangler deploy` to bypass automatic OpenNext deployment/cache population and deploy the Worker directly; cache entries then populate lazily on request misses.
- Implemented the minimal deployment change in `.github/workflows/deploy-open-next.yml`: retain the existing Next.js/OpenNext build and artifact verification, but publish with `pnpm exec wrangler deploy --config ./wrangler.jsonc` under `OPEN_NEXT_DEPLOY=true`.
- No application runtime, Lucky Card Reveal audio/visual code, database, authentication, payment, or secrets were changed.
- Production verification is still pending until the new deployment path successfully completes and the live homepage/reveal are visually checked.

## 2026-09-26 — Cloudflare API Rate-Limit Deployment Repair

- Branch: `fix/cloudflare-deploy-rate-limit`.
- Verified the latest deployment retry still builds Next.js and OpenNext successfully, then fails only at the Cloudflare publish command.
- First failure returned Cloudflare API rate-limit code 10500 on `GET /accounts`; the subsequent retry returned HTTP 429 on the Worker deployments endpoint.
- Verified the production rendering repair is therefore blocked by Cloudflare deployment API throttling, not by the Next.js/Tailwind build.
- Added a bounded deployment backoff that retries only recognized Cloudflare rate-limit responses, with delays of 60s, 120s, 180s, and 300s; non-rate-limit deployment failures still fail immediately.
- No application runtime, Lucky Card Reveal audio/visual code, database, authentication, payment, or secrets were changed.
- Production verification remains pending until a rate-limit-aware deployment succeeds and the live CSS is directly verified.

## 2026-09-26 — Cloudflare Retry Control-Flow Correction

- The first rate-limit backoff implementation was merged and executed, but GitHub Actions' default `-e` behavior terminated the publish step immediately when Wrangler returned 429, before the wrapper could inspect the exit status.
- Verified the build and OpenNext stages still pass on the merged repair.
- Corrected the wrapper to temporarily disable `errexit` only around the Wrangler invocation, capture its status/output, then restore `errexit` before applying the rate-limit classification.
- Non-rate-limit failures still terminate immediately; recognized rate-limit responses proceed to bounded backoff.
- Production verification remains pending.

# Active Context

## 2026-09-26 — Standard Audio Stale-Fallback Lifecycle Repair

- Verified the remaining Sourcery lifecycle finding from PR #1262 against current `main`: after `await standardAudioPreloadRef.current`, a stale or unmounted Standard-tier transaction could leave `standardWebAudioReady` false and fall through into the Howler fallback scheduling path.
- Verified the same stale-fallback risk in the async initialization `catch` path: a post-unmount/preemption error could also fall through to fallback scheduling.
- Implemented the minimal lifecycle guard in `app/lucky-card-reveal.js`: after the preload await, and at the start of the initialization catch, the transaction must still be current and the component mounted or the function returns before any fallback scheduling can occur.
- Preserved Standard hit timing/choreography, visual/VFX behavior, audio assets, gain values, Web Audio scheduling, generation locking, and Premium/Flagship behavior.
- No deployment, database, authentication, payment, secrets, or unrelated application systems were changed.
- Verification pending: repository CI/build/test checks and final diff reconciliation on the repair branch.


## 2026-09-26 — OpenNext Remote Cache Deployment Repair

- Branch: `fix/open-next-remote-cache-deploy`
- Base: current `main` verified at `262d979ccffb50dd11b1f009c1d2354ce13c399b`.
- Deep-dive verification of the supplied production recording confirmed a site-wide visual regression across the homepage and Lucky Card Reveal, including raw/default navigation links, missing polished CTA styling, incorrect layout sizing, a distorted logo presentation, and a collapsed reveal card.
- Forced live production HTML retrieval showed stale stylesheet references to `/_next/static/css/cc4b9b8ab9f722ff.css` and `/_next/static/css/ac4b46593ca20d2e.css`.
- Direct inspection of those live CSS assets verified the expected Tailwind utility classes such as `.inline-flex`, `.rounded-full`, `.bg-gradient-to-r`, `.font-serif`, and reveal sizing/positioning utilities were absent while literal Tailwind directives remained, matching the observed production rendering failure.
- Verified the repository build workflow already removes `.next/cache` and `.open-next` before building, so the local build-cache layer is not the identified cause.
- Verified `wrangler.jsonc` configures the OpenNext R2 incremental cache binding `NEXT_INC_CACHE_R2_BUCKET` to `luckypickcanada-cache`.
- Verified `.github/workflows/deploy-open-next.yml` previously invoked raw `wrangler deploy` after the OpenNext build, bypassing OpenNext's remote-cache population step.
- Updated the deployment workflow to use `pnpm exec opennextjs-cloudflare deploy --config ./wrangler.jsonc`, which performs remote cache population before the Wrangler deployment.
- No changes were made to Lucky Card Reveal audio, visual/VFX choreography, card artwork, tier counts, payment, database, authentication, or secrets.
- Verification status: remote CI/build and post-deployment live visual verification are required before declaring the result complete.

## 2026-09-26 — Production CSS Regression Repair

- Branch: `fix/restore-tailwind-postcss-after-audio`
- Verified the active production recovery build is based on `e1e7d2f300ea5d7787fcbd03335fc5691989e26e`, while `main` remains at `f740f660b146fcc1f44ee4fe91ca8ca26b8bd370`.
- Deep-dive comparison confirmed PR #1261 explicitly deleted `postcss.config.js` and `tailwind.config.js`.
- Verified `app/globals.css` still contains Tailwind v3 directives (`@tailwind base/components/utilities`) and `package.json` still declares Tailwind CSS, PostCSS override, and Autoprefixer.
- Restored the known-good `postcss.config.js` and `tailwind.config.js` from `e1e7d2f` without changing `app/lucky-card-reveal.js` or the recent Standard-tier Web Audio implementation.
- Verification pending: local clean pnpm test/build and final diff/PR checks.
