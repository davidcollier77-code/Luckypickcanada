# Feature Specification: Lucky Reveal Confetti Lifecycle (Phase 1)

**Feature Branch**: `freebuff/d4bf506e672ecbddc0a33655`

**Created**: 2026-11-02

**Status**: Implementing

**Input**: Master Work Request #1 — Phase 1 of the Lucky Pick reveal experience polish: fix the
maple-leaf confetti behaviour without redesigning the reveal, verify both reveal sounds, and verify
both number-selection modes while leaving number generation untouched.

## Context (verified before design)

- The one reveal is `LuckyRevealPopup` (`app/lucky-reveal-popup.js`), used by the homepage, the free
  preview switch and the gift route (`app/reveal/[revealId]/page.tsx`). Feature 076 added
  `app/lucky-reveal-celebration.jsx`; feature 078 layered its settled leaves and moved that layer
  behind the panel.
- **Particles.** `launch()` creates a `<canvas>` imperatively, appends it to `document.body` as a
  `position: fixed`, `100vw`/`100vh`, `z-index: 100` layer, and fires **five** bursts in one tick:
  34 + 34 + 16 + 16 + 12 = **112 particles** with `ticks: 160` (about 2.67 s at 60 fps) and
  `gravity: 1.05`. Nothing caps how many are alive, the canvas lives outside the reveal's own DOM,
  and it survives the end of the effect until the component unmounts.
- **Accumulation.** After the burst, the celebration layer paints 18 settled leaves plus a gold glow
  at `z-index: 1` behind the panel (`z-index: 2`). The layer has no end state: it stays mounted for as
  long as the reveal is open, so leaves remain stacked behind and around the reveal container.
- **Sounds.** The only reveal audio is `playConfettiPop()` (`/sounds/confetti-pop.wav`, mono 24 kHz,
  **0.90 s**), played once when the final number has settled. Nothing plays when the reveal opens, so
  the opening sparkle is **missing**. `/sounds/chime-sound.mp3` (128 kbps, 44.1 kHz, **1.25 s**) is
  committed and unused, giving a brief same-origin asset with no new dependency.
- **Number modes.** `createLuckyReveal()` generates six numbers from 1–49 and seven from 1–50. The
  popup animates each number at `startNumbersDelay = 2.0 s` plus `0.35 s` per number and a `0.9 s`
  reveal, so the final number lands inside the existing 2–3 s target and
  `celebrationDelayMs = (2.0 + (n - 1) * 0.35 + 0.95) * 1000` starts the celebration after it.

## User Scenarios & Testing

### US1 — Leaves stay in the reveal and disappear (P1)

Someone watching the reveal sees golden maple leaves fall across the reveal, and once the celebration
ends nothing is left behind: no leaf stuck behind or around the reveal container, no invisible
full-screen canvas.

**Acceptance**: the particle canvas lives inside the reveal overlay (clipped to it, above the panel so
the leaves stay visible), no more than the declared maximum particles are alive at once, every
particle has a bounded lifetime, the confetti runs about 3–4 s, and the celebration layer plus canvas
are gone when the celebration finishes and when the reveal closes.

### US2 — Reveal experience unchanged (P1)

The reveal still reveals its numbers one at a time within 2–3 s, keeps the golden glow, shimmer,
sparkle, maple-leaf artwork, panel styling, copy, share control and map CTA.

**Acceptance**: number timing, row layout, swatch, shimmer, sparkle and the settled-leaf finish are
preserved; no visual redesign, no new dependency, no route/API/payment/email change.

### US3 — Both sounds are present and brief (P2)

The reveal opens with a short sparkle and finishes with a short chime after the final number.

**Acceptance**: an opening sparkle asset is loaded and played once when the reveal opens, the existing
finishing pop still plays once at the final number, both are under about 1.5 s, and neither is created
when the visitor prefers reduced motion.

### US4 — Both number-selection modes behave identically (P1)

Six Pick and Seven Pick both reveal their numbers individually and celebrate after the last one.

**Acceptance**: the celebration delay is derived from the number count for both modes, the number
generation module is unmodified, and existing guards for 6→3+3 and 7→4+3 rows still pass.

### Edge cases

- Visitor prefers reduced motion: no particles, no canvas, no sound; the static settled finish is
  preserved.
- The reveal is closed mid-celebration: the wave timers, the confetti instance and the canvas are
  released immediately.
- The particle library fails to load: the reveal and the static finish still render, and failures are
  logged rather than thrown.

## Requirements

- **FR-001**: The particle canvas MUST render inside the reveal overlay so the falling leaves are
  confined to the reveal's animation area and are removed with it.
- **FR-002**: The number of simultaneously active particles MUST be capped and enforced in code
  (maximum 96).
- **FR-003**: Every particle MUST have a bounded lifetime, and particles that leave the animation area
  MUST stop being painted.
- **FR-004**: The confetti MUST last about 3–4 s in total (wave schedule plus particle lifetime).
- **FR-005**: The celebration layer, canvas, confetti instance and all animation timers MUST be
  released when the celebration finishes and when the component unmounts, leaving no leaf behind the
  reveal container.
- **FR-006**: The individual number animation MUST stay within the existing 2–3 s target, and the
  golden glow, shimmer, sparkle, maple-leaf artwork and existing design MUST be preserved.
- **FR-007**: A brief opening sparkle MUST play when the reveal opens, and the existing finishing
  chime MUST still play once after the final number.
- **FR-008**: Reduced-motion visitors MUST get no particles and no sound, and MUST keep the static
  finish.
- **FR-009**: Six Pick and Seven Pick MUST keep revealing numbers individually and celebrating after
  the final number, and the random-number generation logic MUST remain unchanged.
- **FR-010**: No change to payment, email, database, deployment, routes or dependencies.

## Success Criteria

- **SC-001**: Source and behavioural guards show at most 96 particles fired in total, a 3–4 s
  celebration window, and a per-particle lifetime.
- **SC-002**: After the celebration window the celebration layer and the canvas are absent from the
  DOM; unmounting mid-celebration also leaves no canvas and no pending timers.
- **SC-003**: Both sound effects are requested once each at the documented moments, using existing
  same-origin assets shorter than 1.5 s.
- **SC-004**: The existing 076/078 reveal guards and the full Vitest suite pass; `tsc --noEmit` and
  `./freebuff-verify.sh` pass; the production build stays under 495 MB.


## Post-merge Cloudflare build hotfix — 2026-11-03

The first production Cloudflare build after PR #1684 failed while parsing
`app/lucky-reveal-celebration.jsx`: the `defaults` object literal was not closed before the confetti-wave scheduling loop. The fix closes the object immediately after its final `scalar` property and removes the obsolete local particle counter; particle accounting continues to use `firedParticlesRef.current`.

**Additional acceptance:** the component must parse and the OpenNext Cloudflare production build must compile successfully at the repair PR head. The existing component test imports this module and provides a parse-time regression gate when the test suite runs.
