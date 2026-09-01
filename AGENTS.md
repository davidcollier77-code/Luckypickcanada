# LuckyPickCanada Agent Guide

This is the permanent operating guide for AI coding agents working on the LuckyPickCanada repository.

**CRITICAL DIRECTIVE**: This repository is the only source of truth. Current code > old notes > assumptions.

## Project Identity
LuckyPickCanada is a digital entertainment experience centered around Canadian luck, mystery, community, and premium visual presentation. It is **not** affiliated with real-world gambling or lottery prizes. It offers free daily interactive rituals (Lucky Meter, Community Map) and premium gift/reveal experiences (Lucky Pick).

## Repository Overview
The project is built with Next.js (App Router), React, Tailwind CSS, and uses OpenNext for deployment on Cloudflare Pages/Workers. It integrates Stripe for payments, Resend for emails, Cloudflare Turnstile for form security, and PostgreSQL for data storage.

### Routes
*   `/` (Homepage): Entry point, Hero, Lucky Pick generator, Lucky Meter entry, Crystal Ball entry.
*   `/lucky-meter`: Daily Resonance ritual.
*   `/map`: Community Lucky Map showing stories by province.
*   `/stories`: Community Lucky Stories.
*   `/crystal-ball`: Interactive Oracle experience.
*   `/admin/suggestions`: Admin panel for reviewing suggestions.

### Architecture Map
*   **Homepage**: `app/homepage/HomePage.js`, `app/homepage/Hero.js`, `app/homepage/Header.js`, `app/homepage/FAQSection.js`
*   **Lucky Pick Generator**: `app/lucky-reveal.js`, `app/lucky-reveal-popup.js`, `components/LuckyGenerator.tsx`
*   **Lucky Card Reveal**: `app/lucky-card-data.js`, `app/lucky-card-content.js`, `app/lucky-card-reveal.js`, `app/collection-binder.js`
*   **Lucky Meter / Daily Resonance**: `app/lucky-meter/page.js`, `components/DailyResonance.tsx`, `components/ResonanceButton.tsx`, `components/midnight-countdown.js`, `app/hooks/useRollingScore.ts`
*   **Crystal Ball / Oracle**: `app/crystal-ball/page.js`, `app/components/CrystalBall/CrystalBall.tsx`, `app/api/oracle/route.js`
*   **Community Stories & Map**: `app/map/page.js`, `app/stories/page.js`, `app/lucky-map-of-canada/lucky-map-of-canada.js`, `app/lucky-stories.js`, `app/api/lucky-stories/route.js`, `app/api/luck-map/route.js`
*   **Payments / Stripe**: `app/api/checkout/route.js`, `app/api/stripe-webhook/route.js`
*   **Gifts**: `app/api/gift-delivery/route.js`, `app/api/send-gift/route.ts`, `app/gift-email.js`
*   **Visual Design / Backgrounds**: `components/Aurora.tsx`, `components/Starfield.tsx`, `components/ShootingStars.tsx`, `components/CosmicBackground.tsx`
*   **Theme / CSS**: `themes/default/theme.js`, `app/globals.css`, `tailwind.config.js`
*   **Security**: `app/turnstile-config.js`, `app/turnstile-field.js`, `app/form-security.js`
*   **Build / Deployment**: `package.json`, `wrangler.jsonc`, `open-next.config.ts`, `next.config.mjs`
*   **Database**: `app/lib/db-init.js`

## Core User Experiences

### Lucky Pick
Generates 6 numbers (1-49) or 7 numbers (1-50) with no duplicates. Features a slow reveal animation with stars, Aurora, a lucky color, and a lucky day of the week.
*   **Preserve**: Number generation rules, reveal pacing, integration with Stripe checkout (`/api/checkout`). Distinguish entertainment logic from payment logic.

### Lucky Card Reveal
A critical, weighted card selection system.
*   **Tiers**: Standard, Premium, Flagship.
*   **Preserve**: Rarity logic, weighted selection, card IDs, artwork, and the explicit **anti-repeat behavior** (excludes the previous card before selection). Do not merge data and selection logic destructively.

### Lucky Meter / Daily Resonance
A premium interactive ritual to check daily "luck" (0-100%).
*   **Preserve**: Daily-use rules, 24-hour countdown, previous-day protections, Web Audio API sound effects, and the intended reveal sequence. A visual task is not permission to remove these functional rules.

### Crystal Ball / Oracle
An interactive question input that requests a fortune from an AI endpoint (`/api/oracle`).
*   **Preserve**: The API contract, loading/result states, session/history behavior, and atmospheric visual effects (mist, stars, Maple Leaf branding). Do not replace the real API flow with static text.

