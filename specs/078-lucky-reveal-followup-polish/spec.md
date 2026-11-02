# Feature Specification: Lucky Reveal Follow-up Polish (Close, Leaves, Glass, Images)

**Feature Branch**: `freebuff/reveal-polish-followups`

**Created**: 2026-11-02

**Status**: Implemented — verification recorded in the single PR summary

**Input**: Four follow-up improvements to the merged Lucky Reveal experience (PR #1680): make the
close control respond to one tap, turn the flat row of settled leaves into a natural pile, match the
homepage's semi-transparent container styling, and complete the image-format audit including SVG.

## Context (verified before design)

- `app/lucky-reveal-popup.js` renders the one reveal used by the $1 Lucky Pick and the $1.99 Lucky
  Pick Gift, on the homepage (`app/homepage/HomePage.js`), the free preview switch and the gift route
  `app/reveal/[revealId]/page.tsx`. Feature 076's celebration is merged and is preserved.
- **Close control.** The panel is `<section role="dialog">` with `overflow: auto`, and its content is
  wrapped in `<div style="position: relative; z-index: 2">`. The close `<button>` is
  `position: absolute; top: 18; right: 18; width: 38; height: 38` with **no z-index**, so the
  positioned content wrapper paints above it. The wrapper starts at the panel's content box
  (`padding-top: clamp(1.5rem, 5vw, 2.5rem)` = 24–40 px) and spans the full width, so it covers the
  lower 32 px of the 38 px button at phone padding and 16 px at desktop padding. Taps in that region
  hit the wrapper, which has no handler.
- **Leaves.** `SETTLED_LEAVES` in `app/lucky-reveal-celebration.jsx` is nine equally spaced leaves at
  `left: 5%…94%`, all `bottom: 1–10`, sizes 20–33 px, i.e. a visibly even row. The celebration layer
  is `z-index: 3`, above the panel (`z-index: 2`), so the finish can draw over the reveal's CTA.
- **Container.** The panel background is `linear-gradient(180deg, rgba(2,6,23,.72), rgba(3,7,18,.82))`
  with `backdrop-filter: blur(24px)`. The homepage cards (`themes/default/homepage.css`,
  `.homepage-experience .homepage-community-card`) use
  `linear-gradient(145deg, rgba(5,11,18,.7), rgba(7,19,27,.52) 52%, rgba(8,7,18,.62))`,
  `border-color: rgba(255,233,171,.15)`, `backdrop-filter: blur(16px)` and radius 22–26 px.
- **Images the reveal actually loads.** Only `/assets/crystal-ball-bg-desktop.{avif,webp,jpeg}`
  (1920×1280; 474,841 / 427,992 / 535,956 B) and the share-image logo
  `/BackgroundEraser_20260724_163638777.{avif,webp,png}` (1920×4152, alpha; 195,149 / 273,324 /
  2,609,980 B). Everything else in the reveal is inline SVG or the shared maple-leaf vector path.
  The logo is drawn at 116×116 in the 1200×1500 share canvas, so serving the full 1920×4152 AVIF
  costs 195 KB for a 116 px mark.

## User Scenarios & Testing

### US1 — One tap closes the reveal (P1)

A customer taps the X once and the reveal closes, returning to the page underneath, on a phone and
on a desktop, for both the Lucky Pick and the Gift reveal.

**Acceptance**: the button's whole visible area hit-tests to the button; one click/tap closes the
reveal; it stays visible and clickable after the panel has been scrolled; keyboard focus and Escape
still work.

### US2 — The finish reads as a pile, not a row (P2)

The celebration ends with a small overlapping pile of golden leaves with varied sizes and rotations
over a soft glow, and no leaf touches numbers, copy, or controls.

**Acceptance**: leaves are clustered with overlap and varied rotation/size/opacity; the finish layer
paints below the panel, so it cannot cover the numbers, share control, or CTA; reduced motion shows
the finished pile without the burst.

### US3 — Match the homepage's translucent container (P2)

The panel lets the Milky Way artwork show through like the homepage cards while text stays readable.

**Acceptance**: the panel uses the homepage card gradient and 16 px backdrop blur; lucky-colour
border/glow, radius, layout and content are unchanged.

### US4 — Complete the image-format audit (P3)

Every image the reveal loads is delivered in its best format, including a measured decision about SVG
artwork, with no quality loss and no broken sharing.

**Acceptance**: each reveal asset has a measured format decision; SVG artwork stays vector with a
measured justification; the share-image logo keeps AVIF → WebP → PNG compatibility; the generated
share image remains a PNG.

## Requirements

- Preserve the celebration, number generation, stored results, row layout, swatch, shimmer, sparkle,
  share control, money/map CTA, Stripe, gift email, database and the Little Luck Map.
- No new dependencies; keep `prefers-reduced-motion` behaviour; keep keyboard access.
