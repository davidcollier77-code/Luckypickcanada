# Feature Specification: Lucky Card Reveal Cinematic Enhancement

**Feature Branch**: `freebuff/4818369485c7528fe69e661a`

**Created**: 2026-11-06

**Status**: Ready

**Input**: Fully enhance the existing Lucky Card Reveal visual experience across all three tiers —
Standard, Premium and Flagship — into a much more cinematic and spectacular reveal, with polished
visual effects, depth, lighting and transitions. Give the cards themselves a premium, consistent
glossy finish that preserves every card's existing design and artwork, applied the same way to every
card and every tier. Inspect the previous enhancement attempt and correct what it left incomplete.

## Context (measured in this worktree before design)

- The experience is `/reveal`: `app/reveal/page.tsx` → `app/reveal/RevealClient.tsx` →
  `app/lucky-card-reveal.js`. That single component owns the entry control, the canvas beam
  choreography, the audio cue scheduling, the Framer Motion flip, the revealed-card presentation and
  the share/collection controls.
- The three tiers are already functional and distinct: `TIER_HITS` runs 3 / 4 / 5 beam strikes, the
  canvas `colors` map paints standard bronze `224, 148, 64`, premium pewter `200, 204, 208` and
  flagship gold `218, 165, 32`, and the final strike intensity multiplier is 1 / 1.5 / 2.5.
- **The previous attempt is `specs/094-lucky-card-reveal-polish`.** Reading its artifacts and the
  shipped component shows exactly what it did and did not do:
  - It added a tappable entry button, a tier chip with the card name and collection caption, and a
    **static** halo plus rim behind the revealed card.
  - Its entire card finish was **one flat 118° gradient** (`cardPolishSheenStyle`), a 1 px frame and
    one inset edge line. There is no specular highlight, no gloss bloom, no finish light pass, and
    the finish never reacts to the reveal.
  - It **excluded `coast-to-coast-tale` from the polish entirely** (`preserveCoastToCoastPolish`), so
    one of eleven cards ships with a visibly different finish — the opposite of "consistent across
    all cards".
  - The reveal moment gained no light event: no spotlight, no shockwave, no embers, no floor depth,
    and the halo does not change shape or intensity at the flip. Its tier escalation is limited to
    opacity and blur triples.
  - The chip, name, quote and share control appear instantly with the card, with no staged
    transition, and the back face never receives the finish at all.
- Existing behaviour that must not change: `LUCKY_CARDS` data and `selectWeightedLuckyCard`
  weighting/anti-repeat, `selectRandomQuote`, the localStorage daily lock
  (`lucky-pick-canada-todays-lucky-moment`) and the `unlockedCards` write, the AVIF-first/WebP
  fallback artwork delivery, the howler/Web Audio cue schedule and every timing constant, the canvas
  beam choreography, the flip timings, the share control, the collection binder, the countdown and
  the Return to Home link.

## User Scenarios & Testing

### User Story 1 — The reveal is a cinematic light event (Priority: P1)

As a visitor, when my card turns over the moment reads as a produced spectacle — light blooms out of
the card, a shockwave releases, embers lift away and the card sits in a pool of shadow — and a rare
pull feels bigger than a common one.

**Why this priority**: The reveal moment is the product. The previous attempt only framed the card
afterwards; it did not direct the moment itself.

**Independent Test**: Reveal one card of each tier and confirm the stage behind the revealed card
contains a tier-tinted spotlight, a light shaft, at least one expanding shockwave ring and rising
embers, that all are decorative and non-interactive, and that the effect strength increases from
Standard to Premium to Flagship.

**Acceptance Scenarios**:

1. **Given** a revealed Standard card, **Then** the stage shows the spotlight, light shaft,
   shockwave and embers in Standard bronze, and no stage layer intercepts pointer events.
2. **Given** a revealed Premium card, **Then** the same layers render in Premium pewter with a
   stronger spotlight and shockwave than Standard.
3. **Given** a revealed Flagship card, **Then** the layers render in Flagship gold with the strongest
   spotlight, shockwave and ember treatment of the three.
