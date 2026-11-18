# Feature Specification: Render-Time Milky Way Sky Delivery

**Feature Branch**: `perf/sky-delivery`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: Owner request, performance improvement 1 of 5: reduce the 143,077-byte Milky Way sky image's impact on
first paint. The audit found the CSS `image-set()` background fetched it before hydration, so the existing
hydration-time adaptive plan could not influence the request.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The sky costs less to paint on first visit (Priority: P1)

A visitor opens the homepage, Crystal Ball or Lucky Map. The Milky Way artwork is the same photograph, in the
same position and with the same overlays, but the browser downloads a smaller file than it did before and the
artwork never competes with the hero for the largest contentful paint.

**Why this priority**: The sky is decorative atmosphere. Its bytes must not delay the content that carries LCP.

**Independent Test**: Load each sky route with a cold cache, record the backdrop response's encoded size and its
request priority, and compare the bytes with the audit baseline (mobile 142,777 body bytes / 143,077 including
headers; desktop 427,992 WebP).

**Acceptance Scenarios**:

1. **Given** a cold mobile load, **When** the backdrop paints, **Then** the browser selects the mobile artwork
   and downloads the recompressed AVIF, not the CSS background candidate.
2. **Given** a cold desktop load, **When** the backdrop paints, **Then** the desktop AVIF is selected and is
   smaller than the 427,992-byte WebP the CSS previously fetched.
3. **Given** either viewport, **When** the artwork is placed, **Then** the focal position, gradient, glow, base
   colour, filter and composition are identical to the approved design.

---

### User Story 2 - Artwork and fallbacks are unchanged (Priority: P1)

The same Milky Way photograph remains, in AVIF, WebP and JPEG order, with the intrinsic 1200x800 and 1920x1280
dimensions. Browsers without AVIF or WebP still receive the JPEG.

**Why this priority**: The change is a delivery change, not an artwork change.

**Independent Test**: Compare asset dimensions before and after, confirm all three formats exist for both
breakpoints, and confirm the markup order.

**Acceptance Scenarios**:

1. **Given** any supported browser, **When** it resolves the `<picture>`, **Then** it receives AVIF, WebP or JPEG
   in that order.
2. **Given** the changed assets, **When** their metadata is read, **Then** the pixel dimensions are unchanged.

---

### Edge Cases

- A viewport crossing 820 px switches from the mobile artwork to the desktop artwork exactly as the previous
  media query did.
- A browser without `object-fit` support still receives a full-size `<img>`; the page's base colour keeps the
  panel dark.
- The layer must not intercept pointer events or appear in the accessibility tree.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The shared backdrop MUST be delivered by markup rather than a CSS `image-set()` background.
- **FR-002**: The artwork MUST remain the existing Milky Way photograph at its existing dimensions.
- **FR-003**: Mobile and desktop artwork selection MUST remain tied to the existing 820 px breakpoint.
- **FR-004**: AVIF MUST stay first, WebP second and JPEG last for both breakpoints.
- **FR-005**: The focal position (`center 45%`, `center 42%` on mobile), gradient overlay, glow overlay, base
  colour, filter and transform MUST be preserved.
- **FR-006**: The backdrop MUST load eagerly but at low fetch priority, so it cannot displace the hero LCP.
- **FR-007**: The recompressed AVIFs MUST be smaller than the bytes the audit recorded while keeping fidelity
  comparable to the previously accepted encodings.
- **FR-008**: The layer MUST remain decorative: `aria-hidden`, empty `alt`, no pointer events.
- **FR-009**: No dependency, build step, hosting, caching or configuration change may be introduced.

### Key Entities

- **SkyBackdrop**: the server-rendered layer used by the homepage, Crystal Ball, Crystal Ball preview and Lucky
  Map routes.
- **Artwork variants**: mobile (1200x800) and desktop (1920x1280), each in AVIF, WebP and JPEG.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Mobile backdrop body bytes fall below the 142,777-byte audit baseline.
- **SC-002**: Desktop backdrop body bytes fall below the 427,992-byte WebP the CSS used to fetch.
- **SC-003**: Both artwork variants keep their exact pixel dimensions and format order.
- **SC-004**: The focused source/asset guard, the affected unit suites, the type check and the production build
  pass; the build stays below 495 MiB.
- **SC-005**: Homepage, Crystal Ball and Lucky Map render the same visual composition in browser QA.

## Assumptions

- `fetchPriority="low"` is the correct scheduling signal for decorative, above-the-fold atmosphere; the hero
  keeps its existing high-priority preload.
- The previously accepted PSNR against the JPEG master (38.1 dB AVIF, 36.9 dB WebP) is the quality reference;
  the re-encoded AVIF stays within roughly 3 dB of it.
- The reveal overlay reuses `/assets/crystal-ball-bg-desktop.avif`, so the smaller file also reaches that
  experience without any code change.
