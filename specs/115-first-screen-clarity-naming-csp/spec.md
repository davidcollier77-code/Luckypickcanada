# Feature Specification: First-screen clarity, approved naming, analytics CSP and mobile tap-target verification

**Feature**: `specs/115-first-screen-clarity-naming-csp`
**Branch**: `freebuff/4c532ef5f3ae120cb7f4e2b5`
**Input**: Master Work Request #1 — the four remaining work areas from the Browserless audit recorded by PR #1773, accounting for the mobile-usability and accessibility work already delivered in PR #1774.
**Source findings**: D1 (the first screen explains nothing), D2 (own CSP blocks the Cloudflare Analytics beacon), D6 (one destination, several names), D3 (phone tap targets — implemented by PR #1774, verified here).

## Overview

Lucky Pick Canada is a fun, welcoming, community-based entertainment site: luck is presented as
hope, optimism, everyday moments and possibility, never as gambling, betting or a lottery service.
The audit found that a new visitor meets four small navigation links and a large emblem, and must
scroll to learn what the site is; that its own Content Security Policy prevents the Cloudflare
Analytics beacon from loading; and that a single destination is called several different things.

This feature adds a first-screen explanation with a free primary action, allows the Cloudflare
Analytics script through `script-src`, and applies the owner-approved names consistently. It does
not change any product behaviour, payment product, price, Stripe price ID, email delivery, asset,
animation, route or navigation destination, and it introduces no gambling or betting identity.

### Baseline (recorded by PR #1773; re-checked in this workspace)

| Finding | Audit measurement |
| --- | --- |
| D1 `/` 1440 × 900 | Only four 14 px header links are visible; the only `H1` is `sr-only` (1 px wide); the first explanatory line starts at y ≈ 843 px. At 390 × 844 the same pattern holds. |
| D2 all routes | `static.cloudflareinsights.com/beacon.min.js` is refused by `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com`. |
| D6 sitewide | `/lucky-meter` is "Lucky Meter" on `/` but "Luck Meter" on `/crystal-ball`; `/map` is "Lucky Stories" in the header and "Lucky Map" in the footer; the paid section is "Lucky Pick" in one place and "Lucky Reveal" in another. |
| D3 390 × 844 | Footer links, homepage header links and map markers below 24 × 24 px. |

## User Scenarios & Testing

### User story 1 — A newcomer understands the offer without scrolling (P1)

On `/` at 1440 × 900 and 390 × 844, before any scrolling, a visitor sees the Lucky Pick Canada name,
one plain sentence explaining that this is a fun, free place to explore what luck means to them, a
line that luck is about more than fortune and fame, and a free primary action into the experiences.
Community stories, the Luck Generator and the Crystal Ball are named as things they can discover.

**Independent test**: load `/`, and assert that the brand line, the explanation, the
"more than fortune and fame" statement and the free CTA are all inside the first viewport, that the
CTA targets an existing free section, and that no new horizontal overflow appears at either size.

### User story 2 — Cloudflare Analytics can load (P1)

The response's `Content-Security-Policy` allows `https://static.cloudflareinsights.com` in
`script-src`, so the hosting provider's beacon is no longer refused, while every other directive and
source keeps its existing value.

**Independent test**: read the rendered `Content-Security-Policy` header from a production server and
assert the exact source in `script-src`, `object-src 'none'`, `base-uri 'self'`,
`frame-ancestors 'self'` and unchanged `connect-src`/`img-src`/`form-action`.

### User story 3 — One name for each experience (P1)

Throughout the site the experiences carry the owner-approved names: **Crystal Ball**,
**Lucky Community Stories**, **Lucky Reveals** (Personal Reveal — CAD $1.00, Gift Reveal — CAD $1.99),
**Luck Generator**, **Tip Jar** (unchanged) and **FAQ** (unchanged). Legacy references — Oracle,
Consult the Crystal Ball, Lucky Stories, Lucky Map, Luck Meter, Lucky Pick as a section name — are
replaced where they name an experience.

**Independent test**: read the rendered homepage, footer, FAQ and map page and assert the approved
names are present and no legacy section name is used; assert every route/link destination, price,
Stripe price ID and checkout type is unchanged.

### User story 4 — Phone targets already delivered stay correct (P2)

The PR #1774 improvements are verified in the rendered page rather than re-implemented: footer
navigation links, homepage header links and map province markers reach at least 24 × 24 CSS px at
390 × 844, and the visible artwork is unchanged. Any remaining sub-24 px control is fixed without
changing its appearance.

**Independent test**: measure border box plus generated hit area for each control at 390 × 844 in an
emulated touch viewport and compare with 24 px; record every value.

## Requirements

- **FR-001**: `/` shows the brand name, a one-sentence explanation of the fun, free, community-based
  purpose, the "more than fortune and fame" statement and a free primary action inside the first
  viewport at 1440 × 900 and 390 × 844.
- **FR-002**: The first-screen addition keeps the existing night-sky/gold identity, the painted hero
  artwork, the navigation, the existing free "Explore your luck" control and all animations.
- **FR-003**: No copy positions the site as gambling, betting, wagering or a lottery service and no
  gambling terminology, casino imagery or affiliation claim is introduced.
- **FR-004**: `script-src` allows exactly `https://static.cloudflareinsights.com` in addition to the
  existing sources; no other directive is weakened or widened and the development-only
  `'unsafe-eval'` behaviour is preserved.
- **FR-005**: Approved names are used for the Crystal Ball, Lucky Community Stories, Lucky Reveals
  (with Personal Reveal — CAD $1.00 and Gift Reveal — CAD $1.99), Luck Generator, Tip Jar and FAQ.
- **FR-006**: Legacy experience names (Oracle, Consult the Crystal Ball, Lucky Stories, Lucky Map,
  Luck Meter, Lucky Pick/Lucky Reveal as the shared section) no longer appear as experience labels.
- **FR-007**: Route paths, navigation destinations, Stripe price IDs, payment products, prices,
  checkout types, email delivery, database access, Turnstile and rate limiting are unchanged.
- **FR-008**: Footer navigation links, homepage header links and map province markers measure at
  least 24 × 24 CSS px of effective hit area at 390 × 844, with their visible artwork unchanged.
- **FR-009**: `/tmp`-free, dependency-free change: no new package, no new route, no new API.

## Success Criteria

- **SC-001**: The measured first-screen evidence at 1440 × 900 and 390 × 844 shows the brand line,
  explanation, "more than fortune and fame" line and free CTA fully inside the viewport, with
  `scrollWidth === clientWidth`.
- **SC-002**: The production `Content-Security-Policy` header contains
  `https://static.cloudflareinsights.com` in `script-src` and is otherwise unchanged.
- **SC-003**: Rendered checks find only approved experience names; source checks find no legacy
  labels; no destination, price or checkout type changed in the diff.
- **SC-004**: All sampled phone controls measure ≥ 24 × 24 px of effective hit area; no remaining
  failure is left unfixed or unreported.
- **SC-005**: `./freebuff-verify.sh` exits 0, the full Vitest suite passes, `tsc --noEmit` exits 0 and
  the production build stays below the 495 MB hard maximum.
- **SC-006**: A regression guard fails if the first-screen explanation, the free CTA, the approved
  names or the Cloudflare analytics source are removed.

## Assumptions and limits

- The audit is the baseline record. Production cannot be modified, so "after" evidence comes from the
  local build and emulated viewports in this workspace.
- The Cloudflare Analytics beacon is injected by the hosting edge, not by this repository, so the CSP
  header is the verifiable local evidence; successful beacon delivery at the edge is not reproducible
  here and is reported as such.
- Colour contrast, `D7` (map story count), `D9` (Terms copy) and the optional `O*` recommendations are
  outside this request and untouched.
- Real hardware is not available; mobile evidence uses an emulated 390 × 844 touch viewport.
