# Evidence: Align Link Prefetch with the Adaptive Network Policy

**Date**: 2026-11-18
**Branch**: `perf/link-prefetch-policy`
**Base**: `main` at `782ac553ffdd0fbb3476e2cc403c3500f981ad4f`
**Task groups**: performance, testing
**Library sources consulted**:
- `.docs/nextjs/_vercel_nextjs_docs.md` — useful: confirmed `Link` prefetch defaults and that
  `prefetch={false}` disables speculative prefetching while click navigation still works.
- `.docs/testing/_google_eng-practices.md` — useful: focused source/policy guards.

## Cause

- Next.js App Router prefetches links by default. Every navigation link outside the hero used plain
  `next/link`, so the adaptive plan's `prefetch` value never reached them.
- `app/lib/resource-readiness.js` `prepareCodeResource` called `router.prefetch` with no plan check, so the
  hub could warm a route on a connection where links would not.
- Result (audit): RSC requests during intent activity, including on constrained connections.

## Change

- 24 navigation links across 11 files now use the existing `IntentPrefetchLink`, which renders the same anchor
  and sets `prefetch={false}` unless `shouldPrefetchOnIntent(plan, intent)` allows it: footer nav, homepage
  CTAs, legal back links, About/AboutSection, Lucky Generator, Daily Resonance, Crystal Ball and the reveal's
  back link.
- `prepareCodeResource` now refuses route code when `prefetch === 'none'` (`prefetch-disabled`) and, for
  `strong-intent`, only proceeds for intent/critical priority (`prefetch-strong-intent`). The job priority is
  passed through the adapter context.
- `IntentPrefetchLink`'s JSDoc props type became `Record<string, any>` so `.tsx` consumers accept `href`,
  `className` and data attributes. No runtime change.
- Three existing markup/import guards were updated to assert the same links and wording through the wrapper.

## Measured result

Production server (`next start` on port 3104), Chromium 1440x900, cold context, homepage → hover the footer's
`About` link (not one of the hub's likely-next experiences).

| Profile | RSC requests after load | RSC requests after hover | Navigation |
| --- | --- | --- | --- |
| Save-Data (`navigator.connection.saveData = true`) | 0 | **0** | click → `/about`, heading "About the Creator & Our Story", 0 console errors |
| Capable (no Save-Data) | 7 (hub warming: `/lucky-meter`, `/reveal`, `/crystal-ball`) | 9 (+2 for `/about`) | not clicked in this run |

So a constrained visitor now pays nothing for hover or load-time speculation, while a capable visitor keeps the
hover prefetch (and the hub's existing idle warming is unchanged). The only `/about` request in the Save-Data
run is the click's own navigation request.

## Checks

| Check | Result |
| --- | --- |
| `npx vitest run __tests__/link-prefetch-policy.test.js` | PASS — 16 tests |
| `npx vitest run __tests__/intent-prefetch-link.test.jsx __tests__/resource-readiness.test.js` | PASS |
| Focused markup guards (`homepage-content-refresh`, `homepage-nav-gold-shimmer`, `lucky-card-reveal-presentation`) | PASS — 38 tests |
| `npx vitest run` | PASS — 97 files / 1011 tests |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm run build` | PASS |
| Clean production build size (`rm -rf .next && pnpm build && du -sb .next`) | 313,364,569 bytes = 298.85 MiB (limit 495 MiB) |
| `./freebuff-verify.sh` | PASS — exit 0 |
| Browser probe (Save-Data / capable) | PASS — see table, 0 console errors |

## Limitations

- Headless Chromium exposes no `navigator.connection.downlink`, so Save-Data is the constrained profile used
  for browser evidence; the moderate/`strong-intent` branch is covered by unit tests instead.
- The capable run deliberately hovers `/about`, a route the hub does not warm, so the +2 RSC requests are
  attributable to the Link. Hovering `/lucky-meter` shows no delta because the hub has already warmed it.
- PR-triggered workflows run after the PR is created and are not part of this record.
