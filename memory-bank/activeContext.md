## 2026-09-27 — Homepage Sky Layer Repair (In Progress)

- Verified the deployed homepage retained a full-screen `bg-slate-950` foundation while the photographic homepage backdrop remained at `z-index: -30`.
- Verified the existing `HomePage.js` canvas already provides ambient star twinkle and randomized shooting-star effects; those effects are intentionally preserved unchanged.
- Implemented a scoped background-layer repair on branch `fix/homepage-sky-background-layer`: the legacy global background layer is now identifiable as `.homepage-background-foundation`, and becomes transparent only when the homepage photographic backdrop is present.
- Scoped the homepage body background to transparent while retaining the legacy dark foundation on non-homepage routes.
- No image assets were deleted or replaced; no homepage content, card artwork, audio, interactions, or other functionality was changed.
- Verification of the production build and runtime rendering remains pending.

## 2026-09-27 — Homepage Cinematic Night-Sky + Visual Polish (PR #1290)

- Replaced the homepage's synthetic four-layer aurora background foundation with a fixed, sky-only photographic Milky Way backdrop selected for an overhead/zenith-style composition with no landscape or horizon.
- Preserved the existing viewport Canvas atmosphere: ambient stars, independent twinkle behavior, and randomized shooting-star events with tails. Only the presentation layer was adjusted.
- Added a scoped homepage visual polish pass covering navigation glass, logo presentation, hero title depth, content-card surfaces, community banner/image framing, CTA treatment, suggestion/about surfaces, and lower-page SEO presentation.
- Removed the competing homepage synthetic pseudo-background layers so the photograph acts as the environmental foundation instead of stacking multiple simulated skies.
- Preserved reduced-motion handling and did not change audio, dependencies, homepage functionality, reset/countdown behavior, collections, sharing, payment, database, authentication, deployment configuration, or protected files.
- Verification: GitHub Actions run 36344468480 passed Next.js build, OpenNext build, compiled Tailwind verification, worker/assets checks, Wrangler validation, and Git status.
- Amazon Q review reported no blocking defects. CodeRabbit status was success; its repository comment indicated automatic review is disabled for this repository and a manual trigger is available.
- Runtime visual verification on a deployed preview was not performed in this PR; the current CI verifies the production build pipeline but does not deploy a PR preview.
- The photographic source remains an external Pexels URL in CSS; no local binary image asset was added because repository binary transfer was not available in the implementation environment.
- No protected files were changed.

## 2026-09-27 — Premium/Flagship Web Audio Reveal Extension

- Extended the existing Standard-tier native Web Audio reveal scheduler to Premium and Flagship.
- Premium retains 4 hits and Flagship retains 5 hits because the existing `TIER_HITS` cadence remains unchanged.
- The same decoded Standard audio asset set, absolute Web Audio scheduling, final-hit sequence, and Howler fallback are now selected for all recognized tiers.
- No new audio assets or visual/VFX choreography were introduced.
- Runtime/browser verification is still pending because the PR head currently has no associated GitHub Actions run or commit status.
## 2026-09-27 — Documentation Refresh Symlink Compatibility Repair

- Verified the documentation refresh failure on run 36308236510: `scripts/refresh-docs.js` failed during `cleanupStaleTempFiles()` with `Documentation paths must not traverse symbolic links.`
- Verified the repository currently contains 90 intentional `.docs/` symlinked documentation snapshots used to deduplicate library guidance across task groups.
- Traced the regression to the 2026-09-26 security hardening change `fix(security): reject symlinked documentation paths`, which applied a blanket symlink rejection to paths the updater itself intentionally creates and reads.
- Implemented the minimal repair in `scripts/refresh-docs.js`: a final-path documentation symlink is permitted only when its fully resolved target remains inside `.docs/`; symlink traversal through an intermediate directory and symlinks resolving outside `.docs/` remain rejected.
- Verification: branch diff contains only `scripts/refresh-docs.js`; a synthetic filesystem regression test passed for both an internal final symlink and an escaping symlink.
- Functional GitHub Actions verification remains pending until the repaired workflow is manually triggered after merge.

