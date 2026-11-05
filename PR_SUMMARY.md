# Daily Lucky Card Reveal — tappable entry control and tier presentation

**Branch** `polish/reveal-card-tier-experience-20261105` targets `main`. **Status: open and unmerged for review.**

Implementation **COMPLETE**. All local mandatory checks and the browser probe pass; **PR-head CI is pending**.

## Task and selected task groups

**Assigned task (Master Work Request #1):** Polish and enhance the daily collectible Lucky Card reveal
experience at `/reveal`. Make the entry button clearly look and feel tappable, and improve the
presentation and reveal experience across all three card tiers (Standard, Premium, Flagship), while
preserving the existing artwork and functionality.

**Selected task groups:**

- **`polishing`** — the whole request is presentation polish on an existing experience: entry-control
  affordance and the visual framing/naming of the revealed card, with no new feature surface.
- **`testing`** — the request is about rendered behaviour ("clearly look and feel tappable", three
  distinct tiers), so it is verified by execution: unit tests for the tier contract, the full suite,
  the repository gate and a measured Chromium probe.

## Library / routed documents reviewed

| Document | USED | USEFUL | Contribution |
| --- | --- | --- | --- |
| `.docs/manifest.json` | **USED** | **YES** | Routing index; identified the `polishing` and `testing` reference sets and confirmed no document was mandatory. |
| `.docs/polishing/_websites_mdn_image_types.md` | NOT USED | NO | No raster format, quality or fallback decision was made — artwork delivery is explicitly preserved. |
| `.docs/polishing/_vercel_next_js.md` | NOT USED | NO | No Next.js API question arose; the change is JSX plus existing utilities in an already-rendered client component. |
| `.docs/polishing/_websites_tailwindcss.md` | NOT USED | NO | Only existing utility conventions were reused; the one measurement that mattered (root `font-size: 15px` on mobile) was read from `themes/default/default.css` and measured in the browser. |
| `.docs/polishing/_websites_motion_dev.md` | NOT USED | NO | Reused the `motion` / `useReducedMotion` imports the component already had; no new motion API was consulted. |
| `.docs/polishing/_websites_developer_chrome.md` | NOT USED | NO | Behaviour (hover lift, press depth, halos, accents) was measured directly in Chromium instead. |
| `.docs/polishing/_dequelabs_axe-core.md` | NOT USED | NO | Accessibility was handled structurally (real `<button>`, unchanged accessible name, `aria-describedby`, `aria-hidden` decorative layers) rather than by an axe run. |
| `.docs/polishing/_google_eng-practices.md` | NOT USED | NO | Cross-cutting review guidance only; not needed for this scoped change. |
| `.docs/testing/_vitest-dev_vitest.md` | NOT USED | NO | Followed the repository's existing `__tests__/*.test.js` conventions. |
| `.docs/testing/_microsoft_playwright.md` | NOT USED | NO | The probe uses the already-pinned Playwright with the API patterns earlier probes in this repository use. |
| `.docs/testing/_google_eng-practices.md` | NOT USED | NO | Optional review guidance; not needed. |

Repository documents that did materially inform the work: `AGENTS.md`, `.freebuff/freebuff.md`,
`.freebuff/polishing.md`, `.freebuff/testing.md`, `memory-bank/projectBrief.md`,
`memory-bank/activeContext.md`, `specs/064-sitewide-gold-cta/spec.md` (authoritative gold CTA
treatment), `specs/069-sitewide-visual-polish/spec.md` and `specs/075-lucky-reveal-polish/spec.md`
(protected reveal behaviour), and `app/globals.css` (the `.gold-3d-btn` states).

## Spec Kit stages (in order)

| Stage | Artifact |
| --- | --- |
| Specify | `specs/094-lucky-card-reveal-polish/spec.md` |
| Plan | `specs/094-lucky-card-reveal-polish/plan.md` |
| Tasks | `specs/094-lucky-card-reveal-polish/tasks.md` |
| Implement | the changes below, with verification recorded here and in `tasks.md` |

`.specify/feature.json` points at the new feature. No earlier feature directory covered the daily
card reveal page (075/078/081 cover the paid reveal popup, 064/069 cover sitewide CTA and page
polish), and no existing branch or PR covered this task, so nothing was duplicated.

## What was implemented

1. **Entry control reads and behaves as a tappable primary action** (`app/lucky-card-reveal.js`):
   a guaranteed **56 px** minimum height (`style={{ minHeight: 56 }}` — a rem-based utility resolves to
   52.5 px because the theme sets `html { font-size: 15px }` on mobile), full-width on phones and
   content-width from `sm`, `cursor-pointer`, `touch-manipulation`, `select-none`, larger padding, and
   a visible instruction (`Tap to reveal today’s Lucky Card`, switching to `Drawing your Lucky Card…`
   while the draw runs) wired with `aria-describedby` so the accessible name stays
   "Reveal Today's Luck". The shared `.gold-3d-btn` gradient, raised edge, hover lift, 2 px press and
   focus ring are unchanged.
2. **Tier presentation module** (`app/lucky-card-presentation.js`, new): `standard` / `premium` /
   `flagship` palettes using the colours the reveal canvas already paints (bronze `#e09440`, pewter
   `#c8ccd0`, gold `#daa520`), with halo/rim/frame strengths that escalate by tier, plus
   `getLuckyCardTierPresentation()` using an own-property lookup and a Standard fallback.
3. **Revealed card now states its tier and name**: a tier chip (`★ Standard Tier` / `◆ Premium Tier` /
   `♛ Flagship Tier`), an `h2` with the card title, a `Series 1 · Added to your collection` caption,
   and a tier-tinted quote-panel border.
4. **Tier-aware reveal moment**: an `aria-hidden`, `pointer-events-none` radial halo plus a card-sized
   rim that fade in once the card is revealed (no fade under `prefers-reduced-motion`), and a
   tier-tinted inner ring on the revealed card front. The `coast-to-coast-tale` authored frame
   exception is preserved.
5. **Evidence tooling**: `artifacts/reveal-card-polish/probe.cjs` and its captured screenshots/report.

## Files changed

- `app/lucky-card-reveal.js` (entry affordance, tier chip/name/caption, halo/rim, revealed frame)
- `app/lucky-card-presentation.js` (new)
- `__tests__/lucky-card-tier-presentation.test.js` (new, executed)
- `__tests__/lucky-card-reveal-presentation.test.js` (new, structural guard)
- `specs/094-lucky-card-reveal-polish/{spec,plan,tasks}.md` (new)
- `.specify/feature.json`
- `artifacts/reveal-card-polish/` (new: probe + screenshots + `out/report.json`)
- `memory-bank/activeContext.md`, `memory-bank/progress.md`
- `PR_SUMMARY.md`

## Verification (commands actually run)

| Check | Result |
| --- | --- |
| `pnpm exec vitest run __tests__/lucky-card-tier-presentation.test.js __tests__/lucky-card-reveal-presentation.test.js __tests__/lucky-card-collection.test.js` | **PASS** — 3 files / 10 tests |
| `pnpm exec vitest run` | **PASS** — 45 files / 439 tests |
| `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| `./freebuff-verify.sh` | **PASS** — exit 0 (bootstrap, frozen install, Spec Kit gate tests, Spec Kit artifacts gate, typecheck, production build, refresh-docs 19/19) |
| Production build size | **PASS** — final `.next` 339,173,423 B + `public` 32,840,043 B = **372,013,466 B (354.8 MiB)**; an earlier build in the same session measured 331,568,750 B (316.2 MiB). Both are below the 495 MB maximum. |
| Chromium probe (`node artifacts/reveal-card-polish/probe.cjs` against `next start` on the production build) | **PASS** — 51/51 checks |

Probe evidence (mobile 390×844 and desktop 1440×900, production server):

- entry button: 56 px tall (mobile) / 58 px (desktop), 330 px wide on mobile, 256 px content width on
  desktop, `cursor: pointer`, `touch-action: manipulation`, gold gradient and raised edge present,
  accessible name exactly "Reveal Today's Luck", `aria-describedby` → `lucky-card-reveal-hint`,
  instruction copy exact, hover lift `translateY(-2px)`, press `translateY(2px)`, and pressing the
  control mounts both canvases and removes the entry control (the draw actually starts);
- each tier: chip label (`… TIER`), card name (`h2`), collection caption, and the stored quote render;
  one `data-card-halo` layer per tier inside an `aria-hidden`, `pointer-events:none` wrapper with
  settled opacity `1`; halo and revealed-frame shadows carry that tier's accent; artwork still
  resolves to the original `.webp` fallback from the unchanged AVIF-first markup; 0 px horizontal
  overflow;
- reduced motion: halo present with opacity `1` and no fade;
- 0 console/page errors across all runs.

The probe caught two real issues during the work, both fixed before this report: a rem-based minimum
height resolved to 52.5 px because `themes/default/default.css` sets `html { font-size: 15px }` on
mobile (now an explicit 56 px), and three probe assertions were wrong (innerText instead of the
accessible name, case-sensitive caption, mismatched `rgb()`/`rgba()` accents) — corrected, not worked
around in the app.

### Not verified / pending

- **PR-head CI (`Visual QA`, updater, DevSkim, OpenNext validation): PENDING.** No CI run exists yet for this head.
- **Component render test not possible in this harness**: Vitest's Vite/oxc pipeline refuses JSX inside
  `.js`, and `app/lucky-card-reveal.js` is a JSX component (renaming it would be an unrelated change).
  The tier values are covered by an executed unit test; the markup contract is covered by a structural
  guard plus the browser probe.
- **Physical iOS/Android devices: NOT RUN.** The probe uses Chromium device emulation only.
- **Audible playback: NOT RUN** (no audio device); audio cue scheduling and assets are untouched.
- A real draw (which triggers the canvas/audio choreography) was started by the probe to prove the
  press works, but the full ~7 s cinematic sequence was not re-timed or re-audited here.

## Behaviour preserved

`LUCKY_CARDS`, `selectWeightedLuckyCard` weighting/anti-repeat, `selectRandomQuote`, the daily
localStorage lock and `unlockedCards` write, `TIER_HITS` (3/4/5), flip timings, canvas beam code, all
eight authored audio cues, AVIF-first with WebP fallback artwork and the card-back/backdrop artwork,
the `coast-to-coast-tale` frame exception, the share control, the collection binder and the Return to
Home link are unchanged. No dependency, route, API, payment, email, database, authentication,
deployment or secret change.

## Remaining issues / limitations

- The tier block sits in the existing result section below the card controls, so on a 390 px phone it
  begins near the fold; this keeps the existing layout rather than re-ordering protected elements.
- The reveal-content fade (`animate-fade-in`) means a screenshot taken within ~0.5 s of the reveal
  shows it partially transparent; the probe waits for it to settle.

**USEFUL RESULT: YES** — the requested behaviour is demonstrated by measured browser evidence and every
local mandatory gate passes. **Verified completion is still pending PR-head CI.**