4. **Given** the draw is running before the flip, **Then** a tier-tinted charging aura holds behind
   the card and intensifies while the beams strike, without covering or blocking the card.
5. **Given** the card is not yet revealed, **Then** no post-reveal stage layer is mounted.

### User Story 2 — Every card shares one premium glossy finish (Priority: P1)

As a collector, every card I pull — standard, premium or flagship, including Coast-to-Coast Tale —
looks like a physical, glossy collectible with the same finish quality, and its artwork is unchanged.

**Why this priority**: The request names the cards themselves; a finish applied to ten of eleven
cards, or only one face, is visibly inconsistent.

**Independent Test**: Reveal cards of each tier, including `coast-to-coast-tale`, and confirm both
faces carry the same gloss, specular highlight and bevel layers, that the tier accent only appears
on the revealed front, and that the artwork URLs and the authored Coast-to-Coast frame are intact.

**Acceptance Scenarios**:

1. **Given** any card, **Then** its back face and front face both carry the identical gloss,
   specular and bevel finish layers.
2. **Given** any revealed card, **Then** the finish adds a tier-tinted gloss bloom and one diagonal
   glint pass without altering the card artwork.
3. **Given** `coast-to-coast-tale`, **Then** its authored frame is preserved and it receives the same
   finish and tier accent as every other card.
4. **Given** the tier accent on the back face, **Then** it stays neutral, so the finish never leaks
   the outcome before the flip.
5. **Given** any card, **Then** its image path, AVIF-first/WebP-fallback delivery and alt text are
   unchanged.

### User Story 3 — The revealed presentation arrives in sequence (Priority: P2)

As a visitor, after the flip the tier chip, card name, quote, share and collection controls settle in
one after another, so the moment resolves rather than appearing all at once.

**Why this priority**: A staged arrival is what makes the sequence feel produced, but it must remain
subordinate to the card itself.

**Independent Test**: Reveal a card and observe the chip/name/caption block, the quote panel and the
share control enter in that order after the card lands, with no layout shift.

**Acceptance Scenarios**:

1. **Given** a completed flip, **Then** the tier block, quote panel and share control fade/rise in
   with increasing delays and keep their existing positions and copy.
2. **Given** the page loads with today's card already stored, **Then** the same presentation renders
   from storage and still plays its staged arrival exactly once.
3. **Given** the page after the sequence, **Then** the result is fully readable and no element stays
   transparent or offset.

### User Story 4 — Motion preferences and accessibility are preserved (Priority: P2)

As a visitor who has asked for reduced motion, I still see the finished card, its tier treatment and
its lighting, but nothing animates or loops.

**Why this priority**: The repository must preserve `prefers-reduced-motion`; a cinematic upgrade
must not become a motion-sensitivity regression.

**Independent Test**: Load `/reveal` with `prefers-reduced-motion: reduce`, reveal a stored card, and
confirm the stage, halo, tier accent and text are present and static, and that no new animated layer
is mounted.

**Acceptance Scenarios**:

1. **Given** reduced motion, **Then** the halo, rim, spotlight, shaft and tier accent are visible
   without a fade.
2. **Given** reduced motion, **Then** the shockwave, embers and glint sweep are not mounted.
3. **Given** reduced motion, **Then** the tier block, quote and share control are immediately
   visible with no transform offset.
4. **Given** any motion preference, **Then** every decorative layer is `aria-hidden` and
   `pointer-events: none`, and no accessible name or role changes.

### Edge Cases

- A stored card id no longer present in `LUCKY_CARDS` keeps its current behaviour (no card shown).
- An unrecognised tier value falls back to the Standard presentation for every existing and new
  value.
- The same card is re-rendered (state update, countdown tick) — one-shot stage effects must not
  restart or duplicate.
- A very small viewport: the larger stage layers must not create horizontal overflow.
- The card image fails to load and the text fallback is shown — the finish still applies.

## Requirements

### Functional Requirements

- **FR-001**: The reveal MUST gain a tier-tinted stage behind the revealed card containing a
  spotlight, a light shaft, at least one expanding shockwave ring, rising embers and a floor shadow,
  all decorative and non-interactive.
