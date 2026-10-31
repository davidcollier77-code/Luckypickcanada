# Homepage Gold Button Raised Depth and Shimmer

## Goal
Give the homepage's gold call-to-action buttons one consistent raised 3D appearance with tactile press-and-release feedback, and add the missing moving shimmer to the Suggestion button so it matches the Tip Jar button it sits alongside.

## Evidence for the change
- `app/homepage/HomePage.js` renders nine gold buttons that share the same Tailwind surface (`bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900`): Check Lucky Meter, Reveal Today's Card, Consult the Oracle, Lucky Stories, Choose a Lucky Pick, Gift a Lucky Pick, Open the tip jar, Send suggestion, and the about-section call to action.
- Those nine buttons only had a soft drop shadow plus `hover:scale-105 active:scale-95`, so they read as flat gold pills and the press feedback is a scale squeeze rather than a press into the surface.
- Only the Tip Jar button carried a moving shimmer (`animate-shimmer` overlay span). The adjacent Suggestion button had a static glow pulse (`suggestion-btn-glow`) but no moving shimmer, so the pair was visibly inconsistent.

## Requirements
- **FR-001**: The nine gold homepage buttons must share one raised-3D treatment: a gold bottom edge plus layered drop shadow that reads as physical depth.
- **FR-002**: Hover/focus must lift the button slightly; pressing must push it down and flatten the bottom edge; releasing must animate back, so the interaction reads as press-and-release.
- **FR-003**: The Suggestion button must gain the same moving golden shimmer as the Tip Jar button, reusing the existing shimmer overlay and timing rather than inventing a new effect.
- **FR-004**: The existing Suggestion glow pulse must remain, now carrying the same raised depth so it does not look flatter than its neighbours.
- **FR-005**: `prefers-reduced-motion: reduce` must remove the shimmer animation and the lift/press transforms.
- **FR-006**: Button wording, gold palette, size, layout, focus-visible outline treatment, click handlers, destinations, and disabled behaviour must not change.
- **FR-007**: The treatment must be provable in a real Chromium browser at the desktop and both mobile viewports: raised rest edge, hover lift, press flattening, shared shimmer/glow, alignment without overlap or horizontal overflow, and the reduced-motion fallback. Static CSS inspection alone does not satisfy this requirement.

## Acceptance Scenarios
1. All nine homepage gold buttons show the same raised bottom edge and shadow at rest.
2. Hovering lifts a button; pointer/keyboard press pushes it down and flattens the edge; release returns it.
3. The Suggestion button and Tip Jar button both show the same slow golden shimmer sweep.
4. With reduced motion enabled, no shimmer animation and no transform movement occur, while the raised shadow remains.
5. Each button still submits, opens its checkout/tip jar, or navigates to the same destination as before.
6. A Chromium run reports no overlapping or horizontally overrunning CTA, no CTA below the 44px touch-target height, and the expected rest, hover, press, shimmer, glow, and reduced-motion computed styles on desktop, 390px, and 412px viewports.

## Out of Scope
- Any change to wording, imagery, artwork, section layout, page structure, or gold colour values.
- Non-homepage buttons (map, crystal ball, checkout modal, card reveal, gift pages).
- New image assets; the effect is pure CSS, so the AVIF-first/WebP-fallback image strategy is untouched and no asset needed conversion.
- New dependencies, Tailwind configuration changes, or build configuration changes.
