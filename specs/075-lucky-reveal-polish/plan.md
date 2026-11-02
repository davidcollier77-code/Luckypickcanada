# Implementation Plan: Lucky Reveal Polish and Device-Native Sharing

**Feature**: `specs/075-lucky-reveal-polish`

**Branch**: `freebuff/734cbf62690b478727fca4a5`

## Summary

Present the stored reveal numbers as 3 + 3 (6 Pick) or 4 + 3 (7 Pick) rows in the popup and in a
canvas-rendered static image, add an accurate colour swatch beside the Lucky Colour, replace the
nine share buttons with one **Share My Reveal** control backed by the Web Share API with a compact
desktop fallback window, and finish the reveal with a golden shimmer, a small maple-leaf sparkle,
and Milky Way wording.

## Technical Context

- **Stack**: existing Next.js App Router + React client components. No new dependency, route, asset,
  API, database, environment, or deployment change.
- **Files changed**: `app/lucky-reveal-popup.js`, `app/share-lucky-pick-button.js` (rewritten),
  new `app/lucky-reveal-presentation.js`, new `app/lucky-reveal-share-image.js`, and the new guard
  test `__tests__/lucky-reveal-polish.test.js`.
- **Reused pieces**: the reveal shape produced by `buildLuckyReveal` (`app/lucky-reveal.js`), the
  seven lucky colours and the per-colour border glows already in the popup, the homepage Milky Way
  artwork from feature 074, the existing gold CTA treatment, the site logo
  `public/BackgroundEraser_20260724_163638777.png`, and the canvas + `navigator.share({ files })`
  precedent in `app/lucky-card-share.js`.
- **Unknowns**: none requiring research. The reveal data is already on screen and the browser
  capabilities are feature-detected at runtime.

## Constitution Check

- **I. Single Source of Truth** — `AGENTS.md` stays authoritative; no governance file changes.
- **II. Verify Before Acting** — the popup, share component, gift path, reveal route, and shared
  generator were read from source before planning.
- **III. Implementation Sequence** — inspect → spec → plan → tasks → implement → test → diff audit →
  PR summary.
- **IV. Protect Core Systems** — checkout, Stripe, gift email, Resend, database, environment,
  deployment, and the Little Luck Map are untouched. Presentation consumes the stored reveal only.
- **V. Resource Conservation** — no new dependency, no documentation refresh, `.docs/` read-only.
- **VI. Accessibility** — swatches are decorative (`aria-hidden`) because the colour name remains
  text; the fallback window is a labelled dialog with Escape handling and focus; reduced-motion
  users get the finished result without animation.

**Gate result**: PASS.

## Phase 0 — Research

No external research was required. Two local decisions were needed and both were answered from the
repository: (1) the share image reuse pattern already exists in `app/lucky-card-share.js`
(`navigator.share` + `canShare` + `AbortError`), and (2) the swatch palette is the reveal's existing
lucky-colour vocabulary. The polishing group's optional MDN image-format reference does not change
anything here: the shared image is generated client-side as a PNG for compatibility with the device
share panel, and no raster asset is converted, selected, or re-encoded.

## Phase 1 — Design

### Number row layout (`app/lucky-reveal-presentation.js`)

- `NUMBER_ROW_LAYOUTS = { 6: [3, 3], 7: [4, 3] }`.
- `splitLuckyNumberRows(numbers)` slices the stored array without sorting or regenerating it; an
  unknown length keeps every number in a trailing row so nothing disappears.

### Colour swatches (`app/lucky-reveal-presentation.js`)

- One gradient pair plus ring colour per lucky colour: green, gold, midnight blue, red, silver,
  purple, sky blue.
- `getLuckyColorSwatch` falls back to the gold treatment for an unrecognised stored colour while the
  displayed name still comes from the reveal.

### Reveal popup (`app/lucky-reveal-popup.js`)

- Render one centred flex row per layout row; numbers keep their stored order and sequential reveal
  delays by flattening row offsets.
- Swatch rendered beside the colour name, with the colour gradient and its ring glow.
- Golden shimmer sweep over the numbers panel and a small gold maple-leaf sparkle, both starting
  after the numbers settle; a `prefers-reduced-motion` block removes the motion and shows the result
  immediately.
- Copy changes "Auroras and stars are revealing…" to Milky Way / starfield wording.
- Everything else — artwork, panel scrim, themed border, close control, Escape, autofocus, map CTA,
  animation timings — is preserved.

### Static image (`app/lucky-reveal-share-image.js`)

- 1200 × 1500 canvas: deterministic starfield, gold-bordered panel, logo and wordmark, heading, game
  label, the same 3 + 3 / 4 + 3 number rows, Lucky Colour card with the matching swatch, Lucky Day
  card with a gold marker, tagline, site link, and the entertainment disclaimer.
- Returns a PNG `File` from `canvas.toBlob`; no dependency, network call, or new asset.

### Sharing (`app/share-lucky-pick-button.js`)

- Single **Share My Reveal** button builds the image once (cached in a ref), then:
  - if `navigator.share` exists and `navigator.canShare({ files })` accepts the payload, calls
    `navigator.share` with the file, title, and text that ends with the LuckyPickCanada link;
  - treats `AbortError` as a quiet cancellation;
  - otherwise opens a compact dialog with an image preview, download, copy image (only when
    `ClipboardItem` is available), and copy link, with Escape, focus, and object-URL cleanup.
- The eight legacy share actions and the expanded card are removed.

### Preserved behaviour

Personal and Gift still present through `LuckyRevealPopup` and `buildLuckyReveal`; the gift route
still verifies `cs_` sessions and shows the stored gift result and `giftDeliveredAt` banner. No
payment, email, database, API route, dependency, or deployment file changes.

### Tests

New `__tests__/lucky-reveal-polish.test.js` covers row splitting (order preserved, 6 → 3 + 3,
7 → 4 + 3, unknown counts keep every number), all seven swatches, the popup's row/swatch/shimmer/
reduced-motion/wording contract, the single share control with no legacy buttons, native file share
and cancellation handling, the fallback actions, and that neither the popup nor the image module
generates numbers.

**Post-design Constitution re-check**: PASS — the change stays inside the reveal presentation, adds
no dependency, and preserves every existing safeguard and control.
