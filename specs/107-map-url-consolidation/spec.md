# Feature Specification: Consolidate duplicate map URLs onto `/map`

**Feature**: `specs/107-map-url-consolidation`
**Branch**: `feat/map-url-consolidation-20261107`
**Input**: "Implement F-H1: consolidate the duplicate map URLs onto /map with permanent redirects"
**Source finding**: F-H1 in `specs/106-seo-audit` (sitewide SEO audit, 2026-11-07)

## Overview

The site answers three URLs with the same map page: `/map`, `/lucky-map-of-canada` and
`/where-luck-has-been-found-in-canada`. All three returned HTTP 200 with the same body and the
same H1/H2/H3 sets. `/map` publishes `Lucky Map | LuckyPickCanada.ca`, while both aliases publish
the root layout (homepage) title. The aliases also publish `og:url` values that contradict the
`/map` canonical, appear in no sitemap, and receive no internal links.

This feature consolidates both legacy URLs onto `/map` with permanent redirects so one URL per
page remains reachable. It changes routing configuration only: no page content, visual, wording,
navigation, metadata or data-fetching behavior changes.

## User Scenarios & Testing

### User story 1 — Crawler reaches a legacy URL (P1)

A search engine or external link requests `/lucky-map-of-canada` or
`/where-luck-has-been-found-in-canada`. The response is a permanent redirect to `/map` instead of
a duplicate 200 document.

**Independent test**: request both paths from a locally running build and observe a permanent
redirect whose `Location` is `/map`.

### User story 2 — Visitor arrives through an old link with a query string (P2)

An old shared link or campaign URL such as `/lucky-map-of-canada?utm_source=newsletter` reaches the
site. The visitor lands on `/map` with the query string preserved, so existing measurement and
referral parameters keep working.

**Independent test**: request an alias with a query string and confirm the redirect preserves it.

### User story 3 — Maintainer adds or edits map content (P3)

A maintainer editing the map has exactly one reachable URL for that page, so metadata, canonicals
and internal links cannot drift between three copies.

**Independent test**: the redirects and sitemap assert a single canonical map URL.

## Requirements

- **FR-001**: Requests for `/lucky-map-of-canada` return a permanent redirect to `/map`.
- **FR-002**: Requests for `/where-luck-has-been-found-in-canada` return a permanent redirect to `/map`.
- **FR-003**: The redirect target is exactly `/map` (no trailing slash, no query string baked in).
- **FR-004**: Query strings and campaign parameters on either legacy URL survive the redirect.
- **FR-005**: Neither legacy URL returns a 200 HTML document any more.
- **FR-006**: The existing `/stories` → `/map` redirect and the `www` → apex host redirect keep
  working exactly as before.
- **FR-007**: `/map` itself is unchanged — same title, description, canonical, `og:url`, JSON-LD,
  content, visuals and data fetching.
- **FR-008**: The sitemap still lists `/map` and never lists either legacy alias.
- **FR-009**: No other route, API handler, payment, authentication, database or deployment
  configuration changes.

## Success Criteria

- **SC-001**: A request to either legacy path returns a 3xx permanent redirect with `Location: /map`
  (verified by executing the built application locally).
- **SC-002**: A request to a legacy path with `?utm_source=audit-check` keeps that parameter on the
  redirect target (verified by execution).
- **SC-003**: A regression test fails if either redirect is removed, retargeted or made temporary,
  or if an alias appears in the sitemap.
- **SC-004**: `./freebuff-verify.sh` exits 0 on the committed diff.
- **SC-005**: The production build stays below the 495 MB ceiling, with the measured size reported.

## Assumptions and limits

- Search Console is unavailable in this environment, so whether the aliases are currently indexed
  cannot be confirmed; the redirect is correct regardless of their index state.
- The alias route modules stay in the codebase. The redirect is the authoritative fix; deleting the
  modules is a separate cleanup with no additional SEO effect, because the paths never reach them.
- Redirects are served by Next.js before route resolution, which is how the existing `/stories`
  redirect already behaves on this deployment.
- Traffic to the aliases is unknown (no Analytics access). A permanent redirect preserves any
  inbound link equity, so no traffic measurement is required to proceed.