- **FR-002**: A tier-tinted charging aura MUST be visible behind the card while the draw runs, and
  MUST NOT be mounted once the card is revealed.
- **FR-003**: Stage strength (spotlight opacity, shockwave opacity/scale, ember opacity, gloss
  opacity, sweep duration) MUST increase from Standard to Premium to Flagship.
- **FR-004**: Both card faces MUST share one finish built from the same gloss, specular and bevel
  layers.
- **FR-005**: A revealed card MUST add a tier-tinted gloss bloom and exactly one diagonal glint pass
  on its front face.
- **FR-006**: `coast-to-coast-tale` MUST receive the same finish and tier accent as every other card
  while keeping its authored frame.
- **FR-007**: The tier accent MUST NOT appear on the card back.
- **FR-008**: The tier block, quote panel and share control MUST enter with staggered transitions
  after the flip, preserving their copy, order and layout.
- **FR-009**: Under `prefers-reduced-motion: reduce`, the spotlight, shaft, halo, rim and tier accent
  MUST be static and the shockwave, embers and glint sweep MUST NOT be mounted.
- **FR-010**: Every new decorative layer MUST be `aria-hidden`, `pointer-events: none` and MUST NOT
  change any accessible name, role or heading.
- **FR-011**: `LUCKY_CARDS`, `selectWeightedLuckyCard`, `selectRandomQuote`, the daily localStorage
  lock, the `unlockedCards` write, the audio cue schedule, all reveal timing constants, the canvas
  choreography, the flip timings, the share control, the collection binder, the countdown and the
  Return to Home link MUST NOT change.
- **FR-012**: Card artwork paths, the AVIF-first/WebP-fallback delivery, `alt` text and the card data
  MUST NOT change.
- **FR-013**: The change MUST add no dependency, route, API, network request, image asset or data
  model, and MUST keep the page free of horizontal overflow.

### Key Entities

- **Tier presentation**: the existing `{ id, label, glyph, accent, accentRgb, chipText, haloOpacity,
  haloBlur, rimOpacity, rimBlur, revealDuration, frameOpacity, innerGlow }` record extended with the
  stage values `spotlightOpacity`, `shockwaveOpacity`, `shockwaveScale`, `glossOpacity`,
  `sweepDuration` and `emberOpacity`, one record per tier with a Standard fallback.
- **Card finish**: the ordered decorative layers painted over the artwork of each card face — gloss,
  specular highlight, bevel, and (front, revealed only) tier gloss bloom and glint sweep.
- **Reveal stage**: the decorative region behind the card — charging aura, spotlight, light shaft,
  halo, rim, shockwave rings, embers and floor shadow.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All three tiers render the complete stage: spotlight, shaft, halo, rim, shockwave and
  embers are each present exactly once per reveal in a browser probe.
- **SC-002**: All eleven cards render the identical finish layer set on both faces; the finish is
  present for `coast-to-coast-tale` exactly as for every other card.
- **SC-003**: Stage opacity/scale values are strictly ordered Standard < Premium < Flagship for all
  six new tier values, verified by executed unit tests.
- **SC-004**: The existing reveal behaviour is preserved: 11 cards, weighting/anti-repeat, quotes,
  daily lock, collection write, audio cue schedule, timings, share and binder unchanged.
- **SC-005**: Under reduced motion, zero one-shot animated stage layers are mounted and the static
  lighting remains visible.
- **SC-006**: No new network request, asset, dependency or route is introduced, and the page has no
  horizontal overflow at 390 px and desktop widths.
- **SC-007**: `./freebuff-verify.sh`, the full Vitest suite, the type check and the measured
  production build (below 495 MB) pass.

## Assumptions

- The enhancement is presentation-only; the three tiers keep their existing probabilities, hit
  counts, audio and timings, so nothing about which card a visitor receives changes.
- "All three reveals" means the three tier reveals of the daily Lucky Card at `/reveal`; the paid
  Lucky Reveal popup, Crystal Ball and gift/payment flows are out of scope and untouched.
- Existing artwork is the authored identity of each card and is used exactly as shipped.
- `coast-to-coast-tale`'s authored frame is its identity; consistency is achieved by adding the
  shared finish around it rather than replacing its frame.
