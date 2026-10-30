# Implementation Plan — Homepage Confetti Deferred Loading

## Technical Context
- Framework: Next.js App Router (webpack build), React client component `app/homepage/ExploreLuckButton.js` rendered in the homepage hero.
- Baseline measurement: 9 initial chunks, 631,196 bytes raw / 197,142 bytes gzip, taken from the production server's rendered homepage HTML.
- `canvas-confetti` ships as a browser bundle of 24,914 bytes raw / 6,933 bytes gzip.

## Decisions
1. Replace the static `import confetti from 'canvas-confetti'` with a module-scope cached `import('canvas-confetti')` promise so webpack emits a separate asynchronous chunk.
2. Keep `getMapleLeafShape` and `getConfettiInstance` behavior identical by passing the resolved library in, preserving the existing cached shape and the dedicated main-thread canvas (the CSP blocks canvas-confetti's blob worker).
3. Prefetch after hydration in the existing effect style used by `preloadConfettiPop()`, guarded by `prefers-reduced-motion`, so the first activation is not delayed by a cold chunk fetch.
4. Start the scroll animation synchronously and fire the burst when the library resolves; a rejected import logs and leaves the scroll untouched instead of throwing inside the click handler.
5. Reset the cached promise in the rejection branch so a transient failure does not permanently disable the effect.

## Verification
- Clean production build; record `.next` + `public` size against the 495 MiB cap.
- Re-measure the served homepage's initial JS chunk list, raw bytes, and gzip bytes; compare with the baseline above and confirm no initial chunk carries `canvas-confetti`.
- `pnpm exec tsc --noEmit`, `pnpm test`, and `./jules-verify.sh`.
- Browser-level Playwright visual regression cannot run in this environment: Chromium in this container crashes on the homepage (`Target page, context or browser has been closed`) on the unmodified baseline as well, so the effect-timing check is reported as BLOCKED rather than passed.
