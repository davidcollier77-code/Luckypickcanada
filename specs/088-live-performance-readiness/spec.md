# Feature Specification: Live-Traffic Performance Readiness

**Feature Branch**: `freebuff/c1e1aaa103045da1dc1fde0f`
**Created**: 2026-11-04
**Status**: Draft

## Goal

LuckyPickCanada.ca is about to receive public traffic. A visitor's first page
view must download only the artwork their browser actually displays, so the
homepage is as light and as fast as possible on mobile connections without any
change to what a visitor sees or can do.

## User Scenarios & Testing

### User Story 1 — A mobile visitor gets the hero quickly (Priority: P1)

A visitor opens the homepage on a phone over a metered mobile connection. Before
the hero artwork is visible, the browser downloads the same picture twice, once
in each modern image format. The visitor pays for and waits on roughly twice the
image data they can ever see.

**Why this priority**: The hero artwork is the largest element of the first
screen and the largest contentful paint. Its duplicate download is the single
largest avoidable cost on the site's busiest page.

**Independent Test**: Load the homepage in a mobile-emulated browser with a cold
cache, and confirm the browser requests exactly one variant of the hero artwork
and displays the intended picture with no visual change.

**Acceptance Scenarios**:

1. **Given** a browser that supports every format the site offers, **When** the
   homepage loads, **Then** exactly one hero artwork variant is transferred.
2. **Given** the same load, **When** the hero paints, **Then** the artwork,
   framing, dimensions, overlay button, and layout are identical to before.
3. **Given** a browser that cannot display the preferred modern format, **When**
   the homepage loads, **Then** the fallback artwork is still delivered and
   displayed.

### User Story 2 — Fast first paint is preserved for every visitor (Priority: P2)

A visitor on a desktop or a fast connection still sees the hero artwork early.
The optimization must not move the picture behind stylesheets, scripts, or
below-the-fold requests.

**Independent Test**: Compare first-contentful paint, largest-contentful paint,
and layout shift against the pre-change baseline on the same harness.

**Acceptance Scenarios**:

1. **Given** the optimized homepage, **When** it is measured on the same
   desktop and mobile profiles as the baseline, **Then** largest-contentful
   paint is not slower and layout shift stays at zero.

### User Story 3 — No other behaviour changes (Priority: P3)

Everything else on the site keeps behaving exactly as it does today: other
routes, checkout, reveal, gift email, the Lucky Map, audio, navigation, and
copy.

**Independent Test**: Run the repository's existing automated suites and
compare routes and interactions against the baseline.

**Acceptance Scenarios**:

1. **Given** the optimized site, **When** the existing test suites run,
   **Then** they pass unchanged.
2. **Given** any other route, **When** it loads, **Then** its assets, requests,
   and behaviour are unchanged.

## Functional Requirements

- **FR-001**: The homepage MUST transfer only the hero artwork variant that the
  visitor's browser displays, once per page view.
- **FR-002**: The site MUST keep preferring the AVIF artwork for browsers that
  support it, and MUST keep delivering the WebP artwork as the fallback for
  browsers that do not.
- **FR-003**: The hero artwork, its framing, dimensions, overlay controls, and
  the surrounding layout MUST NOT change.
- **FR-004**: The hero artwork MUST still be discoverable early in the document
  with high fetch priority for the format the visitor's browser uses.
- **FR-005**: No other route, asset, interaction, payment, email, database, or
  audio behaviour may change.

## Success Criteria

- **SC-001**: On the mobile measurement profile, the hero artwork's transferred
  bytes fall from two files (~492 KiB) to one (~199 KiB), a reduction of about
  293 KiB per homepage view.

- **SC-002**: Total homepage transfer on the mobile profile falls by at least
  13% versus the recorded baseline.
- **SC-003**: Largest-contentful paint is not slower than the baseline on the
  desktop and mobile profiles, and cumulative layout shift remains 0.
- **SC-004**: Screenshots of the first screen at 1440x900 and 390x844 are
  visually unchanged.
- **SC-005**: The in-repository verification script and the existing automated
  suites pass, and the production build stays below the 495 MB limit.

## Assumptions

- Modern browsers support AVIF. Browsers that do not still receive the WebP
  fallback through the existing picture markup, just without an early resource
  hint for it.
- The measured baseline from the local production build is an acceptable proxy
  for the live site, because the markup and assets are the same.

## Key Entities

Not applicable — this feature changes delivery of existing static assets only;
no data, state, or interfaces change.
