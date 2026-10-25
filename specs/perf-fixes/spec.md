# Specification: Performance Improvements

## Overview
Implement 3-4 performance improvements to increase the mobile PageSpeed score (currently ~78/100) towards the target of 85+/100, focusing on frontend loading, rendering, and LCP/FCP improvements.

## Success Criteria
- [ ] Measure baseline performance (LCP, FCP, TBT, CLS).
- [ ] At least 3 verified performance fixes implemented.
- [ ] Image assets (AVIF/WebP) and original fallbacks maintained and correctly served.
- [ ] Visual fidelity, animations, and functionality strictly preserved.
- [ ] Measure final performance to verify improvement.
- [ ] Production build size remains under 495 MB limit.

## Functional Requirements
1. **Reduce Client-Side JavaScript execution:** Investigate deferred loading for heavy libraries or non-critical components.
2. **Optimize Image Delivery:** Ensure `next/image` is utilized correctly, avoiding redundant or over-scaled image downloads, particularly for the main LCP element (Hero background/images).
3. **Optimize Animation Rendering:** Validate that Canvas-based animations (like stars) don't cause unnecessary main-thread blocking or layout shifts. Extract static calculations out of loops.
4. **Prevent Render Blocking:** Ensure third-party scripts (Turnstile, Analytics) are not blocking initial paint.

## Non-Functional Requirements
- **Protected Visuals:** Keep the Milky Way background, card reveals, animations, audio, and branding intact without degradation.
- **Architectural Integrity:** Maintain the existing Cloudflare/OpenNext deployment setup and image optimization constraints.
