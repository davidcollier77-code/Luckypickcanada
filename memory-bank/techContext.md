# Technical Context

## Application Stack
- **Framework:** Next.js App Router 16.4.3, React 19.3.1 and TypeScript.
- **Runtime:** Node.js 26.x.
- **Package manager:** pnpm 10.30.3. Use the committed lockfile and pnpm; never use npm ci.
- **Styling and motion:** Tailwind CSS 4, Framer Motion, GSAP and existing Canvas-based visual effects.
- **Graphics compatibility:** One shared, dependency-free layer at `app/lib/graphics-capabilities.js` supplies lazy Canvas 2D/WebGL/`Path2D` detection, safe context acquisition, a conservative device profile, reduced-motion/visibility helpers and context-loss watching. Renderers let the browser choose its own GPU or software rasterizer.
- **Lucky Meter renderer:** `components/cosmic-event-engine.js` composites two additive WebGL surfaces (far behind the interface, a pointer-transparent near layer above it) using the shared shaders in `app/lib/gpu-particles.js`; `components/lucky-meter-ring-engine.js` draws the ring's slow energy trails with the same primitives. `resolveRenderQuality` in the capability layer supplies the tier, DPR cap, particle scale, near-layer availability, haze and spark budget.
- **Audio:** Howler and browser Web Audio API where already used. Lucky Meter audio assets are genuine recordings; additions carry a provider, item, licence, acquisition date and derivative record in `public/sounds/lucky-meter-cinematic-audio-sources.md`.
- **Database:** Neon PostgreSQL through the serverless driver.
- **Hosting/build:** Cloudflare Pages hosting with OpenNext Cloudflare build tooling and Workers runtime support.
- **Payments and email:** Stripe Checkout and Resend.
- **Public-form protection:** Cloudflare Turnstile, alongside existing validation, sanitization and rate limits.

## Testing and Verification
- **Unit/component:** Vitest and Testing Library.
- **Browser/e2e:** Playwright Test with the repository's configured desktop, mobile-390 and mobile-412 projects and committed visual baselines. Normal QA uses `playwright.config.ts`; `pnpm exec playwright test --config=playwright.swiftshader.config.ts` selects the opt-in `playwright.swiftshader.config.ts` for software-rendered graphics investigations.
- **Direct agent browser interaction:** Use the vendored Microsoft Playwright CLI skill and local pnpm exec playwright cli command when available. Browserless is the connected remote-browser option and fallback under the rules in AGENTS.md. Do not assume Browserbase is connected.
- **Repository gate:** Run ./freebuff-verify.sh and all applicable checks when a shell-capable environment is available. Inspect package.json before choosing scripts. Visual QA does not depend on that script; it runs the full Vitest suite and a standalone TypeScript check.
- **QA infrastructure:** `check_qa_pr_scope.py` validates the exact path manifest, approvals and browser evidence from trusted base-branch code. Browser evidence is required for frontend/rendering paths; known CI-only paths under .github/ and Next.js API handlers under app/api/ and pages/api/ are excluded unless visual_impact.required: true explicitly forces it. `review_pr_changes.py` scans added patch lines for a narrow set of high-confidence secrets and advisory quality risks; it is not a replacement for DevSkim or CodeQL. Secret-like excerpts are redacted before reports are written.
- **Deployment:** A deploy command or successful build does not authorize deployment. Follow AGENTS.md approval boundaries.

## Architecture and Data Boundaries
- Next.js App Router contains the user-facing experiences and server routes.
- Neon is the existing PostgreSQL provider. Do not migrate providers or alter production data without explicit authorization.
- Stripe processes payments for digital experiences; it does not sell lottery tickets or accept wagers.
- Resend delivers transactional gift/email messages.
- Cloudflare Pages is the hosting platform. Do not introduce a hosting migration as part of unrelated work.
- Treat credentials and secret values as opaque. Never place them in source, logs, reports or Memory Bank files.

## Hard Constraints
- **Production build size:** The measured production build output must remain strictly below **495 MiB**. This is the repository's hard cap, defined in AGENTS.md; it is not a .docs directory limit. Measure and report every production build.
- Preserve current UI, artwork, functionality, security controls, integrations and responsive behavior unless the task explicitly authorizes a change.
- Keep .docs/ read-only unless the owner explicitly authorizes a library change.
- AGENTS.md is the sole authoritative governance document. This file records technical facts only and must not duplicate its workflow rules.

## Environment Configuration
Environment-variable names and availability change over time. Inspect the current deployment configuration and repository examples before relying on any variable; do not treat a remembered list as authoritative. Never record secret values.
