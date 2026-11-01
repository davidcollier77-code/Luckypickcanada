# Feature Specification: Turnstile Early Script Preload

**Feature Branch**: `freebuff/1a7d57e47625ce6441d412f1`

**Created**: 2026-10-22

**Updated**: 2026-11-01 (root-cause re-investigation after the preload was removed)

**Status**: Implemented — pending real-device confirmation of the reported wait

**Input**: The homepage Suggestion Box security check reportedly takes 40–60 seconds to become usable.
Re-open the original PR #1568 preload work, investigate why the eager preload was removed by the
mobile PageSpeed commit `7ab4b305` on 2026-10-27, establish the actual cause, and make the smallest
correction that restores prompt loading without giving back the mobile PageSpeed gains.

## Verified root cause (measured, not assumed)

1. **The API script is only requested when the widget mounts.** In the pinned
   `@marsidev/react-turnstile@1.6.1` loader (`node_modules/.../dist/index.js`) the script tag is
   appended from a `useEffect` on mount:
   `script.src = `${SCRIPT_URL}?onload=${onLoadCallbackName}&render=${render}`` →
   `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit`.
2. **`TurnstileField` is statically imported by the `'use client'` homepage tree**
   (`app/homepage/HomePage.js:20`), so that mount cannot happen until the homepage's client bundle
   has downloaded and React has hydrated. The loader chunk `74-*.js` (10,313 bytes) *is* in the
   initial document, so a missing chunk is not the problem — hydration order is.
3. **The initial homepage document advertised no early hint for that script.** The built
   `.next/server/app/index.html` contained `<link rel="preconnect" href="https://challenges.cloudflare.com">`
   and **zero** matching `preload` hints.
4. **The preload was removed for PageSpeed, not because it failed.** `7ab4b305` deleted
   `preload(TURNSTILE_SCRIPT_URL, { as: 'script' })` from `app/page.js`; its own plan records the
   intent: "Let `@marsidev/react-turnstile` load it asynchronously to free up the critical render
   path." The 40–60 second symptom it was meant to address was therefore left unaddressed.
5. **The fetch is two hops but durably cacheable.** Measured: the configured URL answers `302`
   (`cache-control: max-age=300, public`) to `/turnstile/v0/g/<id>/api.js`, which returns `200`,
   `86,732` bytes, `cache-control: max-age=31536000, public`. An early hint therefore remains useful
   even if hydration is slow — a later `<script>` insert is served from the HTTP cache for a year.

So the delay chain is `hydration → widget mount → script fetch (2 hops) → Cloudflare challenge`.
Only the first and third stages are in this repository's control. **Cloudflare's managed-challenge
execution time is not measurable from this environment and is not claimed.**

## User Scenarios & Testing

### User Story 1 — Start the API fetch from the initial document (Priority: P1)

A visitor opens the homepage. The Turnstile API fetch should begin while the page's own CSS/JS is
still loading, so that by the time they reach the Suggestion Box only the challenge remains.

**Independent Test**: A Playwright test asserts the homepage document head contains exactly one
`preload` for the wrapper's exact URL carrying `fetchpriority="low"`, and that `/about` and `/map`
contain none.

**Acceptance Scenarios**:

1. **Given** a desktop or mobile viewport, **When** the homepage document is parsed, **Then** its
   head contains exactly one script preload whose `href` matches the wrapper's injected URL
   byte-for-byte, with `fetchpriority="low"`.
2. **Given** the widget later mounts, **When** the wrapper injects its script tag, **Then** the
   browser reuses the preloaded/cached response and the loader's own
   `querySelector('script[src=…]')` guard prevents a duplicate element.
3. **Given** a visitor opens an unrelated route, **When** its document is parsed, **Then** no
   Turnstile preload is present.

### Edge Cases

- A preload that executes the script would run before `window.onloadTurnstileCallback` exists; the
  hint must fetch only (React's `preload()` never executes), or the widget never renders.
- The URL must keep the wrapper's `onload` and `render=explicit` parameters; any difference costs a
  second download.
- The hint must not be raised to high priority: it must not displace the LCP image or the route's
  own CSS/JS, which is why the eager version was removed.
- Turnstile failure, timeout, retry, token expiry, and disabled-until-verified submit stay unchanged.

## Requirements

- **FR-001**: The homepage MUST emit one preload hint for the exact Turnstile API URL injected by
  the pinned wrapper.
- **FR-002**: The hint MUST be discoverable in the initial homepage document head.
- **FR-003**: The hint MUST be homepage-scoped and MUST NOT appear on unrelated routes.
- **FR-004**: The hint MUST carry `fetchpriority="low"` so the third-party script stays behind the
  LCP image and the route's own CSS/JS.
- **FR-005**: The hint MUST NOT execute the script, create a token, or otherwise alter the widget.
- **FR-006**: Widget callbacks, site-key lookup, hidden token field, server-side Siteverify,
  hostname/action validation, rate limiting and spam protection MUST be unchanged.
- **FR-007**: A regression test MUST verify URL, count, priority and route scope.

## Success Criteria

- **SC-001**: Exactly one preload hint on `/` whose `href` matches the wrapper URL byte-for-byte and
  whose `fetchpriority` is `low`; zero on `/about` and `/map`.
- **SC-002**: The measured initial-document and initial-JS/CSS payloads are unchanged apart from the
  added hint.
- **SC-003**: No Turnstile verification, public-form, API, environment, deployment, visual-design or
  payment behaviour changes.
- **SC-004**: The report separates the confirmed script-fetch improvement from Cloudflare's
  challenge-processing time, which this repository cannot measure.

## Assumptions and Limits

- `@marsidev/react-turnstile` stays pinned at `1.6.1`; the URL is verified against that build.
- The Suggestion Box lives only on the homepage, so `/` is the correct scope.
- A preload removes the *fetch* from the post-hydration chain. It cannot bound Cloudflare's
  challenge duration, and it cannot fix a slow hydration caused by the page's own JS.
- No browser can be launched in this workspace (Chromium is missing `libnspr4`/`libnss3` and there
  is no root), so the browser-level assertions are written for CI and were not executed here.
