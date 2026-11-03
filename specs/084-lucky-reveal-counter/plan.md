# Implementation Plan: Paid Lucky Reveal Counter and Reveal Popup Map CTA Removal

**Feature**: `specs/084-lucky-reveal-counter`
**Branch**: `freebuff/7b6750b84aced857e5b48588`

## Technical context

- Next.js App Router (16.4.3) with route handlers, deployed through OpenNext on Cloudflare.
- Persistence: Neon Postgres through `@neondatabase/serverless` (`app/lib/db-init.js`), already used
  for `lucky_reveals`. No new dependency.
- Read path: a public `GET /api/lucky-reveals-count` handler and a small client component on the
  homepage.
- Write path: the existing server-side payment verification (`/api/verify-session`, `/api/gift-delivery`)
  and the Stripe `checkout.session.completed` webhook. All three are idempotent through a database unique
  constraint, so the counter cannot depend on which path sees the purchase first.
- Visual treatment: CSS in `themes/default/homepage.css`, matching the homepage's gold design language,
  with a `prefers-reduced-motion` guard. No new package, font or image.

## Design

1. **New tally table** — `lucky_reveal_tally(id, session_id UNIQUE, reveal_type, created_at)` created by
   the existing `initializeDatabase()`. One row per counted purchase; the session id is the idempotency
   key, so the total is `COUNT(*)` and starts at zero on a fresh table (no historical backfill, as the
   request specifies). `reveal_type` is constrained to the two paid reveal products.
2. **`app/lucky-reveal-tally.js`** — `recordLuckyRevealCreated({ sessionId, revealType })` inserts
   `ON CONFLICT (session_id) DO NOTHING RETURNING id` and reports `counted` from whether a row was
   inserted; `getLuckyRevealCount()` returns the row count, clamping missing/negative/malformed data and
   any database error to 0. Both accept only `lucky_pick` and `gift_package`. The module never throws to
   its callers and logs failures, so counting can never fail a purchase.
3. **Increment points** — the completion signal is the provider's paid status, never the browser alone:
   - `/api/verify-session`: after the session is confirmed `paid` and its `checkoutType` is one of the two
     products, record the tally; this covers the Personal Reveal success page and its retries.
   - `/api/gift-delivery`: after a paid `gift_package` session is confirmed, record the tally before the
     existing delivery/redirect work continues; this covers the Gift Reveal success redirect.
   - `/api/stripe-webhook`: on `checkout.session.completed`, count only paid sessions of the two reveal
     products before the gift-delivery branch. This is the only path that sees a purchase completed in a
     tab the customer closed. The existing gift email branch and response shape stay intact, and a tally
     failure cannot change the webhook response.
   - Tips, free previews and unconfigured/failed paths never reach a recording call.
4. **Read endpoint** — `GET /api/lucky-reveals-count` returns `{ total }` with `no-store`, so a stale
   cached total cannot survive a purchase.
5. **Counter component** — `app/homepage/LuckyRevealsCounter.js` renders the exact label
   "LUCKY REVEALS CREATED TO DATE" and starts at 0, then reads the endpoint once on mount. It replaces
   the reserved zero-height `#lucky-map` slot in `app/homepage/HomePage.js`, so the counter sits directly
   below the Lucky Reveal section and above the Tip Jar.
6. **Reveal popup** — remove the "Add me to the Little Luck Map" button, its `playButtonClick` usage and
   its `.lucky-map-button-enhanced` styles from `app/lucky-reveal-popup.js`. Reveal content, sharing,
   close/Escape, sound, celebration and layout are untouched.

## Alternatives rejected

- Counting in the browser after payment: a refresh, a scripted request or a shared URL could inflate the
  public number; the server verifies the paid session instead.
- Redis `INCR` with a separate dedupe key: two keys cannot be updated atomically, so a crash between them
  could double count or lose a count. A single unique row is atomic in the existing Postgres store.
- Counting existing `lucky_reveals` rows: the Personal path would inherit historical purchases and the
  Gift path has no row there, so the counter could not start at zero and would under-count gifts.
- Backfilling historical purchases: contradicts the requested starting value of zero.
- Reusing feature 073's map-slot section: that feature reserved an empty slot for a future map; this task
  replaces the slot for a different, new purpose, so a new Spec Kit cycle is correct and no feature
  directory is duplicated.

## Risks

- The webhook is only a completion signal when `STRIPE_WEBHOOK_SECRET` is configured. The verification
  and gift-delivery paths are the documented fallback, and duplicates between them are impossible by
  constraint.
- A purchase paid while the database is unreachable is not counted later; the tally is best-effort by
  design so the purchase path is never blocked. Recorded as a limitation.
- `COUNT(*)` is sufficient at this scale; the table is append-only and one row per purchase.

## Verification

`pnpm exec vitest run` (new counter suite plus the updated reveal, payment and map-slot guards),
`pnpm exec tsc --noEmit`, `./freebuff-verify.sh` (Spec Kit gate, typecheck, production build, refresh-docs
tests), production build-size measurement against the 495 MB maximum, and a final diff audit.
