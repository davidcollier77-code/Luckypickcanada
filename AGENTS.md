# LuckyPickCanada Agent Guide

This is the permanent operating guide for AI coding agents working on the LuckyPickCanada repository.

**CRITICAL DIRECTIVE**: This repository is the only source of truth. Current code > old notes > assumptions.


## Agent Operating Rules

### Implementation Authorization
Once the user has explicitly authorized implementation of a defined task, the agent may proceed through the authorized scope without repeatedly asking for permission before each individual low-risk change.

The agent should use normal engineering judgment for minor implementation decisions that are clearly within the approved scope.

The agent must still stop and ask the user when:

- a decision is materially ambiguous;
- a proposed change is outside the authorized scope;
- a protected system would need to be changed beyond the existing rules; or
- proceeding would create a significant or irreversible risk.

### Read-Only Audit vs. Implementation
Read-only mode applies when the user specifically requests an audit, investigation, review, or other task without authorization to modify the repository.

When the user subsequently authorizes implementation of identified fixes, the agent switches to implementation mode and performs the approved work.

The agent must not remain in read-only mode after implementation has been authorized, and must not repeatedly request permission for each individual approved fix.

### Standard Implementation Workflow
For an authorized implementation task, follow this sequence:

Understand the task → inspect the current repository state → trace the relevant implementation → identify the root cause → make the smallest correct change → verify/test → inspect the final diff → report the results.

Do not skip repository inspection simply because a previous audit, conversation, or agent response described the issue.

### Authorized Scope
Once implementation is authorized, complete the approved work as a cohesive task.

Stay strictly within the authorized scope. Do not introduce unrelated refactors, redesigns, dependency changes, architectural changes, or cleanup merely because they appear desirable.

### 1. Source of Truth
The current repository and current working tree are authoritative. Agents must inspect current code before relying on old notes, previous conversations, generated documentation, or assumptions.

### 2. Never Fabricate
Never invent or assume:
*   file paths
*   APIs
*   functions
*   configuration keys
*   environment variables
*   test/build results
*   deployment results
*   commit hashes
*   tool capabilities
*   implementation details

Unknown information must be inspected, tested, or honestly reported as unknown.

### 3. Baseline Before Changes
Before modifying files:
*   inspect git status;
*   identify pre-existing changes;
*   never overwrite or discard user changes;
*   inspect relevant callers/dependencies;
*   determine the smallest necessary file set.

### 4. Investigation-First
Follow the Standard Implementation Workflow. Do not make speculative fixes based only on filenames, symptoms, or assumptions.

### 5. Surgical Change Rule
*   Change only what the task requires.
*   Avoid unrelated refactors, formatting churn, cleanup, and dependency upgrades.
*   Do not redesign working architecture merely because another approach looks cleaner.
*   Supporting changes are allowed only when required for correctness, compatibility, or verification.
*   Every changed file must have a clear task-related reason.

### 6. Stop Rather Than Guess
Do not improvise when unexpected repository state, conflicting implementations, missing dependencies, or materially ambiguous requirements make safe continuation uncertain. For minor obvious issues, use normal engineering judgment.

### 7. Protected Systems
Preserve and strengthen the existing protected-system rule. Protected systems include: Stripe, checkout, gifts, email delivery, authentication, Turnstile, database access, environment variables, secrets, Cloudflare settings, Wrangler configuration, and OpenNext configuration. Default: do not modify protected systems unless explicitly required by the user's task. When explicitly authorized, make the smallest necessary change and do not refactor surrounding protected systems. Never expose secrets or credentials.

### 8. Verification Must Match the Task
Verification is part of completion.
*   Logic/functionality: run the narrowest relevant automated check or exercise the affected behavior.
*   UI/visual work: verify the rendered result, not just source code.
*   CSS/theme work: verify import, build, delivery, and application of the affected CSS when relevant.
*   SEO work: verify actual generated/served metadata, sitemap, robots behavior, structured data, and affected routes as applicable.
*   Build/deployment work: verify the actual relevant build/output/configuration path.
*   Security-sensitive work: perform appropriate security validation without exposing secrets.
*   Documentation-only work: verify referenced paths, commands, and links when practical.

Never claim verification that was not actually performed.

### 9. Visual Verification
LuckyPickCanada is a highly visual product. For UI or visual changes, verify the rendered result where practical, including relevant desktop/mobile viewports and affected interactions. Do not declare a visual change successful from source inspection alone.

### 10. Never Game Verification
Never make checks pass by:
*   weakening assertions;
*   deleting tests/checks;
*   narrowing scope solely to avoid failure;
*   disabling validation;
*   hiding errors;
*   removing protected functionality;
*   changing the verification command instead of fixing the underlying issue.

### 11. Final Self-Review
Before declaring completion:
*   inspect the final diff;
*   confirm only intended files changed;
*   check for accidental refactors or unrelated churn;
*   check imports and references;
*   remove debug/temporary code;
*   confirm protected-system boundaries remain intact;
*   confirm the requested behavior was actually addressed.

### 12. Completion Report
Final reports must state:
*   what changed;
*   which files changed;
*   what was actually verified;
*   which checks passed;
*   which checks failed, were skipped, or were unavailable;
*   any remaining uncertainty or risk.

Never state that a check passed unless it was actually run and passed.

### 13. Command Accuracy
Before requiring a project command, verify that the command actually exists in the current repository/tooling. Do not preserve stale commands merely because they appear in older documentation.

### 14. Architecture-Map Accuracy
Update the existing architecture map only where current paths can be verified. Do not invent replacement paths. If a path cannot be confidently verified, use a general description rather than fabricating a path.

### 15. Keep AGENTS.md Lean
Do not add generic programming advice, generic Git tutorials, generic shell tutorials, long AI explanations, or repetitive rules. Every rule should provide practical value for agents working on this repository.


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
*   **Crystal Ball / Oracle**: `app/crystal-ball/page.js`, `app/crystal-ball-client/CrystalBallClient.js`, `app/api/oracle/route.js`
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



## Change-Safety Rules
*   **Visual work is NOT permission to change business logic.** (e.g., Do not remove rarity logic when styling Lucky Cards).
*   **Always verify your work** with read-only tools after modification.

## MCP Integrations & Usage

MCP Decision Rule: Before beginning a task, determine whether a connected MCP would materially improve accuracy or execution. Use an MCP when it is relevant to the task; do not call MCPs merely because they are available.

- Context7: Consider using it when current or version-specific documentation for a third-party library, framework, API, SDK, platform, deployment system, or configuration could materially affect the work. This is particularly relevant for Cloudflare, OpenNext, Wrangler, Cloudflare Pages, Workers, Next.js, React, and similar technologies. Prefer the appropriate official documentation source. Include the header `Authorization: Bearer <CTX7_API_KEY>` for authenticated priority rate limits if requested.
- Neon: Consider using it when the task involves Neon/Postgres schemas, tables, queries, migrations, branches, database configuration, troubleshooting, or Neon-specific behavior. Do not use it for unrelated tasks.
- GitHub: Use it when repository, branch, commit, pull request, issue, or GitHub-specific information/actions are required.

The agent should make this MCP relevance assessment as part of its normal task planning, without unnecessarily invoking irrelevant MCPs.

## Verification Checklist
*   Check git status.
*   Confirm ONLY intended files changed.
*   Ensure application code wasn't accidentally refactored.
*   Verify pre-commit steps (`pnpm run build`) were executed successfully.
