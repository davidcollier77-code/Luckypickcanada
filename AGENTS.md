# LuckyPickCanada Agent Guide

Welcome to the LuckyPickCanada permanent operating guide. This document serves as the repository-specific instruction manual for future AI coding agents. It describes the actual implementation, core user experiences, visual language, performance constraints, and strict safety rules to follow when modifying this codebase.

## 1. Project Identity

LuckyPickCanada is a complete entertainment experience built around Canadian luck, mystery, community, and premium visual presentation. It is NOT merely a random number generator. It combines immersive visuals (Aurora borealis, shooting stars, cosmic effects) with interactive daily rituals (Lucky Picks, Card Reveals, Lucky Meter, and Crystal Ball) and community features (Lucky Map, Stories).

## 2. Core User Experiences

### A. Main Lucky Pick Experience
- **Flow**: Users can purchase a $1.00 Lucky Pick via Stripe Checkout.
- **Generation**: The system generates unique numbers (e.g., 6 picks from 1-49 or 7 from 1-50), alongside a lucky color and day.
- **Presentation**: The reveal features a premium, slow animation with stars and Aurora effects.
- **Post-Purchase**: Users can add their province/territory to the "Lucky Purchases Across Canada" display.
- **Rule**: Do not rewrite or bypass the payment flow (`app/api/checkout/route.js`, `app/api/stripe-webhook/route.js`) or gift delivery functionality for casual feature changes.

### B. Lucky Card Reveal
- **Implementation**: Housed primarily in `app/lucky-card-data.js`, `app/lucky-card-content.js`, and `app/lucky-card-reveal.js`.
- **Deck Structure**: Multiple cards with specific IDs (e.g., `number-seeker`, `northern-lights`, `lucky-golden-pick`), titles, imagery, and quotes.
- **Tiers & Rarity**: Cards are categorized into `standard` (70%), `premium` (25%), and `flagship` (5%). Selection uses a weighted probability system based on rarity.
- **Anti-Repeat Protection**: The system explicitly excludes the previous day's card to prevent consecutive duplicates (`app/lucky-card-data.js`).
- **Rule**: Preserve the rarity system, weighted-selection architecture, and anti-repeat protection unless explicitly instructed otherwise. Do not replace card artwork with placeholders or casually rename card IDs.

### C. Lucky Meter / Daily Resonance
- **Implementation**: Located in `app/lucky-meter/page.js` and `components/DailyResonance.tsx`.
- **Experience**: A premium interactive ritual displaying a daily luck score/percentage and fortune.
- **Visuals**: Integrates with the site's cosmic/mystical aesthetic (vortex/crystal).
- **Behavior**: Includes daily-use logic, reset countdowns, and potential state sharing.
- **Rule**: The Lucky Meter is not just a percentage counter. Preserve its premium interactive presentation and daily-use logic. Do not flatten it into a generic dashboard widget.

### D. Crystal Ball / Oracle
- **Implementation**: Located in `app/crystal-ball/page.js`, `app/components/CrystalBall/CrystalBall.tsx`, and `app/api/oracle/route.js`.
- **Experience**: An interactive component where users ask questions and receive fortunes via an Oracle API.
- **Visuals**: Features a mystical atmosphere with mist, stars, Aurora, and Maple Leaf logo integration.
- **Rule**: Treat this as an actual interactive experience. Do NOT replace the Oracle API behavior with static text or casually change the API contract unless explicitly instructed.

### E. Community Experience
- **Implementation**: Housed in `app/stories/page.js`, `app/lucky-map-of-canada/page.js`, `app/api/lucky-stories/route.js`, and `app/api/luck-map/route.js`.
- **Features**: "Community Stories" and "Lucky Map".
- **Data Sharing**: Both the Stories and Map experiences share the same underlying Lucky Story data.
- **Rule**: Do not casually break the shared community data layer while changing visual presentations.