## 2026-09-26 — Standard Final Reveal Audio Texture Pass

- Implemented a focused final-hit texture repair in `app/lucky-card-reveal.js` after reviewing the supplied Standard-tier capture.
- Added four irregular, low-gain micro-electrical flicker bursts around the final discharge, reusing the existing audited `standard_electrical_arc.mp3` rather than adding another asset.
- Mirrored the same timed flicker texture in the Howler fallback while preserving the existing main final beam, lock, discharge, reveal snap, and post-flip electrical residue levels and durations.
- Kept the change Standard-tier-only; Premium/Flagship choreography, visuals, artwork, tier counts, reset/countdown, collection, share, deployment, database, authentication, payment, and secrets are unchanged.
- Verification status: source diff and timing-path reconciliation completed; CI/build/runtime playback verification is still required before this result is declared complete.

## 2026-09-26 — Standard Audio Fallback Timing Repair

- Verified Sourcery's bug-risk finding: the Standard Howler fallback previously invoked every cue immediately inside the hit loop, bypassing the Web Audio choreography offsets.
- Implemented the minimal repair in `app/lucky-card-reveal.js`: every Standard fallback cue is now wrapped in `scheduleAudio` using the same timing offsets as the Web Audio path.
- Preserved all existing Standard asset choices, gain values, seek offsets, fade durations, hit cadence, final lock/discharge sequence, and Premium/Flagship behavior.
- Verification pending: repository CI/build and fresh runtime/device playback capture.

## 2026-09-26 — Standard Reveal Audio Fresh-Asset Rebuild

- Standard-tier audio was rebuilt from a fresh, separately audited asset set after the rendered capture continued to exhibit a computer-like tonal artifact.
- Source-level PCM analysis verified the previous `beam_impact.mp3` contained a strong narrow ~2.1 kHz / ~1.56 kHz tonal structure that matched the unwanted rendered signature; it was not merely a scheduling artifact.
- Eight new Standard-only assets were sourced from Mixkit and independently decoded/analyzed before integration:
  - `standard_beam_shot.mp3`
  - `standard_final_beam.mp3`
  - `standard_beam_impact.mp3`
  - `standard_final_lock.mp3`
  - `standard_final_discharge.mp3`
  - `standard_reveal_snap.mp3`
  - `standard_electrical_arc.mp3`
  - `standard_card_shake.mp3`
- The new asset set was re-audited after ingestion. None showed the previously targeted persistent >20 dB narrow-band prominence around 2.1 kHz or 1.56 kHz in the analysis windows used.
- Standard choreography now models the intended physical sequence: two beam-shot attempts with card impacts and subtle shake, followed by a distinct stronger final beam, mechanical lock, discharge/flip, reveal snap, and post-flip electrical residue.
- Standard uses dedicated Web Audio buffers and a dedicated Howler fallback. Premium/Flagship retain the legacy seven asset paths and fallback choreography unchanged.
- No visual/VFX choreography, card artwork, tier hit counts, reset/countdown, collection, share, database, authentication, payment, deployment, or secrets were changed.
- Verification pending: repository CI/build/browser playback capture and final PR diff reconciliation.

## 2026-09-26 — Cloudflare Deployment Concurrency Guard

- Branch: `fix/cloudflare-deploy-concurrency`.
- Added a workflow-level GitHub Actions concurrency group in `.github/workflows/deploy-open-next.yml`:
  - group: `cloudflare-deploy`
  - cancel-in-progress: `true`
- This serializes Cloudflare deployment workflows so overlapping runs cannot concurrently consume Cloudflare API capacity.
- Preserved the existing bounded Cloudflare 429/code-10500 backoff and the OpenNext `OPEN_NEXT_DEPLOY=true` Wrangler deployment path.
- Scope is limited to deployment workflow control; no application runtime, CSS, database, authentication, payment, secrets, or visual/audio behavior was changed.
- Verification still required: workflow syntax/diff inspection and CI deployment checks.

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
## 2026-09-27 — Controlled Dependency Refresh (PR #1286)

