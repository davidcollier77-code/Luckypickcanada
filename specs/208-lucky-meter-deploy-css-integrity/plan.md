# Implementation Plan: Lucky Meter Deployment CSS Integrity

**Feature**: `specs/208-lucky-meter-deploy-css-integrity`

**Branch**: `freebuff/c866d14850b69cd27cc012d3`

## Technical Context

- Next.js 16.4.5 App Router, React 19.3.1, TypeScript; production builds use `next build --webpack`.
- Deployment: `.github/workflows/deploy-open-next.yml` → `opennextjs-cloudflare build` →
  `wrangler deploy --config ./wrangler.jsonc`.
- `open-next.config.ts` sets `buildCommand: "npx next build --webpack"`, so OpenNext builds the
  app itself. The workflow previously built it a second time with `pnpm run build`.
- The contract selectors live in `app/globals.css` (`.lucky-vessel*`, `.lucky-results-dock`) and
  are emitted into one of the route's CSS chunks.
- Spark timing comes from `getSparkCharacterScheduleMs` in `app/lib/lucky-meter/storyboard.js`.

## Root Cause

The live page was a mixed artifact set: current HTML/JS with a stylesheet bundle from before the
approved Build (it retained `.lucky-colour-vessel` and lacked `.lucky-vessel*`). The deploy
workflow's two builds — one with `GITHUB_SHA`, one without — made the uploaded stylesheet set
dependent on a second build that the job never inspected, and nothing checked what the deployed
origin actually served. The live build ID (`build-…`, timestamp-based) confirms the uploaded
artifact came from the OpenNext rebuild, not the `GITHUB_SHA` build.

## Approach

1. **One deterministic build.** Remove the redundant `pnpm run build` step and pass `GITHUB_SHA`
   to the OpenNext build, so the uploaded artifact is the single build the job performs. The
   compiled-artifact gate asserts `.open-next/assets/BUILD_ID` equals `GITHUB_SHA` before upload.
2. **Artifact gate.** Extend the existing “Verify compiled Tailwind CSS” step to fail when the
   compiled CSS lacks `.lucky-vessel-scene`, `.lucky-vessel-canvas-host` or `.lucky-results-dock`.
3. **Served gate.** Add `scripts/verify-deployed-lucky-meter-css.mjs`. After `wrangler deploy` it
   fetches both a cache-bypassed `/lucky-meter` and the bare visitor-facing URL, requires each
   response to identify the deployed build ID, resolves every `<link rel=stylesheet>`, fetches each
   stylesheet and fails with the failing page and missing selector names. It retries six times at
   15 s intervals for Cloudflare/OpenNext propagation, and every request aborts after 10 s so a
   stalled origin cannot hold the deploy concurrency group.
4. **Absolute Spark clock.** Measure `startedAt = performance.now()` once; schedule each glyph at
   `startedAt + schedule[index]` using `Math.max(0, …)`. Late frames shrink the next delay
   instead of extending the line.
5. **Tests.**
   - `__tests__/deploy-css-check.test.js`: URL resolution, rules split across stylesheets,
     build-identity assertion, visitor-facing cached HTML, request timeout, retry and failure
     paths with a fake fetch.
   - `__tests__/lucky-meter-sky-writing.test.jsx`: a 1,200 ms late first frame reduces the next
     delay by exactly that amount; a late-frame run still completes at the final deadline; the
     existing window test proves completion inside 3,800–5,200 ms.

## Files

| File | Change |
| --- | --- |
| `.github/workflows/deploy-open-next.yml` | Single build, compiled-CSS assertion, served-CSS step |
| `components/LuckyMeterSkyWriting.tsx` | Absolute-deadline glyph scheduling |
| `scripts/verify-deployed-lucky-meter-css.mjs` | New post-deploy served CSS check |
| `__tests__/deploy-css-check.test.js` | New check coverage |
| `__tests__/lucky-meter-sky-writing.test.jsx` | Late-frame regression test |
| `specs/208-lucky-meter-deploy-css-integrity/*` | Spec Kit artifacts |

## Verification

- Focused Vitest for the two changed test files.
- `pnpm exec tsc --noEmit`.
- `pnpm exec prettier --check` on changed source files.
- Production build and OpenNext package; measure `.next` and assert the three selectors in
  `.open-next/assets/_next/static/css/*.css`.
- Run the served check against production with `attempts=1` to confirm it reports the current
  stale deployment (expected until the corrected build is deployed).
- `./freebuff-verify.sh` per repository governance; record any environment limitation.

## Risks and Mitigations

- **Cached HTML at the edge.** The visitor-facing request is checked separately from the
  cache-bypassed request and must also identify the deployed build. The check retries and fails
  loudly rather than reporting a false success; a persistent failure identifies a cache purge as
  the remaining action.
- **Request and job stalls.** Each fetch has a 10 s timeout and the deploy job is bounded at
  30 minutes, so the non-cancelling deployment concurrency group cannot be occupied for hours.
- **Removing the first build.** OpenNext already performs the production build with the same
  `next build --webpack` command, so the artifact is unchanged except that it now carries the
  commit SHA as its build ID.
- **Timer catch-up.** Zero-delay catch-up can reveal several glyphs in one frame after a long
  block. This is preferable to exceeding the approved window and matches the storyboard's intent.
