# LuckyPickCanada Agent Guide

This file is the permanent operating guide for AI coding agents working in this repository. 

## 1. Core Operating Rules & Boundaries

### ALWAYS DO:
- **Investigate first:** Trace behavior from user action to rendered result before proposing a fix.
- **Use existing tools:** Rely on the provided tech stack and shared components instead of creating new ones.
- **Stop and ask (Escalation Rule):** If you are stuck, lack context, or cannot find a solution, STOP. Ask a clarifying question. Do not attempt speculative rewrites, hallucinate APIs, or delete failing tests to force a pass.

### ASK FIRST (Requires Explicit User Authorization):
- Modifying protected systems: Stripe/checkout, email delivery (Resend), authentication, Cloudflare Turnstile.
- Altering deployment config: Wrangler configuration, OpenNext setups, environment variables/secrets.
- Changing database state: Neon schemas, migrations, data integrity, or Upstash Redis logic.
- Installing new dependencies via `npm` or `yarn`.

### NEVER DO:
- Guess file paths, framework behavior, or API parameters. 
- Make cosmetic CSS patches (e.g., negative margins, arbitrary absolute positioning) to hide a structural layout problem.
- Replace working database/API systems with static mocks to satisfy a visual check.
- Modify the established rules for Lucky Pick generation, card rarity/weights, or the Crystal Ball / Oracle API behavior without permission.

---

## 2. Mandatory Tool & MCP Usage

Using MCPs and connected tools is mandatory, not an optional last resort. Do not claim to have used a tool unless it was actually run.

- **GitHub:** Use for current repository truth (source files, branches, PRs, issues, workflows).
- **Context7:** Use to verify accurate documentation and version-specific API behavior for Next.js, React, Tailwind, Web Audio, Framer Motion, Cloudflare, OpenNext, and external SDKs.
- **Neon:** Use whenever the task involves PostgreSQL schema, tables, queries, indexes, or database configuration. Inspect the real database state.

---

## 3. Approved Dependencies & Technology Stack

Always utilize these pre-installed tools. Do not suggest or install redundant dependencies:

- **Core:** Next.js (`next`), React (`react`, `react-dom`), TypeScript (`typescript`), React Error Boundary.
- **Edge/Infra:** OpenNext Cloudflare (`@opennextjs/cloudflare`), Cloudflare Workers (`wrangler`), OpenNext AWS (`@opennextjs/aws`).
- **UI & Motion:** Tailwind CSS (`tailwindcss`), Autoprefixer, shadcn/ui, Framer Motion (`framer-motion` using `motion`, `useAnimate`, `useReducedMotion`).
- **Audio:** Howler.js (`howler`), React Sounds (`react-sounds`).
- **Graphics/Canvas:** Sharp (`sharp`), html2canvas.
- **Testing:** Playwright (`playwright`, `playwright-chromium`), Puppeteer (`puppeteer`).
- **Backend/Services:** Neon Serverless (`@neondatabase/serverless`), Upstash Redis (`@upstash/redis`), Stripe (`stripe`, `@stripe/stripe-js`), Resend (`resend`).
- **Tooling:** ESLint (`eslint`), Node/React types.

---

## 4. LuckyPickCanada Product & Design Guardrails

Preserve the product’s established identity:
- **Aesthetic:** Premium Canadian visual identity, Northern Lights / Aurora atmosphere, Maple leaf symbolism, Starry-night / mystical aesthetic.
- **Styling Elements:** Use gold, glass, glow, depth, and polished typography. 
- **Card Data:** Protect Lucky Card IDs, artwork, weighted selection, daily-use limits, and anti-repeat behavior.

### Component Specification: Lucky Card Reveal
- **Premium Realism:** Avoid flat, exaggerated, or cartoon-like graphics. Use photorealistic cosmic elements (deep-space dust lanes, controlled bloom).
- **Card Integrity:** The front and back of the card design must remain completely untouched. DO NOT overlay colors or tints onto the card surface.
- **Layering Rule (Cosmic Magic):** Energy and light must strictly originate from *underneath* and behind the card. The solid card structure blocks under-glow from spilling onto its face. 
- **Animation Framework:** Use `framer-motion` exclusively.

**Reference Implementation for Card Depth:**
```tsx
// Ensure background energy (z-0) is separate from the card container (z-20)
<div className="relative">
  {/* Cosmic Under-glow */}
  <motion.div className="absolute inset-0 z-0 bg-gradient-to-t blur-2xl pointer-events-none" />
  {/* Unaltered Card */}
  <motion.div className="relative z-20 shadow-2xl bg-slate-900 border border-amber-500/30">
    <CardFace/>
  </motion.div>
</div>
