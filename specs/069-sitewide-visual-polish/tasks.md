# Tasks: Site-Wide Visual Polish and Presentation Refinement

**Input**: `specs/069-sitewide-visual-polish/spec.md` and `specs/069-sitewide-visual-polish/plan.md`

## Phase 1: Setup

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, `.freebuff/polishing.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, and `.docs/manifest.json`; confirmed `polishing` as the single applicable group.
- [x] T002 Inspect the branch/worktree and existing Spec Kit artifacts (035–066) for related visual-polish work; no existing artifact covers this site-wide task, so feature directory `specs/069-sitewide-visual-polish` is new and `066` remains untouched.
- [x] T003 Review the routed Library references that materially apply: `.docs/polishing/_websites_mdn_image_types.md` (image rendering/format strategy), `.docs/polishing/_dequelabs_axe-core.md` (contrast/keyboard expectations), `.docs/creation/_websites_tailwindcss.md` and `.docs/creation/_vercel_next_js.md` (utility/app-router conventions already in use).

## Phase 2: Baseline evidence

- [x] T004 Measure the font-token defect: `var(--font-header, serif)` at `themes/default/homepage.css:23` with `--font-header` declared only in `app/components/CrystalBall/CrystalBall.module.css:13`.
- [x] T005 Measure the legal-route palette: `text-blue-600` and `text-gray-500` appear only in `app/privacy/page.js` and `app/terms/page.js`, on the site's `#02070c` background.
- [x] T006 Measure the map artwork: `sharp` reports `public/IMG_20260731_055452_187611.png` at 569×464, displayed at up to 44rem with `image-rendering: crisp-edges`.

## Phase 3: Implementation

- [x] T007 Resolve homepage card headings to the brand display face.
- [x] T008 Restyle `app/privacy/page.js` and `app/terms/page.js` onto the dark brand palette with a framed surface, unchanged copy/links.
- [x] T009 Stop pixel-replicating upscaling of the Lucky Map artwork element while preserving its sizing, markers, and behaviour.

## Phase 4: Verification

- [x] T010 `pnpm exec tsc --noEmit`.
- [x] T011 `pnpm test`.
- [x] T012 `./freebuff-verify.sh` (Spec Kit governance gate, typecheck, production build, refresh-docs tests).
- [x] T013 Measure the production build size against the 495 MB hard maximum.
- [x] T014 Rendered-evidence checks for each change (served HTML, compiled CSS, computed styles).
- [x] T015 Playwright visual/interaction runs; record the true outcome.
- [x] T016 Final diff audit, PR body publication, and memory-bank update; PR left open and unmerged.

## Verification record

Every line below is a command actually run in this worktree, with its real result.

- **PASS — typecheck:** `pnpm exec tsc --noEmit` → exit 0.
- **PASS — unit suite:** `pnpm test` → 23 files / 177 tests passed, exit 0.
- **PASS — governance gate + build:** `./freebuff-verify.sh` → exit 0 (`✅ All verification steps passed`), including the Spec Kit task gate, typecheck, `pnpm run build`, and refresh-docs (19 passed / 0 failed).
- **PASS — build size:** the `./freebuff-verify.sh` build measured `.next` 373,405,270 + `public` 32,011,361 = 405,416,631 bytes / 386.63 MiB; the final standalone `pnpm run build` (exit 0) measured `.next` 438,077,377 + `public` 32,011,361 = **470,088,738 bytes / 448.31 MiB**. Both are below the 495 MB hard maximum.
- **PASS — compiled CSS contains the changes:** `.homepage-community-card h2,.homepage-offer h3,.homepage-offer-title{…font-family:var(--lpc-display)}`; `.official-map-image{…image-rendering:auto;…}`; `.legal-surface{…border-radius:26px…}` emitted into `.next/static/css/*.css`.
- **PASS — rendered computed styles (Playwright + local Chromium):** homepage card heading, section heading, offer heading, and banner heading all resolve to `Cinzel, "Cinzel Fallback", Georgia, serif` at 1440×900 and 390×844; legal pages resolve links to `rgb(255, 226, 154)` with `Cinzel` titles and a 26px/20px framed surface; `/map` reports `image-rendering: auto` with natural 569×464 rendered at 702×572 inside a 704px artwork box; no horizontal overflow (`scrollWidth === clientWidth`) on `/`, `/about`, `/privacy`, `/map`.
- **PASS — contrast (WCAG computation on rendered colours):** legal links `#ffe29a` 15.99:1 on `#02070c` (was `#2563eb` at 3.91:1); meta text 11.04:1 (was `#6b7280` at 4.18:1); title 17.80:1; body copy 15.92:1 on the surface.
- **PASS — copy/links preserved:** served `/privacy` HTML contains no `text-blue-600`/`text-gray-500`, keeps `href="/"` and `https://luckypickcanada.ca`, and retains the original paragraph text verbatim.
- **FAIL (environment, flaky) — full Playwright suite:** `pnpm exec playwright test` → 52 passed, 5 failed (Crystal Ball interactions/daily-limit on `desktop` and `mobile-390` with `element(s) not found`; one gold-CTA hover assertion on `desktop`).
- **PASS (regression control) — same specs re-run with the diff applied:** 12 passed, 0 failed, exit 0.
- **BASELINE (control) — same specs on the stashed (unmodified) tree:** 10 passed, 2 failed — `gold-cta.spec.ts:69` on `desktop` and `gold-cta.spec.ts:138` on `mobile-390`, i.e. a *different* failure set from the run with the diff. Failures are container-level flakiness under parallel load, not a deterministic regression attributable to these files.
- **NOT RUN — axe-core automated scan:** no axe runner is configured for these routes in this container; contrast was measured numerically instead.

## Remainder

- Owner review of the open, unmerged PR; CI Playwright remains the authoritative visual confirmation.
