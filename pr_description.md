A — Analysis
- Current implementation analyzed: The Lucky Meter was using an inline starfield in `DailyResonance.tsx`, not `components/Starfield.tsx`. This inline implementation used a plain `#ffffff` background clear with simple global alpha bouncing.
- `components/Starfield.tsx` exists but is unused for this component.
- The `Aurora.tsx` component was using wide, thick `bezierCurveTo` strokes with large line widths and linear gradients, which created the unwanted cloud/oval/wave effect.
- Verified these facts directly by inspecting the code on main.

B — Boundaries
- Modified the inline starfield in `DailyResonance.tsx`.
- Modified the atmospheric rendering in `Aurora.tsx`.
- Deliberately avoided touching `components/Starfield.tsx` to prevent unrelated cleanup/breakage elsewhere.
- No new libraries or heavy particle engines were introduced. Maintained the lightweight Canvas architecture.
- Left audio, fireworks choreography, and business logic completely untouched.

C — Completion
- Exact files changed: `components/Aurora.tsx`, `components/DailyResonance.tsx`
- Final background design: A rich deep-space base gradient (near-black to deep navy to near-black) is drawn every frame. The old CSS `opacity-60` was removed so the space base is visible.
- Star-field design: Up to 350 stars on desktop (150 on mobile), utilizing depth layers (base alpha and radius correlated).
- Twinkling behavior: Organic asynchronous scintillation using a sine wave offset by a random phase per star, rather than simple linear bouncing. Brighter foreground stars have a slightly larger twinkle range.
- Atmospheric treatment: Removed the large Bezier curves. Replaced with 4 soft, rotating/translating radial-gradient wisps (Teal/Cyan, Cool Violet, Navy/Blue, plus a central glow) that provide subtle dimensional depth without looking like clouds.
- Aurora phase behavior: Preserved `setPhase` (idle, awaken, gather, impact, settled) but mapped it to wisp opacity and scaling.
- Mobile/Desktop behavior: Adjusts star count dynamically based on `window.innerWidth`.
- Reduced-motion behavior: Star twinkle speed is reduced by 90%, and Aurora wisp translation/rotation speed is reduced by 75% when `prefers-reduced-motion` is true.
- Performance considerations: Maintained `fillRect` instead of `arc` for stars. Reduced string interpolations where possible. Kept the array memory stable by generating it once.
- Verification performed: Ran `./jules-verify.sh`, Next.js build, and TypeScript checks to confirm syntax and performance.
- Confirmation: Audio untouched, fireworks untouched, protected/business functionality untouched.

The result is a visually pleasing, sophisticated deep-space atmosphere matching the premium cinematic aesthetic requested.