### Community Stories & Lucky Map
Displays community submissions by province.
*   **Preserve**: The relationship between shared community data and the map/stories presentation. Do not break data structures when changing presentation.

### Homepage
The central entry point integrating all features.
*   **Preserve**: The background effects (using a combination of CSS and Canvas), calls to action, and the connections to all other subsystems.

### Other Current Experiences
*   **Gifts**: Sending Lucky Picks via email (`$1.99`).
*   **Suggestions**: Public submission form and admin review panel.

## Visual Design System
The site features a premium Canadian identity: maple leaf motifs, Aurora/Northern Lights, night-sky atmosphere, gold accents, glass/translucent surfaces, and glowing effects.
*   **Preserve**: This identity. Future visual work should improve it, not flatten it into a generic dashboard.

### Aurora & Background Effects
Implemented via a combination of CSS and HTML5 Canvas. The Aurora currently uses layered CSS elements/gradients in `app/globals.css`. Stars and shooting stars use their existing Canvas/component implementations where applicable.
*   **Preserve**: Realistic layering (e.g., `globalCompositeOperation = 'screen'` for Canvas), ambient stars, shooting stars, and constellation twinkling. Avoid making it a static gradient, an overpowering neon effect, or obscuring content.
*   **Implementation Check**: Future agents MUST inspect the actual current implementation before assuming whether a visual effect is CSS, Canvas, or a combination. The existing stars, shooting stars, and Aurora must be treated as separate effects unless a task explicitly requests otherwise.

## Performance
*   Avoid unnecessary client-side JavaScript, dependencies, and large assets.
*   Preserve lazy loading (e.g., `dynamic` imports for modals).
*   Avoid unbounded animation loops; respect `prefers-reduced-motion` natively within animation loops (e.g., `window.matchMedia`).
*   Optimize canvas rendering (e.g., use bitwise `| 0` for coordinates, avoid redundant `ctx.stroke()` calls in loops).

## Mobile / Responsive
Must work across narrow phones, tablets, and desktops.
*   **Preserve**: Viewport-height behavior, touch targets, and fixed/sticky UI logic. Do not break mobile to fix desktop, or vice versa.

## Accessibility
*   **Preserve**: Semantic HTML, accessible labels, keyboard focus states (`focus-visible:`), and `aria-disabled` on interactive elements. Ensure custom modals implement Escape key dismissal (`keydown` listener cleanup).

## Security / Payments / Data Boundaries
**PROTECTED SYSTEMS**:
Stripe, checkout, gifts, email delivery, authentication, Turnstile, database access, environment variables, secrets, Cloudflare settings, Wrangler config, OpenNext config.

*   **DEFAULT RULE**: Do not modify protected systems unless explicitly required by the user's task.
*   **EXPLICIT USER AUTHORIZATION**: If David instructs you to change a protected system (e.g., "Fix the Stripe checkout"), that is explicit authorization. Make the smallest necessary change. Do not refactor surrounding systems or expose secrets.

## Build & Deployment
Uses `pnpm`, Next.js, OpenNext, and Cloudflare Pages.
*   **Preserve**: Build scripts, `wrangler.jsonc`, and OpenNext configurations. Do not reintroduce recursive build commands or change Node versions casually.

## CSS / Theme Architecture
Uses a mix of global CSS (`app/globals.css`), component CSS modules, inline styles, and Tailwind CSS.
*   Before rewriting styles for a visual bug, investigate the pipeline: Does the CSS exist? Is it imported? Served? Overridden?

## Shared Dependencies
*   **Community**: Data is shared between Map and Stories.
*   **Themes**: Default theme assets (`themes/default/theme.js`) map to generic identifiers.
*   **Canvas**: Starfield and shooting stars use their existing Canvas implementations where applicable.
Do not break one feature while modifying a shared dependency.

## Investigation Rules (INVESTIGATION-FIRST RULE)
Before modifying code:
1.  Inspect the current implementation and search for usages.
2.  Identify the root cause of the issue.
3.  Find the smallest correct change.
4.  Make surgical changes; do not make speculative refactors or "clean up" unrelated code.

## Change-Safety Rules
*   **Visual work is NOT permission to change business logic.** (e.g., Do not remove rarity logic when styling Lucky Cards).
*   **Always verify your work** with read-only tools after modification.

## Library Documentation (Context7)
*   Use Context7 MCP / documentation search when looking up library APIs (e.g., `/vercel/next.js`).
*   Include the header `Authorization: Bearer <CTX7_API_KEY>` for authenticated priority rate limits if requested.

## Verification Checklist
*   Check git status.
*   Confirm ONLY intended files changed.
*   Ensure application code wasn't accidentally refactored.
*   Verify pre-commit steps (`pnpm run build`, `python3 -m pytest -q`) were executed successfully.