- Authorized scope: refresh only the five developer dependencies that were verified behind current releases; leave already-current dependencies unchanged.
- Updated package.json:
  - prettier: ^3.9.6 → ^3.9.9
  - react-hook-form: ^7.87.0 → ^7.89.0
  - tailwind-merge: ^3.6.0 → ^3.7.0
  - playwright: ^1.62.1 → ^1.63.0
  - playwright-chromium: ^1.62.1 → ^1.63.0
- Preserved already-current packages including @playwright/test ^1.63.0, sonner ^2.0.8, stylelint ^17.15.0, stylelint-config-standard ^40.0.0, tailwindcss 4.2.4, and wrangler 4.141.0.
- Updated pnpm-lock.yaml only for the authorized dependency graph and corresponding peer/snapshot references; stale 1.62.1-era Playwright records, Prettier 3.9.6, React Hook Form 7.87.0, and Tailwind Merge 3.6.0 records were removed.
- Repository toolchain remains pnpm@10.30.3 / Node 22.x.
- GitHub Actions validation run 36315064397 passed the earlier frozen-install/build pipeline; final verification run 36315879187 additionally ran pnpm install with pnpm 10.30.3, pnpm test, the production builds, the explicit AGENTS.md 495 MB size measurement, and Wrangler validation.
- The pnpm 10.30.3 regeneration step produced no pnpm-lock.yaml diff, demonstrating that the committed lockfile is already canonical for the declared package.json dependency state; no manual lockfile rewrite remains necessary.
- Final measured build outputs from run 36315879187: .next = 291 MiB / 284,734,594 bytes; .open-next = 96 MiB / 85,030,507 bytes. Both are below the 495 MB hard limit, leaving 204 MiB and 399 MiB margins respectively and therefore remaining safely below GitHub's 500 MB platform maximum.
- GitHub protected-file workflow run 36315284894 passed for the authorized package.json/pnpm-lock.yaml changes.
- pnpm test passed.
- No application source code, audio, visuals/VFX, database, authentication, payment, deployment behavior, or secrets were changed.
- A temporary verification workflow was used only to execute the missing pnpm regeneration/test/build/size checks and was removed before finalization.
- Non-rate-limit failures still terminate immediately; recognized rate-limit responses proceed to bounded backoff.
- Production verification remains pending.

# Active Context

## 2026-09-28 — Homepage Mobile Sky Correction
- Corrected the remaining `brightness(0.76)` override for `.homepage-sky-backdrop` in `themes/default/homepage.css` within the mobile media query, aligning it with the already-corrected base brightness value (`brightness(1.0)`). Verified clean builds and passing tests.

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


## 2026-09-26 — Standard Reveal Tonal-Cue Repair

- Re-analyzed the supplied Standard-tier capture `6384.mp4`: the three ordinary reveal hits recur at approximately 4.04s, 5.64s, and 7.24s, preserving the intended 1.6s cadence.
- The recurring unwanted artifact is a narrow tonal transient centered around approximately 2.1 kHz and occurring about +0.20s into each ordinary hit.
- Cross-referenced that timing against the current Standard Web Audio choreography: `beamEnergy` is scheduled at `hitStart + 0.08s`, which places a source-internal transient in the exact observed window. The previously fixed Web Audio clock-origin defect is not the current cause.
- Implemented the minimum audio-only repair in `app/lucky-card-reveal.js`: Standard no longer schedules `beamEnergy`. Approach, physical impact, final lock/discharge/reveal cues, Web Audio timing, visual/VFX code, and Premium/Flagship behavior remain unchanged.
- Verification so far: the application change is one targeted file diff with 3 additions and 4 deletions; subsequent commits only update the Memory Bank records. User-facing runtime playback still requires a fresh rendered capture after this change.


## 2026-09-26 — Critical Build/Deployment Safeguards

- Added explicit authorization-required notices to tailwind.config.js and postcss.config.js so unrelated AI/application tasks are instructed to leave the site-wide build configuration unchanged.
- Added explicit protected-safeguard notices to .github/workflows/deploy-open-next.yml covering the Cloudflare deployment concurrency group and bounded 429/10500 retry/backoff logic.
- Preserved the existing deployment behavior exactly: cancel-in-progress: false and bounded 60/120/180/300-second retry delays remain unchanged.
- No application runtime, audio, visual, database, authentication, payment, or secret behavior was changed.
- Verification requires final diff inspection and workflow/config syntax checks.


