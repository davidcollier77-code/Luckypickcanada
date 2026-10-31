# Plan — Site-wide metallic gold primary CTA

## Approach

Build on merged PR #1650 (raised depth + shimmer) and #1651 (shared glow pulse)
instead of recreating them. The existing `.gold-3d-btn` class already marks the
nine homepage gold CTAs and already carries the 3D/press/shimmer behaviour, so
it becomes the single site-wide treatment; it moves from the homepage-scoped
block in `themes/default/homepage.css` to `app/globals.css` so every route can
use it.

## Changes

1. `app/globals.css`
   - New unlayered `.gold-3d-btn` rule set: measured gold ramp, `1px` specular
     border, inset top highlight, inset bottom shade, `0 3px 0 #8a550c` raised
     edge plus two layered shadows and a restrained 22px glow.
   - Hover/`:focus-visible` lift (`translateY(-2px)`, brightness 1.06, 5px edge)
     and `:active` press (`translateY(2px)`, 1px edge, 60ms transition) with the
     release returning over the 180ms transition.
   - `::after` sheen sweep and `::before` gentle pulse for standard CTAs, scoped
     with `:not(.gold-btn-glow)` so the Tip Jar and Suggestion buttons keep their
     existing 12s shimmer span and 3s `goldBtnGlow` keyframes untouched.
   - `.gold-cta-emoji` sizing/alignment (0.92em, 0.42em gap, baseline nudge).
   - `prefers-reduced-motion` block: no transform, filter, sheen or pulse.
2. `themes/default/homepage.css`
   - Removes the now-duplicated homepage-scoped 3D block (single source of truth).
   - Recolours the legacy grouped gold CTA gradient, its hover state and the
     `rounded-full`/`cta-glow` fallback to the measured ramp.
3. `app/homepage/HomePage.js` — nine leading decorative emoji (existing wording).
4. `app/lucky-map-of-canada/lucky-map-of-canada.js` — five gold CTAs adopt
   `gold-3d-btn`; their bespoke inline gold background/border/shadow is removed so
   the shared depth, hover and press states apply; emoji added.
5. `app/lucky-card-reveal.js` — reveal CTA adopts the shared class and ♠; the
   duplicated Tailwind-only shimmer gradient is dropped in favour of the shared
   sheen.
6. `components/ResonanceButton.tsx` — Daily Resonance/Lucky Meter CTA adopts the
   shared gold CTA with ✨.
7. `app/components/CrystalBall/CrystalBall.tsx` + `.module.css` — both Crystal
   Ball primary button states adopt the shared class, measured ramp and 🔮.
8. `app/checkout-modal.js` — secure-checkout submit adopts the shared class and 🔒.
9. `app/share-lucky-pick-button.js`, `app/lucky-reveal-popup.js` — inline gold
   gradients, borders and shadows recoloured to the measured ramp with the raised
   edge; existing hover/active behaviour, wording and handlers preserved.
10. `tests/visual/gold-cta.spec.ts` — the edge-colour constant follows the new
    measured edge (`rgb(138, 85, 12)`); every structural assertion is unchanged.

## Risks and mitigations

- **Cascade:** the shared rules are unlayered, so they beat Tailwind utilities;
  the old homepage-scoped rules are removed to avoid a higher-specificity clash.
- **Glow ownership:** `box-shadow` keyframes would fight the hover edge; the pulse
  is an overlay shadow instead, and the Tip Jar/Suggestion pair is excluded.
- **Protected behaviour:** no handler, route, wording, state or asset is edited;
  only presentation.

## Verification

`./jules-verify.sh`, `pnpm exec tsc --noEmit`, `pnpm test`, build-size gate,
compiled-CSS/markup inspection, and Playwright desktop/mobile checks for the
shared treatment, emoji placement, hover/press/release and the preserved
Tip Jar/Suggestion and Explore Your Luck behaviour.