### F. Homepage
- **Implementation**: `app/page.js`, `app/homepage/HomePage.js`, `app/homepage/Hero.js`.
- **Role**: The central entry point connecting all experiences (Hero, Lucky Pick, Lucky Meter, Crystal Ball, Stories, Map, FAQs).
- **Visuals**: Inline HTML5 Canvas background effects (Aurora, stars, shooting stars).
- **Rule**: Do not assume missing components on the homepage mean the feature is gone; trace actual links/routes. Maintain the inline canvas approach for performance.

## 3. Visual Design System

LuckyPickCanada relies on a premium, mystical Canadian aesthetic.
- **Motifs**: Canadian identity (maple leaf), Northern Lights (Aurora), night-sky atmosphere, mystical/oracle elements.
- **Effects**: Stars, shooting stars, constellations, gold/premium accents, glass/translucent surfaces, glow, depth.
- **Motion**: Atmospheric motion, reveal animations, premium buttons.
- **Rule**: Do not prescribe a redesign. Preserve the existing visual language and principles when making changes.

## 4. Aurora & Background Effects

- **Implementation**: Features layered CSS/Canvas effects, star fields, and shooting stars (`components/Aurora.tsx`, `components/Starfield.tsx`, `components/ShootingStars.tsx`).
- **Guidelines**: The Aurora should feel like a living Northern Lights sky. It should NOT become a static green gradient, an overpowering neon effect, a flat background, or an expensive animation that damages mobile performance.
- **Rule**: If changing Aurora visuals, preserve readability, responsiveness, and performance. Do not introduce completely different visual technologies (e.g., heavy external libraries) merely for isolated visual improvements.

## 5. Performance

- **Guidelines**: Avoid unnecessary client-side JavaScript, new dependencies, and unbounded animation loops.
- **Specifics**: Preserve lazy loading where intentional. Optimize HTML5 Canvas (e.g., use `Math.floor()` for coordinates, extract style assignments outside loops).
- **Rule**: Visual improvements must not create obvious performance regressions. Performance improvements must not destroy the visual experience.

## 6. Mobile / Responsive

- **Requirement**: The application must work flawlessly on mobile devices (narrow phones, larger phones, tablets) as well as desktop.
- **Key Areas**: Aurora positioning, card dimensions, reveals, Crystal Ball scene, buttons, text wrapping, and touch targets.
- **Rule**: Do not solve desktop layout problems by breaking the mobile experience, and vice-versa.

## 7. Accessibility

- **Expectations**: Preserve semantic elements, accessible labels, keyboard interaction, focus styles (e.g., `focus-visible:`), and disabled states (`aria-disabled`).
- **Motion**: Respect `prefers-reduced-motion` settings in CSS and Canvas animations.
- **Rule**: Do not remove accessibility features or focus styles simply to simplify markup. Modal dialogs must include Escape key listeners.

## 8. Security / Payments / Data Boundaries

- **Sensitive Areas**: Stripe checkout/webhooks (`app/api/checkout/route.js`, `app/api/stripe-webhook/route.js`), gift delivery, authentication, Turnstile configuration, API contracts, database access (`@neondatabase/serverless`), and environment variables.
- **Rules**:
  - NEVER expose secrets or hardcode credentials (e.g., `DATABASE_URL`). Redact them using placeholders (e.g., `<CTX7_API_KEY>`) in instructions or PRs.
  - Do not casually modify sensitive payment or security boundaries. Make surgical changes only if explicitly required.
  - Rely on `cf-connecting-ip` for client IP detection.

## 9. Build & Deployment

- **Architecture**: Next.js (App Router), deployed via Cloudflare Pages / OpenNext (`opennextjs-cloudflare`).
- **Configuration**: Managed via `wrangler.jsonc`, `open-next.config.ts`, `next.config.mjs`, and `package.json`.
- **Rules**:
  - Build configuration and asset serving are sensitive. Do not casually rewrite build scripts or change Node versions (`.nvmrc`).
  - Cache-busting logic in `app/layout.js` (using commit SHAs) must be preserved to prevent aggressive edge caching of CSS.

