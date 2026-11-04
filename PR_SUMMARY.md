# Homepage Navigation Consolidation and Golden Shimmer

**Branch** `freebuff/d1d198f83bbd7f8a37f69b23` targets `main`. **Status: open and unmerged for review.**

Implementation **COMPLETE**; verified completion is **pending PR-head CI** (see Verification).

## Task and selected task groups

**Assigned task (Master Work Request #1):**

1. Remove the redundant Lucky Map navigation link and retain one Lucky Stories link pointing to the
   existing Stories homepage. Do not remove the underlying map functionality.
2. Add a subtle, visibly moving golden-light shimmer to the prominent homepage gold lettering, the
   Explore Your Luck text and downward arrow, and the gold ring around the emblem, preserving the
   existing artwork, wording, colours and layout.
3. Preserve the downward arrow's functionality completely — click behaviour, confetti, sound effect
   and scrolling — adding only the decorative shimmer.
4. Preserve the existing AVIF-first image delivery and WebP fallback exactly: no format, quality,
   fallback, preload or image-delivery configuration change.

**Selected task groups:**

- **`polishing`** — both halves are presentation polish on existing artwork and navigation: a
  decorative effect over untouched art and a duplicate-entry cleanup, with no new feature surface.
- **`testing`** — the request is about rendered behaviour ("subtle, visibly moving", "preserve the
  click behaviour"), so it is verified by executing: source guards, the full suite, and measured
  Chromium captures rather than code inspection alone.

## Library / routed documents reviewed

| Document | USED | USEFUL | Contribution |
| --- | --- | --- | --- |
| `.docs/manifest.json` | **USED** | **YES** | Routing index: identified the `polishing` and `testing` reference sets before deciding which documents could materially help. |
| `.docs/polishing/_websites_mdn_image_types.md` | NOT USED | NO | The task forbids any raster format, quality or fallback decision, so no format strategy was chosen; delivery was explicitly preserved rather than re-decided. |
| `.docs/polishing/_vercel_next_js.md` | NOT USED | NO | No Next.js API behaviour needed confirming — the change is plain CSS in an already-imported stylesheet plus JSX in a server component. |
| `.docs/polishing/_websites_developer_chrome.md` | NOT USED | NO | Container-query sizing, `mix-blend-mode` and mask behaviour were verified directly in Chromium by measurement instead. |
| `.docs/polishing/_websites_tailwindcss.md` | NOT USED | NO | New rules are plain CSS in `themes/default/hero.css`, not Tailwind utilities. |
| `.docs/polishing/_google_eng-practices.md` | NOT USED | NO | Cross-cutting review guidance only; not needed for a scoped, measured change. |
| `.docs/testing/_vitest-dev_vitest.md` | NOT USED | NO | The guard follows the repository's existing `__tests__/*.test.js` conventions. |
| `.docs/testing/_microsoft_playwright.md` | NOT USED | NO | The probe uses the repository's already-pinned `playwright-chromium` with the API patterns used by earlier probes here. |
| `.docs/testing/_google_eng-practices.md` | NOT USED | NO | Same as the polishing snapshot: no design decision depended on it. |

Governance and process files read and applied: `AGENTS.md`, `.freebuff/freebuff.md`,
`.freebuff/polishing.md`, `.freebuff/testing.md`, `memory-bank/projectBrief.md`,
`memory-bank/activeContext.md`, `.specify/memory/constitution.md`. `.docs/` was not modified.

## What was actually implemented

The gold wordmark, the "EXPLORE YOUR LUCK" line with its arrow, and the gold ring are painted inside
**one** hero artwork (`public/homepage-hero-lucky-pick-canada*.{avif,webp}`). The shimmer is therefore
a decorative layer above the untouched artwork, not an artwork change.

- **`app/homepage/Hero.js`**
  - Hero primary navigation: removed the `Lucky Map` → `/map` entry and its separator, and relabelled
    the remaining stories link to **Lucky Stories**, keeping its existing `#community-stories`
    destination. Navigation is now `Lucky Meter · Lucky Stories · Consult the Crystal Ball · Daily Card Reveal`.
  - Added one `aria-hidden` shimmer frame with three region layers between the artwork `<picture>` and
    `ExploreLuckButton`, so the decoration sits above the art and below the existing hit target.
  - `preload()`, both `<source>` elements, the `<img>` fallback and every image URL are byte-identical.
- **`themes/default/hero.css`** — the alignment rule and the decorative effect: `.hero-image-container`
  becomes a size container and the frame uses `height: min(100cqh, 150cqw)` with `aspect-ratio: 1024 / 1536`,
  which reproduces the `object-contain` artwork box at any viewport instead of the container box (this
  matters on phones, where the art is width-limited). Three masked layers — a soft annulus for the gold
  ring, an ellipse over the wordmark, an ellipse over the Explore line/arrow — each carry a
  screen-blended gradient band animated by one shared keyframe sweep with per-region durations/offsets.
  `pointer-events: none` throughout, and `prefers-reduced-motion: reduce` sets `display: none`.
- **`__tests__/homepage-nav-gold-shimmer.test.js`** (new) — guards the single "Lucky Stories" link, the
  absent "Lucky Map" link, the preserved `/map` route + "EXPLORE LUCKY STORIES" call to action + footer
  map link, the order of the decoration relative to the artwork and the Explore control, the three
  regions and their animation, the artwork-box alignment, non-interactivity, the reduced-motion rule,
  the untouched Explore control behaviour, and the unchanged image delivery.
- **`specs/089-homepage-nav-gold-shimmer/`** (new) — `spec.md`, `plan.md`, `tasks.md`,
  `checklists/requirements.md`; `.specify/feature.json` points at it.
- **`artifacts/hero-shimmer/probe.cjs`** (new) — the repeatable Chromium probe that produced the
  measurements below.

**Assumption recorded for task item 1:** "the existing Stories homepage" is read as the homepage's
existing Lucky Stories area (`#community-stories`, the section already headed "Lucky Stories"), which
is exactly where the previous "Community Stories" link pointed. The map keeps its own route, its
homepage CTA and its footer link, so no map functionality was removed. The footer's "Lucky Map" entry
is a different navigation surface and was left untouched.

**Not changed:** artwork and image files, image delivery/quality/preloads, `next.config.mjs`,
`ExploreLuckButton.js`, `HomePage.js`, `app/layout.js`, `app/map/page.js`, routes, APIs, Stripe,
Resend, database, Turnstile, dependencies and deployment configuration. `package.json` and `bun.lock`
were already modified/untracked in this workspace before the task started and are **excluded** from
this branch.

## Verification

| Check | Command | Result |
| --- | --- | --- |
| Spec Kit artifacts + gate | `./freebuff-verify.sh` (runs `scripts/verify-speckit-task.sh`) | **PASS** — spec/plan/tasks verified and current |
| Focused guard + hero delivery suite | `pnpm exec vitest run __tests__/homepage-nav-gold-shimmer.test.js __tests__/homepage-hero-preload.test.js` | **PASS** — 16/16 (guard re-run alone on final code: 12/12) |
| Full unit suite | `pnpm exec vitest run` | **PASS** — 39 files / 413 tests |
| Type check | `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| Repository gate + production build | `./freebuff-verify.sh` | **PASS** — exit 0 (Spec Kit gate, typecheck, build, refresh-docs 19/19) |
| Build size (495 MB limit) | `du -sb .next public` | **PASS** — `.next` 285,913,411 B + `public` 32,840,043 B = **318,753,454 B (304.0 MiB)** |
| Served routes | `curl` against `next start` on :3100 | **PASS** — `/` 200, `/map` 200, `/where-luck-has-been-found-in-canada` 200 |
| Served hero navigation | served HTML | **PASS** — 4 links `/lucky-meter`, `#community-stories`, `/crystal-ball`, `/reveal`; one `href="#community-stories"`; no hero `/map` link |
| Map preserved | served HTML | **PASS** — one `EXPLORE LUCKY STORIES →` link to `/map`, one footer "Lucky Map" link, map routes 200 |
| Image delivery | served HTML + Chromium network | **PASS** — one hero preload hint (AVIF), AVIF source before WebP source, WebP `<img>` fallback; exactly one hero response per profile (`…-lucky-pick-canada.avif` desktop, `…-669w.avif` mobile) |
| Shimmer alignment | Chromium (probe `artifacts/hero-shimmer/report.json`) | **PASS** — frame equals the painted artwork box: desktop 432x648 = 432x648, mobile 360x540 = 360x540 |
| Visibly moving shimmer | Chromium, 26 frames @400 ms per profile | **PASS** — max consecutive-frame mean pixel change: desktop ring 7.254 / wordmark 9.620 / explore 11.447; mobile ring 6.291 / wordmark 12.596 / explore 14.677; up to 39 % (desktop) and 52 % (mobile) of a region's pixels changed between frames |
| Reduced motion | Chromium `reducedMotion: 'reduce'` | **PASS** — all three layers `display: none`, whole-hero frame difference 0 |
| Explore Your Luck preserved | Chromium click | **PASS** — scroll 0 → 996 px (desktop) / 0 → 867 px (mobile), confetti canvas added, `data-confetti-pop-ready="true"`, no console or page errors, 0 px horizontal overflow |
| Final diff audit | `git diff`, `git status` | **PASS** — only the intended files below |
| PR-head CI | GitHub checks on the pushed head | **PENDING** |
| Audible confetti sound | — | **NOT RUN** — no audio output device in this workspace; the sound path is unchanged and is not intercepted by the decoration |

## Remaining issues and limitations

- **PR-head CI is PENDING.** No CI result is claimed.
- **Audible sound is NOT RUN** here (no audio device); the click path was exercised and `playConfettiPop()`
  is unchanged, but loudness/audibility is unverified.
- Reduced-motion verification used Chromium's `reducedMotion` emulation, not an OS-level setting.
- Physical iOS/Android devices were not tested; the headless desktop and 390x844 mobile profiles plus
  the existing Playwright suite are the evidence available in this workspace.
- If a future change alters the hero artwork's internal composition, the three measured region
  percentages in `themes/default/hero.css` must be re-measured; they are tied to this artwork.
- Engines without container-query units would drop the decoration rather than misplace it (no layout
  or content change); the AVIF-capable browser set already supports them.
- The skill-copy duplicate at `public/themes/default/hero.css` is unused by the app and was left as-is
  (out of scope).

---

**USEFUL RESULT: YES** — all four requested outcomes are implemented and demonstrated: one Lucky
Stories navigation link with the map functionality intact, a measurably moving golden shimmer on the
wordmark, the Explore Your Luck line/arrow and the gold ring, the Explore control's click/confetti/
scroll behaviour preserved, and image delivery byte-identical. Every claim above is backed by a
recorded command or measurement; PR-head CI remains **PENDING** and is not reported as passing.
