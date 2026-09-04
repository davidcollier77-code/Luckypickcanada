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
- **Context7 (The Codex):** Use to verify accurate documentation and version-specific API behavior for Next.js, React, Tailwind, Web Audio, Framer Motion, Cloudflare, OpenNext, and external SDKs.
- **Neon:** Use whenever the task involves PostgreSQL schema, tables, queries, indexes, or database configuration. Inspect the real database state.

---

## 3. Approved Dependencies & Technology Stack

Always utilize these pre-installed tools. Do not suggest or install redundant dependencies:

- **Core:** Next.js (`next`), React (`react`, `react-dom`), TypeScript (`typescript`), React Error Boundary (`react-error-boundary`).
- **Edge/Infra:** OpenNext Cloudflare (`@opennextjs/cloudflare`), Cloudflare Workers (`wrangler`), OpenNext AWS (`@opennextjs/aws`).
- **UI & Motion:** Tailwind CSS (`tailwindcss`), Autoprefixer, shadcn/ui, Framer Motion (`framer-motion` using `motion`, `useAnimate`, `useReducedMotion`).
- **Audio:** Howler.js (`howler`), React Sounds (`react-sounds`).
- **Graphics/Canvas:** Sharp (`sharp`), html2canvas.
- **Testing & Auditing:** Playwright (`playwright`, `playwright-chromium`), Puppeteer (`puppeteer`).
- **Backend/Services:** Neon Serverless (`@neondatabase/serverless`), Upstash Redis (`@upstash/redis`), Stripe (`stripe`, `@stripe/stripe-js`), Resend (`resend`).
- **Tooling:** ESLint (`eslint`), Node/React types.

---

## 4. LuckyPickCanada Global Product & Design Guardrails

**Crucial Context:** `luckypickcanada.ca` is strictly a digital entertainment project for fun. It has no affiliation with gambling, and there are no real lottery prizes. All UI text, designs, and interactions must reflect this and avoid casino-style aesthetics.

Preserve the product’s established identity across all components:
- **Aesthetic:** Highly polished, realistic, and premium Canadian visual identity. Northern Lights / Aurora atmosphere, Maple leaf symbolism, Starry-night / mystical aesthetics.
- **Visual Execution:** This is a production application. **Absolutely no cartoonish, flat, or amateur graphics.** Use photorealistic cosmic elements (tangible depth, controlled bloom, realistic light diffusion). 
- **Styling Elements:** Use gold, glass, glow, depth, and polished typography. 
- **Core Asset Integrity:** The front and back designs of Lucky Cards must remain completely untouched. DO NOT overlay colors or tints onto card surfaces.
- **Dynamic Backgrounds & Layering:** When adding visual effects (like glowing elements), use strict z-index layering so light sources originate naturally (e.g., emanating from behind objects rather than spilling over them). You may animate backgrounds to feel alive.
- **Audio Integration:** Interactive features (like reveals, button presses, unlocks) must be accompanied by synchronized, high-quality audio cues using `howler` or `react-sounds`.
- **Animation Framework:** Use `framer-motion` exclusively.

---

## 5. Auditing, Troubleshooting, Deep Dives & Fine Polish

When explicitly tasked to **"audit," "deep dive," "troubleshoot," or "fine polish,"** you must immediately engage your intelligent tools and documentation codex. Do not rely on visual guessing or outdated training data.

1. **Context7 (The Codex):** You MUST use Context7 as your primary intelligence tool. Retrieve the definitive, version-specific documentation for our stack to ensure your audits and polishes perfectly align with the latest Next.js, Framer Motion, or Cloudflare Worker best practices.
2. **Static Analysis & Typing:** Always run `eslint` and TypeScript compiler checks (`tsc --noEmit`) to catch structural, syntax, and type errors before changing application logic.
3. **UI & E2E Audits:** Use **Playwright** or **Puppeteer** to script user interactions, test responsive states, and capture actual DOM behavior. If an element isn't rendering correctly, use these headless tools to inspect the computed layout.
4. **Component Crashes:** Leverage **React Error Boundary** to isolate failing components. Trace the stack trace to the exact hook or prop causing the failure rather than rewriting the whole component.

---

## 6. Verification & Final Self-Review (Done Criteria)

A change is not complete merely because the code compiles. You must explicitly verify your work before submitting it:

1. **Test Compilation:** Ensure the app builds without errors (e.g., using `npm run build` or `npm run dev`).
2. **Lint/Type Check:** Run ESLint and TypeScript checks where applicable.
3. **UI/DOM Check:** Inspect actual DOM structure and computed styles. Verify responsiveness and accessibility.
4. **Motion/Audio Check:** Verify animation sequencing, audio synchronization with visual states, Web Audio lifecycle cleanup, and `useReducedMotion` fallbacks.
5. **Pre-Completion Diff Review:**
   - Confirm every requested requirement was addressed.
   - Review the final diff for unintended changes.
   - Remove unnecessary commented-out code or console logs introduced during work.
   - Confirm no protected systems were changed without authorization.
6. **Report:** Clearly state what was explicitly verified and what remains uncertain.
