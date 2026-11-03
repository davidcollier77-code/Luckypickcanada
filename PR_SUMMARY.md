# Paid Lucky Reveal counter and reveal-popup map CTA removal

## Task and task groups

**Task groups: `creation` + `polishing` + `testing`.**

- `creation` — the task adds a customer-facing feature (a persisted public counter and its read surface)
  on top of the existing reveal products.
- `polishing` — the counter is a new homepage visual that must feel like the existing premium neon-gold
  design language, stay responsive and respect reduced motion.
- `testing` — the counting rule is money-facing and must be proven by executed unit tests and browser
  checks, not by source inspection alone.

**Assigned task:** remove the "Add me to the Little Luck Map" button from the Lucky Reveal popup; replace
the reserved empty homepage slot below the Lucky Reveal card and above the Tip Jar with a premium
neon-gold counter reading "LUCKY REVEALS CREATED TO DATE", starting at zero; increase it once per
successfully completed paid Personal Reveal (CAD $1.00) or Gift Reveal (CAD $1.99) purchase with duplicate
counting prevented; preserve payment, gift-email, reveal and map functionality.

## Reference documents reviewed

| Document | USED | USEFUL | Explanation |
|---|---|---|---|
| `.docs/manifest.json` | YES | YES | Routed the `creation`, `polishing` and `testing` groups. Used as an index only. |
| `.docs/creation/_google_eng-practices.md` | NO | NO | The change reuses existing repository patterns; no review-practice guidance was needed. |
| `.docs/polishing/_google_eng-practices.md` | NO | NO | Styling follows the repository's own theme CSS; not consulted. |
| `.docs/testing/_google_eng-practices.md` | NO | NO | Tests reuse the repository's Vitest and Playwright conventions; not consulted. |
| Next.js `/vercel/next.js` snapshot | NO | NO | No new framework API was introduced; the route handler and client component follow existing files. |
| Tailwind `/websites/tailwindcss` snapshot | NO | NO | The counter uses the existing theme stylesheet rather than new utility classes. |
| Playwright `/microsoft/playwright` snapshot | NO | NO | The existing `playwright.config.ts` projects and spec patterns were reused unchanged. |
| Vitest `/vitest-dev/vitest` snapshot | NO | NO | The existing suite and mock patterns were reused. |
| MDN image types `/websites/mdn_image_types` | NO | NO | No raster asset was added, converted or served, so the image-format rule does not apply. |

## What was implemented

- **New tally store** — `lucky_reveal_tally(session_id UNIQUE, reveal_type, created_at)` is created by the
  existing `initializeDatabase()`. One row per paid reveal, `reveal_type` constrained to `lucky_pick` /
  `gift_package`, so the total is the row count and a fresh table is the requested zero, with no historical
  backfill.
- **New `app/lucky-reveal-tally.js`** — `recordLuckyRevealCreated()` performs one atomic
  `INSERT … ON CONFLICT (session_id) DO NOTHING RETURNING id`, so a repeated webhook, a reload or a retried
  verification cannot double count; `getLuckyRevealCount()` returns the count and clamps missing,
  malformed, negative or failed reads to 0. Neither function throws to its caller.
- **Recording points** — `/api/verify-session` records a server-verified paid reveal session;
  `/api/gift-delivery` records a paid gift session before the existing delivery/redirect work;
  `/api/stripe-webhook` records a paid `checkout.session.completed` for either reveal product before the
  existing gift-email branch, which is the only signal that also sees a purchase completed in a closed
  tab. Tips, free previews, unpaid or cancelled sessions never reach a recording call.
- **Read surface** — new `GET /api/lucky-reveals-count` returns `{ total }` with
  `Cache-Control: no-store, max-age=0`; it never writes.
- **Homepage counter** — new `app/homepage/LuckyRevealsCounter.js` starts at 0, shows the exact label
  "LUCKY REVEALS CREATED TO DATE" and reads the real total once. It replaces the reserved zero-height
  `#lucky-map` slot in `app/homepage/HomePage.js`, directly between the reveal section and the Tip Jar.
- **Premium neon-gold styling** — `themes/default/homepage.css` replaces `.homepage-map-slot` with a
  gold-bordered, layered-glow plaque, a gold-gradient number and a slow sheen, with a
  `prefers-reduced-motion` guard. No new dependency, font or image.
- **Popup removal** — `app/lucky-reveal-popup.js` no longer renders the "Add me to the Little Luck Map"
  button, its unused `playButtonClick` import or its `.lucky-map-button-enhanced` styles. Reveal content,
  numbers, colour/day cards, sharing, close/Escape, sound, celebration and layout are unchanged.

### Files changed

New:

- `app/lucky-reveal-tally.js`
- `app/api/lucky-reveals-count/route.js`
- `app/homepage/LuckyRevealsCounter.js`
- `__tests__/lucky-reveal-counter.test.js`
- `artifacts/lucky-reveal-counter-probe.cjs` (reusable browser probe; generated output not committed)
- `specs/084-lucky-reveal-counter/{spec,plan,tasks,data-model}.md`,
  `specs/084-lucky-reveal-counter/checklists/requirements.md`,
  `specs/084-lucky-reveal-counter/contracts/lucky-reveals-count.md`

