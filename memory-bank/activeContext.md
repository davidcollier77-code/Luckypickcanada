# Active Context — Lucky Meter Cinematic Redesign

- **Updated:** 2026-11-15
- **Repository:** `davidcollier77-code/Luckypickcanada`
- **Branch:** `freebuff/645448188e4eb950b3b04f32`
- **Base:** `main`
- **Spec Kit feature:** `specs/164-lucky-meter-cinematic-redesign`

## Current Task

Redesign the Lucky Meter into a cinematic, realistically rendered experience while
preserving its result logic, reveal timings, sharing, storage, artwork and the
existing Milky Way background.

## Implemented state

- The Milky Way `<picture>`, responsive sources, `object-position: center 40%`,
  overlay and layer order are unchanged.
- The composition is bottom-anchored around an always-mounted circular meter:
  heading and Start above it, supporting details and Share below it, Home in the
  top-right corner. The ring has a viewport-aware minimum size so its centre text
  never clips on short viewports.
- Home follows the persisted lifecycle: visible before Start, removed on the
  Start press, hidden across the scramble, landing, details and the whole event,
  and restored only once the cinematic (including the final golden sparks) has
  finished. A refresh mid-event resumes the stored event with Home still hidden.
- `cosmic-event-engine.js` renders a far surface behind the interface and a
  pointer-transparent near surface above it. Meteors use continuous plasma
  streaks, lightning uses a bounded branching geometry with a white-hot core and
  additive bloom, red fireworks are dense peonies while silver is finer crackling
  sparkle, and the finale is a large golden chrysanthemum with willow streamers
  and foreground sparks that fall across the interface.
- Particle sizes scale with viewport area; per-surface point budgets are bounded;
  silver crackle children are terminal so the particle count cannot run away; the
  frame governor steps resolution and budgets down before it drops the near layer.
- Two recorded cues were added (finale boom, thunder rumble) with a committed
  provenance record; existing cues are unchanged.

## Verification

- 80 Vitest files / 769 tests passed; `tsc --noEmit` exit 0.
- `./freebuff-verify.sh` passed; production build recorded in the PR body and
  strictly below the 495 MiB cap.
- Chromium browser QA: 27/27 checks covering welcome, lifecycle, event, Share
  clickability, persistence, refresh resume, reduced motion, WebGL-disabled
  fallback and mobile 390 × 844.
- Audio files were verified sample-for-sample against their Mixkit masters
  (correlation 1.0), confirming they are recordings rather than generated audio.

## Limitations

- Firefox and WebKit binaries are unavailable in this environment, so those
  engines were not executed.
- No hardware GPU is exposed; Chromium ran on SwiftShader. Frame-rate behaviour on
  real GPUs and the near-layer path at full quality are not measured here.
- Real-device Samsung Internet, Opera and Edge runs were not performed.
