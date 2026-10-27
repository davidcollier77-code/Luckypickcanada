# Mobile PageSpeed Optimization

## Overview
Improve LuckyPickCanada.ca mobile PageSpeed performance to target a score of 88 or higher. The changes must strictly preserve visual quality, AVIF/WebP image delivery, security protections (Turnstile), functionality, and layout.

## Scope
- Investigate and fix render-blocking CSS by leveraging component-level CSS imports.
- Enhance cache headers for static image resources (`max-age=31536000, immutable`).
- Address legacy JavaScript/network requests (like forced Turnstile script preloading on initial load).
- Exclusions: No image compression downgrades, no framework overhauls, no removal of existing capabilities.