Modified:

- `app/lib/db-init.js`, `app/api/verify-session/route.ts`, `app/api/gift-delivery/route.js`,
  `app/api/stripe-webhook/route.js`
- `app/homepage/HomePage.js`, `app/lucky-reveal-popup.js`, `themes/default/homepage.css`
- `__tests__/lucky-reveal-background.test.js`, `__tests__/lucky-reveal-polish.test.js`,
  `__tests__/security-payment.test.js`, `__tests__/lucky-reveal-persistence.test.js`
- `tests/visual/lucky-reveal-selection.spec.ts`
- `.specify/feature.json`, `PR_SUMMARY.md`, `memory-bank/activeContext.md`

No file under `.docs/` was changed. No dependency or lockfile change. No environment, secret, payment
price, API request/response shape or map file changed.

## Spec Kit stages

| Stage | Result | Artifact |
|---|---|---|
| Specify | Done | `specs/084-lucky-reveal-counter/spec.md` + `checklists/requirements.md` |
| Plan | Done | `specs/084-lucky-reveal-counter/plan.md`, `data-model.md`, `contracts/lucky-reveals-count.md` |
| Tasks | Done | `specs/084-lucky-reveal-counter/tasks.md` (T001…T019) |
| Implement | Done | T001…T019 completed and marked `[x]` |

A new feature directory was correct here: feature 073 reserved an empty homepage map slot for a different,
future purpose, and no existing artifact covers a paid-reveal counter. Nothing was duplicated.

## Verification

| Check | Result |
|---|---|
| Focused Vitest (`lucky-reveal-counter`, `lucky-reveal-background`, `lucky-reveal-polish`, `security-payment`, `lucky-reveal-persistence`, `stripe-product-alignment`) | **PASS** 6 files / 82 tests |
| Full `pnpm exec vitest run` | **PASS** 37 files / 399 tests |
| `pnpm exec tsc --noEmit` | **PASS** exit 0 |
| `./freebuff-verify.sh` (Spec Kit gate, typecheck, production build, refresh-docs 19/19) | **PASS** exit 0 |
| Production build size (`pnpm build`) | **PASS** `.next` 301,229,223 B + `public` 32,840,043 B = 334,069,266 B / 318.6 MiB, below the 495 MB maximum |
| Playwright `tests/visual/lucky-reveal-selection.spec.ts` on desktop 1440x900, mobile 390x844 and mobile 412x915 | **PASS** 24/24 in Chromium 153.0.8010.12, including counter placement/formatting and the paid reveal popup with no map invitation, sharing and close still present |
| Counter visual probe (production build) | **PASS** 2/2: label + "4,321", 620x197 px desktop and 368x125 px mobile, 0 px horizontal overflow, 0 console/page errors |
| Live `GET /api/lucky-reveals-count` (production build, no database configured) | **PASS** `{"total":0}`, `cache-control: no-store, max-age=0`, `application/json` |
| Live Postgres tally behaviour (insert/conflict/count against Neon) | **NOT RUN** — no database credentials in this workspace |
| Live Stripe checkout and a real gift email | **NOT RUN** — no Stripe/Resend keys; no charge or email was made |
| PR-head CI checks | **PENDING** |

The Spec Kit gate was run with `SPEC_KIT_BASE_REF=bffde716686d0649545d2518a6f3a50e60c6d027` because this
workspace's `origin/main` is stale at `a2c1222a`, while the branch starts at `bffde716` (PR #1700 merge).
CI resolves the base normally.

## Remaining issues / limitations

- The tally SQL was not executed against a real Neon database here; it is covered by an executed
  module-level test with a database double, and by `CREATE TABLE IF NOT EXISTS` in the existing
  initializer. First deployment should confirm the table is created and one paid test purchase increments
  once.
- A purchase paid while the database is unreachable is not retried into the tally, by design: counting is
  best-effort so a payment, gift delivery or webhook never fails because of it. Its total would stay low
  by that purchase rather than break the flow.
- Historical purchases are deliberately not backfilled; the counter starts at zero as requested.
- No live payment was taken and no real gift email was sent. Stripe metadata, prices, callbacks, gift
  delivery safeguards and the map routes are unchanged and remain covered by the existing suites.
- CI on the pushed head is pending; local Node is 26.13.0 against the repository's 22.x pin.

## Final diff audit

The complete diff was read against task base `bffde716`. It contains only the tally module, endpoint,
counter component and probe, the three additive recording points, the popup removal, the counter styling,
the Spec Kit/PR/Memory Bank records, and the updated guards and visual spec. Build-generated
`next-env.d.ts` churn was reverted, generated probe screenshots were removed, a stale map-slot CSS comment
was removed, and no `.docs/`, dependency, lockfile, environment, secret, price, email, map or unrelated
file changed. A final `git status`/diff check after those corrections found no leftover generated file or
unrelated edit.

**USEFUL RESULT: YES** — the requested outcome is implemented and verified to the extent this workspace
allows, with the live-database and live-payment checks stated explicitly as not run.
