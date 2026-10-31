# Implementation Plan — Homepage Gold Button Raised Depth and Shimmer

## Technical Context
- Next.js App Router homepage (`app/homepage/HomePage.js`, client component) styled by `themes/default/homepage.css`, which is the file the homepage imports; `app/globals.css` holds the shared `suggestionBtnGlow` keyframes and reduced-motion override.
- The gold buttons are Tailwind-classed on the element (`bg-linear-to-b from-yellow-400 to-amber-600`, `rounded-full`), with hover/active transform utilities and arbitrary shadow utilities.
- No image asset is created or modified, so the AVIF-first with WebP fallback strategy is unaffected.

## Decisions
1. Add one shared `gold-3d-btn` class to the nine gold homepage buttons instead of repeating new utilities nine times, keeping the visual definition in one place.
2. Define the depth in `themes/default/homepage.css` under `.homepage-experience .gold-3d-btn` so the rule outranks the existing Tailwind hover/active transform and arbitrary shadow utilities by specificity (0,2,0 vs 0,1,0/0,2,0) and by source order against the earlier `.suggestion-box-submit:hover/:active` declarations in the same file. Existing utility classes stay in the markup, so no unrelated styling is removed if this class is ever dropped.
3. Model the physical press with a solid `0 3px 0 #a16207` bottom edge plus stacked shadow; hover raises the button 2px and lengthens the edge, `:active` pushes it 2px down with the edge collapsed to `0 1px 0`. The 120ms transform/shadow transition on release provides the tactile return; `:active` shortens it to 60ms.
4. Reuse the Tip Jar's existing shimmer overlay markup for the Suggestion button (same `animate-shimmer` 12s sweep, same `via-white/30` gradient, same `overflow-hidden` clipping) rather than authoring a second shimmer, and tag both overlays with `gold-shimmer` so reduced motion can disable them.
5. Extend the existing `suggestionBtnGlow` keyframe shadows with the same bottom-edge and inset layers, and pause that glow animation while the button is pressed, so the Suggestion button shares the depth and the press flattening of its neighbours while keeping its glow pulse.
6. Respect `prefers-reduced-motion: reduce` by disabling the shimmer animation and the lift/press transforms while keeping the static raised shadow.

## Verification
- `pnpm exec tsc --noEmit`, `pnpm test`, clean production build with measured `.next` + `public` size against the 495 MiB hard cap.
- `./jules-verify.sh` (Spec Kit governance gate, typecheck, build, refresh-docs tests).
- Inspect the built CSS to confirm the new rules and reduced-motion block survive the build, and that the shimmer keyframes referenced by the markup exist.
- Add `tests/visual/gold-cta.spec.ts` to the existing Playwright project so the treatment is asserted against computed styles in real Chromium at the desktop, 390px, and 412px viewports. The spec stays inside the configured `tests/visual` directory, so `visual-qa.yml` runs it with no workflow change, and its evidence screenshots are written to `test-results/`, which the workflow already uploads.
- Because a running CSS animation owns `box-shadow`, the glow buttons are asserted on lift and pressed depth only; the 5px hover edge is asserted on the non-glowing CTAs. This records real browser behaviour instead of a rule the cascade cannot satisfy.
- Run the spec locally where Chromium is available and confirm the same code path in the free `ubuntu-latest` Visual QA job on the PR. If Chromium cannot start in a container, report the check as BLOCKED rather than passed and rely on the workflow result only once it is actually observed.