## 10. CSS / Theme Architecture

- **Structure**: Uses a combination of Tailwind CSS (`tailwind.config.js`), global styles (`app/globals.css`), and theme-specific CSS (`public/themes/default/*.css`, `themes/default/*.css`).
- **Loading**: Theme CSS is dynamically loaded in `app/layout.js` (`const cssPath = '/themes/default/index.css?v=${buildId}';`).
- **Rule**: Before rewriting styles to fix visual bugs, verify the root cause. Distinguish between missing CSS, unimported CSS, unserved CSS, overridden CSS, or incorrectly applied CSS.

## 11. Investigation Rules (Investigation-First)

Before modifying ANY code:
1. **Inspect**: Examine the current implementation. Use tools like `grep`, `sed`, `head`, `tail`, or custom Python scripts to confirm exact syntax.
2. **Root Cause**: Identify the actual root cause of the issue.
3. **Smallest Change**: Find the smallest correct change required.
4. **Dependencies**: Check for shared dependencies (e.g., components used on multiple pages).
5. **Execution**: Make a surgical change, run validation (e.g., `pnpm run build`), inspect the diff, and confirm unrelated functionality was not altered.
6. **Rule**: Do not make speculative changes, "clean up" unrelated code, or refactor working architecture just because a different approach looks nicer.

## 12. Change-Safety & Existing Functionality Rules

- **Visual Changes !== Logic Changes**: A visual task is not permission to alter business logic.
  - Changing Aurora? Do NOT change Lucky Card selection.
  - Improving Crystal Ball visuals? Do NOT change the Oracle API contract.
  - Improving the Homepage? Do NOT silently remove existing experiences.
- **Mock Errors**: Ignore `window.AudioContext` mock errors during headless visual verification.

## 13. Routes

Current major user-facing routes based on the repository structure:
- `/` - Homepage (Entry point, Hero, Community Grid)
- `/reveal` - Today's Lucky Moment (Lucky Card Reveal)
- `/lucky-meter` (or `/widget/daily-meter`) - Daily Resonance / Luck Score
- `/crystal-ball` - The Oracle Experience
- `/stories` - Community Stories
- `/lucky-map-of-canada` (or `/map`) - Lucky Map of Canada
- `/terms`, `/privacy` - Legal pages

## 14. Architecture Map (Important Files)

- **Homepage**: `app/page.js`, `app/homepage/HomePage.js`, `app/homepage/Hero.js`
- **Lucky Pick/Reveal**: `app/reveal/page.tsx`, `app/lucky-reveal.js`, `app/lucky-card-reveal.js`
- **Lucky Cards Data**: `app/lucky-card-data.js`, `app/lucky-card-content.js`
- **Lucky Meter**: `app/lucky-meter/page.js`, `components/DailyResonance.tsx`, `app/hooks/useRollingScore.ts`
- **Crystal Ball**: `app/crystal-ball/page.js`, `app/components/CrystalBall/CrystalBall.tsx`, `app/api/oracle/route.js`
- **Community**: `app/lucky-stories.js`, `app/luck-map.js`, `app/api/lucky-stories/route.js`
- **CSS/Theme**: `app/layout.js`, `app/globals.css`, `public/themes/default/`
- **Payments/API**: `app/api/checkout/route.js`, `app/api/stripe-webhook/route.js`, `app/api/gift-delivery/route.js`
- **Deployment**: `package.json`, `wrangler.jsonc`, `open-next.config.ts`, `next.config.mjs`

## 15. Verification Checklist

Before submitting changes, future agents must:
- Verify the change achieves the explicit user request.
- Verify no existing, unrelated functionality (e.g., payments, anti-repeat logic, API contracts) was broken or removed.
- Run `pnpm run build` to ensure the project still compiles.
- Complete the pre-commit steps to ensure proper testing, verification, review, and reflection are done.
- Verify only the intended files were modified.

**CURRENT CODE > OLD NOTES > ASSUMPTIONS.** Always inspect the current repository state before acting.
