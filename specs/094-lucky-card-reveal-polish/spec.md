# Feature Specification: Daily Lucky Card Reveal Polish (Standard / Premium / Flagship)

**Feature Branch**: `polish/reveal-card-tier-experience-20261105`

**Created**: 2026-11-05

**Status**: Implemented — verification recorded in the single PR summary

**Input**: Polish and enhance the daily collectible Lucky Card reveal at `/reveal`. Make the entry
button clearly look and feel tappable, and improve the presentation and reveal experience across all
three card tiers — Standard, Premium and Flagship — while preserving the existing artwork and every
piece of existing functionality.

## Context (measured in this worktree before design)

- `/reveal` renders `app/reveal/page.tsx` → `app/reveal/RevealClient.tsx` → `app/lucky-card-reveal.js`.
  `RevealClient` supplies the page heading and sub-line only; every interactive and visual element of
  the draw lives in `app/lucky-card-reveal.js`.
- The entry control is the single `<button>` in `app/lucky-card-reveal.js` labelled **Reveal Today's
  Luck**, styled with the shared `.gold-3d-btn` / `.gold-cta-emoji` treatment from `app/globals.css`.
  It had `px-8 py-3.5`, no explicit minimum touch height, no `cursor-pointer` (Tailwind 4 preflight no
  longer gives buttons a pointer cursor), no `touch-manipulation`, and no visible tap instruction.
- The reveal choreography (canvas beams, Howler/Web Audio cues, Framer Motion flip) already varies by
  tier through `TIER_HITS` (3 / 4 / 5 hits) and the canvas intensity multiplier, and the tier colours
  already exist in the canvas `colors` map: standard `224, 148, 64`, premium `200, 204, 208`,
  flagship `218, 165, 32`.
- **Presentation gap:** once the card is revealed the on-screen result shows only the card artwork, a
  quote panel and the share control. The tier and the card's name are never shown, so a Premium or
  Flagship pull is indistinguishable from a Standard pull except by recognising the artwork, and the
  revealed card keeps a single neutral frame/glow for all three tiers.
- Existing behaviour that must not change: `LUCKY_CARDS` data and `selectWeightedLuckyCard`
  anti-repeat/weighting, the localStorage daily lock (`lucky-pick-canada-todays-lucky-moment`) and
  `unlockedCards` collection write, AVIF-first with WebP fallback artwork delivery, the
  `coast-to-coast-tale` artwork exception that opts out of the neutral polish frame, audio cues,
  `prefers-reduced-motion` handling, the share control, the collection binder, and the Return to Home
  link.

## User Scenarios & Testing

### User Story 1 — The entry control reads as a tappable button (Priority: P1)

As a visitor who has not drawn today's card, I see one large gold button with a clear tap
instruction, and pressing it gives immediate visual feedback.

**Why this priority**: The button is the only way into the experience; if it reads as flat decoration
the feature is undiscoverable on a phone.

**Independent Test**: Load `/reveal` with no stored card, focus/tap the entry control, and confirm it
is a real button with a ≥56 px target, a pointer cursor, a press/hover state from `.gold-3d-btn`, an
accurate accessible name, and an instruction that is announced as its description.

**Acceptance Scenarios**:

1. **Given** no card has been drawn today, **When** `/reveal` renders, **Then** exactly one entry
   button is present with the accessible name "Reveal Today's Luck".
2. **Given** the entry button, **Then** its rendered height is at least 56 px at both phone and
   desktop widths, it shows a pointer cursor on hover-capable devices, and it keeps the shared gold
   gradient, raised edge, hover lift and 2 px press state.
3. **Given** the entry button, **Then** the tap instruction is visible below it and is exposed
   through `aria-describedby`, so the button's accessible name is unchanged and screen-reader users
   hear the instruction once.
4. **Given** the draw is running, **Then** the instruction reads as an in-progress message and the
   button is disabled with its existing loading state.

### User Story 2 — The revealed card states its tier and name (Priority: P2)

As a collector, after the flip I see which tier I pulled and which card I received, presented in a
way that matches that tier.

**Why this priority**: The tier is the collectible's whole value signal and is currently invisible.

**Independent Test**: Reveal a Standard, a Premium and a Flagship card and confirm each shows its own
tier label, its own card name, and a tier-distinct accent.

**Acceptance Scenarios**:

1. **Given** a Standard pull, **Then** a "Standard Tier" chip, the card's name and the collection
   caption render using the Standard bronze accent.
2. **Given** a Premium pull, **Then** the same elements render with the Premium pewter accent.
3. **Given** a Flagship pull, **Then** the same elements render with the Flagship gold accent, with
   the strongest of the three treatments.
4. **Given** an unrecognised tier value, **Then** the Standard presentation is used rather than an
   unstyled or missing block.