## 2026-09-27 — OpenNext Cloudflare 1.20.6 Dependency Update

- Branch: `chore/opennext-1-20-6`; PR #1280.
- Verified `main` baseline at `fa4aa7772ea31cc15d59a7d2aafc3cd3cad899fc`, including the merged Wrangler 4.141.0 update.
- Verified the repository was using `@opennextjs/cloudflare` 1.20.2 in the lockfile with Next.js 16.3.6 and Wrangler 4.141.0.
- Verified upstream OpenNext Cloudflare 1.20.6 publishes peer support for Next.js `>=16.3.3` and Wrangler 4.x, and moves the OpenNext AWS core to 4.1.4.
- Pinned `@opennextjs/cloudflare` to 1.20.6 and updated only the corresponding lockfile graph, including the OpenNext AWS core and package integrity records.
- Preserved application code, OpenNext configuration, Wrangler configuration, Tailwind/PostCSS configuration, deployment workflow, database, authentication, payment, audio, visuals, and secrets.
- Validation run 553 passed: frozen pnpm install, Next.js production build, OpenNext Cloudflare build, compiled Tailwind verification, worker/assets checks, Wrangler build validation, and Git status.
- No production deployment was triggered by PR #1280.


## 2026-09-27 — Tailwind CSS 4.2.4 migration
- Isolated migration prepared on `chore/tailwind-4-2-4` using the AGENTS.md deep-dive governance path.
- Migrated Tailwind CSS from the resolved 3.4.19 line to 4.2.4 and added `@tailwindcss/postcss` 4.2.4.
- Preserved the existing JavaScript Tailwind configuration with `@config "../tailwind.config.js"` and replaced the v3 PostCSS integration with `@tailwindcss/postcss`.
- Updated the documented v4 utility renames used by the app (`bg-gradient-to-*` → `bg-linear-to-*`, `shadow-sm` → `shadow-xs`).
- Rejected broad and resolver-refreshed lockfiles because they changed unrelated dependencies; final lockfile was constrained to the Tailwind 4.2.4 dependency closure while preserving the main baseline ordering/versions.
- Verified frozen install, Next.js production build, OpenNext Cloudflare build, compiled Tailwind CSS, OpenNext artifacts, build-size limits, Wrangler no-deploy validation, and clean lockfile state. No production deployment or merge performed.


## 2026-09-27 — Premium/Flagship Web Audio Rename Repair

- Fixed the incomplete `standardWebAudioReady` → `webAudioReady` rename left by the automated Q follow-up on PR #1285.
- Verified the remaining stale identifier references were confined to `app/lucky-card-reveal.js`; replacing them completes the generalized recognized-tier Web Audio state path without changing timing, tier hit counts, assets, visuals, or fallback architecture.

## 2026-09-27 — Lucky Card Reveal Visual Polish

- Branch: `jules-visual-polish`
- Completed the visual polish pass on the Lucky Card Reveal component (`app/lucky-card-reveal.js`).
- Implemented robust, non-intrusive direct replacements targeting specific canvas rendering functions (`drawContinuousBeam`, `drawMoltenBurnout`, particle physics, Framer Motion sequencing).
- Successfully enhanced cinematic depth (ambient glow, contact flashes, drag physics) while perfectly preserving the protected card artwork, tier logic, and audio choreography.
- Validated tier identities: Standard (Bronze), Premium (true Silver/Pewter, no blue), Flagship (Rich Gold).
- Build size verified well under the 495MB limit (291MB). Tests passing.


## 2026-09-28 — Homepage Top Background Foundation Repair

- Verified the prior homepage photographic-sky brightness fixes are already present on `main`, including mobile `brightness(1.0)`.
- Cross-referenced `app/page.js`, `app/layout.js`, and `themes/default/homepage.css` against the latest mobile recording.
- Identified a redundant full-viewport `.homepage-background-foundation` layer that the homepage CSS previously made transparent but did not remove.
- Removed that homepage-only foundation layer with a scoped `display: none !important` rule, leaving the photographic sky, navigation, hero, stars, and homepage functionality unchanged.
- Branch: `fix/homepage-top-foundation-layer`; PR #1295. Runtime visual verification remains pending on the next deployed/mobile build.


