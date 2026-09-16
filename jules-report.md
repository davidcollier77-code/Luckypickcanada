A — VERIFIED ANALYSIS
- Identified `components/DailyResonance.tsx` as the component housing the Lucky Meter.
- Confirmed the background is an `<img>` tag loading `lucky-meter-night-sky.webp`.
- The background sits at `z-index: -20` with a dark overlay at `z-index: -10`.
- Aurora canvas sits behind the main content but above the background image.
- `prefers-reduced-motion` logic is well established and must be adhered to.

B — BOUNDARIES AND PLAN
- Goal: Create a subtle twinkling star effect to layer above the background image but below everything else.
- Constraint: No changes to the original background asset.
- Constraint: High performance, minimal React re-renders. Use HTML5 canvas.
- Constraint: Only place stars in the top portion of the screen (top 55%) to avoid the foreground landscape.
- Constraint: Respect `prefers-reduced-motion` by drawing static stars but skipping the `requestAnimationFrame` loop.
- Plan: Created a standalone `<TwinklingStars />` canvas component and placed it at `z-index: -15` inside `DailyResonance.tsx`.

C — EXECUTION, VERIFICATION, AND FINAL STATE
- Created `components/TwinklingStars.tsx`.
- Updated `components/DailyResonance.tsx` to import and render `<TwinklingStars />`.
- Ran `./jules-verify.sh`, which passed all build and validation checks.
- Ran `pnpm test`, all tests passed.
- No unexpected files were modified.

Libraries Consulted / Used:
- React (Core architecture)
- None specifically for documentation (Used standard HTML5 Canvas API and React Hooks).
