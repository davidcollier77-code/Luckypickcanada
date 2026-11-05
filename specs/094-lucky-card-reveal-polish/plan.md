# Implementation Plan: Daily Lucky Card Reveal Polish

**Branch**: `polish/reveal-card-tier-experience-20261105` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/094-lucky-card-reveal-polish/spec.md`

## Summary

Give the `/reveal` entry button a genuine tap affordance (≥56 px target, pointer cursor,
`touch-manipulation`, a visible instruction wired with `aria-describedby`, and the existing gold
press state), and add a presentation layer for the revealed card that names the tier and the card and
frames the reveal with a tier-coloured halo/rim that escalates from Standard to Premium to Flagship.
The artwork, card data, draw weighting, localStorage behaviour, audio cues, canvas choreography, flip
timings and share/collection controls are untouched.

## Technical Context

**Language/Version**: JavaScript / TypeScript (Next.js App Router, React 19; repository versions).

**Primary Dependencies**: Existing React, Tailwind CSS utilities, `framer-motion` (`motion`,
`useReducedMotion`), `howler`, `next/link`. No new dependency.

**Storage**: Read-only use of the existing `lucky-pick-canada-todays-lucky-moment` localStorage
record; no schema or payload change.

**Testing**: Vitest + React Testing Library (jsdom) for the tier presentation and the entry
affordance; repository gate `./freebuff-verify.sh` (Spec Kit governance, typecheck, production build,
docs tests).

**Target Platform**: Mobile and desktop web browsers.

**Project Type**: Single Next.js web application.

**Performance Goals**: No new network request, asset, dependency or animation loop. The halo is two
static layers plus one opacity fade driven by the existing `framer-motion` import; it is
`pointer-events: none` and is removed when the card is not revealed.

**Constraints**: Preserve `prefers-reduced-motion`; keep the 495 MB production-build ceiling; no
change to payments, API routes, authentication, database, deployment or secrets.

**Scale/Scope**: One component file, one new small pure module, two new test files, Spec Kit
artifacts, `.specify/feature.json`, memory bank and the PR summary.

## Constitution Check

- **Single source of truth**: PASS — the tier palette reuses the colours already declared in the
  reveal canvas; the button keeps the global `.gold-3d-btn` / `.gold-cta-emoji` classes and no
  competing button CSS is added.
- **Verify before acting**: PASS — inspected `AGENTS.md`, `.freebuff/freebuff.md`, the memory bank,
  `.freebuff/polishing.md`, `.freebuff/testing.md`, `.docs/manifest.json`, the current `/reveal`
  components, the global CTA styles, the existing card tests and the active feature numbering.
- **Implementation sequence**: PASS — specify → plan → tasks → implement, artifacts in
  `specs/094-lucky-card-reveal-polish/`.
- **Protect core systems**: PASS — no payments, API route, database, authentication, deployment or
  unrelated application behaviour is changed.
- **Accessibility and responsive behaviour**: PASS — decorative layers are `aria-hidden` and
  non-interactive; the accessible button name is unchanged; the instruction is exposed once through
  `aria-describedby`; reduced motion disables the fade.

## Phase 0 — Research

No external research was required. The facts needed were read from the repository: the entry button
markup and classes (`app/lucky-card-reveal.js`), the shared gold CTA states (`app/globals.css`), the
tier list and colours (`TIER_HITS`, the canvas `colors` map, `app/lucky-card-data.js`), the existing
`coast-to-coast-tale` frame exception, and the repository's jsdom component-test conventions
(`__tests__/components/LuckyRevealCelebration.test.jsx`).

## Phase 1 — Design

- **New pure module** `app/lucky-card-presentation.js` — `LUCKY_CARD_TIER_PRESENTATION` for
  `standard` / `premium` / `flagship` plus `getLuckyCardTierPresentation(tier)` with an own-property
  lookup and a Standard fallback. This keeps the tier values unit-testable without rendering.
- **`app/lucky-card-reveal.js`** — the only rendering change:
  - entry button: `min-h-14 w-full sm:w-auto cursor-pointer touch-manipulation`, `aria-describedby`
    on the existing button, and a new instruction paragraph that switches to an in-progress message
    while the draw runs;
  - revealed card: a `data-tier` chip with the tier label, an `h2` with the card `title`, a
    collection caption, and a tier-tinted quote-panel border;
  - behind the card: two `aria-hidden`, `pointer-events-none` layers (soft radial halo + rim) that
    fade in once `isRevealed` is true, with no transition under reduced motion;
  - card front: a tier-tinted inner ring added inside the existing
    `!preserveCoastToCoastPolish` branch, so the `coast-to-coast-tale` authored frame is untouched.
- **Tests** — `__tests__/lucky-card-tier-presentation.test.js` (pure tier contract, escalation,
  fallback) and `__tests__/components/LuckyCardRevealPresentation.test.jsx` (renders the real
  component with mocked audio/motion/next modules for each tier, the entry affordance, the unchanged
  artwork URLs, and the reduced-motion halo).

## Project Structure

```text
app/lucky-card-presentation.js                 (new)
app/lucky-card-reveal.js                       (entry button, tier chip, halo, frame)
__tests__/lucky-card-tier-presentation.test.js (new)
__tests__/components/LuckyCardRevealPresentation.test.jsx (new)
specs/094-lucky-card-reveal-polish/{spec,plan,tasks}.md
.specify/feature.json
memory-bank/activeContext.md
PR_SUMMARY.md
```

**Structure Decision**: Keep the presentation values in one small pure module so all three tiers are
verifiable by execution, and confine the markup change to the single component that already owns the
reveal. No new stylesheet, component, dependency or route.

## Complexity Tracking

No constitution violations or additional architecture are introduced.
