# Implementation Plan: Lucky Card Reveal Cinematic Enhancement

**Branch**: `freebuff/4818369485c7528fe69e661a` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/101-lucky-card-reveal-cinematics/spec.md`

## Summary

Turn the daily reveal into a directed light event and give every card one premium finish. The stage
gains a tier-tinted charging aura during the draw and, on reveal, a spotlight, a light shaft, the
existing halo/rim, expanding shockwave rings, one-shot embers and a floor shadow. Both card faces
gain the same gloss/specular/bevel finish, and the revealed front adds a tier gloss bloom and a
single diagonal glint pass; `coast-to-coast-tale` now receives that finish while keeping its authored
frame. The tier block, quote and share control settle in with staggered transitions. All values come
from the existing tier presentation module, escape from it, and no reveal functionality changes.

## Technical Context

**Language/Version**: JavaScript (JSX) / TypeScript, Next.js 16 App Router, React 19.

**Primary Dependencies**: existing `framer-motion` (`motion`, `useReducedMotion`, `useAnimate`),
`howler`, `next/link`. No new dependency.

**Storage**: unchanged read/write of `lucky-pick-canada-todays-lucky-moment` and `unlockedCards`.

**Testing**: Vitest (executed tier contract and source/markup guard), the full Vitest suite,
`pnpm exec tsc --noEmit`, a Playwright browser probe against the production build, and
`./freebuff-verify.sh`.

**Target Platform**: mobile and desktop browsers; reduced-motion respected.

**Project Type**: single Next.js web application.

**Performance Goals**: no new network request, asset, dependency or reveal loop. Stage effects are
one-shot transforms/opacities on a handful of absolutely positioned elements; the beam canvas
choreography is untouched.

**Constraints**: 495 MB production build ceiling; no change to payments, API routes, database,
authentication, deployment, secrets, audio assets or timing constants; no card artwork change.

**Scale/Scope**: `app/lucky-card-presentation.js`, `app/lucky-card-reveal.js`, two existing test
files updated for the new contract, Spec Kit artifacts, `.specify/feature.json`, memory bank and the
single PR summary.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` stays authoritative; the tier values remain in
  `app/lucky-card-presentation.js` and the reveal stays in the one component that owns it.
- **Verify before acting**: PASS — read `AGENTS.md`, `.freebuff/freebuff.md`, the memory bank,
  `.freebuff/polishing.md`, `.freebuff/testing.md`, `.docs/manifest.json`, spec 094 and its shipped
  code, the current component, the tier module, the existing guards and the verification script.
- **Implementation sequence**: PASS — specify → plan → tasks → implement, artifacts under
  `specs/101-lucky-card-reveal-cinematics/`.
- **Protect core systems**: PASS — no payment, API route, database, authentication, deployment or
  secret change; the Lucky Reveal popup and Crystal Ball are untouched.
- **Resource conservation**: PASS — no `.docs/` write, no dependency change, no new asset.
- **Accessibility and responsive behaviour**: PASS — every new layer is `aria-hidden` and
  `pointer-events: none`; reduced motion keeps the static lighting and drops one-shot animation; no
  accessible name changes; stage layers are centred and bounded so no horizontal overflow is added.

## Phase 0 — Research

No external research was needed. The facts that decide the design were measured in this worktree:
the three tier palettes and multipliers in `app/lucky-card-reveal.js`, the existing hashed
motion/timing constants, the previous finish styles and the `coast-to-coast-tale` exception (spec
094 plus the shipped code), the tier escalation contract in `app/lucky-card-presentation.js`, and
the existing guards in `__tests__/lucky-card-tier-presentation.test.js` and
`__tests__/lucky-card-reveal-presentation.test.js`. The routed reference set for the selected groups
supplied no behaviour that overrides those measurements; the two library documents actually used are
recorded in the PR summary.

## Phase 1 — Design

- **`app/lucky-card-presentation.js`** — extend each tier record with `spotlightOpacity`,
  `shockwaveOpacity`, `shockwaveScale`, `glossOpacity`, `sweepDuration` and `emberOpacity`. Values
  stay presentation-only and keep the own-property lookup with the Standard fallback.
- **`app/lucky-card-reveal.js`**
  - one module-scope `CardFinish` component paints the shared finish: diagonal gloss, top-left
    specular highlight, bevel edge, and — on the revealed front only — a tier gloss bloom and one
    glint sweep. It is rendered unconditionally on the back and the front of the card, including
    `coast-to-coast-tale`; that card keeps `style={preserveCoastToCoastPolish ? undefined :
    cardPolishFrameStyle}` for its authored frame.
  - the stage wrapper renders a charging aura while `isGenerating`, then on reveal a spotlight, a
    light shaft, the existing halo and rim, one or two shockwave rings, rising embers and a floor
    shadow. All are `aria-hidden`, `pointer-events-none`, and the one-shot layers are gated on
    `!shouldReduceMotion`.
  - the tier block, quote panel and share control become `motion` elements with increasing delays;
    copy, order, classes and layout stay as shipped.
- **Tests** — extend the executed tier contract (complete finish palette for every shipped card,
  strict escalation of all six new values) and update the structural guard to pin the two-face
  finish, the stage layers, the preserved authored frame and every preserved functional contract.

## Project Structure

```text
app/lucky-card-presentation.js                  (extended tier stage values)
app/lucky-card-reveal.js                        (CardFinish, cinematic stage, staged arrival)
__tests__/lucky-card-tier-presentation.test.js  (executed contract additions)
__tests__/lucky-card-reveal-presentation.test.js (markup guard updated)
specs/101-lucky-card-reveal-cinematics/{spec,plan,tasks}.md
.specify/feature.json
memory-bank/activeContext.md
memory-bank/progress.md
PR_SUMMARY.md
artifacts/reveal-card-cinematics/probe.cjs      (browser evidence)
```

**Structure Decision**: keep every visual value in the existing pure module so all three tiers are
verifiable by execution, and keep the rendering in the single component that already owns the
reveal. No new stylesheet, component file, dependency or route.

## Complexity Tracking

No constitution violations. The only structural addition is one module-scope presentational
component inside the existing reveal file, which removes duplicated finish markup from the two card
faces rather than adding architecture.

## Review addendum — method (PR #1743, 2026-11-06)

1. **Enumerate.** Read conversation comments, inline review threads, formal reviews and check runs for
   PR #1743 at head `18731264`. The unauthenticated REST API returned 403 (rate limit) from this VM, so
   the GitHub integration was used as the documented alternative; its payloads truncate, so inline
   threads were paged one at a time and check runs were filtered by name.
2. **Verify each point against the code.** Open the exact cited location at HEAD and reason about the
   real behaviour: `app/lucky-card-reveal.js:125–140` (glint gating), `:76–83` and `:2038–2061`
   (ember list and keys), `__tests__/lucky-card-reveal-presentation.test.js:127–133` (slice anchors),
   `PR_SUMMARY.md:130` and `playwright.config.ts` + `tests/visual/` (reduced-motion coverage).
3. **Classify.** Valid / partially valid / invalid / already addressed, then separate merge blockers
   from optional hardening and from items this review could not verify.
4. **Record.** Findings and limitations in `artifacts/reveal-card-cinematics/out/pr1743-review-findings.md`;
   the canonical PR summary carries the same conclusions.

**Constraints honoured:** read-only. No code, test, dependency, workflow or baseline edit; no reply,
resolution, approval or merge; no paid service subscribed (the Pullfrog quota failure is reported, not
topped up).

**Unaffected by design:** the review adds no runtime path, so the production build size and the tier /
finish behaviour are unchanged from the reviewed head.
