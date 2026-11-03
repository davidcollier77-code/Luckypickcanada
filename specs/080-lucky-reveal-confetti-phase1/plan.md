# Implementation Plan: Lucky Reveal Confetti Lifecycle (Phase 1)

**Feature**: `specs/080-lucky-reveal-confetti-phase1`

**Branch**: `freebuff/d4bf506e672ecbddc0a33655`

## Approach

Three confined edits on the shipped reveal. Nothing is redesigned: the leaf artwork, palette, gold
glow, flash, shimmer, sparkle, number animation, copy and controls stay as they are. The work is a
lifecycle repair of the confetti, plus the one missing sound effect.

### 1. Confine the confetti to the reveal (`app/lucky-reveal-celebration.jsx`)

- **Cause**: the canvas is created imperatively and appended to `document.body` as a fixed
  `100vw`/`100vh` `z-index: 100` layer. It is outside the reveal's DOM, so it outlives the effect (it
  is only removed on unmount), and its size is unrelated to the reveal.
- **Fix**: render the canvas as part of the celebration markup, in its own absolutely positioned
  layer inside the reveal overlay (`z-index: 3`, above the panel at `z-index: 2`), so the leaves stay
  visible over the reveal and are clipped to its animation area. The settled-leaf finish keeps its
  existing `z-index: 1` layer behind the panel.
- `confetti.create(canvas, { resize: true, useWorker: false })` is unchanged (the CSP still blocks the
  Blob worker), created once against the mounted element.

### 2. Bound the particles and the window

- `MAX_ACTIVE_PARTICLES = 96`, enforced by a fired-particle counter that clamps every wave.
- Wave schedule keeps the existing shape (both edges inward, then two follow-up waves, then a small
  centre wave) at 24 / 24 / 14 / 14 / 10 = **86** particles, fired at 0 ms, 500 ms and 1000 ms.
- `ticks: 150` (2.5 s at 60 fps) is each particle's hard lifetime, so the last leaf expires at about
  **3.5 s** — inside the requested 3–4 s window and longer than the old 2.67 s.
- Particles that leave the animation area are not painted (the canvas is the area) and are deleted
  from the simulation at their lifetime; the canvas-confetti API has no per-particle removal hook, so
  the guarantee is per-particle `ticks` plus the confined canvas, and teardown at the end.
- `CELEBRATION_TOTAL_MS = 4200` ends the celebration: at 3500 ms the instance is `reset()` and the
  layer fades over 0.5 s, then the layer unmounts. Nothing is left behind the reveal container.

### 3. Timers and teardown

- Every `setTimeout` id is stored in a ref and cleared on finish and on unmount; the confetti instance
  is `reset()` and the canvas is released with the layer.
- Reduced motion is untouched: no particles, no canvas, no sound, static finish, no finish timer
  (that path behaves exactly as feature 076/078 shipped it).

### 4. Opening sparkle (`app/lib/audio.js`, `app/lucky-reveal-popup.js`)

- Measured: the reveal currently plays no audio on open, so the opening sparkle is missing. The
  finishing pop exists — `/sounds/confetti-pop.wav` is mono 24 kHz, **0.90 s**, and plays once when
  the final number settles.
- Add `preloadRevealSparkle()` / `playRevealSparkle()` for the committed, unused same-origin
  `/sounds/chime-sound.mp3` (128 kbps, 44.1 kHz, **1.25 s**) at a modest volume, one-shot, with the
  same graceful failure handling as the existing sounds. No new asset, no new dependency.
- `LuckyRevealPopup` preloads it on mount and plays it once when the reveal opens, skipped when the
  visitor prefers reduced motion. The finishing pop keeps its existing timing.

### 5. Number modes

- No change to `app/lucky-reveal.js` (generation) or the row layout. The celebration delay stays
  `(startNumbersDelay + (numItems - 1) * 0.35 + 0.95) * 1000`, derived from the number count, so Six
  Pick (6) and Seven Pick (7) both celebrate after their own final number.

## Files

- `app/lucky-reveal-celebration.jsx` — confined canvas, particle cap, wave schedule, lifetime, finish
  and teardown.
- `app/lib/audio.js` — brief opening sparkle helpers.
- `app/lucky-reveal-popup.js` — opening sparkle on reveal open.
- `__tests__/lucky-reveal-confetti-phase1.test.js` — new source/behaviour guards.
- `__tests__/components/LuckyRevealCelebration.test.jsx`, `__tests__/lucky-reveal-celebration.test.js`
  — updated guards for the confined canvas and the new window.
- `artifacts/reveal-confetti-phase1-probe.cjs`, `artifacts/reveal-confetti-phase1/` — browser evidence
  (measurements and burst/after screenshots).
- `specs/080-lucky-reveal-confetti-phase1/*`, `.specify/feature.json`.

## Verification

- Focused Vitest suites, full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`.
- Production build measured against the 495 MB hard maximum.
- Browser check of the reveal at 1440×900 and 390×844 if a Chromium engine can start in this
  workspace; otherwise recorded as BLOCKED and left to CI Playwright.

## Risks

- Moving the canvas inside the overlay relies on the overlay being the fixed, full-viewport containing
  block; it already is (`position: fixed; inset: 0`), so the leaves keep their full-screen area.
- The opening sparkle plays on mount. On the paid homepage flow the reveal opens from a click, so the
  gesture is available; on the gift route (direct navigation) the browser may refuse playback. The
  failure is logged and never thrown, and audibility needs a real-device check.
- The settled finish now ends with the celebration instead of staying for the whole reveal; that is
  the requested "no leaves accumulating behind the reveal container" behaviour, and the artwork,
  layering and timing of its entrance are unchanged.