## 2026-09-28 — Homepage Root Background Follow-up
- The merged homepage foundation-layer repair did not change the reported mobile appearance.
- Re-inspection found the remaining root `html { background: var(--night) }` layer in `themes/default/default.css`. The homepage clears `body`, while `.homepage-sky-backdrop` uses a negative z-index, so the root background can remain visible in the root stacking order.
- Added a homepage-scoped `html:has(.homepage-sky-backdrop)` transparency rule in `themes/default/homepage.css`.
- Runtime/browser verification remains pending; this is a code-level fix, not a claimed visual verification.


## 2026-09-28 — Playwright Visual QA Foundation

- Implemented a dedicated Playwright visual-regression check for the homepage.
- Coverage: desktop 1440×900, mobile 390×844, and mobile 412×915 Chromium viewports.
- Playwright was already present in the repository at 1.63.0; no dependency or lockfile changes were made.
- Added deterministic Math.random/Date.now inputs and a fixed /api/visits response so screenshots represent visual regressions rather than transient data.
- Established three committed homepage viewport baselines under tests/visual/__screenshots__/.
- GitHub Actions verification run 36394814400 passed the complete visual comparison against those baselines.
- Final PR workflow is read-only with committed baselines; normal PRs do not auto-create or mutate baselines.
## 2026-09-28 — Homepage Background Restoration (CSS Sync)
- **Problem**: The homepage was rendering a dark, sparse background instead of the intended cinematic Pexels photographic Milky Way.
- **Root Cause Verified**: `themes/default/homepage.css` contained the correct `.homepage-sky-backdrop` implementation, but the file served to the browser (`public/themes/default/homepage.css`) was a stale, older copy that lacked this implementation. The `CSS_FIX_GUIDE.md` establishes a convention to manually copy CSS from `themes/default/` to `public/themes/default/` to bypass Next.js CSS bundling issues.
- **Fix**: Synchronized `public/themes/default/homepage.css` with the source `themes/default/homepage.css`.
- **Scope Control**: Reverted earlier unnecessary changes to `default.css` and `hero.css` from the previous failed attempt; they were already synced or unrelated to the bug. Kept changes strictly limited to `public/themes/default/homepage.css` to satisfy the "smallest correct change" requirement.
- **Verification**: Verified using a local production build (`pnpm run build` and `node .next/standalone/server.js`), captured mandatory viewport screenshots (Desktop full/1440x900, Mobile 412x915, Mobile 390x844). Verified visually that the cinematic background was restored without breaking existing ambient animations (Canvas stars).
- **Baselines**: Ran `npx playwright test --update-snapshots` to deliberately regenerate the three committed visual baselines, since the baselines were previously set against the broken dark-background state.
## 2026-09-28 — Lower Page Contrast/Visibility Polish
- **Problem**: Text in the "Our Story" sections and the footer area was too faint against the dark background. Some buttons were too translucent to distinguish easily.
- **Root Cause**: Text elements in `app/page.js` had `opacity: 0.9` and grey colors (`#888`). Footer elements in `app/layout.js` had low opacity Tailwind classes (`text-white/60`, `text-white/30`, etc.). The "Read the Full Story" button had a very low opacity background (`0.1`) and border (`0.2`).
- **Fix**: Adjusted text colors in `app/page.js` to `rgba(255, 255, 255, 0.9)` and `#bbb` to improve contrast. Removed `opacity: 0.9` inline styles. Increased button background opacity to `0.2` and border to `0.4`. In `app/layout.js`, increased footer text opacity classes (e.g., `text-white/60` -> `text-white/80`, `text-white/30` -> `text-white/50`).
- **Scope Control**: No changes to layout, background brightness, or animations. Dimensions and overall design remained intact.
- **Verification**: Changes passed local build/tests. Visual impact manually verified to increase legibility without compromising the site's dark aesthetic.
