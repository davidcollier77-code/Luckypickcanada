# Implementation Plan: Lucky Reveal Follow-up Polish

**Feature**: `specs/078-lucky-reveal-followup-polish`

**Branch**: `freebuff/reveal-polish-followups`

## Approach

Four small, independent edits on the already-merged reveal (076). Nothing is rebuilt or redesigned;
each change addresses one reported symptom with the smallest structural fix.

### 1. Close control (`app/lucky-reveal-popup.js`)

- **Cause**: the content wrapper (`position: relative; z-index: 2`) paints above the
  `z-index: auto` close button and its box overlaps most of the 38 px circle.
- **Fix**: raise the button above the content (`zIndex: 3`), give it a 44×44 px hit area with
  `padding: 0`, `lineHeight: 1`, `touchAction: 'manipulation'` and a transparent tap highlight, and
  move the panel's scrolling to the content wrapper so a scrolled panel cannot carry the X out of
  reach. `dialogStyle` becomes a flex column with `overflow: hidden`; the content wrapper gets
  `overflowY: auto`, `flex: 1 1 auto`, `minHeight: 0`. Escape handling, `autoFocus`, `aria-label`
  and `onClose` are unchanged.

### 2. Settled leaf pile (`app/lucky-reveal-celebration.jsx`)

- Replace the nine evenly spaced leaves with a layered pile: four clusters of overlapping leaves with
  varied `left/bottom/size/rotate/opacity` and explicit stacking (back leaves darker, front leaves
  brighter), plus the existing radial gold glow.
- Give the celebration layer `z-index: 1` so it paints behind the panel (`z-index: 2`): the finish is
  decorative and can never cover numbers, copy, the share control or the CTA. The particle canvas
  stays a `document.body` child at `z-index: 100` with `pointer-events: none`, so the burst still
  plays over the reveal.
- Reduced motion still shows the finished pile with no burst, sparkle or sound.

### 3. Homepage container style (`app/lucky-reveal-popup.js`)

- Set the panel background to the homepage card gradient,
  `linear-gradient(145deg, rgba(5,11,18,0.7), rgba(7,19,27,0.52) 52%, rgba(8,7,18,0.62))`, and match
  the homepage's `backdrop-filter: blur(16px)`. Keep the lucky-colour border and theme glow, radius
  28, padding, layout and all content.

### 4. Image-format audit

Measured (bytes and pixels) and decided per asset:

| Asset | Formats now | Decision |
| --- | --- | --- |
| `assets/crystal-ball-bg-desktop` | AVIF 474,841 / WebP 427,992 / JPEG 535,956 (1920×1280) | Keep AVIF → WebP → JPEG; AVIF is smallest and already first in `image-set()`. |
| Share logo, full-size | AVIF 195,149 / WebP 273,324 / PNG 2,609,980 (1920×4152, alpha) | Keep as compatibility fallback, but stop using it for the 116 px draw. |
| New `assets/lucky-reveal-logo-232` | generated from the same PNG at 232 px wide (~2× the 116 px draw), AVIF/WebP/PNG | Use first in the share renderer: the same artwork at the only size it is drawn, cutting the AVIF from 195 KB to a few KB. |
| Inline SVG (sparkle, settled leaves, maple-leaf path) | inline, 0 requests | Retain: conversion would add a request and fix one resolution. |
| `assets/golden-maple-leaf` | AVIF 2,316 / WebP 3,870 / SVG 3,567 (112×122) | Already AVIF → WebP → SVG in `GoldenLeaf`; not used by the reveal, unchanged. |

- SVG is not excluded by policy: the decision is recorded per asset with measured sizes. Vector art
  used by the reveal is inline, so an AVIF variant would add bytes and a request while losing
  resolution independence.
- The generated share image stays `image/png`.

## Files

- `app/lucky-reveal-popup.js` — close button, scroll container, panel background.
- `app/lucky-reveal-celebration.jsx` — pile geometry and layer order.
- `app/lucky-reveal-share-image.js` — small logo sources.
- `public/assets/lucky-reveal-logo-232.{avif,webp,png}` — generated from the existing PNG.
- `__tests__/lucky-reveal-celebration.test.js`, `__tests__/components/LuckyRevealCelebration.test.jsx`
  — updated guards; new `__tests__/lucky-reveal-followup.test.js` for the close button, panel style
  and logo chain.
- `specs/078-lucky-reveal-followup-polish/*`, `.specify/feature.json`.

## Verification

- Focused Vitest suites, full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`.
- Production build measured against the 495 MB hard maximum.
- Playwright against the production server: hit-test and one-click close at the button centre and at
  its lower edge, before/after scroll, desktop 1440×900 and mobile 390×844, computed panel
  background/blur, leaf overlap check against every text/number/control box, and screenshots.

## Risks

- Moving the finish behind the panel changes where the pile is seen on phones (the panel covers most
  of the width); the pile remains visible in the panel gutters and the bottom gap. This is the only
  way to guarantee it never covers content.
- The smaller logo must keep the same aspect ratio and draw rectangle so the share image is
  pixel-comparable.