5. **Given** any tier, **Then** the card artwork, quote and share control are unchanged.

### User Story 3 — The reveal moment is tier-aware (Priority: P3)

As a collector, the moment the card flips over feels different for a rare pull than for a common one,
using the same artwork and the same animation timings as before.

**Independent Test**: Reveal one card of each tier under normal motion and under reduced motion, and
confirm a tier-coloured halo/rim frames the revealed card, escalates with tier, and is present but
motionless for reduced motion.

**Acceptance Scenarios**:

1. **Given** the card has just flipped, **Then** a tier-coloured halo and rim fade in behind the
   revealed card without touching audio, canvas choreography or flip timings.
2. **Given** the three tiers, **Then** halo strength, rim strength and revealed-frame strength all
   increase from Standard to Premium to Flagship.
3. **Given** `prefers-reduced-motion: reduce`, **Then** the halo and rim are still visible and do not
   animate.
4. **Given** the card `coast-to-coast-tale`, **Then** its authored frame is preserved exactly as
   before and only the tier chip/name/halo are added.

### Edge Cases

- A stored card whose id no longer exists in `LUCKY_CARDS` keeps its current behaviour (no card).
- A stored quote is shown verbatim; the new presentation adds no new quote source.
- The halo layer must never intercept pointer events or be announced by assistive technology.
- The reveal is entered twice in one session (already-revealed state) — presentation must render from
  the stored card without re-running the draw.

## Requirements

### Functional Requirements

- **FR-001**: The entry control MUST remain the single existing button with the accessible name
  "Reveal Today's Luck", the existing `.gold-3d-btn` / `.gold-cta-emoji` treatment and the existing
  click handler.
- **FR-002**: The entry control MUST render a minimum 56 px target, a pointer cursor, `touch-
  manipulation` and the existing hover/press/focus-visible states, at phone and desktop widths.
- **FR-003**: A visible tap instruction MUST be added below the entry control and wired to it through
  `aria-describedby`; the button's accessible name MUST NOT change.
- **FR-004**: While the draw is running the instruction MUST show the in-progress message and the
  existing disabled/loading behaviour MUST be preserved.
- **FR-005**: A revealed card MUST display its tier label, its card `title`, and a collection caption.
- **FR-006**: Each tier MUST use its own accent: Standard bronze `#e09440`, Premium pewter `#c8ccd0`,
  Flagship gold `#daa520` — matching the colours already used by the reveal canvas.
- **FR-007**: Halo strength, rim strength and revealed-frame strength MUST each increase from
  Standard to Premium to Flagship.
- **FR-008**: An unrecognised or missing tier MUST fall back to the Standard presentation.
- **FR-009**: A tier-coloured halo and rim MUST appear behind the revealed card, MUST be
  `aria-hidden` and MUST NOT intercept pointer events.
- **FR-010**: Under `prefers-reduced-motion: reduce` the halo and rim MUST be visible but must not
  animate.
- **FR-011**: `LUCKY_CARDS`, `selectWeightedLuckyCard`, `selectRandomQuote`, the daily localStorage
  lock, the `unlockedCards` write, audio cue scheduling, canvas choreography, flip timings, the
  `coast-to-coast-tale` frame exception, the share control, the collection binder and the Return to
  Home link MUST NOT change.
- **FR-012**: Card artwork paths and the AVIF-first/WebP-fallback delivery MUST NOT change.
- **FR-013**: The change MUST add no dependency, route, API, network request, asset or data model.

### Key Entities

- **Tier presentation**: `{ id, label, glyph, accent, accentRgb, chipText, haloOpacity, haloBlur,
  rimOpacity, rimBlur, revealDuration, frameOpacity, innerGlow }` for one of `standard`, `premium`,
  `flagship`.
- **Revealed card**: the existing `LUCKY_CARDS` record plus a randomly assigned quote.

## Success Criteria

- **SC-001**: All three tiers render a distinct tier chip, accent and card name; a fourth, unknown
  tier value falls back to Standard.
- **SC-002**: The entry button reports a rendered height of at least 56 px and a pointer cursor at
  390 px and desktop widths, with a working `aria-describedby` target.
- **SC-003**: The executable test suite covers the entry affordance, the three tier presentations and
  the reduced-motion halo, and passes.
- **SC-004**: `./freebuff-verify.sh` passes and the measured production build stays below the 495 MB
  maximum.

## Assumptions

- "Improve the presentation and reveal experience" means the on-screen presentation layer around the
  existing artwork and animation; the flip choreography, beam canvas and audio cues are protected and
  are not re-timed.
- The tier colours already present in the reveal canvas are the authoritative palette, so the new
  presentation introduces no competing palette.
- The existing `Series 1` inventory language in the card data/tests is accurate for the caption.
