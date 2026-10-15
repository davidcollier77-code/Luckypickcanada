# Implementation Plan — Crystal Ball Fortune Reveal Enhancement

1. Technical Context:
   - Component: `app/components/CrystalBall/CrystalBall.tsx` and `CrystalBall.module.css`.
   - Backend: `/api/oracle` returns a complete JSON response (not a stream).

2. Implementation Phases:
   - **Phase 0: Interaction Overhaul.** Introduce a progressive text reveal mechanism inside `CrystalBall.tsx`. The text is split by words. A `useEffect` handles sequential word reveal using a calculated dynamic timing based on word count.
   - **Phase 1: Cinematic Elements.** Add a lightweight SVG golden maple leaf that animates alongside the revealing text. Update CSS keyframes in `CrystalBall.module.css` to coordinate the glow and pulse states with the new progressive reveal logic.
   - **Phase 2: Accessibility & Layout.** Wrap the animated words with `aria-hidden="true"`, adding a screen-reader-only element containing the full text inside an `aria-live` region. Implement smooth scroll into view on submit, with respect for `prefers-reduced-motion`. Prevent double submissions and clean up timeouts.

3. Testing & Verification:
   - Update/Verify Playwright interaction tests (`crystal-ball-interactions.spec.ts`).
   - Run `pnpm run build` and ensure build size is under 495 MB.
   - Run `./jules-verify.sh`.


4. Regression repair for the Cloudflare compile failure:
   - Restore the opening `<span>` element in `fortuneWords.map` and retain only the content-derived `key` (`word + '-' + i`).
   - Confirm the map returns valid JSX and preserve the existing animation class names and word text.
   - Verify TypeScript, production build, Spec Kit governance, and the Cloudflare OpenNext build through CI; do not claim deployment success from source inspection alone.

5. Repair the follow-on `GoldenLeaf.tsx` compile error by restoring the complete existing gradient/path JSX, binding both gradient definitions and references to their unique `useId()` values, and preserving the original maple-leaf path data. Re-run all required CI verification; OpenNext checks are not valid until `next build` passes.
