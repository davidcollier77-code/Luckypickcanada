# Feature Specification: Responsive Performance Foundation

**Feature Branch**: `175-responsive-performance-foundation`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: Owner mission: "Improve Luckypickcanada's mobile and desktop performance, targeting PageSpeed Insights scores of 90+ on both, with mobile as the first priority. Establish an efficient, responsive asset-loading and rendering foundation that prepares for future GPU-accelerated assets without implementing a GPU or visual redesign."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A phone visitor reaches a readable, complete homepage quickly (Priority: P1)

A visitor on a mid-tier phone and a slow mobile connection opens `https://luckypickcanada.ca/`. The first screen must paint without first paying for third-party or below-the-fold payloads that the visitor has not asked for, and the page must not block the main thread on work that belongs to a later interaction.

**Why this priority**: Mobile is the priority in the mission and the only platform currently scoring far below the target (58/100 measured on the live site). Mobile PageSpeed applies a 4x CPU slowdown and a slow-4G profile, which exposes main-thread and off-screen-network waste that a desktop run hides.

**Independent Test**: Run a Lighthouse (PageSpeed-equivalent) mobile audit against a production build and confirm the initial transfer, total blocking time and LCP do not regress, and that no below-the-fold third-party challenge payload is requested before the visitor approaches it.

**Acceptance Scenarios**:

1. **Given** the homepage is opened on mobile, **When** the document reaches `load`, **Then** no `challenges.cloudflare.com` challenge request has been made and no Tag Manager/Turnstile preload hint is emitted.
2. **Given** the visitor scrolls to the Suggestion Box, **When** the field approaches the viewport, **Then** the Turnstile widget mounts, verifies, and enables the submit control.
3. **Given** the homepage is opened on mobile, **When** the visitor has not hovered or focused a navigation link, **Then** no route prefetch request is made for the four first-viewport destinations.
4. **Given** the visitor hovers or focuses a navigation link, **When** intent is registered, **Then** the destination is prefetched and navigation behaves exactly as before.

---

### User Story 2 - A desktop visitor keeps the existing experience and score (Priority: P2)

A desktop visitor keeps the full hero artwork, animations and interactions, and the desktop PageSpeed score does not fall.

**Why this priority**: Desktop already meets the target (95 measured). Any mobile-first change must not trade desktop quality or performance for mobile gains.

**Independent Test**: Run a Lighthouse desktop audit before and after and confirm the score and visual composition are unchanged.

**Acceptance Scenarios**:

1. **Given** the desktop homepage, **When** it loads, **Then** the hero artwork, gold shimmer, star canvas, cards and CTAs render exactly as before at 1440x900.
2. **Given** a desktop audit, **When** the score is compared with the pre-change baseline, **Then** it is equal or higher.

---

### User Story 3 - Asset delivery stays correct for every device (Priority: P3)

Images and fonts are selected by the browser from the device's own viewport, resolution and format support, with no user-agent sniffing and no second mobile site.

**Why this priority**: The mission asks for a responsive foundation that a future GPU-accelerated layer can build on. It must not depend on server-side device guessing.

**Independent Test**: Load the homepage at 390 px, 768 px and 1440 px, confirm the browser picks AVIF/WebP from `srcset`/`<picture>`/`image-set()`, that no horizontal overflow appears, and that resizing does not reload a mismatched asset.

**Acceptance Scenarios**:

1. **Given** any viewport and orientation, **When** the page renders, **Then** the same single application serves it (no separate mobile site) and the layout does not overflow horizontally.
2. **Given** an AVIF-capable browser, **When** the hero renders, **Then** the AVIF candidate is used, and a WebP fallback remains for browsers without AVIF.
3. **Given** fonts that are not used above the fold on a route, **When** that route loads, **Then** those font files are not preloaded on its critical path.

### Edge Cases

- What happens when `IntersectionObserver` is unavailable? The Turnstile field mounts immediately, exactly as before.
- What happens when the visitor submits the suggestion form before the widget mounts? The submit control stays disabled and the existing `submit` guard still refuses an unverified post; server-side token validation is unchanged.
- What happens when a visitor lands directly on a deep link and then scrolls back to the hero? Intent prefetching still fires on hover/focus/touch; navigation is unaffected.
- What happens if a font is genuinely needed but no longer preloaded? The emitted `@font-face` still loads it on demand with the existing `display: swap`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The homepage MUST NOT request or preload the Turnstile challenge runtime before the Suggestion Box approaches the viewport.
- **FR-002**: The Suggestion Box MUST still render, verify and enable submission once the visitor reaches it; token validation, the disabled-until-verified control and the server-side check MUST be unchanged.
- **FR-003**: The four first-viewport navigation links MUST NOT prefetch their routes during the initial load; they MUST prefetch on hover, focus, pointer-down or touch.
- **FR-004**: Fonts that are not used above the fold on a route (Inter as a fallback face, Playfair Display as an About/Reveal-only face) MUST NOT be preloaded on that route's critical path.
- **FR-005**: Decorative, below-the-fold imagery MUST be lazy so it does not compete with the first-viewport artwork.
- **FR-006**: Asset selection MUST remain browser-driven through `srcset`, `sizes`, `<picture>` and CSS `image-set()`; no user-agent detection may be introduced.
- **FR-007**: All existing artwork, layout, colours, Milky Way backdrop, animations, sounds, reveal sequences, timings, countdowns and interactions MUST be preserved.
- **FR-008**: Cloudflare configuration, DNS, cache rules and hosting MUST NOT be changed.
- **FR-009**: The production build MUST remain strictly below 495 MiB.

### Key Entities

- **Critical-path request**: any request a visitor's first screen depends on. The feature reduces this set rather than altering the application's behaviour.
- **Deferred capability**: a third-party or below-the-fold asset whose load is triggered by viewport proximity or explicit user intent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Initial mobile transfer on a production build drops materially from the 961 KiB baseline (measured: 777 KiB, −19%).
- **SC-002**: Mobile total blocking time drops from the 469 ms local baseline (measured: 310–400 ms across runs, −15% to −34%).
- **SC-003**: Live-site initial transfer drops from the 2,912 KiB baseline by removing the ~1,975 KiB third-party challenge payload from first load. Verified locally by proving zero challenge requests before interaction; the live number requires a deployment.
- **SC-004**: Desktop performance does not regress (local baseline 97; measured 98).
- **SC-005**: Zero console errors and zero horizontal overflow at 390 px and 1440 px.
- **SC-006**: The mobile and desktop PageSpeed targets (90+) are met or the remaining gap is quantified with evidence. **Measured outcome: desktop 98 (met); mobile 72–75 locally and 58 on the live site before the change, driven by a ~3.8 s LCP render delay.** The gap is reported as remaining work, not claimed as met.

## Assumptions

- Lighthouse 12.8.2 in mobile and desktop emulation is an acceptable stand-in for PageSpeed Insights lab data; the PageSpeed Insights API returned HTTP 429 (shared anonymous daily quota) for this environment, so it could not be used directly.
- The audit environment has no hardware GPU, so every number here is software-rendered. Absolute values are not comparable with a physical-GPU desktop.
- Deployment is out of scope: Cloudflare is off-limits, so live "after" numbers cannot be produced in this task.
- Existing visual baselines remain the authority for artwork and layout.
