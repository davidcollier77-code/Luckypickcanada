# Tasks: Homepage Mobile LCP Delivery

**Feature**: `specs/179-homepage-mobile-lcp-delivery` | **Date**: 2026-11-17

## Phase 1 — Baselines (completed before any change)

- [x] T001 Capture the PSI mobile report for `https://luckypickcanada.ca` (score, Core Web Vitals, field-data availability, diagnostics, report link).
- [x] T002 Capture the PSI desktop report for the same URL.
- [x] T003 Build the production bundle and record its size.
- [x] T004 Record a local Lighthouse baseline (mobile ×3, desktop ×2) on the same build, device profile and throttling used for the after-measurement.

## Phase 2 — Investigation

- [x] T005 Identify the LCP element and its request chain from the Lighthouse breakdown and network log.
- [x] T006 Measure which hero candidate each device profile selects, and compare with its device-pixel requirement.
- [x] T007 Enumerate render-blocking stylesheets and attribute each by content.
- [x] T008 Profile the first-load main thread (V8 CPU profile) to attribute TBT and to test whether the Canvas2D night sky is a bottleneck.
- [x] T009 Test an early `Link` preload header and `experimental.cssChunking: 'strict'`; keep only what measures.

## Phase 3 — Implementation

- [x] T010 Generate the 768 w AVIF and WebP derivatives from the existing 1024 w master.
- [x] T011 Add the candidate to both `<source>` elements, the `<img>` fallback and the preload hint.
- [x] T012 Update the hero guards: hint list equals picture list, ascending ladder, a step at or above 721 px, asset allowlist.

## Phase 4 — Verification

- [x] T013 Rebuild and confirm the production build size stays below 495 MiB.
- [x] T014 Confirm candidate selection per profile (390×844 DPR 2.75, 412×823 DPR 1.75, 412×915 DPR 2.75, 1440×900 DPR 1).
- [x] T015 Re-run local Lighthouse mobile ×3 and desktop, and compare with the baseline.
- [x] T016 A/B the rendered hero at the PSI mobile profile and record the pixel difference.
- [x] T017 Browser verification at 390×844, 412×915 and 1440×900 (console, network, overflow, hero, navigation, countdown, star canvas, screenshots).
- [x] T018 Run the focused hero suites, the full Vitest suite, `tsc --noEmit` and `./freebuff-verify.sh`.

## Phase 5 — Handoff

- [x] T019 Record findings, measurements and limitations in `evidence.md`.
- [x] T020 Open one regular, non-draft PR with the measured before/after, exact changes, verification evidence, build size and remaining limitations; leave it open and unmerged.
