# Tasks — Homepage Confetti Deferred Loading

## Implementation
- [x] T001 Remove the static `canvas-confetti` import from `app/homepage/ExploreLuckButton.js`.
- [x] T002 Add a cached `loadConfetti()` dynamic-import helper that resets on failure.
- [x] T003 Pass the resolved library into `getMapleLeafShape()` and `getConfettiInstance()` so shape geometry and the main-thread canvas stay identical.
- [x] T004 Fire the burst when the library resolves while starting the eased scroll synchronously.
- [x] T005 Prefetch after hydration, skipping visitors who prefer reduced motion.

## Verification
- [x] T006 `pnpm exec tsc --noEmit` — pass.
- [x] T007 `pnpm test` — 22 files / 152 tests pass.
- [x] T008 Clean production build with measured `.next` + `public` size (< 495 MiB) — 329,989,305 bytes / 314.70 MiB.
- [x] T009 Re-measure the served homepage initial JS payload and confirm no initial chunk contains `canvas-confetti` — 631,196 → 621,131 bytes raw, 197,142 → 193,213 bytes gzip; library now in `chunks/2992.*.js` (10,429 raw / 4,250 gzip).
- [x] T010 `./jules-verify.sh` — exit 0 (governance gate, typecheck, build, refresh-docs 17/17).
- [x] T011 Inspect the complete final diff — one source file plus Spec Kit/memory artifacts; no unrelated changes.
- [ ] T012 Playwright visual regression — BLOCKED in this environment (Chromium crashes on the homepage on the unmodified baseline too).
