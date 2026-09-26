# Active Context

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
