# Feature Specification: Homepage Mobile LCP Delivery

**Feature Branch**: `freebuff/11aafabede64e67ce700edda`

**Created**: 2026-11-17

**Status**: Implementation complete; verification recorded in `evidence.md`

**Input**: Owner mission to move the Luckypickcanada homepage toward a repeatable mobile PageSpeed Insights score of 90+ without compromising its appearance, functionality or desktop performance, building on merged PR #1933 and leaving the Milky Way artwork and living night sky untouched.

## Baselines Reviewed Before Any Change

Recorded in full in `evidence.md`; summarised here because the specification was written after the baselines were reviewed.

- **PSI mobile (live `https://luckypickcanada.ca`)**: 76 performance / 96 accessibility / 100 best practices / 100 SEO. FCP 1.2 s, LCP 4.1 s, TBT 350 ms, CLS 0, SI 4.8 s. Report `https://pagespeed.web.dev/analysis/https-luckypickcanada-ca/dkb5k82qb5?form_factor=mobile`, captured 2026-11-17 09:23.
- **PSI desktop (live)**: 98 performance. FCP 0.3 s, LCP 1.1 s, TBT 50 ms, CLS 0, SI 0.8 s. Report `https://pagespeed.web.dev/analysis/https-luckypickcanada-ca/4iltgxrud6?form_factor=desktop`.
- **Field data**: "No Data" on both tabs. CrUX has no field data for this origin, so every number here is lab data.
- **Local production build** (Lighthouse 13.6.0, the PSI mobile profile: 412×823, DPR 1.75, slow 4G, 4× CPU): 61 / 68 / 69, median **68**; LCP 4.1–4.3 s; TBT 500–800 ms; transfer 724 KiB.

## User Scenarios & Testing

### User Story 1 — A phone downloads the artwork it actually needs (Priority: P1)

As a visitor on a mid-range phone, I need the homepage's largest image to be sized for my screen so the page becomes readable quickly instead of spending seconds downloading pixels my screen cannot show.

**Why this priority**: The mobile LCP element is the hero artwork, and Lighthouse attributes 3.28 s of the 4.1 s LCP to loading that one file. It is the largest single bandwidth consumer on the page.

**Independent Test**: Load the homepage at the PSI mobile profile and read the hero image's `currentSrc`. It must be a candidate at least as wide as the device-pixel width the browser needs, and it must be smaller than the 1024 w file when a closer candidate exists.

**Acceptance Scenarios**:

1. **Given** a 412 px-wide viewport at DPR 1.75 (721 device pixels needed), **When** the homepage renders, **Then** the browser fetches a candidate of at least 721 px width and less than the 1024 px file.
2. **Given** a 390 px viewport at DPR 2.75 (1 073 device pixels needed), **When** the homepage renders, **Then** the browser still fetches the 1024 w file exactly as before.
3. **Given** the desktop 1440×900 profile, **When** the homepage renders, **Then** the hero, layout and score are unchanged.

### Edge Cases

- A candidate ladder may never serve an image narrower than the device-pixel width the browser requested; filling the gap must not lower any device's sampled resolution.
- The preload hint's `imageSrcSet` must list exactly the same candidates as the `<picture>` source, otherwise Chrome downloads a second file for the same paint (the failure recorded in `specs/088-live-performance-readiness`).
- Browsers without AVIF support must keep using the WebP `<source>` and the WebP `<img>` fallback.

## Requirements

### Functional Requirements

- **FR-001**: The hero artwork MUST keep its existing AVIF → WebP → `<img>` delivery order, `sizes` declaration, `fetchPriority="high"` and single preload hint.
- **FR-002**: Every device MUST continue to receive a candidate at least as wide as its device-pixel width requirement; no viewport may be served a narrower file than it uses today.
- **FR-003**: A candidate suitable for 700–1000 device pixels MUST exist so that the PSI mobile profile no longer fetches the 1024 w file.
- **FR-004**: The Milky Way backdrop, star canvas, gold shimmer, welcome panel, navigation, copy, sounds, reveal sequences, timing, countdowns and business logic MUST be unchanged.
- **FR-005**: Desktop performance and appearance MUST not regress.
- **FR-006**: No new dependency, hosting, Cloudflare, deployment, secret or paid-infrastructure change may be introduced, and the production build MUST stay below 495 MiB.

### Key Entities

- **Hero candidate ladder**: the AVIF/WebP widths offered to the browser (669, 768, 1024) and the preload hint that mirrors them.
- **Lighthouse mobile profile**: 412×823 CSS pixels at DPR 1.75 with slow-4G throttling and 4× CPU slowdown, the profile PSI uses for its mobile tab.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At the PSI mobile profile the hero request drops from the 199 KiB 1024 w file to a smaller correct candidate, transferring at least 50 KiB less.
- **SC-002**: Median local mobile Lighthouse score improves beyond run-to-run noise, with every post-change run above every pre-change run.
- **SC-003**: Desktop Lighthouse score does not fall below its 98 baseline.
- **SC-004**: No console error, failed request, broken asset, horizontal overflow or stopped sky animation at 390×844, 412×915 or 1440×900.
- **SC-005**: No device profile receives fewer device pixels than it needs, verified by `currentSrc` and `naturalWidth`.

### Explicitly Out of Scope

- Degrading, simplifying, dimming or disabling any Milky Way or night-sky layer, animation, gradient or glow.
- Reducing DPR for high-density devices or re-encoding the existing 1024 w artwork (PR #1933 measured ≤4 KiB available there).
- Renderer replacement, WebGL/WebGPU work, blanket GPU hints or animation reductions.
- Changing hosting, CDN, cache policy, Workers or deployment configuration.
