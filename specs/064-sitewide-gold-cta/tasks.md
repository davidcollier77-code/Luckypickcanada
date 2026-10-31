# Tasks — Site-wide metallic gold primary CTA

- [x] T001 Measure the emblem gold (SVG stops + WebP/PNG pixel percentiles) and
      record the derived highlight/main/deep/edge HEX values in spec.md.
- [x] T002 Replace the homepage-scoped 3D block with one global `.gold-3d-btn`
      treatment in `app/globals.css` (rest, hover/focus, press, sheen, pulse,
      reduced motion, emoji alignment).
- [x] T003 Recolour the legacy homepage gold CTA gradients to the measured ramp.
- [x] T004 Add the assigned leading emoji to the nine homepage primary CTAs.
- [x] T005 Adopt the shared treatment on the Lucky Map CTAs (View Lucky Stories,
      Share your lucky story ×2, Share This Story, Submit Story).
- [x] T006 Adopt the shared treatment on Lucky Card Reveal (♠).
- [x] T007 Adopt the shared treatment on Daily Resonance / Lucky Meter (✨).
- [x] T008 Adopt the shared treatment on both Crystal Ball primary CTAs (🔮).
- [x] T009 Adopt the shared treatment on checkout submit (🔒) and the reveal
      popup map CTA (📍); recolour the share CTA.
- [x] T010 Keep Tip Jar and Suggestion shimmer/pulse timing and pauses unchanged.
- [x] T011 Exclude Explore Your Luck (confetti button) — no change.
- [x] T012 Update the Playwright edge-colour constant to the measured edge and add
      `tests/visual/sitewide-gold-cta.spec.ts` for the site-wide treatment.
- [x] T013 PASS — `pnpm exec tsc --noEmit` exit 0; `pnpm test` 22 files / 152
      tests; `./jules-verify.sh` exit 0 (Spec Kit gate, typecheck, build,
      refresh-docs 17/17); build `.next` + `public` = 330,131,271 bytes /
      314.84 MiB (< 495 MiB).
- [x] T014 PARTIAL — rendered Chromium checks pass on `/map` (desktop),
      `/lucky-meter` (desktop, mobile-390, mobile-412) and `/about` (all three
      viewports). Homepage and Crystal Ball rendering is BLOCKED: the container's
      Chromium renderer crashes on those routes, reproduced with this branch
      stashed (unmodified baseline), so it is not caused by this change.
      Homepage appears instead as served-markup + compiled-CSS evidence.
- [ ] T015 CI Playwright run of `gold-cta.spec.ts` and
      `sitewide-gold-cta.spec.ts` on a working Chromium — pending.
